<template>
  <div class="payouts-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Заявки на вывод</h1>
        <p class="page-subtitle">Обработка выплат партнёрам и просмотр реквизитов</p>
      </div>
      <select v-model="statusFilter" class="input filter-select" @change="fetchPayouts">
        <option value="">Все статусы</option>
        <option value="PAYOUT_REQUESTED">Активные</option>
        <option value="PAYOUT_APPROVED">Одобренные</option>
        <option value="PAYOUT_REJECTED">Отклонённые</option>
      </select>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
    </div>

    <div v-else-if="payouts.length === 0" class="empty-card card">
      Заявок пока нет
    </div>

    <template v-else>
      <div class="table-wrapper card desktop-only">
        <table class="data-table">
          <thead>
            <tr>
              <th>Дата</th>
              <th>Партнёр</th>
              <th>Сумма</th>
              <th>Статус</th>
              <th>Реквизиты</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="payout in payouts" :key="payout.id">
              <td>{{ formatDate(payout.createdAt) }}</td>
              <td>
                <router-link :to="`/partners/${payout.partnerId}`" class="partner-link">
                  {{ payout.partner?.user?.name || `Партнёр #${payout.partnerId}` }}
                </router-link>
                <div class="muted">{{ payout.partner?.user?.email || '—' }}</div>
              </td>
              <td class="amount">{{ formatCurrency(payout.amount) }}</td>
              <td><span :class="['status-badge', statusClass(payout.status)]">{{ statusLabel(payout.status) }}</span></td>
              <td class="details-cell">{{ compactDetails(payout.details) }}</td>
              <td class="actions-cell">
                <button class="btn btn-secondary btn-sm" @click="openModal(payout)">Подробнее</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="mobile-list mobile-only">
        <article v-for="payout in payouts" :key="`mobile-${payout.id}`" class="payout-card card">
          <div class="payout-card__top">
            <div>
              <strong>{{ payout.partner?.user?.name || `Партнёр #${payout.partnerId}` }}</strong>
              <span>{{ formatDate(payout.createdAt) }}</span>
            </div>
            <span :class="['status-badge', statusClass(payout.status)]">{{ statusLabel(payout.status) }}</span>
          </div>
          <div class="payout-card__amount">{{ formatCurrency(payout.amount) }}</div>
          <p>{{ compactDetails(payout.details) }}</p>
          <button class="btn btn-secondary btn-sm" @click="openModal(payout)">Подробнее</button>
        </article>
      </div>
    </template>

    <div v-if="selectedPayout" class="modal-overlay" @click.self="closeModal">
      <div class="modal card">
        <div class="modal-header">
          <div>
            <h3 class="modal-title">Заявка #{{ selectedPayout.id }}</h3>
            <p class="modal-subtitle">{{ selectedPayout.partner?.user?.name || 'Партнёр' }} · {{ formatCurrency(selectedPayout.amount) }}</p>
          </div>
          <button class="modal-close" @click="closeModal">×</button>
        </div>

        <div class="details-grid">
          <div v-for="item in detailsRows(selectedPayout.details)" :key="item.label" class="detail-row">
            <span>{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Комментарий администратора</label>
          <textarea v-model="adminComment" class="input" rows="3" placeholder="Например: выплачено на карту / неверные реквизиты"></textarea>
        </div>

        <div v-if="error" class="error-message">{{ error }}</div>

        <div class="modal-actions">
          <button class="btn btn-secondary" @click="closeModal">Закрыть</button>
          <button
            v-if="selectedPayout.status === 'PAYOUT_REQUESTED'"
            class="btn btn-danger"
            :disabled="processing"
            @click="updatePayoutStatus('PAYOUT_REJECTED')"
          >
            Отклонить
          </button>
          <button
            v-if="selectedPayout.status === 'PAYOUT_REQUESTED'"
            class="btn btn-primary"
            :disabled="processing"
            @click="updatePayoutStatus('PAYOUT_APPROVED')"
          >
            Одобрить выплату
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const API_URL = '/api/admin/partners'

const payouts = ref([])
const loading = ref(true)
const processing = ref(false)
const error = ref('')
const statusFilter = ref('PAYOUT_REQUESTED')
const selectedPayout = ref(null)
const adminComment = ref('')

function statusLabel(status) {
  const labels = {
    PAYOUT_REQUESTED: 'На проверке',
    PAYOUT_APPROVED: 'Выплачено',
    PAYOUT_REJECTED: 'Отклонено',
    SPENT_ON_ORDER: 'Списано на заказ'
  }
  return labels[status] || status
}

function statusClass(status) {
  if (status === 'PAYOUT_APPROVED') return 'status-success'
  if (status === 'PAYOUT_REJECTED') return 'status-danger'
  return 'status-warning'
}

function formatCurrency(value) {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(Number(value || 0))
}

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function compactDetails(details = {}) {
  if (details.cardNumber) return `Карта: ${details.cardNumber}`
  if (details.phone) return `Телефон: ${details.phone}`
  if (details.accountNumber) return `${details.bankName || 'Банк'} · ${details.accountNumber}`
  return 'Реквизиты не указаны'
}

function detailsRows(details = {}) {
  const rows = [
    ['ФИО получателя', details.recipientName],
    ['Банк', details.bankName],
    ['Расчётный счёт', details.accountNumber],
    ['БИК', details.bik],
    ['Корр. счёт', details.correspondentAccount],
    ['ИНН', details.inn],
    ['Карта', details.cardNumber],
    ['Телефон', details.phone],
    ['Комментарий партнёра', details.comment]
  ]
  return rows.filter(([, value]) => value).map(([label, value]) => ({ label, value }))
}

async function fetchPayouts() {
  loading.value = true
  try {
    const params = {
      limit: 100,
      ...(statusFilter.value ? { status: statusFilter.value } : {})
    }
    const { data } = await axios.get(`${API_URL}/payments`, { params })
    payouts.value = (data.payments || []).filter(payment => (payment.type || 'PAYOUT') === 'PAYOUT')
  } finally {
    loading.value = false
  }
}

function openModal(payout) {
  selectedPayout.value = payout
  adminComment.value = payout.comment || ''
  error.value = ''
}

function closeModal() {
  selectedPayout.value = null
  adminComment.value = ''
  error.value = ''
}

async function updatePayoutStatus(status) {
  if (!selectedPayout.value) return
  const message = status === 'PAYOUT_APPROVED'
    ? 'Одобрить выплату и списать сумму с баланса партнёра?'
    : 'Отклонить заявку и разморозить сумму?'
  if (!confirm(message)) return

  processing.value = true
  error.value = ''
  try {
    await axios.put(`${API_URL}/payments/${selectedPayout.value.id}`, {
      status,
      comment: adminComment.value
    })
    closeModal()
    await fetchPayouts()
  } catch (e) {
    error.value = e.response?.data?.error || 'Не удалось обновить заявку'
  } finally {
    processing.value = false
  }
}

onMounted(fetchPayouts)
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
  margin-bottom: 1.5rem;
}

.filter-select {
  max-width: 220px;
}

.empty-card {
  padding: 1.5rem;
  color: var(--text-secondary);
}

.table-wrapper {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  min-width: 900px;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid var(--border);
}

.data-table th {
  color: var(--text-secondary);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.partner-link {
  color: var(--text-primary);
  font-weight: 700;
}

.muted,
.details-cell {
  color: var(--text-secondary);
  font-size: 0.85rem;
}

.amount {
  font-weight: 800;
  color: var(--accent);
}

.status-badge {
  display: inline-flex;
  padding: 0.35rem 0.7rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 800;
}

.status-success {
  color: #22c55e;
  background: rgba(34, 197, 94, 0.14);
}

.status-warning {
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.14);
}

.status-danger {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.14);
}

.actions-cell {
  text-align: right;
}

.mobile-only {
  display: none;
}

.payout-card {
  padding: 1rem;
  display: grid;
  gap: 0.8rem;
}

.payout-card__top {
  display: flex;
  justify-content: space-between;
  gap: 0.8rem;
}

.payout-card__top div {
  display: grid;
  gap: 0.2rem;
}

.payout-card__top span,
.payout-card p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.85rem;
}

.payout-card__amount {
  font-size: 1.5rem;
  font-weight: 900;
  color: var(--accent);
}

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(8px);
}

.modal {
  width: min(680px, 100%);
  max-height: 90vh;
  overflow: auto;
  padding: 1.5rem;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.modal-title,
.modal-subtitle {
  margin: 0;
}

.modal-subtitle {
  margin-top: 0.35rem;
  color: var(--text-secondary);
}

.modal-close {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 1.5rem;
}

.details-grid {
  display: grid;
  gap: 0.65rem;
  margin-bottom: 1rem;
}

.detail-row {
  display: grid;
  grid-template-columns: 170px 1fr;
  gap: 1rem;
  padding: 0.8rem;
  border: 1px solid var(--border);
  border-radius: 12px;
}

.detail-row span {
  color: var(--text-secondary);
}

.detail-row strong {
  word-break: break-word;
}

.form-group {
  margin: 1rem 0;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--text-secondary);
  font-weight: 700;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.btn-danger {
  background: #ef4444;
  color: #fff;
}

.error-message {
  margin-bottom: 1rem;
  color: #ef4444;
}

@media (max-width: 768px) {
  .page-header {
    display: grid;
  }

  .filter-select {
    max-width: none;
  }

  .desktop-only {
    display: none;
  }

  .mobile-only {
    display: grid;
    gap: 0.9rem;
  }

  .detail-row {
    grid-template-columns: 1fr;
    gap: 0.35rem;
  }

  .modal-actions .btn {
    flex: 1 1 100%;
  }
}
</style>
