import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  QueryDocumentSnapshot,
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
