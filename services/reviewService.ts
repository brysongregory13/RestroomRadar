import {
  collection,
  addDoc,
  query,
  orderBy,
  getDocs,
  serverTimestamp,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';
import { Review } from '../types/Review';

function docToReview(d: QueryDocumentSnapshot): Review {
  const data = d.data();
  return {
    id: d.id,
    userId: data.userId,
    displayName: data.displayName,
    rating: data.rating,
    text: data.text,
    createdAt: data.createdAt?.toDate() ?? new Date(),
  };
}

export async function getReviews(restroomId: string): Promise<Review[]> {
  const q = query(
    collection(db, 'restrooms', restroomId, 'reviews'),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(docToReview);
}

export async function addReview(
  restroomId: string,
  userId: string,
  displayName: string,
  rating: number,
  text: string
): Promise<void> {
  await addDoc(collection(db, 'restrooms', restroomId, 'reviews'), {
    userId,
    displayName,
    rating,
    text,
    createdAt: serverTimestamp(),
  });
}
