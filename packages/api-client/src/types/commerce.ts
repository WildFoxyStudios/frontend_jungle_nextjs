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
  /** Owner user id (commerce API includes this on job rows). */
  user_id?: number;
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
  poster?: PublicUser | null;
  is_active: boolean;
  created_at: string;
}

/**
 * Plan §3.15 JA1 — structured job application question.
 *
 * `question_type` controls how the frontend renders the input:
 * - `free_text`       → `<Textarea>` (default)
 * - `yes_no`          → `<RadioGroup>` with Yes/No
 * - `multiple_choice` → `<Select>` populated from `options`
 *
 * The backend stores questions in the `job_questions` table (migration
 * `20260422000011_job_question_types.sql`) but legacy jobs still expose
 * rows with only `id`/`question`/`required`, which implicitly default to
 * `free_text` — hence the optional `question_type`.
 */
export interface JobQuestion {
  id: number;
  question: string;
  required: boolean;
  question_type?: "free_text" | "yes_no" | "multiple_choice";
  /** Only populated for `multiple_choice`; empty otherwise. */
  options?: string[];
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
  category?: string;
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
  /** Set by commerce-service (`orders.payment_status`). */
  payment_status?: string;
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

export interface SavedJob {
  id: number;
  title: string;
  location?: string;
  created_at: string;
}

export interface JobAlert {
  id: number;
  query?: string;
  frequency: "daily" | "weekly";
  is_active: boolean;
  created_at: string;
}

export interface Resume {
  id: number;
  file_url: string;
  file_name?: string;
  extracted_text?: string;
  skills?: string[];
  experience_years?: number;
  uploaded_at: string;
}
