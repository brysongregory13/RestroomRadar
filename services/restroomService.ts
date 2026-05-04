import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  getDoc,
  serverTimestamp,
  QueryDocumentSnapshot,
  onSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';
import { Restroom } from '../types/Restroom';
import { getGeohashBounds, distanceMiles, computeGeohash } from './geoService';

function docToRestroom(d: QueryDocumentSnapshot): Restroom {
  const data = d.data();
  return {
    id: d.id,
    name: data.name,
    address: data.address,
    lat: data.lat,
    lng: data.lng,
    geohash: data.geohash,
    gender: data.gender ?? [],
    accessType: data.accessType,
    stalls: data.stalls ?? 0,
    urinals: data.urinals ?? 0,
    hoursOpen: data.hoursOpen ?? '',
    hoursClose: data.hoursClose ?? '',
    isOpen: data.isOpen ?? false,
    amenities: data.amenities ?? [],
    photos: data.photos ?? [],
    description: data.description ?? '',
    avgRating: data.avgRating ?? 0,
    reviewCount: data.reviewCount ?? 0,
    addedBy: data.addedBy,
    createdAt: data.createdAt?.toDate() ?? new Date(),
    updatedAt: data.updatedAt?.toDate() ?? new Date(),
    isClosed: data.isClosed ?? false,
  };
}

export async function getNearbyRestrooms(
  lat: number,
  lng: number,
  radiusMiles: number
): Promise<Restroom[]> {
  const bounds = getGeohashBounds(lat, lng, radiusMiles);
  const ref = collection(db, 'restrooms');
  const results: Restroom[] = [];
  const seen = new Set<string>();

  for (const [start, end] of bounds) {
    const q = query(ref, where('geohash', '>=', start), where('geohash', '<=', end));
    const snap = await getDocs(q);
    snap.docs.forEach((d) => {
      if (!seen.has(d.id)) {
        seen.add(d.id);
        const r = docToRestroom(d);
        if (distanceMiles(lat, lng, r.lat, r.lng) <= radiusMiles) {
          results.push(r);
        }
      }
    });
  }

  return results;
}

export function subscribeNearbyRestrooms(
  lat: number,
  lng: number,
  radiusMiles: number,
  onData: (restrooms: Restroom[], allShardsReady: boolean) => void,
  onError: (e: Error) => void
): () => void {
  console.log(`[subscribeNearbyRestrooms] lat=${lat} lng=${lng} radius=${radiusMiles}mi`);

  const bounds = getGeohashBounds(lat, lng, radiusMiles);
  console.log(`[subscribeNearbyRestrooms] geohash bounds count: ${bounds.length}`);
  bounds.forEach(([s, e], i) => console.log(`  bound[${i}]: "${s}" → "${e}"`));

  const ref = collection(db, 'restrooms');

  // Each geohash bound gets its own shard Map to track which docs belong to it
  const shards = bounds.map(() => new Map<string, Restroom>());
  const shardsReady = new Set<number>();
  let fallbackActivated = false;

  function emit() {
    const merged = new Map<string, Restroom>();
    shards.forEach((shard) => shard.forEach((r, id) => merged.set(id, r)));
    const allReady = shardsReady.size >= bounds.length;

    console.log(
      `[subscribeNearbyRestrooms] emit: shardsReady=${shardsReady.size}/${bounds.length} merged=${merged.size}`
    );

    if (allReady && merged.size === 0 && !fallbackActivated) {
      // Geo query found nothing — either restrooms lack a geohash field or the
      // user is outside the stored locations. Fall back to reading the full collection.
      fallbackActivated = true;
      console.log('[subscribeNearbyRestrooms] geo returned 0 — falling back to full collection read');
      getDocs(ref)
        .then((snap) => {
          console.log(`[subscribeNearbyRestrooms] fallback returned ${snap.docs.length} docs`);
          const all = snap.docs.map((d) => docToRestroom(d as QueryDocumentSnapshot));
          onData(all, true);
        })
        .catch((e) => onError(e instanceof Error ? e : new Error(String(e))));
    } else {
      onData(Array.from(merged.values()), allReady);
    }
  }

  const unsubscribers = bounds.map(([start, end], idx) => {
    const q = query(ref, where('geohash', '>=', start), where('geohash', '<=', end));
    console.log(`[subscribeNearbyRestrooms] attaching onSnapshot for bound[${idx}]`);
    return onSnapshot(
      q,
      (snap) => {
        console.log(
          `[subscribeNearbyRestrooms] snapshot bound[${idx}]: ${snap.size} docs, ${snap.docChanges().length} changes`
        );
        snap.docChanges().forEach((change) => {
          if (change.type === 'added' || change.type === 'modified') {
            const r = docToRestroom(change.doc as QueryDocumentSnapshot);
            const dist = distanceMiles(lat, lng, r.lat, r.lng);
            console.log(`  ${change.type} "${r.name}" geohash="${r.geohash}" dist=${dist.toFixed(2)}mi`);
            if (dist <= radiusMiles) {
              shards[idx].set(change.doc.id, r);
            } else {
              shards[idx].delete(change.doc.id);
            }
          } else if (change.type === 'removed') {
            shards[idx].delete(change.doc.id);
          }
        });
        shardsReady.add(idx);
        emit();
      },
      (e) => {
        console.log(`[subscribeNearbyRestrooms] onSnapshot error bound[${idx}]:`, e);
        onError(e instanceof Error ? e : new Error(String(e)));
      }
    );
  });

  return () => unsubscribers.forEach((u) => u());
}

export async function getRestroomById(id: string): Promise<Restroom | null> {
  const snap = await getDoc(doc(db, 'restrooms', id));
  if (!snap.exists()) return null;
  return docToRestroom(snap as QueryDocumentSnapshot);
}

export async function addRestroom(
  data: Omit<Restroom, 'id' | 'geohash' | 'avgRating' | 'reviewCount' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const geohash = computeGeohash(data.lat, data.lng);
  const ref = await addDoc(collection(db, 'restrooms'), {
    ...data,
    geohash,
    avgRating: 0,
    reviewCount: 0,
    isClosed: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getRestroomsByUser(uid: string): Promise<Restroom[]> {
  console.log('[getRestroomsByUser] querying for uid:', uid);
  const ref = collection(db, 'restrooms');
  // No orderBy — avoids composite index requirement; sort client-side instead
  const q = query(ref, where('addedBy', '==', uid));
  const snap = await getDocs(q);
  console.log('[getRestroomsByUser] docs returned:', snap.docs.length);
  const results = snap.docs.map((d) => docToRestroom(d as QueryDocumentSnapshot));
  return results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}
