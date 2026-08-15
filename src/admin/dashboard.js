import { fetchAllProducts } from '../services/products.js'
import { getOrderCounts } from '../services/orders.js'
import { fetchAllCategories } from '../services/categories.js'

/**
 * Render the Dashboard section
 */
export async function renderDashboard(container) {
  try {
    const [products, orderCounts, categories] = await Promise.all([
      fetchAllProducts(),
      getOrderCounts(),
      fetchAllCategories(),
    ])

    const activeProducts = products.filter(p => p.is_active).length
    const totalProducts = products.length

    container.innerHTML = `
      <div style="margin-bottom: 2rem;">
        <h3 style="font-family: 'EB Garamond', serif; font-size: 28px; color: #1a1c1a; margin-bottom: 0.5rem;">
          ¡Bienvenido! 🌸
        </h3>
        <p style="font-size: 14px; color: #444748;">
          Resumen de tu tienda Fiore Taller Floral
        </p>
      </div>

      <!-- Stats Grid -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2.5rem;">
        <div class="stat-card">
          <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem;">
            <span class="material-symbols-outlined" style="font-size: 24px; color: #546250;">local_florist</span>
            <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #444748; font-weight: 600;">Productos</span>
          </div>
          <div style="font-size: 32px; font-weight: 500; color: #1a1c1a; font-family: 'EB Garamond', serif;">${activeProducts}</div>
          <div style="font-size: 12px; color: #747878; margin-top: 0.25rem;">de ${totalProducts} total · activos en tienda</div>
        </div>
        <div class="stat-card">
          <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem;">
            <span class="material-symbols-outlined" style="font-size: 24px; color: #623f18;">receipt_long</span>
            <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #444748; font-weight: 600;">Pedidos Pendientes</span>
          </div>
          <div style="font-size: 32px; font-weight: 500; color: #1a1c1a; font-family: 'EB Garamond', serif;">${orderCounts.pending}</div>
          <div style="font-size: 12px; color: #747878; margin-top: 0.25rem;">requieren atención</div>
        </div>
        <div class="stat-card">
          <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem;">
            <span class="material-symbols-outlined" style="font-size: 24px; color: #546250;">chat</span>
            <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #444748; font-weight: 600;">Contactados</span>
          </div>
          <div style="font-size: 32px; font-weight: 500; color: #1a1c1a; font-family: 'EB Garamond', serif;">${orderCounts.contacted}</div>
          <div style="font-size: 12px; color: #747878; margin-top: 0.25rem;">en proceso</div>
        </div>
        <div class="stat-card">
          <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem;">
            <span class="material-symbols-outlined" style="font-size: 24px; color: #747878;">category</span>
            <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #444748; font-weight: 600;">Categorías</span>
          </div>
          <div style="font-size: 32px; font-weight: 500; color: #1a1c1a; font-family: 'EB Garamond', serif;">${categories.length}</div>
          <div style="font-size: 12px; color: #747878; margin-top: 0.25rem;">categorías configuradas</div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div style="margin-bottom: 2rem;">
        <h4 style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #444748; font-weight: 600; margin-bottom: 1rem;">Acciones Rápidas</h4>
        <div style="display: flex; flex-wrap: wrap; gap: 0.75rem;">
          <a href="#products" class="btn btn-primary">
            <span class="material-symbols-outlined">add</span>
            Nuevo Producto
          </a>
          <a href="#orders" class="btn btn-secondary">
            <span class="material-symbols-outlined">receipt_long</span>
            Ver Pedidos (${orderCounts.pending} pendientes)
          </a>
          <a href="#categories" class="btn btn-secondary">
            <span class="material-symbols-outlined">category</span>
            Gestionar Categorías
          </a>
        </div>
      </div>

      <!-- Recent Products -->
      ${products.length > 0 ? `
        <div>
          <h4 style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #444748; font-weight: 600; margin-bottom: 1rem;">Productos Recientes</h4>
          <div style="background: #fff; border: 1px solid #c4c7c720; border-radius: 0.25rem; overflow: hidden;">
            <table class="admin-table">
              <thead>
                <tr>
                  <th></th>
                  <th>Nombre</th>
                  <th>Precio</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                ${products.slice(0, 5).map(p => `
                  <tr>
                    <td>
                      <img src="${escapeAttr(p.image_url || '')}" class="product-thumb" alt="" onerror="this.style.display='none'"/>
                    </td>
                    <td><strong>${escapeHTML(p.name)}</strong></td>
                    <td>$${Number(p.price).toLocaleString('es-MX')} MXN</td>
                    <td><span class="badge ${p.is_active ? 'badge-active' : 'badge-inactive'}">${p.is_active ? 'Activo' : 'Inactivo'}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      ` : `
        <div class="empty-state">
          <span class="material-symbols-outlined">local_florist</span>
          <p>Aún no hay productos. <a href="#products" style="color: #546250; text-decoration: underline;">Agrega el primero</a></p>
        </div>
      `}
    `
  } catch (err) {
    console.error('Error rendering dashboard:', err)
    container.innerHTML = `
      <div class="empty-state">
        <span class="material-symbols-outlined">error_outline</span>
        <p>Error al cargar el dashboard. Verifica tu conexión a Supabase.</p>
        <p style="font-size: 12px; color: #747878; margin-top: 0.5rem;">${escapeHTML(err.message || '')}</p>
      </div>
    `
  }
}

function escapeHTML(str) {
  if (!str) return ''
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}

function escapeAttr(str) {
  if (!str) return ''
  return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
