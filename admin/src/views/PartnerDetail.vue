<template>
  <div class="partner-detail-page">
    <div class="page-header">
      <div class="header-left">
        <button @click="goBack" class="btn btn-secondary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
          Назад
        </button>
        <div>
          <h1 class="page-title" style="font-size: 1.75rem; margin-bottom: 0.25rem;">{{ partner?.user?.name || 'Партнёр' }}</h1>
          <p class="page-subtitle">{{ partner?.user?.email }}</p>
        </div>
      </div>
      <div class="header-actions">
        <label class="toggle">
          <input type="checkbox" :checked="partner?.isActive" @change="toggleActive">
          <span class="toggle-slider"></span>
          <span class="toggle-label">{{ partner?.isActive ? 'Активен' : 'Отключён' }}</span>
        </label>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
    </div>

    <div v-else-if="partner" class="content">
      <div class="stats-grid">
        <div class="stat-card card">
          <div class="stat-card__value">{{ partner.users?.length || 0 }}</div>
          <div class="stat-card__label">Привязанных пользователей</div>
        </div>
        <div class="stat-card card">
          <div class="stat-card__value">{{ partner.promoCodes?.length || 0 }}</div>
          <div class="stat-card__label">Промокодов</div>
        </div>
        <div class="stat-card card">
          <div class="stat-card__value">{{ partner.recentOrders?.length || 0 }}</div>
          <div class="stat-card__label">Заказов</div>
        </div>
        <div class="stat-card card">
          <div class="stat-card__value">{{ formatCurrency(partner.totalCommission || 0) }}</div>
          <div class="stat-card__label">Общая комиссия</div>
        </div>
        <div class="stat-card card">
          <div class="stat-card__value">{{ partner.percentage }}%</div>
          <div class="stat-card__label">Процент комиссии</div>
        </div>
        <div class="stat-card card">
          <div class="stat-card__value"><code class="code-tag">{{ partner.referralCode }}</code></div>
          <div class="stat-card__label">Реферальный код</div>
        </div>
      </div>

      <div class="info-grid">
        <div class="card info-card">
          <h3 class="card-title">Информация о партнёре</h3>
          <div class="info-list">
            <div class="info-item">
              <span class="info-label">ID</span>
              <span class="info-value">{{ partner.id }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Email</span>
              <span class="info-value">{{ partner.user.email }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Имя</span>
              <span class="info-value">{{ partner.user.name }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Телефон</span>
              <span class="info-value">{{ partner.user.phone || '—' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Дата регистрации</span>
              <span class="info-value">{{ formatDate(partner.user.createdAt) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Дата создания аккаунта</span>
              <span class="info-value">{{ formatDate(partner.createdAt) }}</span>
            </div>
          </div>
        </div>

        <div class="card info-card">
          <h3 class="card-title">Настройки</h3>
          <div class="form-group">
            <label class="form-label">Процент комиссии</label>
            <div class="percentage-edit">
              <input type="number" v-model.number="percentage" min="0" max="100" step="0.5" class="input">
              <span>%</span>
              <button @click="updatePercentage" class="btn btn-primary btn-sm">Сохранить</button>
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">Привязанные пользователи</h2>
        <div v-if="partner.users?.length" class="table-wrapper card">
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Имя</th>
                <th>Email</th>
                <th>Дата привязки</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in partner.users" :key="user.id">
                <td class="cell-id">{{ user.id }}</td>
                <td class="cell-name">{{ user.name || '—' }}</td>
                <td class="cell-email">{{ user.email }}</td>
                <td>{{ formatDate(user.boundAt) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="empty-state card">
          <p>Нет привязанных пользователей</p>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">Последние заказы</h2>
        <div v-if="partner.recentOrders?.length" class="table-wrapper card">
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Клиент</th>
                <th>Сумма</th>
                <th>Статус</th>
                <th>Дата</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="order in partner.recentOrders" :key="order.id">
                <td class="cell-id">#{{ order.id }}</td>
                <td>
                  <div>{{ order.user?.name || '—' }}</div>
                  <div class="text-muted">{{ order.user?.email }}</div>
                </td>
                <td class="cell-amount">{{ formatCurrency(order.total) }}</td>
                <td>
                  <span :class="['badge', getStatusClass(order.status)]">{{ getStatusLabel(order.status) }}</span>
                </td>
                <td>{{ formatDate(order.createdAt) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="empty-state card">
          <p>Нет заказов</p>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">Промокоды</h2>
        <div v-if="partner.promoCodes?.length" class="promo-grid">
          <div v-for="code in partner.promoCodes" :key="code.id" class="promo-card card">
            <div class="promo-code"><code>{{ code.code }}</code></div>
            <div class="promo-info">
              <span class="promo-discount">{{ code.discountType === 'percent' ? code.discount + '%' : formatCurrency(code.discount) }}</span>
              <span :class="['badge', code.isActive ? 'badge-success' : 'badge-danger']">
                {{ code.isActive ? 'Активен' : 'Отключён' }}
              </span>
            </div>
          </div>
        </div>
        <div v-else class="empty-state card">
          <p>Нет промокодов</p>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">Комиссии</h2>
        <div v-if="partner.commissions?.length" class="table-wrapper card">
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Заказ</th>
                <th>Сумма</th>
                <th>Дата</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="comm in partner.commissions" :key="comm.id">
                <td class="cell-id">#{{ comm.id }}</td>
                <td>#{{ comm.orderId }}</td>
                <td class="cell-amount">{{ formatCurrency(comm.amount) }}</td>
                <td>{{ formatDate(comm.createdAt) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="empty-state card">
          <p>Нет комиссий</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'

const route = useRoute()
const router = useRouter()

const API_URL = '/api/admin/partners'
const partner = ref(null)
const loading = ref(true)
const percentage = ref(5)

async function fetchPartner() {
  try {
    const { data } = await axios.get(`${API_URL}/${route.params.id}`)
    partner.value = data.partner
    percentage.value = data.partner.percentage
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function updatePercentage() {
  try {
    await axios.put(`${API_URL}/${route.params.id}`, { percentage: percentage.value })
    partner.value.percentage = percentage.value
  } catch (e) {
    console.error(e)
  }
}

async function toggleActive() {
  try {
    const newStatus = !partner.value.isActive
    await axios.put(`${API_URL}/${route.params.id}`, { isActive: newStatus })
    partner.value.isActive = newStatus
  } catch (e) {
    console.error(e)
  }
}

function goBack() {
  router.push('/partners')
}

function formatCurrency(value) {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(value)
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

function getStatusClass(status) {
  const classes = {
    PENDING: 'badge-warning',
    PROCESSING: 'badge-info',
    SHIPPED: 'badge-primary',
    DELIVERED: 'badge-success',
    CANCELLED: 'badge-danger'
  }
  return classes[status] || ''
}

function getStatusLabel(status) {
  const labels = {
    PENDING: 'Ожидает',
    PROCESSING: 'В обработке',
    SHIPPED: 'Отправлен',
    DELIVERED: 'Доставлен',
    CANCELLED: 'Отменён'
  }
  return labels[status] || status
}

onMounted(fetchPartner)
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 2rem;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  padding: 1.5rem;
  text-align: center;
}

.stat-card__value {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--accent);
  margin-bottom: 0.25rem;
}

.stat-card__label {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.info-card {
  padding: 1.5rem;
}

.card-title {
  font-size: 1.125rem;
  font-weight: 700;
  margin-bottom: 1rem;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-label {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.info-value {
  font-weight: 500;
}

.percentage-edit {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.percentage-edit .input {
  width: 100px;
}

.section {
  margin-bottom: 2rem;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 1rem;
}

.table-wrapper {
  overflow-x: auto;
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
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  color: var(--text-muted);
}

.cell-name {
  font-weight: 600;
}

.cell-email {
  color: var(--text-secondary);
}

.cell-amount {
  font-weight: 600;
  color: var(--accent);
}

.text-muted {
  font-size: 0.8125rem;
  color: var(--text-muted);
}

.code-tag {
  background: var(--bg-secondary);
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
}

.promo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}

.promo-card {
  padding: 1rem;
}

.promo-code {
  margin-bottom: 0.5rem;
}

.promo-code code {
  font-size: 1.125rem;
  font-weight: 700;
}

.promo-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.promo-discount {
  font-size: 1rem;
  font-weight: 600;
}

.empty-state {
  padding: 2rem;
  text-align: center;
  color: var(--text-muted);
}

.badge {
  display: inline-block;
  padding: 0.25rem 0.625rem;
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.badge-success { background: var(--success); color: white; }
.badge-danger { background: var(--danger); color: white; }
.badge-warning { background: var(--warning); color: black; }
.badge-info { background: var(--info); color: white; }
.badge-primary { background: var(--accent); color: white; }

.toggle {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
}

.toggle-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
  }

  .header-left {
    flex-direction: column;
    align-items: flex-start;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>