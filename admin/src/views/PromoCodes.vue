<template>
  <div class="promo-codes-page">
    <div class="page-header">
      <div>
        <h1 class="page-title" style="font-size: 1.75rem; margin-bottom: 0.25rem;">Промокоды</h1>
        <p class="page-subtitle">Управление промокодами и купонами</p>
      </div>
      <button @click="openModal()" class="btn btn-primary">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        <span class="btn-text">Создать промокод</span>
      </button>
    </div>

    <div class="filters-bar card" style="margin-bottom: 1.5rem; padding: 1rem;">
      <div class="filter-group">
        <label class="form-label">Партнёр</label>
        <select v-model="filterPartnerId" @change="fetchPromoCodes" class="input">
          <option :value="null">Все партнёры</option>
          <option v-for="p in partners" :key="p.id" :value="p.id">
            {{ p.user.name }} ({{ p.referralCode }})
          </option>
        </select>
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
              <th>Код</th>
              <th>Тип скидки</th>
              <th>Значение</th>
              <th>Тип использования</th>
              <th>Активаций</th>
              <th>Партнёр</th>
              <th>Даты</th>
              <th>Мин. сумма</th>
              <th>Статус</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="pc in promoCodes" :key="pc.id">
              <td><code class="code-tag">{{ pc.code }}</code></td>
              <td>
                <span :class="['badge', pc.discountType === 'percentage' ? 'badge-primary' : 'badge-secondary']">
                  {{ pc.discountType === 'percentage' ? 'Процент' : 'Фикс. сумма' }}
                </span>
              </td>
              <td>
                <span class="discount-value">
                  {{ pc.discountType === 'percentage' ? pc.discountValue + '%' : formatCurrency(pc.discountValue) }}
                </span>
              </td>
              <td>
                <span :class="['badge', pc.usageType === 'single' ? 'badge-danger' : 'badge-success']">
                  {{ pc.usageType === 'single' ? 'Однократный' : 'Многоразовый' }}
                </span>
              </td>
              <td class="cell-num">{{ pc.activationCount }} / {{ pc.maxActivations }}</td>
              <td>
                <span v-if="pc.partner">
                  {{ pc.partner.user.name }}
                </span>
                <span v-else class="text-muted">Общий</span>
              </td>
              <td class="cell-dates">
                <span v-if="pc.startDate || pc.endDate">
                  {{ formatDate(pc.startDate) }} — {{ formatDate(pc.endDate) }}
                </span>
                <span v-else class="text-muted">Без ограничений</span>
              </td>
              <td>
                <span v-if="pc.minOrderAmount">{{ formatCurrency(pc.minOrderAmount) }}</span>
                <span v-else class="text-muted">—</span>
              </td>
              <td>
                <label class="toggle">
                  <input type="checkbox" :checked="pc.isActive" @change="toggleActive(pc.id, $event.target.checked)">
                  <span class="toggle-slider"></span>
                </label>
              </td>
              <td>
                <button @click="editPromoCode(pc)" class="action-btn" title="Редактировать">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
                <button @click="deletePromoCode(pc.id)" class="action-btn danger" title="Удалить">
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
          <h3 class="modal-title">{{ editingId ? 'Редактировать промокод' : 'Новый промокод' }}</h3>
          <button @click="closeModal" class="modal-close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form @submit.prevent="handleSubmit" class="modal-form">
          <div class="form-group">
            <label class="form-label">Код</label>
            <input type="text" v-model="form.code" required class="input" placeholder="PROMO2024" :disabled="editingId">
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Тип скидки</label>
              <select v-model="form.discountType" class="input">
                <option value="percentage">Процент</option>
                <option value="fixed">Фиксированная сумма</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Значение</label>
              <input type="number" v-model="form.discountValue" required class="input" min="0"
                :step="form.discountType === 'percentage' ? 1 : 0.01">
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Тип использования</label>
              <select v-model="form.usageType" class="input">
                <option value="single">Однократный</option>
                <option value="multi">Многоразовый</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Макс. активаций</label>
              <input type="number" v-model="form.maxActivations" class="input" min="1" :disabled="form.usageType === 'single'">
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Дата начала</label>
              <input type="date" v-model="form.startDate" class="input">
            </div>
            <div class="form-group">
              <label class="form-label">Дата окончания</label>
              <input type="date" v-model="form.endDate" class="input">
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Мин. сумма заказа</label>
              <input type="number" v-model="form.minOrderAmount" class="input" min="0" step="0.01">
            </div>
            <div class="form-group">
              <label class="form-label">Партнёр</label>
              <select v-model="form.partnerId" class="input">
                <option :value="null">Без партнёра (общий)</option>
                <option v-for="p in partners" :key="p.id" :value="p.id">
                  {{ p.user.name }}
                </option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="form.isFirstPurchase">
              <span>Купон на первую покупку (только для новых пользователей)</span>
            </label>
          </div>

          <div v-if="error" class="error-message">{{ error }}</div>

          <div class="modal-actions">
            <button type="button" @click="closeModal" class="btn btn-secondary">Отмена</button>
            <button type="submit" class="btn btn-primary" :disabled="loadingForm">{{ editingId ? 'Сохранить' : 'Создать' }}</button>
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
const PROMO_CODES_URL = '/api/admin/partners/promo-codes'
const PARTNERS_URL = '/api/admin/partners'

const promoCodes = ref([])
const partners = ref([])
const loading = ref(true)
const showModal = ref(false)
const editingId = ref(null)
const error = ref('')
const loadingForm = ref(false)
const filterPartnerId = ref(null)

const form = ref({
  code: '',
  discountType: 'percentage',
  discountValue: 5,
  usageType: 'single',
  maxActivations: 1,
  startDate: '',
  endDate: '',
  minOrderAmount: null,
  isFirstPurchase: false,
  partnerId: null
})

async function fetchPromoCodes() {
  try {
    const params = filterPartnerId.value ? { partnerId: filterPartnerId.value } : {}
    const { data } = await axios.get(PROMO_CODES_URL, { params })
    promoCodes.value = data.promoCodes
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function fetchPartners() {
  try {
    const { data } = await axios.get(PARTNERS_URL)
    partners.value = data.partners
  } catch (e) {
    console.error(e)
  }
}

function editPromoCode(pc) {
  editingId.value = pc.id
  form.value = {
    code: pc.code,
    discountType: pc.discountType,
    discountValue: pc.discountValue,
    usageType: pc.usageType,
    maxActivations: pc.maxActivations,
    startDate: pc.startDate ? pc.startDate.split('T')[0] : '',
    endDate: pc.endDate ? pc.endDate.split('T')[0] : '',
    minOrderAmount: pc.minOrderAmount,
    isFirstPurchase: pc.isFirstPurchase,
    partnerId: pc.partnerId
  }
  showModal.value = true
}

async function toggleActive(id, isActive) {
  try {
    await axios.put(`${PROMO_CODES_URL}/${id}`, { isActive })
  } catch (e) {
    console.error(e)
  }
}

async function deletePromoCode(id) {
  if (!confirm('Удалить промокод?')) return
  try {
    await axios.delete(`${PROMO_CODES_URL}/${id}`)
    promoCodes.value = promoCodes.value.filter(pc => pc.id !== id)
  } catch (e) {
    alert('Ошибка удаления')
  }
}

function openModal() {
  editingId.value = null
  form.value = {
    code: '',
    discountType: 'percentage',
    discountValue: 5,
    usageType: 'single',
    maxActivations: 1,
    startDate: '',
    endDate: '',
    minOrderAmount: null,
    isFirstPurchase: false,
    partnerId: null
  }
  error.value = ''
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingId.value = null
}

async function handleSubmit() {
  error.value = ''
  loadingForm.value = true
  try {
    const payload = { ...form.value }
    if (payload.startDate) payload.startDate = new Date(payload.startDate).toISOString()
    if (payload.endDate) payload.endDate = new Date(payload.endDate).toISOString()
    if (payload.minOrderAmount === '') payload.minOrderAmount = null

    if (editingId.value) {
      await axios.put(`${PROMO_CODES_URL}/${editingId.value}`, payload)
    } else {
      await axios.post(PROMO_CODES_URL, payload)
    }
    closeModal()
    fetchPromoCodes()
  } catch (e) {
    error.value = e.response?.data?.error || 'Ошибка сохранения'
  } finally {
    loadingForm.value = false
  }
}

function formatCurrency(value) {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(value)
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('ru-RU')
}

onMounted(() => {
  fetchPromoCodes()
  fetchPartners()
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

.filters-bar {
  display: flex;
  gap: 1rem;
  align-items: flex-end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 200px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.table-wrapper {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 1000px;
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

.code-tag {
  background: var(--bg-secondary);
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
}

.discount-value {
  font-weight: 600;
}

.badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 600;
}

.badge-primary {
  background: var(--accent-dim);
  color: var(--accent);
}

.badge-secondary {
  background: var(--bg-secondary);
  color: var(--text-secondary);
}

.badge-success {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
}

.badge-danger {
  background: rgba(239, 68, 68, 0.15);
  color: var(--danger);
}

.cell-num {
  font-family: var(--font-body);
}

.cell-dates {
  font-size: 0.875rem;
}

.text-muted {
  color: var(--text-muted);
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
  display: inline-flex;
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
  max-width: 560px;
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

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
}

.checkbox-label input {
  width: 18px;
  height: 18px;
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

  .filters-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>