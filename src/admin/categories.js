import { fetchAllCategories, createCategory, updateCategory, deleteCategory } from '../services/categories.js'
import { openModal, closeModal, showAdminToast, showConfirm } from '../admin.js'

let allCategories = []

/**
 * Render the Categories section
 */
export async function renderCategories(container) {
  try {
    allCategories = await fetchAllCategories()
    renderCategoriesTable(container)
    initCategoryForm()
  } catch (err) {
    console.error('Error rendering categories:', err)
    container.innerHTML = `
      <div class="empty-state">
        <span class="material-symbols-outlined">error_outline</span>
        <p>Error al cargar categorías.</p>
      </div>
    `
  }
}

function renderCategoriesTable(container) {
  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
      <div>
        <span style="font-size: 13px; color: #747878;">${allCategories.length} categoría${allCategories.length !== 1 ? 's' : ''}</span>
      </div>
      <button id="add-category-btn" class="btn btn-primary">
        <span class="material-symbols-outlined">add</span>
        Nueva Categoría
      </button>
    </div>

    ${allCategories.length > 0 ? `
      <div style="background: #fff; border: 1px solid #c4c7c720; border-radius: 0.25rem; overflow-x: auto;">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Slug</th>
              <th>Descripción</th>
              <th>Orden</th>
              <th>Estado</th>
              <th style="width: 120px;">Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${allCategories.map(c => `
              <tr>
                <td><strong>${escapeHTML(c.name)}</strong></td>
                <td style="font-size:13px; color:#747878; font-family: monospace;">${escapeHTML(c.slug)}</td>
                <td style="font-size:13px; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHTML(c.description || '—')}</td>
                <td style="font-size:13px; color:#747878;">${c.display_order}</td>
                <td>
                  <label class="toggle" title="${c.is_active ? 'Desactivar' : 'Activar'}">
                    <input type="checkbox" ${c.is_active ? 'checked' : ''} data-toggle-category="${c.id}"/>
                    <span class="toggle-slider"></span>
                  </label>
                </td>
                <td>
                  <div style="display: flex; gap: 0.5rem;">
                    <button class="btn-icon" data-edit-category="${c.id}" title="Editar">
                      <span class="material-symbols-outlined" style="font-size:16px;">edit</span>
                    </button>
                    <button class="btn-icon" data-delete-category="${c.id}" data-category-name="${escapeAttr(c.name)}" title="Eliminar" style="color: #ba1a1a;">
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
        <span class="material-symbols-outlined">category</span>
        <p>No hay categorías aún.</p>
        <p style="font-size: 13px; margin-top: 0.5rem;">Las categorías ayudan a organizar tus productos.</p>
      </div>
    `}
  `

  // Bind events
  document.getElementById('add-category-btn')?.addEventListener('click', () => openCategoryModal())

  document.querySelectorAll('[data-edit-category]').forEach(btn => {
    btn.addEventListener('click', () => {
      const cat = allCategories.find(c => c.id === btn.dataset.editCategory)
      if (cat) openCategoryModal(cat)
    })
  })

  document.querySelectorAll('[data-delete-category]').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.dataset.categoryName
      const id = btn.dataset.deleteCategory
      showConfirm(`¿Eliminar la categoría "${name}"? Los productos asociados quedarán sin categoría.`, async () => {
        try {
          await deleteCategory(id)
          showAdminToast('Categoría eliminada', 'delete')
          allCategories = allCategories.filter(c => c.id !== id)
          renderCategoriesTable(document.getElementById('admin-content'))
        } catch (e) {
          showAdminToast('Error al eliminar', 'error')
        }
      })
    })
  })

  document.querySelectorAll('[data-toggle-category]').forEach(toggle => {
    toggle.addEventListener('change', async (e) => {
      const id = toggle.dataset.toggleCategory
      try {
        await updateCategory(id, { is_active: e.target.checked })
        showAdminToast(e.target.checked ? 'Categoría activada' : 'Categoría desactivada')
      } catch (err) {
        e.target.checked = !e.target.checked
        showAdminToast('Error al cambiar estado', 'error')
      }
    })
  })
}

function openCategoryModal(category = null) {
  const isEdit = !!category
  document.getElementById('category-modal-title').textContent = isEdit ? 'Editar Categoría' : 'Nueva Categoría'
  document.getElementById('cf-submit').textContent = isEdit ? 'Guardar Cambios' : 'Guardar Categoría'

  document.getElementById('cf-id').value = category?.id || ''
  document.getElementById('cf-name').value = category?.name || ''
  document.getElementById('cf-slug').value = category?.slug || ''
  document.getElementById('cf-description').value = category?.description || ''
  document.getElementById('cf-order').value = category?.display_order ?? 0
  document.getElementById('cf-active').checked = category?.is_active ?? true

  openModal('category-modal')
}

function initCategoryForm() {
  const form = document.getElementById('category-form')
  if (!form) return

  const newForm = form.cloneNode(true)
  form.parentNode.replaceChild(newForm, form)

  // Auto-generate slug from name
  const nameInput = newForm.querySelector('#cf-name')
  const slugInput = newForm.querySelector('#cf-slug')
  if (nameInput && slugInput) {
    nameInput.addEventListener('input', () => {
      if (!newForm.querySelector('#cf-id').value) {
        slugInput.value = generateSlug(nameInput.value)
      }
    })
  }

  newForm.addEventListener('submit', async (e) => {
    e.preventDefault()
    const submitBtn = newForm.querySelector('#cf-submit')
    submitBtn.disabled = true
    submitBtn.textContent = 'Guardando...'

    try {
      const id = newForm.querySelector('#cf-id').value
      const catData = {
        name: newForm.querySelector('#cf-name').value.trim(),
        slug: newForm.querySelector('#cf-slug').value.trim() || generateSlug(newForm.querySelector('#cf-name').value),
        description: newForm.querySelector('#cf-description').value.trim(),
        display_order: parseInt(newForm.querySelector('#cf-order').value) || 0,
        is_active: newForm.querySelector('#cf-active').checked,
      }

      if (id) {
        await updateCategory(id, catData)
        showAdminToast('Categoría actualizada ✓')
      } else {
        await createCategory(catData)
        showAdminToast('Categoría creada ✓')
      }

      closeModal('category-modal')
      allCategories = await fetchAllCategories()
      renderCategoriesTable(document.getElementById('admin-content'))
      initCategoryForm()
    } catch (err) {
      console.error('Error saving category:', err)
      showAdminToast('Error al guardar categoría', 'error')
    } finally {
      submitBtn.disabled = false
      submitBtn.textContent = 'Guardar Categoría'
    }
  })
}

function generateSlug(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
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
