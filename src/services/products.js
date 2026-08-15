import { supabase } from '../lib/supabase.js'

const DEFAULT_PRODUCTS = [
  {
    id: '1',
    name: 'Jardín Silvestre',
    description: 'Composición orgánica con flores de temporada en tonos cálidos y texturas botánicas silvestres.',
    price: 1450,
    badge: 'Más Popular',
    image_url: 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=800&q=80',
    is_active: true,
    display_order: 1,
    categories: { name: 'Arreglos de Autor', slug: 'arreglos-autor' }
  },
  {
    id: '2',
    name: 'Alba Minimalista',
    description: 'Diseño monocromático en florero cerámico artesanal con follajes finos y acentos etéreos.',
    price: 1850,
    badge: 'Edición Limitada',
    image_url: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=800&q=80',
    is_active: true,
    display_order: 2,
    categories: { name: 'Arreglos de Autor', slug: 'arreglos-autor' }
  },
  {
    id: '3',
    name: 'Velvet Noche',
    description: 'Tonos profundos de borgoña y follajes oscuros en base de vidrio soplado artesanal.',
    price: 2200,
    badge: null,
    image_url: '/images/velvet-noche.jpg',
    is_active: true,
    display_order: 3,
    categories: { name: 'Arreglos de Autor', slug: 'arreglos-autor' }
  },
  {
    id: '4',
    name: 'Atardecer Coral',
    description: 'Rosas inglesas, ranúnculos y detalles en coral vivo para iluminar cualquier espacio.',
    price: 1650,
    badge: 'Nuevo',
    image_url: 'https://images.unsplash.com/photo-1582794543139-8ac9cb0f7b11?auto=format&fit=crop&w=800&q=80',
    is_active: true,
    display_order: 4,
    categories: { name: 'Ocasiones Especiales', slug: 'ocasiones-especiales' }
  }
]

/**
 * Obtener todos los productos activos, ordenados
 */
export async function fetchProducts() {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*, categories(name, slug)')
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (error || !data || data.length === 0) {
      console.warn('Supabase products fetch warning, using default catalog:', error)
      return DEFAULT_PRODUCTS
    }
    return data
  } catch (err) {
    console.warn('Network issue fetching from Supabase, using default catalog:', err)
    return DEFAULT_PRODUCTS
  }
}

/**
 * Obtener productos por categoría
 */
export async function fetchProductsByCategory(categoryId) {
  const { data, error } = await supabase
    .from('products')
    .select('*, categories(name, slug)')
    .eq('is_active', true)
    .eq('category_id', categoryId)
    .order('display_order', { ascending: true })

  if (error) {
    console.error('Error fetching products by category:', error)
    return []
  }
  return data
}

/**
 * Obtener todos los productos (admin — incluyendo inactivos)
 */
export async function fetchAllProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*, categories(name, slug)')
    .order('display_order', { ascending: true })

  if (error) {
    console.error('Error fetching all products:', error)
    return []
  }
  return data
}

/**
 * Obtener un producto por ID
 */
export async function fetchProductById(id) {
  const { data, error } = await supabase
    .from('products')
    .select('*, categories(name, slug)')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching product:', error)
    return null
  }
  return data
}

/**
 * Crear un producto nuevo
 */
export async function createProduct(product) {
  const { data, error } = await supabase
    .from('products')
    .insert([product])
    .select()
    .single()

  if (error) {
    console.error('Error creating product:', error)
    throw error
  }
  return data
}

/**
 * Actualizar un producto existente
 */
export async function updateProduct(id, updates) {
  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating product:', error)
    throw error
  }
  return data
}

/**
 * Eliminar un producto
 */
export async function deleteProduct(id) {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting product:', error)
    throw error
  }
}

/**
 * Subir imagen de producto a Supabase Storage
 */
export async function uploadProductImage(file) {
  const fileExt = file.name.split('.').pop()
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
  const filePath = `products/${fileName}`

  const { error } = await supabase.storage
    .from('product-images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    console.error('Error uploading image:', error)
    throw error
  }

  const { data: urlData } = supabase.storage
    .from('product-images')
    .getPublicUrl(filePath)

  return urlData.publicUrl
}

/**
 * Eliminar imagen de Supabase Storage
 */
export async function deleteProductImage(imageUrl) {
  // Extraer el path del URL público
  const urlParts = imageUrl.split('/product-images/')
  if (urlParts.length < 2) return

  const filePath = urlParts[1]
  const { error } = await supabase.storage
    .from('product-images')
    .remove([filePath])

  if (error) {
    console.error('Error deleting image:', error)
  }
}
