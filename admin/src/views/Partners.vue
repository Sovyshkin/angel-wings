<template>
  <div class="partners-page">
    <div class="page-header">
      <div>
        <h1 class="page-title" style="font-size: 1.75rem; margin-bottom: 0.25rem;">Партнёры</h1>
        <p class="page-subtitle">Управление партнёрской программой</p>
      </div>
      <button @click="openModal()" class="btn btn-primary">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        <span class="btn-text">Добавить партнёра</span>
      </button>
    </div>

    <div class="stats-grid" style="margin-bottom: 2rem;">
      <div class="stat-card card">
        <div class="stat-card__value">{{ stats.partnersCount || 0 }}</div>
        <div class="stat-card__label">Всего партнёров</div>
      </div>
      <div class="stat-card card">
        <div class="stat-card__value">{{ stats.promoCodesCount || 0 }}</div>
        <div class="stat-card__label">Промокодов</div>
      </div>
      <div class="stat-card card">
        <div class="stat-card__value">{{ stats.activeBindings || 0 }}</div>
        <div class="stat-card__label">Активных привязок</div>
      </div>
      <div class="stat-card card">
        <div class="stat-card__value">{{ formatCurrency(stats.totalCommissions || 0) }}</div>
        <div class="stat-card__label">Всего комиссий</div>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
    </div>

    <div v-else>
      <div class="table-wrapper card">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Имя</th>
              <th>Email</th>
              <th>Реф. код</th>
              <th>Процент</th>
              <th>Пользователей</th>
              <th>Заказов</th>
              <th>Комиссия</th>
              <th>Статус</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="partner in partners" :key="partner.id">
              <td class="cell-id">{{ partner.id }}</td>
              <td class="cell-name">{{ partner.user.name }}</td>
              <td class="cell-email">{{ partner.user.email }}</td>
              <td><code class="code-tag">{{ partner.referralCode }}</code></td>
              <td>
                <div class="percentage-edit">
                  <input type="number" :value="partner.percentage" @blur="updatePercentage(partner.id, $event.target.value)"
                    min="0" max="100" step="0.5" class="input input-sm">
                  <span>%</span>
                </div>
              </td>
              <td class="cell-num">{{ partner.usersCount }}</td>
              <td class="cell-num">{{ partner.ordersCount }}</td>
              <td class="cell-amount">{{ formatCurrency(partner.totalCommission) }}</td>
              <td>
                <label class="toggle">
                  <input type="checkbox" :checked="partner.isActive" @change="toggleActive(partner.id, $event.target.checked)">
                  <span class="toggle-slider"></span>
                </label>
              </td>
              <td>
                <button @click="deletePartner(partner.id)" class="action-btn danger" title="Удалить">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                  </svg>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="showModal" class="modal-overlay">
      <div class="modal card">
        <div class="modal-header">
          <h3 class="modal-title">Новый партнёр</h3>
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
            <input type="email" v-model="form.email" required class="input" placeholder="partner@example.com">
          </div>

          <div class="form-group">
            <label class="form-label">Пароль</label>
            <input type="password" v-model="form.password" required class="input" placeholder="Минимум 6 символов">
          </div>

          <div class="form-group">
            <label class="form-label">Телефон</label>
            <input type="tel" v-model="form.phone" class="input" placeholder="+7 (999) 123-45-67">
          </div>

          <div class="form-group">
            <label class="form-label">Процент комиссии</label>
            <input type="number" v-model="form.percentage" required class="input" min="0" max="100" step="0.5" placeholder="5">
          </div>

          <div v-if="error" class="error-message">{{ error }}</div>

          <div class="modal-actions">
            <button type="button" @click="closeModal" class="btn btn-secondary">Отмена</button>
            <button type="submit" class="btn btn-primary" :disabled="loadingForm">Создать</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const API_URL = '/api/admin/partners'
const STATS_URL = '/api/admin/stats/partner'

const partners = ref([])
const stats = ref({})
const loading = ref(true)
const showModal = ref(false)
const error = ref('')
const loadingForm = ref(false)

const form = ref({ name: '', email: '', password: '', phone: '', percentage: 5 })

async function fetchPartners() {
  try {
    const { data } = await axios.get(API_URL)
    partners.value = data.partners
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function fetchStats() {
  try {
    const { data } = await axios.get(STATS_URL)
    stats.value = data.stats
  } catch (e) {
    console.error(e)
  }
}

async function updatePercentage(id, value) {
  const percentage = parseFloat(value)
  if (isNaN(percentage) || percentage < 0 || percentage > 100) return
  try {
    await axios.put(`${API_URL}/${id}`, { percentage })
  } catch (e) {
    console.error(e)
  }
}

async function toggleActive(id, isActive) {
  try {
    await axios.put(`${API_URL}/${id}`, { isActive })
  } catch (e) {
    console.error(e)
  }
}

async function deletePartner(id) {
  if (!confirm('Удалить партнёра?')) return
  try {
    await axios.delete(`${API_URL}/${id}`)
    partners.value = partners.value.filter(p => p.id !== id)
    fetchStats()
  } catch (e) {
    alert('Ошибка удаления')
  }
}

function openModal() {
  form.value = { name: '', email: '', password: '', phone: '', percentage: 5 }
  error.value = ''
  showModal.value = true
}

function closeModal() {
  showModal.value = false
}

async function handleSubmit() {
  error.value = ''
  loadingForm.value = true
  try {
    await axios.post(API_URL, form.value)
    closeModal()
    fetchPartners()
    fetchStats()
  } catch (e) {
    error.value = e.response?.data?.error || 'Ошибка создания'
  } finally {
    loadingForm.value = false
  }
}

function formatCurrency(value) {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(value)
}

onMounted(() => {
  fetchPartners()
  fetchStats()
})
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 2rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.stat-card {
  padding: 1.5rem;
  text-align: center;
}

.stat-card__value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--accent);
  margin-bottom: 0.25rem;
}

.stat-card__label {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.table-wrapper {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 900px;
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

.cell-num {
  font-family: var(--font-body);
}

.cell-amount {
  font-weight: 600;
  color: var(--accent);
}

.code-tag {
  background: var(--bg-secondary);
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius-sm);
  font-size: 0.8125rem;
  font-family: var(--font-body);
}

.percentage-edit {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.percentage-edit .input {
  width: 60px;
  padding: 0.375rem 0.5rem;
}

.percentage-edit span {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.input-sm {
  font-size: 0.875rem;
  padding: 0.375rem 0.5rem;
}

.toggle {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
}

.toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  inset: 0;
  background: var(--bg-secondary);
  border-radius: 24px;
  transition: var(--transition);
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background: white;
  border-radius: 50%;
  transition: var(--transition);
}

.toggle input:checked + .toggle-slider {
  background: var(--accent);
}

.toggle input:checked + .toggle-slider:before {
  transform: translateX(20px);
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
  from { opacity: 0; transform: scale(0.95) translateY(10px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
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

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>