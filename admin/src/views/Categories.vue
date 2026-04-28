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
        Добавить
      </button>
    </div>
    
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
    </div>
    
    <div v-else class="card">
      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Название</th>
            <th>Slug</th>
            <th>Товаров</th>
            <th>Статус</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="cat in categories" :key="cat.term_id">
            <td class="cell-id">{{ cat.term_id }}</td>
            <td class="cell-name">{{ cat.name }}</td>
            <td class="cell-slug">{{ cat.slug }}</td>
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
            <label class="form-label">Описание</label>
            <textarea v-model="form.description" rows="3" class="input" placeholder="Описание категории..."></textarea>
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

const form = ref({ name: '', description: '', active: true })

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
  if (cat) {
    editing.value = cat.term_id
    form.value = { name: cat.name, description: cat.description || '', active: cat.active }
  } else {
    editing.value = null
    form.value = { name: '', description: '', active: true }
  }
  error.value = ''
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editing.value = null
  form.value = { name: '', description: '' }
}

async function handleSubmit() {
  error.value = ''
  loadingForm.value = true
  
  try {
    if (editing.value) {
      await axios.put(`${API_URL}/categories/${editing.value}`, form.value)
    } else {
      await axios.post(`${API_URL}/categories`, form.value)
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
  margin-bottom: 2rem;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
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
}

.modal {
  width: 100%;
  max-width: 480px;
  padding: 2rem;
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

@media (max-width: 640px) {
  .page-header {
    flex-direction: column;
    gap: 1rem;
  }
}
</style>