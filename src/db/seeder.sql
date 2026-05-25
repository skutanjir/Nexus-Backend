BEGIN;

CREATE TEMP TABLE seed_products (
  name TEXT NOT NULL,
  price DECIMAL(12,2) NOT NULL,
  stock INTEGER NOT NULL,
  image_url TEXT NOT NULL,
  category_slug TEXT NOT NULL,
  description TEXT
) ON COMMIT DROP;

INSERT INTO seed_products (name, price, stock, image_url, category_slug, description) VALUES
  ('Pulpen Pilot G2 0.5mm', 18000, 200, 'https://source.unsplash.com/400x400/?pilot+g2+gel+pen+stationery', 'alat-tulis', 'Pulpen gel halus untuk menulis dan menggambar.'),
  ('Buku Tulis Sidu 58 Lembar', 6500, 500, 'https://source.unsplash.com/400x400/?lined+notebook+school+stationery', 'alat-tulis', 'Buku tulis bergaris cocok untuk sekolah dan kantor.'),
  ('Stabilo Boss Highlighter Set 4 Warna', 42000, 150, 'https://source.unsplash.com/400x400/?highlighter+markers+set+stationery', 'alat-tulis', 'Set stabilo warna-warni untuk menandai teks penting.'),
  ('Popok Bayi Pampers Active Baby M 40 pcs', 135000, 80, 'https://source.unsplash.com/400x400/?baby+diapers+pack', 'bayi-anak', 'Popok bayi lembut dengan teknologi anti bocor untuk bayi aktif.'),
  ('Baju Bayi Jumper Katun Lengan Panjang', 65000, 120, 'https://source.unsplash.com/400x400/?baby+long+sleeve+onesie+cotton', 'bayi-anak', 'Jumper bayi bahan katun organik nyaman untuk tidur.'),
  ('Mainan Edukasi Puzzle Kayu Hewan', 89000, 60, 'https://source.unsplash.com/400x400/?wooden+animal+puzzle+toy+children', 'bayi-anak', 'Puzzle kayu bergambar hewan untuk stimulasi motorik anak 2-5 tahun.'),
  ('Serum Wajah Vitamin C 30ml', 185000, 90, 'https://source.unsplash.com/400x400/?vitamin+c+face+serum+bottle+skincare', 'beauty', 'Serum vitamin C mencerahkan wajah dan meratakan warna kulit.'),
  ('Sunscreen SPF50 PA+++ 50ml', 120000, 110, 'https://source.unsplash.com/400x400/?sunscreen+bottle+skincare+spf', 'beauty', 'Tabir surya ringan cocok untuk kulit sensitif dan berminyak.'),
  ('Lipstik Matte Tahan Lama', 75000, 200, 'https://source.unsplash.com/400x400/?matte+lipstick+makeup', 'beauty', 'Lipstik dengan formula matte tahan 12 jam, pilihan 20 warna.'),
  ('Moisturizer Hyaluronic Acid 50ml', 145000, 75, 'https://source.unsplash.com/400x400/?moisturizer+cream+jar+skincare', 'beauty', 'Pelembap ringan dengan hyaluronic acid untuk kulit lembap sepanjang hari.'),
  ('Novel Dune — Frank Herbert', 128000, 40, 'https://source.unsplash.com/400x400/?dune+novel+book+science+fiction', 'buku-edukasi', 'Novel fiksi ilmiah epik pemenang Hugo Award, edisi terjemahan Indonesia.'),
  ('Buku Belajar Python untuk Pemula', 99000, 55, 'https://source.unsplash.com/400x400/?python+programming+book+laptop+code', 'buku-edukasi', 'Panduan lengkap pemrograman Python dari nol hingga mahir.'),
  ('Kamus Besar Bahasa Indonesia (KBBI)', 175000, 30, 'https://source.unsplash.com/400x400/?dictionary+book+language', 'buku-edukasi', 'KBBI edisi terbaru lengkap dengan 100.000+ entri kata.'),
  ('Smart TV Samsung 43 Inch 4K UHD', 5499000, 15, 'https://source.unsplash.com/400x400/?smart+tv+television+4k+living+room', 'electronics', 'TV 4K dengan fitur Smart TV, HDR, dan koneksi WiFi built-in.'),
  ('Speaker Bluetooth JBL Flip 6', 1350000, 35, 'https://source.unsplash.com/400x400/?portable+bluetooth+speaker', 'electronics', 'Speaker portabel tahan air IP67 dengan suara bass yang kuat.'),
  ('Earbuds TWS Sony WF-1000XM5', 3200000, 20, 'https://source.unsplash.com/400x400/?wireless+earbuds+noise+cancelling', 'electronics', 'True wireless earbuds dengan noise cancelling terbaik di kelasnya.'),
  ('Kaos Polos Oversize Unisex Cotton', 85000, 300, 'https://source.unsplash.com/400x400/?oversized+plain+t+shirt+cotton', 'fashion', 'Kaos oversize bahan cotton combed 30s, tersedia 15 warna.'),
  ('Celana Jeans Slim Fit Pria', 249000, 80, 'https://source.unsplash.com/400x400/?men+slim+fit+jeans+denim', 'fashion', 'Celana jeans slim fit denim stretch nyaman dipakai seharian.'),
  ('Sepatu Sneakers Putih Kasual', 350000, 60, 'https://source.unsplash.com/400x400/?white+casual+sneakers+shoes', 'fashion', 'Sneakers putih kasual cocok untuk daily look, bahan kanvas premium.'),
  ('Tas Ransel Laptop 15.6 Inch', 285000, 45, 'https://source.unsplash.com/400x400/?laptop+backpack+waterproof', 'fashion', 'Ransel multifungsi waterproof dengan kompartemen laptop dan USB charging port.'),
  ('Sofa 3 Dudukan Minimalis Abu-abu', 3750000, 8, 'https://source.unsplash.com/400x400/?gray+three+seat+sofa+minimalist', 'furniture', 'Sofa modern minimalis bahan fabric premium, rangka kayu solid.'),
  ('Meja Kerja L-Shape dengan Laci', 1850000, 12, 'https://source.unsplash.com/400x400/?l+shaped+office+desk+drawers', 'furniture', 'Meja kerja bentuk L dengan 2 laci dan rak monitor built-in.'),
  ('Kursi Gaming Ergonomis RGB', 1450000, 25, 'https://source.unsplash.com/400x400/?rgb+gaming+chair+ergonomic', 'gaming', 'Kursi gaming ergonomis dengan lumbar support dan sandaran kaki, LED RGB.'),
  ('PlayStation 5 Digital Edition', 8499000, 5, 'https://source.unsplash.com/400x400/?playstation+5+console+controller', 'gaming', 'Konsol game generasi terbaru Sony dengan SSD ultra-cepat dan DualSense controller.'),
  ('Joystick Gamepad PC Wireless', 385000, 40, 'https://source.unsplash.com/400x400/?wireless+gamepad+controller', 'gaming', 'Controller wireless kompatibel PC, Xbox, dan Android dengan vibration feedback.'),
  ('Headset Gaming RGB 7.1 Surround', 450000, 30, 'https://source.unsplash.com/400x400/?rgb+gaming+headset+microphone', 'gaming', 'Headset gaming dengan suara surround 7.1 virtual dan mic noise cancelling.'),
  ('Samsung Galaxy S24 256GB', 13499000, 18, 'https://source.unsplash.com/400x400/?samsung+galaxy+smartphone', 'handphone-tablet', 'Flagship Android terbaru dengan kamera 200MP dan chip Exynos 2400.'),
  ('iPad Air 11 Inch M2 WiFi 128GB', 11999000, 10, 'https://source.unsplash.com/400x400/?ipad+tablet+apple', 'handphone-tablet', 'Tablet ringan bertenaga chip M2 dengan layar Liquid Retina 11 inci.'),
  ('Xiaomi Redmi Note 13 Pro 8/256GB', 3799000, 30, 'https://source.unsplash.com/400x400/?xiaomi+redmi+smartphone', 'handphone-tablet', 'Smartphone mid-range dengan kamera 200MP, AMOLED 120Hz, dan baterai 5000mAh.'),
  ('Makanan Anjing Royal Canin Adult 4kg', 320000, 50, 'https://source.unsplash.com/400x400/?dog+food+bag+kibble', 'hewan-peliharaan', 'Pakan anjing dewasa lengkap nutrisi untuk semua ras, formula premium.'),
  ('Pasir Kucing Clumping 10L', 85000, 100, 'https://source.unsplash.com/400x400/?cat+litter+box+cat', 'hewan-peliharaan', 'Pasir kucing gumpal cepat dengan parfum lavender anti bau.'),
  ('Kandang Burung Besi Minimalis', 175000, 35, 'https://source.unsplash.com/400x400/?bird+cage+metal', 'hewan-peliharaan', 'Kandang burung finishing anti karat, ukuran 40x40x60cm.'),
  ('Kamera Mirrorless Sony A7 IV Body Only', 38500000, 4, 'https://source.unsplash.com/400x400/?sony+mirrorless+camera', 'kamera-foto', 'Mirrorless full frame 33MP dengan IBIS 5-axis dan video 4K 60fps.'),
  ('Lensa Canon EF 50mm f/1.8 STM', 1850000, 12, 'https://source.unsplash.com/400x400/?canon+camera+lens+50mm', 'kamera-foto', 'Lensa fix portrait terjangkau dengan aperture lebar dan bokeh indah.'),
  ('Tripod Aluminum 165cm Portable', 325000, 40, 'https://source.unsplash.com/400x400/?camera+tripod+aluminum', 'kamera-foto', 'Tripod ringan aluminium dengan ball head 360° dan quick release plate.'),
  ('Masker KN95 5-Layer isi 50 pcs', 125000, 200, 'https://source.unsplash.com/400x400/?kn95+face+mask+box', 'kesehatan', 'Masker KN95 5 lapisan efisiensi filtrasi 95%, tersertifikasi SNI.'),
  ('Tensi Meter Digital Omron HEM-7120', 385000, 30, 'https://source.unsplash.com/400x400/?digital+blood+pressure+monitor', 'kesehatan', 'Alat ukur tekanan darah digital akurat dengan indikator aritmia.'),
  ('Vitamin C 1000mg Effervescent 30 tablet', 75000, 150, 'https://source.unsplash.com/400x400/?vitamin+c+tablets+supplement', 'kesehatan', 'Suplemen vitamin C dosis tinggi untuk imunitas, rasa jeruk segar.'),
  ('Laptop Asus ROG Strix G16 RTX4060', 17999000, 6, 'https://source.unsplash.com/400x400/?gaming+laptop+asus+rog', 'komputer-laptop', 'Laptop gaming 16 inci dengan RTX 4060, i7-13650HX, RAM 16GB, SSD 512GB.'),
  ('MacBook Air M3 13 Inch 8GB 256GB', 18499000, 8, 'https://source.unsplash.com/400x400/?macbook+air+laptop', 'komputer-laptop', 'Laptop tipis bertenaga chip M3 dengan layar Liquid Retina dan baterai 18 jam.'),
  ('Mouse Wireless Logitech MX Master 3S', 1250000, 25, 'https://source.unsplash.com/400x400/?wireless+ergonomic+mouse', 'komputer-laptop', 'Mouse ergonomis premium dengan MagSpeed scroll dan silent click.'),
  ('Lego Technic Bugatti Chiron 42083', 2850000, 10, 'https://source.unsplash.com/400x400/?lego+technic+car+model', 'mainan-hobi', 'Set Lego Technic edisi koleksi 3599 keping replika Bugatti Chiron.'),
  ('Action Figure Gundam RG 1/144 Wing Zero', 320000, 25, 'https://source.unsplash.com/400x400/?gundam+model+kit+action+figure', 'mainan-hobi', 'Model kit Gundam Real Grade detail tinggi, skala 1/144, 201 parts.'),
  ('Kopi Arabica Toraja Bubuk 250g', 85000, 100, 'https://source.unsplash.com/400x400/?ground+coffee+bag+arabica', 'makanan-minuman', 'Kopi arabika single origin Toraja dengan aroma fruity dan rasa balanced.'),
  ('Cokelat Dark 72% Lindt Excellence 100g', 55000, 80, 'https://source.unsplash.com/400x400/?dark+chocolate+bar', 'makanan-minuman', 'Cokelat dark premium Swiss dengan kakao 72%, kaya antioksidan.'),
  ('Madu Hutan Murni 500ml', 145000, 60, 'https://source.unsplash.com/400x400/?honey+jar+bottle', 'makanan-minuman', 'Madu hutan asli tanpa campuran, dipanen dari lebah liar Kalimantan.'),
  ('Oli Mesin Mobil Shell Helix Ultra 5W-40 4L', 425000, 40, 'https://source.unsplash.com/400x400/?motor+oil+bottle+car', 'otomotif', 'Oli mesin full synthetic berkualitas tinggi untuk mesin modern bensin & diesel.'),
  ('Wiper Blade Bosch Aerotwin 20+20 inch', 235000, 35, 'https://source.unsplash.com/400x400/?car+windshield+wiper+blade', 'otomotif', 'Wiper blade tanpa rangka untuk visibilitas optimal di segala cuaca.'),
  ('Wajan Anti Lengket Teflon 28cm', 175000, 70, 'https://source.unsplash.com/400x400/?nonstick+frying+pan+kitchen', 'peralatan-dapur', 'Wajan anti lengket lapisan PTFE 5-layer cocok untuk semua jenis kompor.'),
  ('Blender Philips HR2041 600W', 385000, 30, 'https://source.unsplash.com/400x400/?kitchen+blender+appliance', 'peralatan-dapur', 'Blender kaca 600W dengan 2 kecepatan dan fungsi pulse untuk smoothie & jus.'),
  ('Koper Kabin Hardcase 20 Inch', 650000, 25, 'https://source.unsplash.com/400x400/?hardcase+cabin+suitcase+luggage', 'perjalanan', 'Koper kabin ABS hardcase 4-roda 360°, kunci TSA, kapasitas 38L.'),
  ('Travel Pillow Memory Foam U-shape', 125000, 60, 'https://source.unsplash.com/400x400/?travel+neck+pillow+memory+foam', 'perjalanan', 'Bantal leher memory foam untuk perjalanan jauh di pesawat dan bus.'),
  ('Tenda Camping Dome 4 Orang', 850000, 15, 'https://source.unsplash.com/400x400/?camping+dome+tent', 'perjalanan', 'Tenda dome waterproof 3000mm, mudah dipasang, cocok untuk 4 orang.'),
  ('Sepatu Lari Nike Air Max 270', 1750000, 30, 'https://source.unsplash.com/400x400/?nike+running+shoes+air+max', 'sports', 'Sepatu lari dengan teknologi Air Max 270 untuk kenyamanan maksimal.'),
  ('Raket Badminton Yonex Astrox 88S', 1250000, 20, 'https://source.unsplash.com/400x400/?badminton+racket+yonex', 'sports', 'Raket badminton karbon high-flex untuk pukulan smash bertenaga.'),
  ('Dumbbell Set 2x10kg Rubber', 385000, 40, 'https://source.unsplash.com/400x400/?rubber+dumbbell+set+gym', 'sports', 'Dumbbell hexagonal karet anti slip, cocok untuk latihan di rumah.'),
  ('Bibit Monstera Deliciosa', 85000, 50, 'https://source.unsplash.com/400x400/?monstera+deliciosa+plant+pot', 'tanaman-kebun', 'Bibit monstera sehat dalam pot 15cm, daun berlubang karakteristik.'),
  ('Pot Tanah Liat Terracotta 20cm', 35000, 150, 'https://source.unsplash.com/400x400/?terracotta+clay+plant+pot', 'tanaman-kebun', 'Pot terracotta natural dengan lubang drainase, cocok untuk semua jenis tanaman.'),
  ('Pupuk NPK Mutiara 16-16-16 1kg', 28000, 200, 'https://source.unsplash.com/400x400/?garden+fertilizer+bag', 'tanaman-kebun', 'Pupuk majemuk seimbang untuk pertumbuhan vegetatif dan generatif optimal.'),
  ('Keyboard Mechanical Keychron K8 TKL', 1450000, 18, 'https://source.unsplash.com/400x400/?mechanical+keyboard+tenkeyless', 'komputer-laptop', 'Keyboard mechanical wireless TKL dengan switch Gateron Brown, backlit white.');

WITH selected_seller AS (
  SELECT id
  FROM public.profiles
  ORDER BY CASE WHEN role = 'seller' THEN 0 ELSE 1 END, created_at
  LIMIT 1
)
INSERT INTO public.products (name, price, stock, image_url, category_id, seller_id, description, created_at, updated_at)
SELECT
  seed_products.name,
  seed_products.price,
  seed_products.stock,
  seed_products.image_url,
  categories.id,
  selected_seller.id,
  seed_products.description,
  NOW(),
  NOW()
FROM seed_products
JOIN public.categories ON categories.slug = seed_products.category_slug
CROSS JOIN selected_seller
WHERE NOT EXISTS (
  SELECT 1
  FROM public.products
  WHERE products.name = seed_products.name
);

WITH selected_seller AS (
  SELECT id
  FROM public.profiles
  ORDER BY CASE WHEN role = 'seller' THEN 0 ELSE 1 END, created_at
  LIMIT 1
)
UPDATE public.products
SET
  price = seed_products.price,
  stock = seed_products.stock,
  image_url = seed_products.image_url,
  category_id = categories.id,
  seller_id = selected_seller.id,
  description = seed_products.description,
  updated_at = NOW()
FROM seed_products
JOIN public.categories ON categories.slug = seed_products.category_slug
CROSS JOIN selected_seller
WHERE products.name = seed_products.name;

COMMIT;
