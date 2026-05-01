-- Database Schema for NEXUS E-Commerce
-- Cleaned for standard PostgreSQL (Local Backend)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 1. PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE,
  password_hash TEXT,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'seller')),
  phone TEXT,
  gender TEXT CHECK (gender IN ('male', 'female', 'other') OR gender IS NULL),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- ============================================
-- 2. CATEGORIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  image_url TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- ============================================
-- 3. PRODUCTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  level_id TEXT,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(12,2) NOT NULL DEFAULT 0,
  stock INTEGER DEFAULT 0,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- ============================================
-- 4. ORDERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'shipped', 'delivered', 'completed', 'cancelled')),
  total_amount DECIMAL(12,2) NOT NULL,
  shipping_address TEXT,
  snap_token TEXT,
  payment_method TEXT,
  payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'pending', 'failed', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- ============================================
-- 5. ORDER ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) NOT NULL,
  quantity INTEGER NOT NULL,
  price_at_purchase DECIMAL(12,2) NOT NULL
);

-- ============================================
-- 6. WISHLISTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.wishlists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (user_id, product_id)
);

-- ============================================
-- 7. ADDRESSES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.addresses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  label TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address_line TEXT NOT NULL,
  city TEXT,
  province TEXT,
  postal_code TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- ============================================
-- 8. PROMOS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.promos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  discount_percent INTEGER NOT NULL CHECK (discount_percent BETWEEN 1 AND 90),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  product_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- ============================================
-- 9. PRODUCT REVIEWS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.product_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  rating DECIMAL(2,1) NOT NULL CHECK (rating >= 1.0 AND rating <= 5.0),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(product_id, user_id)
);

-- ============================================
-- 10. CHAT MESSAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id),
  sender_role TEXT NOT NULL CHECK (sender_role IN ('user', 'seller')),
  message TEXT,
  image_url TEXT,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'cancellation', 'system')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- ============================================
-- 11. INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_orders_user_id         ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_created     ON public.orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status           ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status   ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id    ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id  ON public.order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id    ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_user_id       ON public.wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_addresses_user_id       ON public.addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id   ON public.chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_seller_id ON public.chat_messages(seller_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created   ON public.chat_messages(user_id, seller_id, created_at ASC);

-- ============================================
-- 12. UPDATED_AT TRIGGER LOGIC
-- ============================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS orders_set_updated_at ON public.orders;
CREATE TRIGGER orders_set_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS products_set_updated_at ON public.products;
CREATE TRIGGER products_set_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
CREATE TRIGGER profiles_set_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================
-- 13. SAMPLE DATA (Categories)
-- ============================================
INSERT INTO public.categories (name, slug, icon, image_url, description) VALUES
('Electronics', 'electronics', 'devices', 'https://lh3.googleusercontent.com/aida-public/AB6AXuAcRgVlnFm8-NHptPfg1SuhyEzKmUCqSpEq-74PGQOBulfzx4Z26MKnivIieQRQ-MVzn1njd1xZikMoUyjmTfdiNdNuemd3LZe_eeir1GLNIxNURBOD4KpU82EUyYj-_ALETvG2a3gYCtro-xfvSBZ_VgQGtaOr8jEc3ylZR5GlktqlTQISaX0x_4gNGvH9_STIeK0gBeDfowXHVN7KZ1B62FUfFYgnPdNbFwDZn9QUjN1569cZjSOumzQ924_l8JOVptAl0gU5HnQ', 'Gadget dan perangkat elektronik terkini.'),
('Fashion', 'fashion', 'apparel', 'https://lh3.googleusercontent.com/aida-public/AB6AXuC4vIWQ5p7ZNnc2CUvVqjlhcraDKmb-IP_rlAg8PccCroczQyXXZd925nmKr3LFPc3N_dshgq1oZgM82wUGSgxnFRPAI8W6tPH9nnETkH_OK31RphLDtxqCOD_isOc7SOAX3Iw0ykcXviBCVn1Uw4mEAx7b6GCmk2CNTaJbtbY1f3caI3zP4eoxyKSuqAMYJf_okAskVhNqs_bGT2XZoi-F_bJPDoQFTLxJ4IShRg2r5pDIaSqCCnB4hzkzKcRD_fMLuEZazzk-RA8', 'Tren terkini pakaian dan aksesori.'),
('Furniture', 'furniture', 'chair', 'https://lh3.googleusercontent.com/aida-public/AB6AXuCL6M2hHcxwLfvEWOJA43aqQYUoj3O1G1jerQHe9LZ-nWxrh9CtlmYPyyisA5mftLx4jJAcVrVYtxR58JDAIJl2dfJBufCe-NIfRqhvqGrufoGLJMoIu2LEVGZmkMXdf8e5zJjyuKRoxX_ZC5g1REH76fVmmkyBcPsiZSi-mI93pX77QADumVJcS9rznCpZEvlDJFyvTZHpz21RYCbJl3gio9ng1Y4E8L17RURY59RSQ1Kc2qXum65iLebiVFllcG7lNNELWj3pHyE', 'Furnitur elegan untuk rumah Anda.'),
('Beauty', 'beauty', 'face_retouching_natural', 'https://lh3.googleusercontent.com/aida-public/AB6AXuA2y7AaZUOIigE3lWmHLytNfRcrnmSwdVG2jnGdAoilSvsdMXuKn7GBZV6K_9Ur69-C5r5GgcL44YwZvb9j7rDt4lg60WAGI8k1IrzoHsKejBkGQwhN74RpBx4is-ELYpSMFXIMh4ebpZ4og5hrEY5UnG9YzICB1QMt7_K9KhXlMEFcUUsSuHHg9FMoF18z0wBOH9G-ReA3uELyaGMtIsj7vjXs3z_CZhYrCXBzXjoPk2v5obAnpbP4O3ifNrZKvY5efAecmqMySXE', 'Produk perawatan kulit dan kecantikan.'),
('Sports', 'sports', 'fitness_center', 'https://lh3.googleusercontent.com/aida-public/AB6AXuC9yGKjgxzIZxteAPY5vn2Qfp6vaF-6SgP7ncMwPDrlyuRgA873ltKGtNSmug4Q1vetudJDP9go3BL_FgnUIOFpSl195JAhcswbwZ2lP3Ak9I_tG74sORvRAUDIVkO9y-S2zADizxT-nU9PaGXTXxBIdXj0MsMF97FgUEkqPZRr6AGA1Al0T6CxjTWWhKL1rY6FhEnY32d_g_m5wunHxFl0tQJzf7Bf1COLaPBQtLw_TE_yjMRLXGmS4QVuhqS-X9wutHfroDDin6k', 'Peralatan dan perlengkapan olahraga.'),
('Makanan & Minuman', 'makanan-minuman', 'restaurant', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop&q=60', 'Berbagai pilihan makanan dan minuman lezat.'),
('Otomotif', 'otomotif', 'directions_car', 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&auto=format&fit=crop&q=60', 'Suku cadang dan aksesoris kendaraan.'),
('Buku & Edukasi', 'buku-edukasi', 'menu_book', 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&auto=format&fit=crop&q=60', 'Buku bacaan dan alat penunjang pendidikan.'),
('Mainan & Hobi', 'mainan-hobi', 'toys', 'https://images.unsplash.com/photo-1531315630201-bb15abeb1653?w=800&auto=format&fit=crop&q=60', 'Koleksi mainan dan perlengkapan hobi.'),
('Kesehatan', 'kesehatan', 'health_and_safety', 'https://images.unsplash.com/photo-1505751172107-1c4b726477e3?w=800&auto=format&fit=crop&q=60', 'Produk kesehatan dan perawatan tubuh.'),
('Gaming', 'gaming', 'sports_esports', 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=60', 'Perangkat gaming dan video game terbaru.'),
('Tanaman & Kebun', 'tanaman-kebun', 'eco', 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=800&auto=format&fit=crop&q=60', 'Bibit tanaman dan alat berkebun.'),
('Hewan Peliharaan', 'hewan-peliharaan', 'pets', 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&auto=format&fit=crop&q=60', 'Kebutuhan hewan peliharaan kesayangan.'),
('Bayi & Anak', 'bayi-anak', 'child_care', 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=800&auto=format&fit=crop&q=60', 'Pakaian dan perlengkapan bayi/anak.'),
('Peralatan Dapur', 'peralatan-dapur', 'kitchen', 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&auto=format&fit=crop&q=60', 'Alat memasak dan perlengkapan dapur.'),
('Alat Tulis', 'alat-tulis', 'edit', 'https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?w=800&auto=format&fit=crop&q=60', 'Alat tulis kantor dan sekolah.'),
('Perjalanan', 'perjalanan', 'travel_explore', 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&auto=format&fit=crop&q=60', 'Kebutuhan traveling dan outdoor.'),
('Handphone & Tablet', 'handphone-tablet', 'smartphone', 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format&fit=crop&q=60', 'Smartphone dan tablet dari brand ternama.'),
('Komputer & Laptop', 'komputer-laptop', 'computer', 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&auto=format&fit=crop&q=60', 'Komputer, laptop, and aksesorisnya.'),
('Kamera & Foto', 'kamera-foto', 'camera_alt', 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&auto=format&fit=crop&q=60', 'Kamera, lensa, dan perlengkapan fotografi.')
ON CONFLICT (slug) DO NOTHING;
