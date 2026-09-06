import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export type Item = {
  id: string;
  name: string;
  category: string;
  size: string;
  condition: string;
  price_inr: number;
  description: string | null;
  photos: string[];
  status: string;
  brand: string | null;
  measurements: string | null;
  created_at: string;
};

export type CartLock = {
  id: string;
  item_id: string;
  session_id: string;
  status: string;
  locked_at: string;
  expires_at: string;
};

export type Order = {
  id: string;
  user_id: string | null;
  session_id: string | null;
  status: string;
  total_inr: number;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  razorpay_signature: string | null;
  shipping_name: string | null;
  shipping_address: string | null;
  shipping_city: string | null;
  shipping_state: string | null;
  shipping_pincode: string | null;
  shipping_phone: string | null;
  created_at: string;
  paid_at: string | null;
};

export type OrderItem = {
  id: string;
  order_id: string;
  item_id: string;
  price_inr: number;
  item?: Item;
};

export type SellSubmission = {
  id: string;
  submitter_name: string;
  submitter_email: string;
  submitter_phone: string | null;
  category: string;
  size: string;
  condition: string;
  asking_price_inr: number;
  photos: string[];
  status: string;
  created_at: string;
};

export const CATEGORIES = ['jackets', 'shirts', 'tshirts', 'pants', 'shoes', 'accessories'] as const;
export const CONDITIONS = ['like new', 'good condition', 'well worn'] as const;
export const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'OS'] as const;

export const LOCK_DURATION_MS = 10 * 60 * 1000;
