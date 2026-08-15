import { supabase } from '../lib/supabase.js'

/**
 * Obtener categorías activas ordenadas
 */
export async function fetchCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  if (error) {
    console.error('Error fetching categories:', error)
    return []
  }
  return data
}

/**
 * Obtener todas las categorías (admin — incluyendo inactivas)
 */
export async function fetchAllCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('display_order', { ascending: true })

  if (error) {
    console.error('Error fetching all categories:', error)
    return []
  }
  return data
}

/**
 * Crear una categoría
 */
export async function createCategory(category) {
  const { data, error } = await supabase
    .from('categories')
    .insert([category])
    .select()
    .single()

  if (error) {
    console.error('Error creating category:', error)
    throw error
  }
  return data
}

/**
 * Actualizar una categoría
 */
export async function updateCategory(id, updates) {
  const { data, error } = await supabase
    .from('categories')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating category:', error)
    throw error
  }
  return data
}

/**
 * Eliminar una categoría
 */
export async function deleteCategory(id) {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting category:', error)
    throw error
  }
}
