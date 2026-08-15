-- ============================================
-- Fiore Taller Floral — Supabase Database Schema
-- ============================================
-- Ejecutar este archivo completo en el SQL Editor de Supabase
-- Dashboard → SQL Editor → New Query → Pegar y ejecutar

-- ============================================
-- 1. TABLAS
-- ============================================

-- Categorías de productos
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT DEFAULT '',
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Productos / arreglos florales
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  image_url TEXT DEFAULT '',
  badge TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Pedidos especiales del formulario de contacto
CREATE TABLE IF NOT EXISTS special_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  email TEXT DEFAULT '',
  event_type TEXT DEFAULT '',
  budget TEXT DEFAULT '',
  delivery_date DATE,
  details TEXT DEFAULT '',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'completed', 'cancelled')),
  whatsapp_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger para actualizar updated_at automáticamente en products
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 2. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE special_orders ENABLE ROW LEVEL SECURITY;

-- CATEGORÍAS: Lectura pública, escritura solo admin autenticado
CREATE POLICY "categories_select_public" ON categories
  FOR SELECT USING (true);

CREATE POLICY "categories_insert_auth" ON categories
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "categories_update_auth" ON categories
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "categories_delete_auth" ON categories
  FOR DELETE USING (auth.role() = 'authenticated');

-- PRODUCTOS: Lectura pública, escritura solo admin autenticado
CREATE POLICY "products_select_public" ON products
  FOR SELECT USING (true);

CREATE POLICY "products_insert_auth" ON products
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "products_update_auth" ON products
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "products_delete_auth" ON products
  FOR DELETE USING (auth.role() = 'authenticated');

-- PEDIDOS ESPECIALES: Inserción pública (formulario), lectura/update solo admin
CREATE POLICY "special_orders_insert_public" ON special_orders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "special_orders_select_auth" ON special_orders
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "special_orders_update_auth" ON special_orders
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "special_orders_delete_auth" ON special_orders
  FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================
-- 3. STORAGE BUCKET
-- ============================================
-- NOTA: Crear manualmente en Dashboard → Storage → New Bucket
-- Nombre: product-images
-- Public: true
-- O ejecutar esto (requiere permisos de service_role):
-- INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true);

-- ============================================
-- 4. DATOS INICIALES (SEED)
-- ============================================

-- Categorías iniciales
INSERT INTO categories (name, slug, description, display_order) VALUES
  ('Arreglos de Autor', 'arreglos-autor', 'Diseños únicos e irrepetibles.', 1),
  ('Bodas y Eventos', 'bodas-eventos', 'Flores para tu día especial.', 2),
  ('Ocasiones Especiales', 'ocasiones-especiales', 'Regalos que sorprenden.', 3),
  ('Talleres & Experiencias', 'talleres-experiencias', 'Aprende el arte botánico.', 4);

-- Productos iniciales (usando las imágenes existentes)
INSERT INTO products (name, description, price, image_url, badge, display_order, category_id) VALUES
  (
    'Jardín Silvestre',
    'Tonos tierra, texturas orgánicas.',
    1250.00,
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDNR8aUJCOh46U_w3mJ3bg4wYlyOmAl-NxaGkV7GGCb1bK3A1f2UEpibmjAPyfkmDbzmAd66AYgc7umiueP2ysW7bnIl9zW90QXyBxEj8RyhRvf775tUoN_zblmglAj9BoYTvRjiQ5u8419DhoMLrsYT7RpDByWOBVzCCk5XpKbljE95Eb3ag-qchaQcoQztJ18a6A6eOip586U0T80QHp9BVtMCeBfXFIO8XWB-veSSXPzYIbIjZlI',
    'Más Vendido',
    1,
    (SELECT id FROM categories WHERE slug = 'arreglos-autor')
  ),
  (
    'Alba Minimalista',
    'Monocromático blanco, pureza absoluta.',
    980.00,
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDEsKKgbbS0_I2e5ImHhjqtvMhOTf30hHVsNBeWr9BpIiH3dqwjxCoB601byBLqiYFUwDdD1NgDrEGlLPUgqlOW65qYB1yViMTwp7teeGRo2-yyhYNAvgTUBPzq95UtwTKTzHOtCIXYQM249Q98tJiEpdv07w6p-Y7cwAcmrGIlUf8JqHF8YNQNfeq1jdpdizPkYCBosLbL-Luu-6OCJWduH2rU5rwklfAvqKdul0qwNOWL_5RO4NaL',
    '',
    2,
    (SELECT id FROM categories WHERE slug = 'arreglos-autor')
  ),
  (
    'Atardecer Coral',
    'Peonías y ranúnculos en tonos cálidos.',
    1450.00,
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDfARN_UH82mmQjnHuhs-ZjEueVcPc0jzXB-ga3y5PTR541WYFNApx8dv7s5Rsu0jgIPrsjQNqPJWuxdtiv4XM0riUNWL46MBLUBtpp1Mtq-i34kaK55II5fzffwF9i2sCEgFrEYQ6fi90WQ6lfz-E3a1m6o6Ys7PykOO8lMNsa-B4wFQ_Yf3CGn6iERiu2ZC1mG7EfyS0DQWibbeWcS9J7ps7pzVY_5bEG2Uc5El64bS5SVAuoSGf1',
    'Nuevo',
    3,
    (SELECT id FROM categories WHERE slug = 'ocasiones-especiales')
  ),
  (
    'Velvet Noche',
    'Borgoña profundo y texturas sedosas.',
    1100.00,
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCPEa6lkjtQE-bcibey-2OIqgSGaKA4xxsHDMF0iXRLy4GIZBwSzZibUmPG3o9lJPhmtl5o-7z0q8OI7qgHEUzRCDKMRsi0MqOwWnalj7vo-FXd2SCz4LpW-v6Eb0nyMtQlWmmjxIx7BO2GSx6J9EhKHCFmYgp1jqJepyRr1zlldC1-22FUgN-Z-FXVDj23vDL6Q5Rpxm8hXuEqUyIbAxum-U5qS7wdVXVZOv-xt5bFdXHkpPLwtBm9',
    '',
    4,
    (SELECT id FROM categories WHERE slug = 'arreglos-autor')
  );
