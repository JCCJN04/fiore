import { fetchSpecialOrders, updateSpecialOrderStatus, generateSpecialOrderWhatsAppLink, markWhatsAppSent } from '../services/orders.js'
import { showAdminToast, updateOrderBadge } from '../admin.js'

let allOrders = []
let currentFilter = null

/**
 * Render the Orders section
 */
export async function renderOrders(container) {
  try {
    allOrders = await fetchSpecialOrders()
    renderOrdersView(container)
  } catch (err) {
    console.error('Error rendering orders:', err)
    container.innerHTML = `
      <div class="empty-state">
        <span class="material-symbols-outlined">error_outline</span>
        <p>Error al cargar pedidos.</p>
      </div>
    `
  }
}

function renderOrdersView(container) {
  const counts = {
    total: allOrders.length,
    pending: allOrders.filter(o => o.status === 'pending').length,
    contacted: allOrders.filter(o => o.status === 'contacted').length,
    completed: allOrders.filter(o => o.status === 'completed').length,
    cancelled: allOrders.filter(o => o.status === 'cancelled').length,
  }

  const filtered = currentFilter
    ? allOrders.filter(o => o.status === currentFilter)
    : allOrders

  container.innerHTML = `
    <!-- Filters -->
    <div class="filter-bar">
      <button class="filter-btn ${!currentFilter ? 'active' : ''}" data-filter="">
        Todos (${counts.total})
      </button>
      <button class="filter-btn ${currentFilter === 'pending' ? 'active' : ''}" data-filter="pending">
        🟡 Pendientes (${counts.pending})
      </button>
      <button class="filter-btn ${currentFilter === 'contacted' ? 'active' : ''}" data-filter="contacted">
        🟢 Contactados (${counts.contacted})
      </button>
      <button class="filter-btn ${currentFilter === 'completed' ? 'active' : ''}" data-filter="completed">
        ✅ Completados (${counts.completed})
      </button>
      <button class="filter-btn ${currentFilter === 'cancelled' ? 'active' : ''}" data-filter="cancelled">
        ❌ Cancelados (${counts.cancelled})
      </button>
    </div>

    ${filtered.length > 0 ? `
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        ${filtered.map(order => renderOrderCard(order)).join('')}
      </div>
    ` : `
      <div class="empty-state">
        <span class="material-symbols-outlined">receipt_long</span>
        <p>${currentFilter ? 'No hay pedidos con este estado.' : 'No hay pedidos especiales aún.'}</p>
        <p style="font-size: 13px; margin-top: 0.5rem;">Los pedidos aparecerán aquí cuando alguien complete el formulario de la tienda.</p>
      </div>
    `}
  `

  // Filter events
  document.querySelectorAll('[data-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      currentFilter = btn.dataset.filter || null
      renderOrdersView(container)
    })
  })

  // Status change events
  document.querySelectorAll('[data-order-status]').forEach(select => {
    select.addEventListener('change', async (e) => {
      const orderId = select.dataset.orderId
      const newStatus = e.target.value
      try {
        await updateSpecialOrderStatus(orderId, newStatus)
        showAdminToast(`Estado actualizado: ${getStatusLabel(newStatus)}`)
        // Update local data
        const order = allOrders.find(o => o.id === orderId)
        if (order) order.status = newStatus
        renderOrdersView(container)
        updateOrderBadge()
      } catch (err) {
        showAdminToast('Error al actualizar estado', 'error')
      }
    })
  })

  // WhatsApp events
  document.querySelectorAll('[data-whatsapp-order]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const orderId = btn.dataset.whatsappOrder
      const order = allOrders.find(o => o.id === orderId)
      if (!order) return

      const link = generateSpecialOrderWhatsAppLink(order)
      window.open(link, '_blank')

      try {
        await markWhatsAppSent(orderId)
        order.whatsapp_sent = true
        renderOrdersView(container)
      } catch (e) {
        // Silently handle
      }
    })
  })
}

function renderOrderCard(order) {
  const date = new Date(order.created_at).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const deliveryDate = order.delivery_date
    ? new Date(order.delivery_date + 'T00:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  return `
    <div style="background: #fff; border: 1px solid #c4c7c720; border-radius: 0.25rem; padding: 1.25rem; transition: box-shadow 0.2s;" class="hover:shadow-sm">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 1rem;">
        <div>
          <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
            <strong style="font-size: 16px;">${escapeHTML(order.name || 'Sin nombre')}</strong>
            <span class="badge badge-${order.status}">${getStatusLabel(order.status)}</span>
            ${order.whatsapp_sent ? '<span style="font-size: 11px; color: #546250;">✓ WhatsApp enviado</span>' : ''}
          </div>
          <div style="font-size: 12px; color: #747878; margin-top: 0.25rem;">
            ${date}
            ${order.email ? ` · ${escapeHTML(order.email)}` : ''}
          </div>
        </div>
        <div style="display: flex; gap: 0.5rem; align-items: center;">
          <select class="form-select" data-order-status data-order-id="${order.id}" style="width: auto; font-size: 12px; padding: 4px 8px;">
            <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pendiente</option>
            <option value="contacted" ${order.status === 'contacted' ? 'selected' : ''}>Contactado</option>
            <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>Completado</option>
            <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelado</option>
          </select>
          <button class="btn btn-secondary" data-whatsapp-order="${order.id}" style="font-size: 10px; padding: 4px 8px;">
            <span class="material-symbols-outlined" style="font-size: 14px;">chat</span>
            WhatsApp
          </button>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 0.75rem; font-size: 13px;">
        ${order.event_type ? `
          <div>
            <span style="color: #747878; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em;">Evento</span>
            <p style="margin-top: 0.125rem;">${escapeHTML(order.event_type)}</p>
          </div>
        ` : ''}
        ${order.budget ? `
          <div>
            <span style="color: #747878; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em;">Presupuesto</span>
            <p style="margin-top: 0.125rem;">${escapeHTML(order.budget)}</p>
          </div>
        ` : ''}
        ${deliveryDate ? `
          <div>
            <span style="color: #747878; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em;">Fecha Entrega</span>
            <p style="margin-top: 0.125rem;">${deliveryDate}</p>
          </div>
        ` : ''}
      </div>

      ${order.details ? `
        <div style="margin-top: 0.75rem; padding: 0.75rem; background: #faf9f6; border-radius: 0.125rem; font-size: 13px; color: #444748;">
          <span style="color: #747878; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em;">Detalles</span>
          <p style="margin-top: 0.25rem;">${escapeHTML(order.details)}</p>
        </div>
      ` : ''}
    </div>
  `
}

function getStatusLabel(status) {
  const labels = {
    pending: 'Pendiente',
    contacted: 'Contactado',
    completed: 'Completado',
    cancelled: 'Cancelado',
  }
  return labels[status] || status
}

function escapeHTML(str) {
  if (!str) return ''
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}
