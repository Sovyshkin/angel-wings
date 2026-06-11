<template>
  <div class="categories-page">
    <div class="page-header">
      <div>
        <h1 class="page-title" style="font-size: 1.75rem; margin-bottom: 0.25rem;">Категории</h1>
        <p class="page-subtitle">Управление категориями товаров</p>
      </div>
      <button @click="openModal()" class="btn btn-primary">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        <span class="btn-text">Добавить</span>
      </button>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
    </div>

    <div v-else>
      <div class="categories-table-wrapper card">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Иконка</th>
              <th>Название</th>
              <th>Товаров</th>
              <th>Статус</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="cat in categories" :key="cat.term_id">
              <td class="cell-id">{{ cat.term_id }}</td>
              <td class="cell-icon">
                <div class="category-icon-thumb">
                  <img v-if="cat.image && !brokenCategoryThumbs.has(cat.term_id)" :src="cat.image" :alt="cat.name" @error="handleCategoryThumbError(cat.term_id)">
                  <span v-else class="category-icon-thumb__empty">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="3" y="3" width="7" height="7"/>
                      <rect x="14" y="3" width="7" height="7"/>
                      <rect x="14" y="14" width="7" height="7"/>
                      <rect x="3" y="14" width="7" height="7"/>
                    </svg>
                  </span>
                </div>
              </td>
              <td class="cell-name">{{ cat.name }}</td>
              <td class="cell-count">{{ cat.count }}</td>
              <td>
                <span :class="['badge', cat.active ? 'badge-success' : 'badge-danger']">
                  {{ cat.active ? 'Активна' : 'Скрыта' }}
                </span>
              </td>
              <td class="cell-actions">
                <button @click="openModal(cat)" class="action-btn" title="Редактировать">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
                <button @click="deleteCategory(cat.term_id)" class="action-btn danger" title="Удалить">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                  </svg>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="categories-cards">
        <div v-for="cat in categories" :key="cat.term_id" class="category-card card">
          <div class="category-card__header">
            <div class="category-card__icon">
              <img v-if="cat.image && !brokenCategoryThumbs.has(cat.term_id)" :src="cat.image" :alt="cat.name" @error="handleCategoryThumbError(cat.term_id)">
              <span v-else class="category-card__icon-placeholder">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="7" height="7"/>
                  <rect x="14" y="3" width="7" height="7"/>
                  <rect x="14" y="14" width="7" height="7"/>
                  <rect x="3" y="14" width="7" height="7"/>
                </svg>
              </span>
            </div>
            <span :class="['badge', cat.active ? 'badge-success' : 'badge-danger']">
              {{ cat.active ? 'Активна' : 'Скрыта' }}
            </span>
            <span class="category-card__count">{{ cat.count }} шт</span>
          </div>
          <div class="category-card__body">
            <h3 class="category-card__name">{{ cat.name }}</h3>
            <p class="category-card__slug">{{ cat.slug }}</p>
          </div>
          <div class="category-card__actions">
            <button @click="openModal(cat)" class="btn btn-secondary btn-sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Изменить
            </button>
            <button @click="deleteCategory(cat.term_id)" class="btn btn-danger btn-sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal card">
        <div class="modal-header">
          <h3 class="modal-title">{{ editing ? 'Редактировать категорию' : 'Новая категория' }}</h3>
          <button @click="closeModal" class="modal-close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form @submit.prevent="handleSubmit" class="modal-form">
          <div class="form-group">
            <label class="form-label">Название</label>
            <input type="text" v-model="form.name" required class="input" placeholder="Долголетие">
          </div>

          <div class="form-group">
            <label class="form-label">Иконка категории</label>
            <div class="file-input-wrapper">
              <input type="file" @change="handleCategoryImageChange" accept="image/*" class="file-input">
              <div class="file-input-trigger">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                </svg>
                <span>{{ editing ? 'Заменить иконку' : 'Выбрать иконку' }}</span>
              </div>
            </div>
            <p class="field-hint">Изображение будет использоваться как иконка категории на сайте.</p>
            <div v-if="categoryImagePreview" class="category-image-preview">
              <img :src="categoryImagePreview" alt="Иконка категории">
              <button type="button" class="remove-image" @click="clearCategoryImage" title="Убрать иконку">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div v-if="categoryImageRemoved && editing" class="image-removed-note">
              Иконка будет удалена после сохранения.
            </div>
          </div>

          <div class="toggle-group">
            <label class="toggle">
              <input type="checkbox" v-model="form.active">
              <span class="toggle-slider"></span>
              <span class="toggle-label">Активна (видима на сайте)</span>
            </label>
          </div>

          <div v-if="error" class="error-message">{{ error }}</div>

          <div class="modal-actions">
            <button type="button" @click="closeModal" class="btn btn-secondary">Отмена</button>
            <button type="submit" class="btn btn-primary" :disabled="loading">
              {{ editing ? 'Сохранить' : 'Создать' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const API_URL = '/api'

const categories = ref([])
const loading = ref(true)
const showModal = ref(false)
const editing = ref(null)
const error = ref('')
const loadingForm = ref(false)
const categoryImageFile = ref(null)
const categoryImagePreview = ref('')
const categoryImageRemoved = ref(false)
const brokenCategoryThumbs = ref(new Set())

const form = ref({ name: '', active: true })

async function fetchCategories() {
  try {
    const { data } = await axios.get(`${API_URL}/categories`)
    categories.value = data.categories
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function openModal(cat = null) {
  revokeCategoryPreview()
  if (cat) {
    editing.value = cat.term_id
    form.value = { name: cat.name, active: cat.active }
    categoryImagePreview.value = cat.image || ''
    categoryImageRemoved.value = false
  } else {
    editing.value = null
    form.value = { name: '', active: true }
    categoryImagePreview.value = ''
    categoryImageRemoved.value = false
  }
  categoryImageFile.value = null
  error.value = ''
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editing.value = null
  form.value = { name: '', active: true }
  categoryImageFile.value = null
  categoryImagePreview.value = ''
  categoryImageRemoved.value = false
  revokeCategoryPreview()
}

function revokeCategoryPreview() {
  if (categoryImagePreview.value && categoryImagePreview.value.startsWith('blob:')) {
    URL.revokeObjectURL(categoryImagePreview.value)
  }
}

function handleCategoryImageChange(event) {
  const file = event.target.files?.[0] || null
  revokeCategoryPreview()
  categoryImageFile.value = file
  categoryImageRemoved.value = false
  categoryImagePreview.value = file ? URL.createObjectURL(file) : ''
}

function clearCategoryImage() {
  revokeCategoryPreview()
  categoryImageFile.value = null
  categoryImagePreview.value = ''
  categoryImageRemoved.value = true
}

function handleCategoryThumbError(categoryId) {
  brokenCategoryThumbs.value = new Set([...brokenCategoryThumbs.value, categoryId])
}

async function handleSubmit() {
  error.value = ''
  loadingForm.value = true
  
  try {
    const formData = new FormData()
    formData.append('name', form.value.name)
    formData.append('active', String(!!form.value.active))

    if (editing.value) {
      if (categoryImageFile.value) {
        formData.append('image', categoryImageFile.value)
      }
      if (categoryImageRemoved.value) {
        formData.append('clearImage', '1')
      }
      await axios.put(`${API_URL}/categories/${editing.value}`, formData)
    } else {
      if (categoryImageFile.value) {
        formData.append('image', categoryImageFile.value)
      }
      await axios.post(`${API_URL}/categories`, formData)
    }
    closeModal()
    fetchCategories()
  } catch (e) {
    error.value = e.response?.data?.error || 'Ошибка сохранения'
  } finally {
    loadingForm.value = false
  }
}

async function deleteCategory(id) {
  if (!confirm('Удалить категорию?')) return
  try {
    await axios.delete(`${API_URL}/categories/${id}`)
    categories.value = categories.value.filter(c => c.term_id !== id)
  } catch (e) {
    alert('Ошибка удаления')
  }
}

onMounted(fetchCategories)
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 2rem;
}

.categories-table-wrapper {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 600px;
}

.data-table th,
.data-table td {
  padding: 1rem 1.25rem;
  text-align: left;
  border-bottom: 1px solid var(--border);
}

.data-table th {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-secondary);
  background: var(--bg-secondary);
}

.data-table tr:last-child td {
  border-bottom: none;
}

.data-table tr:hover td {
  background: var(--bg-hover);
}

.cell-id {
  font-family: var(--font-body);
  font-size: 0.8125rem;
  color: var(--text-muted);
}

.cell-name {
  font-weight: 600;
}

.cell-slug {
  font-family: var(--font-body);
  font-size: 0.8125rem;
  color: var(--text-secondary);
}

.cell-count {
  font-family: var(--font-body);
}

.cell-icon {
  width: 88px;
}

.category-icon-thumb,
.category-card__icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  overflow: hidden;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  display: grid;
  place-items: center;
}

.category-icon-thumb img,
.category-card__icon img,
.category-image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.category-icon-thumb__empty,
.category-card__icon-placeholder {
  color: var(--text-muted);
  display: grid;
  place-items: center;
}

.category-image-preview {
  position: relative;
  width: 96px;
  height: 96px;
  border-radius: 20px;
  overflow: hidden;
  margin-top: 0.75rem;
  border: 1px solid var(--border);
  background: var(--bg-secondary);
}

.image-removed-note {
  margin-top: 0.5rem;
  font-size: 0.8125rem;
  color: var(--text-muted);
}

.categories-cards {
  display: none;
}

.category-card {
  overflow: hidden;
}

.category-card__header {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  padding: 1rem;
  background: var(--bg-secondary);
  gap: 0.75rem;
}

.category-card__icon {
  flex-shrink: 0;
}

.category-card__count {
  margin-left: auto;
}

.category-card__count {
  font-size: 0.8125rem;
  color: var(--text-muted);
}

.category-card__body {
  padding: 1rem;
}

.category-card__name {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0 0 0.25rem;
}

.category-card__slug {
  font-size: 0.8125rem;
  color: var(--text-muted);
  font-family: var(--font-mono);
  margin-bottom: 0.5rem;
}

.category-card__actions {
  display: flex;
  gap: 0.5rem;
  padding: 1rem;
  padding-top: 0;
}

.category-card__actions .btn {
  flex: 1;
}

.badge {
  display: inline-block;
  padding: 0.25rem 0.625rem;
  border-radius: 20px;
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.badge-success { background: #22c55e22; color: #22c55e; }
.badge-danger { background: #ef444422; color: #ef4444; }

.toggle-group {
  margin-top: 0.5rem;
}

.toggle {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
}

.toggle input {
  display: none;
}

.toggle-slider {
  position: relative;
  width: 48px;
  height: 26px;
  background: var(--bg-secondary);
  border-radius: 13px;
  transition: var(--transition);
  flex-shrink: 0;
}

.toggle-slider::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: 20px;
  height: 20px;
  background: var(--text-muted);
  border-radius: 50%;
  transition: var(--transition);
}

.toggle input:checked + .toggle-slider {
  background: var(--accent);
}

.toggle input:checked + .toggle-slider::after {
  left: 25px;
  background: white;
}

.toggle-label {
  font-size: 0.9375rem;
}

.cell-actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  transition: var(--transition);
}

.action-btn:hover {
  background: var(--accent);
  color: #fff;
}

.action-btn.danger:hover {
  background: var(--danger);
}

.btn-danger {
  background: var(--danger);
  color: white;
}

.btn-danger:hover {
  background: #ff4444;
}

.loading-state {
  display: flex;
  justify-content: center;
  padding: 4rem;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
  padding: 1rem;
}

.modal {
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 1.5rem;
  animation: modalIn 0.3s ease;
}

@keyframes modalIn {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.modal-title {
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 700;
}

.modal-close {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  transition: var(--transition);
  flex-shrink: 0;
}

.modal-close:hover {
  background: var(--danger);
  color: white;
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 0.5rem;
}

.error-message {
  background: var(--danger);
  color: white;
  padding: 0.875rem 1rem;
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 1rem;
  }

  .page-header .btn {
    width: 100%;
    justify-content: center;
  }

  .categories-table-wrapper {
    display: none;
  }

  .categories-cards {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .modal-overlay {
    padding: 0;
  }

  .modal {
    max-width: 100%;
    max-height: 90vh;
    border-radius: var(--radius);
    padding: 1.25rem;
    margin: 1rem;
  }
}

@media (min-width: 769px) {
  .categories-cards {
    display: none !important;
  }
}

@media (max-width: 480px) {
  .btn-text {
    display: none;
  }

  .page-header .btn {
    width: auto;
    padding: 0.75rem;
  }
}
</style>
