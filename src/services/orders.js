import { supabase } from '../lib/supabase.js'

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '5215512345678'

/**
 * Generar link de WhatsApp para un producto
 */
export function generateWhatsAppLink(product) {
  const message = encodeURIComponent(
    `¡Hola! 🌸 Me interesa el arreglo "${product.name}" ($${Number(product.price).toLocaleString('es-MX')} MXN). ¿Podrían darme más información?`
  )
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`
}

/**
 * Generar link de WhatsApp para un pedido especial
 */
export function generateSpecialOrderWhatsAppLink(order) {
  const parts = [
    `¡Hola! 🌸 Me gustaría hacer un pedido especial.`,
    `\n📋 *Detalles:*`,
    order.event_type ? `• Evento: ${order.event_type}` : '',
    order.budget ? `• Presupuesto: ${order.budget}` : '',
    order.delivery_date ? `• Fecha: ${order.delivery_date}` : '',
    order.details ? `• Visión: ${order.details}` : '',
    `\n*${order.name}*`,
    order.email ? `📧 ${order.email}` : '',
  ].filter(Boolean).join('\n')

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(parts)}`
}

/**
 * Crear un pedido especial en Supabase
 */
export async function createSpecialOrder(order) {
  const { data, error } = await supabase
    .from('special_orders')
    .insert([{
      name: order.name,
      email: order.email,
      event_type: order.event_type,
      budget: order.budget,
      delivery_date: order.delivery_date || null,
      details: order.details,
      status: 'pending',
      whatsapp_sent: false,
    }])
    .select()
    .single()

  if (error) {
    console.error('Error creating special order:', error)
    throw error
  }
  return data
}

/**
 * Obtener todos los pedidos especiales (admin)
 */
export async function fetchSpecialOrders(statusFilter = null) {
  let query = supabase
    .from('special_orders')
    .select('*')
    .order('created_at', { ascending: false })

  if (statusFilter) {
    query = query.eq('status', statusFilter)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching special orders:', error)
    return []
  }
  return data
}

/**
 * Actualizar estado de un pedido especial
 */
export async function updateSpecialOrderStatus(id, status) {
  const { data, error } = await supabase
    .from('special_orders')
    .update({ status })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating order status:', error)
    throw error
  }
  return data
}

/**
 * Marcar que se envió WhatsApp a un pedido
 */
export async function markWhatsAppSent(id) {
  const { error } = await supabase
    .from('special_orders')
    .update({ whatsapp_sent: true })
    .eq('id', id)

  if (error) {
    console.error('Error marking WhatsApp sent:', error)
  }
}

/**
 * Obtener conteo de pedidos por estado
 */
export async function getOrderCounts() {
  const { data, error } = await supabase
    .from('special_orders')
    .select('status')

  if (error) {
    console.error('Error fetching order counts:', error)
    return { pending: 0, contacted: 0, completed: 0, total: 0 }
  }

  const counts = {
    pending: 0,
    contacted: 0,
    completed: 0,
    cancelled: 0,
    total: data.length,
  }

  data.forEach(order => {
    if (counts[order.status] !== undefined) {
      counts[order.status]++
    }
  })

  return counts
}
