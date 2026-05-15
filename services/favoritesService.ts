import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { Restroom } from '../types/Restroom';
import { getRestroomById } from './restroomService';

export async function addFavorite(uid: string, restroomId: string): Promise<void> {
  await setDoc(doc(db, 'users', uid, 'favorites', restroomId), {
    restroomId,
    savedAt: serverTimestamp(),
  });
}

export async function removeFavorite(uid: string, restroomId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'favorites', restroomId));
}

export function subscribeFavoriteIds(
  uid: string,
  onData: (ids: Set<string>) => void
): () => void {
  return onSnapshot(collection(db, 'users', uid, 'favorites'), (snap) => {
    onData(new Set(snap.docs.map((d) => d.id)));
  });
}

export async function getFavoriteRestrooms(uid: string): Promise<Restroom[]> {
  const snap = await getDocs(collection(db, 'users', uid, 'favorites'));
  const ids = snap.docs.map((d) => d.id);
  const results = await Promise.all(ids.map((id) => getRestroomById(id)));
  return results.filter((r): r is Restroom => r !== null);
}
