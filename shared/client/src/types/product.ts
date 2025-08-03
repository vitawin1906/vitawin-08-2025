
export interface Product {
  id: number;
  name: string;
  description: string;
  longDescription?: string;
  price: number;
  originalPrice: number;
  category: string;
  images: string[];
  badge: string;
  benefits: string[];
  rating: number;
  reviews: number;
  stock: number;
  status: 'active' | 'inactive';
  sku?: string;
  composition?: Record<string, string>;
  usage?: string;
  additionalInfo?: string;
  customUrl?: string;
  // Новые поля
  capsuleCount?: number;
  capsuleVolume?: string;
  servingsPerContainer?: number;
  manufacturer?: string;
  countryOfOrigin?: string;
  expirationDate?: string;
  storageConditions?: string;
  howToTake?: 'morning' | 'morning_evening' | 'with_meals' | 'before_meals' | 'custom';
  reviewBreakdown?: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  userReviews?: Array<{
    userName: string;
    rating: number;
    date: string;
    title: string;
    comment: string;
  }>;
}
