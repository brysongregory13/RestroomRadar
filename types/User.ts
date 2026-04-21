export interface AppUser {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string | null;
  createdAt: Date;
  restroomsAdded: number;
  reviewCount: number;
  editCount: number;
}
