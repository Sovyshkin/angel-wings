<template>
  <div class="users-page">
    <div class="page-header">
      <div>
        <h1 class="page-title" style="font-size: 1.75rem; margin-bottom: 0.25rem;">Пользователи</h1>
        <p class="page-subtitle">Управление пользователями</p>
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
            <th>Имя</th>
            <th>Email</th>
            <th>Телефон</th>
            <th>Роль</th>
            <th>Заказов</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.id">
            <td class="cell-id">{{ user.id }}</td>
            <td class="cell-name">{{ user.name }}</td>
            <td class="cell-email">{{ user.email }}</td>
            <td class="cell-phone">{{ user.phone || '—' }}</td>
            <td>
              <select :value="user.role" @change="updateRole(user.id, $event.target.value)" class="role-select" :disabled="user.id === currentUserId">
                <option value="USER">Пользователь</option>
                <option value="ADMIN">Админ</option>
              </select>
            </td>
            <td class="cell-orders">{{ user._count?.orders || 0 }}</td>
            <td>
              <button @click="deleteUser(user.id)" class="action-btn danger" :disabled="user.id === currentUserId" title="Удалить">
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
          <h3 class="modal-title">Новый пользователь</h3>
          <button @click="closeModal" class="modal-close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        
        <form @submit.prevent="handleSubmit" class="modal-form">
          <div class="form-group">
            <label class="form-label">Имя</label>
            <input type="text" v-model="form.name" required class="input" placeholder="Иван Петров">
          </div>
          
          <div class="form-group">
            <label class="form-label">Email</label>
            <input type="email" v-model="form.email" required class="input" placeholder="email@example.com">
          </div>
          
          <div class="form-group">
            <label class="form-label">Пароль</label>
            <input type="password" v-model="form.password" required class="input" placeholder="Минимум 6 символов">
          </div>
          
          <div class="form-group">
            <label class="form-label">Телефон</label>
            <input type="tel" v-model="form.phone" class="input" placeholder="+7 (999) 123-45-67">
          </div>
          
          <div v-if="error" class="error-message">{{ error }}</div>
          
          <div class="modal-actions">
            <button type="button" @click="closeModal" class="btn btn-secondary">Отмена</button>
            <button type="submit" class="btn btn-primary" :disabled="loading">Создать</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../store/auth'
import axios from 'axios'

const authStore = useAuthStore()
const API_URL = '/api/admin'

const users = ref([])
const loading = ref(true)
const showModal = ref(false)
const error = ref('')
const loadingForm = ref(false)

const form = ref({ name: '', email: '', password: '', phone: '', role: 'USER' })

const currentUserId = computed(() => authStore.user?.id)

async function fetchUsers() {
  try {
    const { data } = await axios.get(API_URL + '/users')
    users.value = data.users
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function updateRole(id, role) {
  try {
    await axios.put(`${API_URL}/users/${id}`, { role })
    const user = users.value.find(u => u.id === id)
    if (user) user.role = role
  } catch (e) {
    alert('Ошибка обновления роли')
  }
}

function openModal() {
  form.value = { name: '', email: '', password: '', phone: '', role: 'USER' }
  error.value = ''
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  form.value = { name: '', email: '', password: '', phone: '', role: 'USER' }
}

async function handleSubmit() {
  error.value = ''
  loadingForm.value = true
  try {
    await axios.post(API_URL + '/users', form.value)
    closeModal()
    fetchUsers()
  } catch (e) {
    error.value = e.response?.data?.error || 'Ошибка создания'
  } finally {
    loadingForm.value = false
  }
}

async function deleteUser(id) {
  if (!confirm('Удалить пользователя?')) return
  try {
    await axios.delete(`${API_URL}/users/${id}`)
    users.value = users.value.filter(u => u.id !== id)
  } catch (e) {
    alert('Ошибка удаления')
  }
}

onMounted(fetchUsers)
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

.cell-email {
  color: var(--text-secondary);
}

.cell-phone {
  color: var(--text-secondary);
  font-size: 0.9375rem;
}

.role-select {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  padding: 0.5rem 0.75rem;
  border-radius: var(--radius-sm);
  color: inherit;
  cursor: pointer;
  font-size: 0.8125rem;
}

.role-select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cell-orders {
  font-family: var(--font-body);
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

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 1rem;
  }
}
</style>