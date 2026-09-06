/*
# DEADSTOCK — Full Schema Setup

## Overview
Creates the complete database schema for DEADSTOCK, a one-of-one streetwear resale platform.
Includes items, cart_locks (with critical unique partial index), orders, order_items,
and sell_submissions tables. Also sets up RLS policies, a trigger to auto-sync item
status with cart_lock status, a storage bucket for sell submission photos, and seed data.

## Tables

### items
Stores each unique physical product listing. Every item is one-of-one.
- id (uuid PK)
- name (text, required)
- category (text: jackets, shirts, tshirts, pants, shoes, accessories)
- size (text)
- condition (text: 'like new', 'good condition', 'well worn')
- price_inr (integer, rupees)
- description (text)
- photos (text[], array of image URLs)
- status (text: 'available', 'locked', 'sold')
- brand (text, optional)
- measurements (text, optional — e.g. "Pit to pit: 24in, Length: 28in")
- created_at (timestamptz)

### cart_locks
Reserves an item for a session for 10 minutes. The unique partial index on (item_id)
WHERE status = 'active' is the core concurrency-control mechanism — the DB itself
rejects a second active lock on the same item.
- id (uuid PK)
- item_id (uuid FK -> items.id)
- session_id (text — client-generated UUID stored in localStorage)
- status (text: 'active', 'released', 'expired', 'converted')
- locked_at (timestamptz)
- expires_at (timestamptz)

### orders
- id (uuid PK)
- user_id (uuid FK -> auth.users, nullable for guest checkout)
- session_id (text, for guest cart association)
- status (text: 'pending', 'paid', 'failed', 'cancelled')
- total_inr (integer)
- razorpay_order_id (text)
- razorpay_payment_id (text)
- razorpay_signature (text)
- shipping_name, shipping_address, shipping_city, shipping_state, shipping_pincode, shipping_phone (text)
- created_at, paid_at (timestamptz)

### order_items
- id (uuid PK)
- order_id (uuid FK -> orders.id)
- item_id (uuid FK -> items.id)
- price_inr (integer, snapshot at purchase time)

### sell_submissions
- id (uuid PK)
- submitter_name, submitter_email, submitter_phone (text)
- category, size, condition (text)
- asking_price_inr (integer)
- photos (text[])
- status (text: 'pending', 'approved', 'rejected')
- created_at (timestamptz)

## Security (RLS)
- items: public SELECT (anon + authenticated); INSERT/UPDATE/DELETE authenticated only
- cart_locks: full CRUD for anon + authenticated (session-scoped via app code)
- orders: SELECT authenticated (own orders); INSERT anon + authenticated; UPDATE authenticated
- order_items: SELECT authenticated (via parent order ownership); INSERT anon + authenticated
- sell_submissions: INSERT anon + authenticated; SELECT authenticated

## Trigger
- update_item_status_on_lock(): automatically sets item.status based on cart_lock status changes.
  active -> locked, released/expired -> available, converted -> sold.

## Storage
- Creates 'sell-submissions' public bucket for photo uploads.
- Storage policies allow anon + authenticated to upload and read.

## Seed Data
- Inserts 8 sample streetwear items with real Pexels image URLs.
*/

-- ============================================================
-- ITEMS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  size text NOT NULL,
  condition text NOT NULL CHECK (condition IN ('like new', 'good condition', 'well worn')),
  price_inr integer NOT NULL CHECK (price_inr > 0),
  description text,
  photos text[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'locked', 'sold')),
  brand text,
  measurements text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_items" ON items;
CREATE POLICY "public_read_items" ON items FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_items" ON items;
CREATE POLICY "auth_insert_items" ON items FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_items" ON items;
CREATE POLICY "auth_update_items" ON items FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_items" ON items;
CREATE POLICY "auth_delete_items" ON items FOR DELETE
  TO authenticated USING (true);

-- ============================================================
-- CART_LOCKS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS cart_locks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'released', 'expired', 'converted')),
  locked_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL
);

ALTER TABLE cart_locks ENABLE ROW LEVEL SECURITY;

-- Critical: unique partial index — only one active lock per item at a time
CREATE UNIQUE INDEX IF NOT EXISTS cart_locks_one_active_per_item
  ON cart_locks (item_id) WHERE status = 'active';

DROP POLICY IF EXISTS "anon_select_cart_locks" ON cart_locks;
CREATE POLICY "anon_select_cart_locks" ON cart_locks FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_cart_locks" ON cart_locks;
CREATE POLICY "anon_insert_cart_locks" ON cart_locks FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_cart_locks" ON cart_locks;
CREATE POLICY "anon_update_cart_locks" ON cart_locks FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_cart_locks" ON cart_locks;
CREATE POLICY "anon_delete_cart_locks" ON cart_locks FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS cart_locks_session_idx ON cart_locks (session_id);
CREATE INDEX IF NOT EXISTS cart_locks_item_idx ON cart_locks (item_id);

-- ============================================================
-- ORDERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'cancelled')),
  total_inr integer NOT NULL CHECK (total_inr >= 0),
  razorpay_order_id text,
  razorpay_payment_id text,
  razorpay_signature text,
  shipping_name text,
  shipping_address text,
  shipping_city text,
  shipping_state text,
  shipping_pincode text,
  shipping_phone text,
  created_at timestamptz DEFAULT now(),
  paid_at timestamptz
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_select_own_orders" ON orders;
CREATE POLICY "auth_select_own_orders" ON orders FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "anon_insert_orders" ON orders;
CREATE POLICY "anon_insert_orders" ON orders FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_own_orders" ON orders;
CREATE POLICY "auth_update_own_orders" ON orders FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS orders_user_idx ON orders (user_id);
CREATE INDEX IF NOT EXISTS orders_session_idx ON orders (session_id);

-- ============================================================
-- ORDER_ITEMS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES items(id) ON DELETE RESTRICT,
  price_inr integer NOT NULL CHECK (price_inr >= 0)
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_select_own_order_items" ON order_items;
CREATE POLICY "auth_select_own_order_items" ON order_items FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "anon_insert_order_items" ON order_items;
CREATE POLICY "anon_insert_order_items" ON order_items FOR INSERT
  TO anon, authenticated WITH CHECK (true);

CREATE INDEX IF NOT EXISTS order_items_order_idx ON order_items (order_id);

-- ============================================================
-- SELL_SUBMISSIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS sell_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submitter_name text NOT NULL,
  submitter_email text NOT NULL,
  submitter_phone text,
  category text NOT NULL,
  size text NOT NULL,
  condition text NOT NULL CHECK (condition IN ('like new', 'good condition', 'well worn')),
  asking_price_inr integer NOT NULL CHECK (asking_price_inr > 0),
  photos text[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sell_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_sell_submissions" ON sell_submissions;
CREATE POLICY "anon_insert_sell_submissions" ON sell_submissions FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_select_sell_submissions" ON sell_submissions;
CREATE POLICY "auth_select_sell_submissions" ON sell_submissions FOR SELECT
  TO authenticated USING (true);

-- ============================================================
-- TRIGGER: Auto-update item status when cart_lock changes
-- ============================================================
CREATE OR REPLACE FUNCTION update_item_status_on_lock()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'active' THEN
    UPDATE items SET status = 'locked' WHERE id = NEW.item_id;
  ELSIF NEW.status = 'released' OR NEW.status = 'expired' THEN
    UPDATE items SET status = 'available' WHERE id = NEW.item_id;
  ELSIF NEW.status = 'converted' THEN
    UPDATE items SET status = 'sold' WHERE id = NEW.item_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS cart_lock_status_trigger ON cart_locks;
CREATE TRIGGER cart_lock_status_trigger
  AFTER INSERT OR UPDATE OF status ON cart_locks
  FOR EACH ROW
  EXECUTE FUNCTION update_item_status_on_lock();

-- ============================================================
-- STORAGE: sell-submissions bucket
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('sell-submissions', 'sell-submissions', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "anon_upload_sell_submissions" ON storage.objects;
CREATE POLICY "anon_upload_sell_submissions" ON storage.objects FOR INSERT
  TO anon, authenticated WITH CHECK (bucket_id = 'sell-submissions');

DROP POLICY IF EXISTS "anon_read_sell_submissions" ON storage.objects;
CREATE POLICY "anon_read_sell_submissions" ON storage.objects FOR SELECT
  TO anon, authenticated USING (bucket_id = 'sell-submissions');

-- ============================================================
-- SEED DATA: 8 sample items
-- ============================================================
INSERT INTO items (name, category, size, condition, price_inr, description, photos, status, brand, measurements) VALUES
(
  'Vintage Levi''s Denim Trucker Jacket',
  'jackets', 'M', 'good condition', 4200,
  'Classic blue denim trucker jacket. Faded naturally over years of wear. Two chest pockets, button front. No rips or tears, just honest fade.',
  ARRAY['https://images.pexels.com/photos/769733/pexels-photo-769733.jpeg?auto=compress&cs=tinysrgb&w=800'],
  'available', 'Levi''s', 'Pit to pit: 21in, Length: 26in, Shoulder: 18in'
),
(
  'Nike Tech Fleece Hoodie — Black',
  'shirts', 'L', 'like new', 6800,
  'Barely worn Nike Tech Fleece hoodie. Lightweight, warm, no pilling. Zipped front pocket. Original retail tags removed but worn maybe 3 times.',
  ARRAY['https://images.pexels.com/photos/769749/pexels-photo-769749.jpeg?auto=compress&cs=tinysrgb&w=800'],
  'available', 'Nike', 'Pit to pit: 24in, Length: 28in, Sleeve: 26in'
),
(
  'Adidas Originals Track Pants — Navy',
  'pants', 'M', 'good condition', 2800,
  'Three-stripe track pants in navy blue. Elastic waist, tapered ankle. Worn but plenty of life left. Minor fading on knees.',
  ARRAY['https://images.pexels.com/photos/4219499/pexels-photo-4219499.jpeg?auto=compress&cs=tinysrgb&w=800'],
  'available', 'Adidas', 'Waist: 32in, Inseam: 30in'
),
(
  'Carhartt Detroit Work Jacket — Brown Duck',
  'jackets', 'L', 'well worn', 3500,
  'Heavy-duty canvas work jacket. Broken in proper — paint spots, oil marks, the works. Still structurally sound. This one has stories.',
  ARRAY['https://images.pexels.com/photos/1124468/pexels-photo-1124468.jpeg?auto=compress&cs=tinysrgb&w=800'],
  'available', 'Carhartt', 'Pit to pit: 25in, Length: 27in'
),
(
  'Vintage Band Tee — Oversized Fit',
  'tshirts', 'L', 'well worn', 1800,
  'Bootleg tour shirt, faded print, soft cotton. Holes at hem, collar slightly stretched. Perfect for the grunge revival.',
  ARRAY['https://images.pexels.com/photos/1656684/pexels-photo-1656684.jpeg?auto=compress&cs=tinysrgb&w=800'],
  'available', 'Unknown', 'Pit to pit: 23in, Length: 27in'
),
(
  'New Balance 990v5 — Grey',
  'shoes', 'US 9', 'like new', 8500,
  'Made in USA 990v5. Worn twice, soles clean, no creasing. Original box included. Suede and mesh upper in excellent shape.',
  ARRAY['https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=800'],
  'available', 'New Balance', 'US 9 / UK 8.5'
),
(
  'Champion Reverse Weave Crewneck — Grey',
  'shirts', 'M', 'good condition', 2200,
  'Heavyweight reverse weave sweatshirt. No shrinkage, no pilling. Embroidered Champion logo on chest. Clean.',
  ARRAY['https://images.pexels.com/photos/6311627/pexels-photo-6311627.jpeg?auto=compress&cs=tinysrgb&w=800'],
  'available', 'Champion', 'Pit to pit: 22in, Length: 26in'
),
(
  'Military Surplus Cargo Pants — Olive',
  'pants', 'L', 'well worn', 1500,
  'Genuine military cargo pants. Ripstop fabric, tons of pockets. Faded color, one knee patched. Built to last another decade.',
  ARRAY['https://images.pexels.com/photos/1342609/pexels-photo-1342609.jpeg?auto=compress&cs=tinysrgb&w=800'],
  'available', 'Surplus', 'Waist: 34in, Inseam: 32in'
)
ON CONFLICT DO NOTHING;