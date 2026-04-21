export type Gender = 'male' | 'female' | 'unisex';
export type AccessType = 'public' | 'customer' | 'key' | 'password';
export type Amenity = 'handicap' | 'baby_change' | 'free' | 'gender_neutral';

export interface Restroom {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  geohash: string;
  gender: Gender[];
  accessType: AccessType;
  stalls: number;
  urinals: number;
  hoursOpen: string;
  hoursClose: string;
  isOpen: boolean;
  amenities: Amenity[];
  photos: string[];
  description: string;
  avgRating: number;
  reviewCount: number;
  addedBy: string;
  createdAt: Date;
  updatedAt: Date;
  isClosed: boolean;
}
