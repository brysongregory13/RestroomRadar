import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export type ReportReason =
  | 'closed_or_gone'
  | 'wrong_location'
  | 'incorrect_hours'
  | 'not_accessible'
  | 'spam'
  | 'other';

export async function submitReport(
  restroomId: string,
  userId: string,
  reason: ReportReason,
  notes: string
): Promise<void> {
  await addDoc(collection(db, 'reports'), {
    restroomId,
    userId,
    reason,
    notes,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
}

export async function submitSuggestedEdit(
  restroomId: string,
  userId: string,
  changes: Record<string, unknown>,
  notes: string
): Promise<void> {
  await addDoc(collection(db, 'suggested_edits'), {
    restroomId,
    userId,
    changes,
    notes,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
}
