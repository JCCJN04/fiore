import { fetchAllProducts, createProduct, updateProduct, deleteProduct, uploadProductImage } from '../services/products.js'
import { fetchAllCategories } from '../services/categories.js'
import { openModal, closeModal, showAdminToast, showConfirm } from '../admin.js'

let allProducts = []
let allCategories = []

/**
 * Render the Products section
 */
export async function renderProducts(container) {
  try {
    [allProducts, allCategories] = await Promise.all([
      fetchAllProducts(),
      fetchAllCategories(),
    ])

    populateCategorySelect()
    renderProductsTable(container)
    initProductForm()
    initImageUpload()
  } catch (err) {
    console.error('Error rendering products:', err)
    container.innerHTML = `
      <div class="empty-state">
        <span class="material-symbols-outlined">error_outline</span>
        <p>Error al cargar productos.</p>
      </div>
    `
  }
}

function renderProductsTable(container) {
  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
      <div>
        <span style="font-size: 13px; color: #747878;">${allProducts.length} producto${allProducts.length !== 1 ? 's' : ''}</span>
      </div>
      <button id="add-product-btn" class="btn btn-primary">
        <span class="material-symbols-outlined">add</span>
        Nuevo Producto
      </button>
    </div>

    ${allProducts.length > 0 ? `
      <div style="background: #fff; border: 1px solid #c4c7c720; border-radius: 0.25rem; overflow-x: auto;">
        <table class="admin-table">
          <thead>
            <tr>
              <th style="width: 60px;"></th>
              <th>Nombre</th>
              <th>Categoría</th>
              <th>Precio</th>
              <th>Etiqueta</th>
              <th>Estado</th>
              <th>Orden</th>
              <th style="width: 120px;">Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${allProducts.map(p => `
              <tr>
                <td>
                  ${p.image_url
                    ? `<img src="${escapeAttr(p.image_url)}" class="product-thumb" alt="${escapeAttr(p.name)}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 48 48%22%3E%3Crect fill=%22%23efeeeb%22 width=%2248%22 height=%2248%22/%3E%3C/svg%3E'"/>`
                    : `<div class="product-thumb" style="display:flex;align-items:center;justify-content:center;font-size:20px;">🌸</div>`
                  }
                </td>
                <td><strong>${escapeHTML(p.name)}</strong><br/><span style="font-size:12px;color:#747878;">${escapeHTML(p.description || '')}</span></td>
                <td style="font-size:13px;">${escapeHTML(p.categories?.name || '—')}</td>
                <td style="white-space:nowrap;"><strong>$${Number(p.price).toLocaleString('es-MX')}</strong></td>
                <td>${p.badge ? `<span class="badge badge-active">${escapeHTML(p.badge)}</span>` : '—'}</td>
                <td>
                  <label class="toggle" title="${p.is_active ? 'Desactivar' : 'Activar'}">
                    <input type="checkbox" ${p.is_active ? 'checked' : ''} data-toggle-product="${p.id}"/>
                    <span class="toggle-slider"></span>
                  </label>
                </td>
                <td style="font-size:13px; color:#747878;">${p.display_order}</td>
                <td>
                  <div style="display: flex; gap: 0.5rem;">
                    <button class="btn-icon" data-edit-product="${p.id}" title="Editar">
                      <span class="material-symbols-outlined" style="font-size:16px;">edit</span>
                    </button>
                    <button class="btn-icon" data-delete-product="${p.id}" data-product-name="${escapeAttr(p.name)}" title="Eliminar" style="color: #ba1a1a;">
                      <span class="material-symbols-outlined" style="font-size:16px;">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    ` : `
      <div class="empty-state">
        <span class="material-symbols-outlined">local_florist</span>
        <p>No hay productos aún.</p>
        <p style="font-size: 13px; margin-top: 0.5rem;">Haz clic en "Nuevo Producto" para comenzar.</p>
      </div>
    `}
  `

  // Bind events
  document.getElementById('add-product-btn')?.addEventListener('click', () => openProductModal())

  document.querySelectorAll('[data-edit-product]').forEach(btn => {
    btn.addEventListener('click', () => {
      const product = allProducts.find(p => p.id === btn.dataset.editProduct)
      if (product) openProductModal(product)
    })
  })

  document.querySelectorAll('[data-delete-product]').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.dataset.productName
      const id = btn.dataset.deleteProduct
      showConfirm(`¿Eliminar el producto "${name}"? Esta acción no se puede deshacer.`, async () => {
        try {
          await deleteProduct(id)
          showAdminToast('Producto eliminado', 'delete')
          allProducts = allProducts.filter(p => p.id !== id)
          renderProductsTable(document.getElementById('admin-content'))
        } catch (e) {
          showAdminToast('Error al eliminar', 'error')
        }
      })
    })
  })

  document.querySelectorAll('[data-toggle-product]').forEach(toggle => {
    toggle.addEventListener('change', async (e) => {
      const id = toggle.dataset.toggleProduct
      try {
        await updateProduct(id, { is_active: e.target.checked })
        showAdminToast(e.target.checked ? 'Producto activado' : 'Producto desactivado')
      } catch (err) {
        e.target.checked = !e.target.checked
        showAdminToast('Error al cambiar estado', 'error')
      }
    })
  })
}

function openProductModal(product = null) {
  const isEdit = !!product
  document.getElementById('product-modal-title').textContent = isEdit ? 'Editar Producto' : 'Nuevo Producto'
  document.getElementById('pf-submit').textContent = isEdit ? 'Guardar Cambios' : 'Guardar Producto'

  // Fill form
  document.getElementById('pf-id').value = product?.id || ''
  document.getElementById('pf-name').value = product?.name || ''
  document.getElementById('pf-description').value = product?.description || ''
  document.getElementById('pf-price').value = product?.price || ''
  document.getElementById('pf-category').value = product?.category_id || ''
  document.getElementById('pf-badge').value = product?.badge || ''
  document.getElementById('pf-order').value = product?.display_order ?? 0
  document.getElementById('pf-active').checked = product?.is_active ?? true
  document.getElementById('pf-image-url').value = product?.image_url || ''

  // Reset image preview
  const preview = document.getElementById('pf-image-preview')
  const fileInput = document.getElementById('pf-image')
  fileInput.value = ''
  if (product?.image_url) {
    preview.src = product.image_url
    preview.style.display = 'block'
  } else {
    preview.style.display = 'none'
  }

  openModal('product-modal')
}

function populateCategorySelect() {
  const select = document.getElementById('pf-category')
  if (!select) return

  select.innerHTML = '<option value="">Sin categoría</option>'
  allCategories.forEach(cat => {
    select.innerHTML += `<option value="${cat.id}">${escapeHTML(cat.name)}</option>`
  })
}

function initProductForm() {
  const form = document.getElementById('product-form')
  if (!form) return

  // Remove old listener
  const newForm = form.cloneNode(true)
  form.parentNode.replaceChild(newForm, form)

  newForm.addEventListener('submit', async (e) => {
    e.preventDefault()
    const submitBtn = document.getElementById('pf-submit')
    submitBtn.disabled = true
    submitBtn.textContent = 'Guardando...'

    try {
      const id = document.getElementById('pf-id').value
      const fileInput = document.getElementById('pf-image')
      let imageUrl = document.getElementById('pf-image-url').value.trim()

      // Upload image if file selected
      if (fileInput.files?.[0]) {
        imageUrl = await uploadProductImage(fileInput.files[0])
      }

      const productData = {
        name: document.getElementById('pf-name').value.trim(),
        description: document.getElementById('pf-description').value.trim(),
        price: parseFloat(document.getElementById('pf-price').value),
        category_id: document.getElementById('pf-category').value || null,
        badge: document.getElementById('pf-badge').value.trim(),
        display_order: parseInt(document.getElementById('pf-order').value) || 0,
        is_active: document.getElementById('pf-active').checked,
        image_url: imageUrl,
      }

      if (id) {
        await updateProduct(id, productData)
        showAdminToast('Producto actualizado ✓')
      } else {
        await createProduct(productData)
        showAdminToast('Producto creado ✓')
      }

      closeModal('product-modal')

      // Refresh list
      allProducts = await fetchAllProducts()
      renderProductsTable(document.getElementById('admin-content'))
      initProductForm()
      initImageUpload()
    } catch (err) {
      console.error('Error saving product:', err)
      showAdminToast('Error al guardar producto', 'error')
    } finally {
      submitBtn.disabled = false
      submitBtn.textContent = 'Guardar Producto'
    }
  })
}

function initImageUpload() {
  const area = document.getElementById('image-upload-area')
  const fileInput = document.getElementById('pf-image')
  const preview = document.getElementById('pf-image-preview')
  if (!area || !fileInput) return

  area.addEventListener('click', () => fileInput.click())

  area.addEventListener('dragover', (e) => {
    e.preventDefault()
    area.classList.add('dragover')
  })

  area.addEventListener('dragleave', () => {
    area.classList.remove('dragover')
  })

  area.addEventListener('drop', (e) => {
    e.preventDefault()
    area.classList.remove('dragover')
    if (e.dataTransfer.files?.[0]) {
      fileInput.files = e.dataTransfer.files
      showImagePreview(e.dataTransfer.files[0])
    }
  })

  fileInput.addEventListener('change', () => {
    if (fileInput.files?.[0]) {
      showImagePreview(fileInput.files[0])
    }
  })

  function showImagePreview(file) {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (e) => {
      preview.src = e.target.result
      preview.style.display = 'block'
    }
    reader.readAsDataURL(file)
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
