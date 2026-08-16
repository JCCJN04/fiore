import { requireAuth, signOut, onAuthChange } from './auth.js'
import { renderDashboard } from './admin/dashboard.js'
import { renderProducts } from './admin/products.js'
import { renderCategories } from './admin/categories.js'
import { renderOrders } from './admin/orders.js'
import { getOrderCounts } from './services/orders.js'

// ============================================
// Admin Panel — Main Controller
// ============================================

const sections = {
  dashboard: { title: 'Dashboard', render: renderDashboard },
  products: { title: 'Productos', render: renderProducts },
  categories: { title: 'Categorías', render: renderCategories },
  orders: { title: 'Pedidos Especiales', render: renderOrders },
}

let currentSection = 'dashboard'

document.addEventListener('DOMContentLoaded', async () => {
  // Auth guard
  const session = await requireAuth()
  if (!session) return

  // Show admin email
  const emailEl = document.getElementById('admin-email')
  if (emailEl && session.user?.email) {
    emailEl.textContent = session.user.email
  }

  // Init
  initSidebar()
  initLogout()
  initModals()
  initRouter()
  updateOrderBadge()

  // Listen for auth changes
  onAuthChange((event) => {
    if (event === 'SIGNED_OUT') {
      window.location.href = '/login'
    }
  })
})

// ============================================
// Hash-based Router
// ============================================
function initRouter() {
  // Navigate to current hash or default
  const hash = window.location.hash.replace('#', '') || 'dashboard'
  navigateTo(hash)

  // Listen for hash changes
  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.replace('#', '')
    navigateTo(hash)
  })
}

function navigateTo(section) {
  if (!sections[section]) {
    section = 'dashboard'
  }

  currentSection = section
  const { title, render } = sections[section]

  // Update page title
  const titleEl = document.getElementById('page-title')
  if (titleEl) titleEl.textContent = title

  // Update active nav link
  document.querySelectorAll('.sidebar-nav a').forEach(link => {
    link.classList.toggle('active', link.dataset.section === section)
  })

  // Render section content
  const content = document.getElementById('admin-content')
  if (content) {
    content.innerHTML = '<div style="text-align:center; padding: 3rem;"><span class="material-symbols-outlined" style="font-size: 24px; animation: spin 1s linear infinite;">progress_activity</span></div>'
    render(content)
  }

  // Close mobile sidebar
  closeSidebar()
}

// ============================================
// Sidebar
// ============================================
function initSidebar() {
  const toggle = document.getElementById('sidebar-toggle')
  const backdrop = document.getElementById('sidebar-backdrop')

  if (toggle) {
    toggle.addEventListener('click', toggleSidebar)
  }
  if (backdrop) {
    backdrop.addEventListener('click', closeSidebar)
  }
}

function toggleSidebar() {
  const sidebar = document.getElementById('admin-sidebar')
  const backdrop = document.getElementById('sidebar-backdrop')
  sidebar?.classList.toggle('open')
  backdrop?.classList.toggle('open')
}

function closeSidebar() {
  const sidebar = document.getElementById('admin-sidebar')
  const backdrop = document.getElementById('sidebar-backdrop')
  sidebar?.classList.remove('open')
  backdrop?.classList.remove('open')
}

// ============================================
// Logout
// ============================================
function initLogout() {
  const btn = document.getElementById('logout-btn')
  if (btn) {
    btn.addEventListener('click', async () => {
      await signOut()
    })
  }
}

// ============================================
// Modals
// ============================================
function initModals() {
  // Close modal buttons
  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modalId = btn.dataset.closeModal
      closeModal(modalId)
    })
  })

  // Close on overlay click
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('open')
      }
    })
  })

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.open').forEach(m => {
        m.classList.remove('open')
      })
    }
  })
}

// ============================================
// Exported Utilities
// ============================================
export function openModal(modalId) {
  document.getElementById(modalId)?.classList.add('open')
}

export function closeModal(modalId) {
  document.getElementById(modalId)?.classList.remove('open')
}

export function showAdminToast(message, icon = 'check_circle') {
  const toast = document.getElementById('admin-toast')
  const msgEl = document.getElementById('admin-toast-message')
  const iconEl = document.getElementById('admin-toast-icon')
  if (!toast) return

  msgEl.textContent = message
  iconEl.textContent = icon
  toast.classList.add('show')

  setTimeout(() => toast.classList.remove('show'), 4000)
}

export function showConfirm(message, onConfirm) {
  const msgEl = document.getElementById('confirm-message')
  const actionBtn = document.getElementById('confirm-action')
  if (!msgEl || !actionBtn) return

  msgEl.textContent = message
  openModal('confirm-modal')

  // Remove old listeners
  const newBtn = actionBtn.cloneNode(true)
  actionBtn.parentNode.replaceChild(newBtn, actionBtn)

  newBtn.addEventListener('click', () => {
    closeModal('confirm-modal')
    onConfirm()
  })
}

export async function updateOrderBadge() {
  try {
    const counts = await getOrderCounts()
    const badge = document.getElementById('orders-badge')
    if (badge && counts.pending > 0) {
      badge.textContent = counts.pending
      badge.classList.remove('hidden')
    } else if (badge) {
      badge.classList.add('hidden')
    }
  } catch (e) {
    // Silently fail
  }
}

export function getCurrentSection() {
  return currentSection
}
