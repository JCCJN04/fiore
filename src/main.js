import { fetchProducts } from './services/products.js'
import { createSpecialOrder, generateWhatsAppLink, generateSpecialOrderWhatsAppLink } from './services/orders.js'

// ============================================
// MAIN — Public Storefront Logic
// ============================================

let allProducts = []
let currentCategoryFilter = 'all'

document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu()
  loadProducts()
  initSpecialOrderForm()
  initInstagramEmbeds()
  initCategoryInteractions()
})

function initInstagramEmbeds() {
  if (window.instgrm) {
    window.instgrm.Embeds.process()
  } else {
    const checkInterval = setInterval(() => {
      if (window.instgrm) {
        window.instgrm.Embeds.process()
        clearInterval(checkInterval)
      }
    }, 300)
    setTimeout(() => clearInterval(checkInterval), 5000)
  }
}

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
    allProducts = await fetchProducts()
    renderProducts(allProducts)
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
// Render Filtered Products
// ============================================
function renderProducts(products) {
  const grid = document.getElementById('products-grid')
  if (!grid) return

  if (!products || products.length === 0) {
    let customMessage = 'Próximamente nuevos arreglos disponibles en esta categoría.'
    let ctaButton = ''

    if (currentCategoryFilter === 'bodas-eventos') {
      customMessage = 'Diseñamos ambientaciones y conceptos florales únicos para bodas y eventos especiales.'
      ctaButton = `
        <a href="#contacto" class="mt-4 inline-flex items-center gap-2 px-8 py-3 bg-primary text-on-primary font-label-md text-label-md uppercase tracking-wider rounded-sm hover:bg-primary/90 transition-all">
          <span class="material-symbols-outlined text-sm">edit_note</span> Solicitar Cotización para Evento
        </a>
      `
    } else if (currentCategoryFilter === 'talleres-experiencias') {
      customMessage = 'Aprende el arte botánico y técnicas de diseño floral en nuestros talleres presenciales en Monterrey.'
      ctaButton = `
        <a href="https://wa.me/528180990117?text=${encodeURIComponent('¡Hola! 🌸 Me gustaría recibir información y próximas fechas de sus Talleres de Arte Botánico.')}" target="_blank" rel="noopener" class="mt-4 inline-flex items-center gap-2 px-8 py-3 border border-secondary text-secondary hover:bg-secondary hover:text-on-secondary font-label-md text-label-md uppercase tracking-wider rounded-sm transition-all">
          <span class="material-symbols-outlined text-sm">chat</span> Consultar Próximas Fechas por WhatsApp
        </a>
      `
    }

    grid.innerHTML = `
      <div class="col-span-full text-center py-16 px-4 max-w-lg mx-auto bg-surface-container-low/50 rounded-sm border border-outline-variant/10">
        <span class="material-symbols-outlined text-5xl text-secondary mb-3">local_florist</span>
        <p class="font-body-md text-body-md text-on-surface-variant mb-2">${customMessage}</p>
        ${ctaButton}
      </div>
    `
    return
  }

  grid.innerHTML = products.map(product => renderProductCard(product)).join('')
}

// ============================================
// Render a single product card
// ============================================
function renderProductCard(product) {
  const priceFormatted = `$${Number(product.price).toLocaleString('es-MX')} MXN`
  const whatsappLink = generateWhatsAppLink(product)
  const badgeHTML = product.badge
    ? `<div class="absolute top-4 left-4 z-10">
         <span class="px-3 py-1 bg-surface-container-lowest/90 backdrop-blur-sm text-on-surface font-label-md text-label-md rounded-full shadow-sm text-[10px] tracking-wider uppercase">${escapeHTML(product.badge)}</span>
       </div>`
    : ''

  const imageUrl = product.image_url || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500"%3E%3Crect fill="%23efeeeb" width="400" height="500"/%3E%3Ctext x="200" y="250" text-anchor="middle" fill="%23c4c7c7" font-size="48"%3E🌸%3C/text%3E%3C/svg%3E'

  return `
    <div class="group flex flex-col transition-all duration-300">
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
// Interactive Category Filtering & Bento Clicks
// ============================================
function initCategoryInteractions() {
  // Category Filter Buttons
  const filterBtns = document.querySelectorAll('.category-filter-btn')
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter
      applyCategoryFilter(filter)
    })
  })

  // Bento Grid Category Cards ("Nuestra Esencia")
  const bentoCards = document.querySelectorAll('[data-category-card]')
  bentoCards.forEach(card => {
    card.addEventListener('click', () => {
      const targetCategory = card.dataset.categoryCard

      if (targetCategory === 'talleres-experiencias') {
        // Scroll to special order form and set option
        const contactSection = document.getElementById('contacto')
        if (contactSection) {
          contactSection.scrollIntoView({ behavior: 'smooth' })
          const eventSelect = document.getElementById('order-event-type')
          if (eventSelect) eventSelect.value = 'otro'
          const detailsArea = document.getElementById('order-details')
          if (detailsArea && !detailsArea.value) {
            detailsArea.value = 'Me gustaría recibir información sobre los próximos talleres de arte floral.'
          }
        }
        return
      }

      if (targetCategory === 'bodas-eventos') {
        const coleccionSection = document.getElementById('coleccion')
        if (coleccionSection) {
          coleccionSection.scrollIntoView({ behavior: 'smooth' })
        }
        applyCategoryFilter('bodas-eventos')
        return
      }

      // Default categories: Arreglos de autor, Ocasiones especiales
      applyCategoryFilter(targetCategory)
      const coleccionSection = document.getElementById('coleccion')
      if (coleccionSection) {
        coleccionSection.scrollIntoView({ behavior: 'smooth' })
      }
    })
  })
}

function applyCategoryFilter(filterSlug) {
  currentCategoryFilter = filterSlug

  // Update button active styles
  const filterBtns = document.querySelectorAll('.category-filter-btn')
  filterBtns.forEach(btn => {
    const isSelected = btn.dataset.filter === filterSlug
    if (isSelected) {
      btn.className = 'category-filter-btn px-5 py-2 text-xs font-semibold uppercase tracking-wider rounded-full border border-primary bg-primary text-on-primary transition-all cursor-pointer shadow-sm'
    } else {
      btn.className = 'category-filter-btn px-5 py-2 text-xs font-semibold uppercase tracking-wider rounded-full border border-outline-variant text-on-surface hover:border-primary transition-all cursor-pointer'
    }
  })

  // Filter products list
  if (filterSlug === 'all') {
    renderProducts(allProducts)
  } else {
    const filtered = allProducts.filter(p => {
      const catSlug = p.categories?.slug || ''
      return catSlug === filterSlug
    })
    renderProducts(filtered)
  }
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
        await createSpecialOrder({ ...orderData, whatsapp_sent: true })
      } catch (err) {
        console.warn('Could not save to DB, proceeding to WhatsApp:', err)
      }

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
