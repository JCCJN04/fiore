import { supabase } from '../lib/supabase.js'

/**
 * Obtener todos los productos activos, ordenados
 */
export async function fetchProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*, categories(name, slug)')
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  if (error) {
    console.error('Error fetching products:', error)
    return []
  }
  return data
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
