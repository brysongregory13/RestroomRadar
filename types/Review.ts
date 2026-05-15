export interface Review {
  id: string;
  userId: string;
  displayName: string;
  rating: number;
  text: string;
  helpfulCount: number;
  createdAt: Date;
}
