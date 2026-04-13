import type { PublicUser } from "./user";
import type { MediaItem } from "./post";

export interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  sub_category?: string;
  images: MediaItem[];
  location: string;
  latitude?: number;
  longitude?: number;
  seller: PublicUser;
  rating: number;
  review_count: number;
  is_available: boolean;
  custom_fields?: Record<string, string>;
  created_at: string;
}

export interface ProductReview {
  id: number;
  product_id: number;
  user: PublicUser;
  rating: number;
  comment: string;
  created_at: string;
}

export interface Job {
  id: number;
  title: string;
  description: string;
  category: string;
  location: string;
  salary_min?: number;
  salary_max?: number;
  currency: string;
  job_type: "full_time" | "part_time" | "contract" | "freelance" | "internship";
  questions: JobQuestion[];
  application_count: number;
  poster: PublicUser;
  is_active: boolean;
  created_at: string;
}

export interface JobQuestion {
  id: number;
  question: string;
  required: boolean;
}

export interface JobApplication {
  id: number;
  job_id: number;
  applicant: PublicUser;
  answers: { question_id: number; answer: string }[];
  cover_letter?: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
}

export interface Funding {
  id: number;
  title: string;
  description: string;
  cover: string;
  goal_amount: number;
  raised_amount: number;
  currency: string;
  end_date: string;
  creator: PublicUser;
  donor_count: number;
  is_goal_reached: boolean;
  created_at: string;
}

export interface Offer {
  id: number;
  title: string;
  description: string;
  image: string;
  discount_percent: number;
  original_price: number;
  offer_price: number;
  currency: string;
  expires_at: string;
  seller: PublicUser;
  created_at: string;
}

export interface CartItem {
  id: number;
  product: Product;
  quantity: number;
  subtotal: number;
}

export interface Cart {
  items: CartItem[];
  total: number;
  currency: string;
}

export interface Order {
  id: number;
  buyer_id: number;
  seller_id: number;
  buyer: PublicUser;
  seller: PublicUser;
  product: Product;
  quantity: number;
  total: number;
  currency: string;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled" | "refunded";
  tracking_number?: string;
  shipping_address: Address;
  payment_method: string;
  created_at: string;
  updated_at: string;
}

export interface Address {
  id: number;
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  phone: string;
  is_default: boolean;
}
