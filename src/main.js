import { fetchProducts } from './services/products.js'
import { createSpecialOrder, generateWhatsAppLink, generateSpecialOrderWhatsAppLink } from './services/orders.js'

// ============================================
// MAIN — Public Storefront Logic
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu()
  loadProducts()
  initSpecialOrderForm()
})

// ============================================
// Mobile Menu Toggle
// ============================================
function initMobileMenu() {
  const btn = document.getElementById('mobile-menu-btn')
  const menu = document.getElementById('mobile-menu')
  if (!btn || !menu) return

  btn.addEventListener('click', () => {
    const isOpen = !menu.classList.contains('hidden')
    menu.classList.toggle('hidden')
    btn.querySelector('span').textContent = isOpen ? 'menu' : 'close'
  })

  // Close menu when clicking a link
  menu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      menu.classList.add('hidden')
      btn.querySelector('span').textContent = 'menu'
    })
  })
}

// ============================================
// Load Products from Supabase
// ============================================
async function loadProducts() {
  const grid = document.getElementById('products-grid')
  if (!grid) return

  try {
    const products = await fetchProducts()

    if (!products || products.length === 0) {
      grid.innerHTML = `
        <div class="col-span-full text-center py-16">
          <span class="material-symbols-outlined text-6xl text-outline-variant mb-4">local_florist</span>
          <p class="font-body-md text-body-md text-on-surface-variant">Próximamente nuevos arreglos disponibles.</p>
        </div>
      `
      return
    }

    grid.innerHTML = products.map(product => renderProductCard(product)).join('')
  } catch (err) {
    console.error('Error loading products:', err)
    grid.innerHTML = `
      <div class="col-span-full text-center py-16">
        <span class="material-symbols-outlined text-6xl text-outline-variant mb-4">error_outline</span>
        <p class="font-body-md text-body-md text-on-surface-variant">No pudimos cargar los productos. Intenta de nuevo más tarde.</p>
      </div>
    `
  }
}

// ============================================
// Render a single product card
// ============================================
function renderProductCard(product) {
  const priceFormatted = `$${Number(product.price).toLocaleString('es-MX')} MXN`
  const whatsappLink = generateWhatsAppLink(product)
  const badgeHTML = product.badge
    ? `<div class="absolute top-4 left-4">
         <span class="px-3 py-1 bg-surface-container-lowest/90 backdrop-blur-sm text-on-surface font-label-md text-label-md rounded-full shadow-sm text-[10px] tracking-wider uppercase">${escapeHTML(product.badge)}</span>
       </div>`
    : ''

  const imageUrl = product.image_url || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500"%3E%3Crect fill="%23efeeeb" width="400" height="500"/%3E%3Ctext x="200" y="250" text-anchor="middle" fill="%23c4c7c7" font-size="48"%3E🌸%3C/text%3E%3C/svg%3E'

  return `
    <div class="group flex flex-col">
      <div class="relative w-full aspect-[4/5] bg-surface-container-low overflow-hidden mb-6 rounded-sm">
        <img
          alt="${escapeHTML(product.name)}"
          class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          src="${escapeHTML(imageUrl)}"
          loading="lazy"
        />
        ${badgeHTML}
      </div>
      <div class="flex-grow flex flex-col">
        <h3 class="font-headline-sm text-headline-sm text-on-surface mb-1">${escapeHTML(product.name)}</h3>
        <p class="font-body-sm text-body-sm text-on-surface-variant mb-4">${escapeHTML(product.description || '')}</p>
        <div class="mt-auto flex items-center justify-between">
          <span class="font-body-md text-body-md text-on-surface">${priceFormatted}</span>
        </div>
        <a
          class="mt-4 w-full py-3 border border-outline text-center font-label-md text-label-md text-on-surface hover:bg-secondary hover:text-on-secondary hover:border-secondary transition-colors flex items-center justify-center gap-2 rounded-sm"
          href="${whatsappLink}"
          target="_blank"
          rel="noopener"
        >
          <span class="material-symbols-outlined text-[18px]" data-icon="chat">chat</span> Pedir por WhatsApp
        </a>
      </div>
    </div>
  `
}

// ============================================
// Special Order Form
// ============================================
function initSpecialOrderForm() {
  const form = document.getElementById('special-order-form')
  const whatsappBtn = document.getElementById('submit-whatsapp-btn')
  if (!form) return

  // Standard submit (save to Supabase)
  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    const orderData = getFormData(form)
    const submitBtn = document.getElementById('submit-order-btn')

    try {
      submitBtn.disabled = true
      submitBtn.textContent = 'Enviando...'

      await createSpecialOrder(orderData)
      showToast('¡Solicitud enviada! Te contactaremos pronto. 🌸', 'check_circle')
      form.reset()
    } catch (err) {
      console.error('Error submitting order:', err)
      showToast('Error al enviar. Intenta de nuevo.', 'error')
    } finally {
      submitBtn.disabled = false
      submitBtn.textContent = 'Solicitar Presupuesto'
    }
  })

  // WhatsApp submit (save + redirect)
  if (whatsappBtn) {
    whatsappBtn.addEventListener('click', async () => {
      const orderData = getFormData(form)

      if (!orderData.name) {
        showToast('Por favor escribe tu nombre.', 'warning')
        document.getElementById('order-name')?.focus()
        return
      }

      try {
        // Save to DB first
        await createSpecialOrder({ ...orderData, whatsapp_sent: true })
      } catch (err) {
        console.warn('Could not save to DB, proceeding to WhatsApp:', err)
      }

      // Open WhatsApp
      const link = generateSpecialOrderWhatsAppLink(orderData)
      window.open(link, '_blank')
      form.reset()
      showToast('¡Redirigiendo a WhatsApp! 💬', 'chat')
    })
  }
}

// ============================================
// Utilities
// ============================================
function getFormData(form) {
  return {
    name: form.querySelector('[name="name"]')?.value?.trim() || '',
    email: form.querySelector('[name="email"]')?.value?.trim() || '',
    event_type: form.querySelector('[name="event_type"]')?.value || '',
    budget: form.querySelector('[name="budget"]')?.value || '',
    delivery_date: form.querySelector('[name="delivery_date"]')?.value || '',
    details: form.querySelector('[name="details"]')?.value?.trim() || '',
  }
}

function escapeHTML(str) {
  if (!str) return ''
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}

function showToast(message, icon = 'check_circle') {
  const toast = document.getElementById('toast')
  const toastMsg = document.getElementById('toast-message')
  const toastIcon = document.getElementById('toast-icon')
  if (!toast) return

  toastMsg.textContent = message
  toastIcon.textContent = icon
  toast.classList.add('show')

  setTimeout(() => {
    toast.classList.remove('show')
  }, 4000)
}
