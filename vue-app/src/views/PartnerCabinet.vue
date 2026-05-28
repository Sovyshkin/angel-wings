<template>
  <div class="partner-cabinet">
    <div class="page-header">
      <div>
        <h1 class="page-title">Личный кабинет партнёра</h1>
        <p class="page-subtitle">Добро пожаловать, {{ authStore.user?.name }}!</p>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
    </div>

    <div v-else-if="accessDenied" class="access-denied card">
      <h3>Доступ ограничен</h3>
      <p>Партнёрский кабинет доступен только подтверждённым партнёрам.</p>
    </div>

    <div v-else class="cabinet-content">
      <div class="stats-grid">
        <div class="stat-card card">
          <div class="stat-card__icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
            </svg>
          </div>
          <div class="stat-card__value">{{ stats.usersCount || 0 }}</div>
          <div class="stat-card__label">Привлечённых пользователей</div>
        </div>

        <div class="stat-card card">
          <div class="stat-card__icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div class="stat-card__value">{{ stats.ordersCount || 0 }}</div>
          <div class="stat-card__label">Заказов от ваших пользователей</div>
        </div>

        <div class="stat-card card">
          <div class="stat-card__icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
            </svg>
          </div>
          <div class="stat-card__value">{{ formatCurrency(stats.totalOrdersAmount || 0) }}</div>
          <div class="stat-card__label">Сумма заказов</div>
        </div>

        <div class="stat-card card highlight">
          <div class="stat-card__icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/>
            </svg>
          </div>
          <div class="stat-card__value">{{ formatCurrency(stats.totalEarned || 0) }}</div>
          <div class="stat-card__label">Начислено</div>
        </div>

        <div class="stat-card card stat-card--success">
          <div class="stat-card__value">{{ formatCurrency(stats.totalPaidOut || 0) }}</div>
          <div class="stat-card__label">Выплачено</div>
        </div>

        <div class="stat-card card stat-card--warning">
          <div class="stat-card__value">{{ formatCurrency(stats.pendingAmount || 0) }}</div>
          <div class="stat-card__label">Доступно для оплаты заказов</div>
        </div>
      </div>

      <div class="dashboard-grid section-space">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Мои промокоды</h3>
          </div>
          <div class="card-body">
            <div class="promo-codes-section">
              <div v-if="promoCodes.length === 0" class="empty-state">
                У вас пока нет промокодов.
              </div>
              <div v-else class="promo-codes-list">
                <div v-for="pc in promoCodes" :key="pc.id" class="promo-code-item">
                  <div class="pc-info">
                    <code class="pc-code">{{ pc.code }}</code>
                    <span class="pc-discount">
                      {{ pc.discountType === 'percentage' ? pc.discountValue + '%' : formatCurrency(pc.discountValue) }} скидка
                    </span>
                  </div>
                  <div class="pc-stats">
                    <span>{{ pc.activationCount }} / {{ pc.maxActivations }} активаций</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="card card-actions">
          <div class="card-header">
            <h3 class="card-title">Быстрые действия</h3>
          </div>
          <div class="card-body">
            <button @click="exportReport" class="btn btn-primary action-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Скачать отчёт (CSV)
            </button>
          </div>
        </div>
      </div>

      <div class="card section-space">
        <div class="card-header">
          <h3 class="card-title">График заказов и начислений</h3>
        </div>
        <div class="card-body">
          <div v-if="dailyStats.length === 0" class="empty-state">Нет данных для отображения</div>
          <div v-else class="chart-container">
            <div class="chart-bars">
              <div v-for="day in dailyStats" :key="day.date" class="chart-bar-wrapper">
                <div class="chart-bar" :style="{ height: getBarHeight(day.commission) + 'px' }" :title="formatCurrency(day.commission)"></div>
                <div class="chart-bar orders" :style="{ height: getOrdersBarHeight(day.ordersCount) + 'px' }"></div>
                <div class="chart-label">{{ formatChartDate(day.date) }}</div>
              </div>
            </div>
            <div class="chart-legend">
              <div class="legend-item">
                <div class="legend-color legend-color--commission"></div>
                <span>Комиссия</span>
              </div>
              <div class="legend-item">
                <div class="legend-color legend-color--orders"></div>
                <span>Заказы</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="card section-space">
        <div class="card-header card-header--stack-mobile">
          <h3 class="card-title">Мои пользователи</h3>
          <div class="date-filter">
            <input type="date" v-model="filterStartDate" @change="handleUsersFilterChange" class="input input-sm" placeholder="От">
            <input type="date" v-model="filterEndDate" @change="handleUsersFilterChange" class="input input-sm" placeholder="До">
          </div>
        </div>
        <div class="card-body">
          <div v-if="usersLoading" class="loading-state">
            <div class="spinner"></div>
          </div>
          <div v-else-if="partnerUsers.length === 0" class="empty-state">
            У вас пока нет привлечённых пользователей
          </div>
          <template v-else>
            <div class="table-wrapper desktop-only">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Имя</th>
                    <th>Дата регистрации</th>
                    <th>Дата привязки</th>
                    <th>Заказов</th>
                    <th>Сумма заказов</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="u in partnerUsers" :key="u.id">
                    <td>{{ u.email }}</td>
                    <td>{{ u.name || '—' }}</td>
                    <td>{{ formatDate(u.registeredAt) }}</td>
                    <td>{{ formatDate(u.boundAt) }}</td>
                    <td>{{ u.ordersCount }}</td>
                    <td class="cell-amount">{{ formatCurrency(u.totalSpent) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="mobile-list mobile-only">
              <article v-for="u in partnerUsers" :key="`mobile-user-${u.id}`" class="mobile-record card">
                <div class="mobile-record__row">
                  <span class="mobile-record__label">Email</span>
                  <span class="mobile-record__value">{{ u.email }}</span>
                </div>
                <div class="mobile-record__row">
                  <span class="mobile-record__label">Имя</span>
                  <span class="mobile-record__value">{{ u.name || '—' }}</span>
                </div>
                <div class="mobile-record__row">
                  <span class="mobile-record__label">Дата регистрации</span>
                  <span class="mobile-record__value">{{ formatDate(u.registeredAt) }}</span>
                </div>
                <div class="mobile-record__row">
                  <span class="mobile-record__label">Дата привязки</span>
                  <span class="mobile-record__value">{{ formatDate(u.boundAt) }}</span>
                </div>
                <div class="mobile-record__row">
                  <span class="mobile-record__label">Заказов</span>
                  <span class="mobile-record__value">{{ u.ordersCount }}</span>
                </div>
                <div class="mobile-record__row">
                  <span class="mobile-record__label">Сумма заказов</span>
                  <span class="mobile-record__value mobile-record__value--accent">{{ formatCurrency(u.totalSpent) }}</span>
                </div>
              </article>
            </div>
          </template>
        </div>
      </div>

      <div class="card section-space">
        <div class="card-header">
          <h3 class="card-title">История комиссий</h3>
        </div>
        <div class="card-body">
          <div v-if="commissions.length === 0" class="empty-state">Нет записей о комиссиях</div>
          <template v-else>
            <div class="table-wrapper desktop-only">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Дата</th>
                    <th>Заказ #</th>
                    <th>Сумма заказа</th>
                    <th>Ваш %</th>
                    <th>Комиссия</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="c in commissions" :key="c.id">
                    <td>{{ formatDate(c.createdAt) }}</td>
                    <td>#{{ c.order.id }}</td>
                    <td>{{ formatCurrency(c.order.total) }}</td>
                    <td>{{ c.percentage }}%</td>
                    <td class="cell-commission">{{ formatCurrency(c.amount) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="mobile-list mobile-only">
              <article v-for="c in commissions" :key="`mobile-commission-${c.id}`" class="mobile-record card">
                <div class="mobile-record__row">
                  <span class="mobile-record__label">Дата</span>
                  <span class="mobile-record__value">{{ formatDate(c.createdAt) }}</span>
                </div>
                <div class="mobile-record__row">
                  <span class="mobile-record__label">Заказ</span>
                  <span class="mobile-record__value">#{{ c.order.id }}</span>
                </div>
                <div class="mobile-record__row">
                  <span class="mobile-record__label">Сумма заказа</span>
                  <span class="mobile-record__value">{{ formatCurrency(c.order.total) }}</span>
                </div>
                <div class="mobile-record__row">
                  <span class="mobile-record__label">Процент</span>
                  <span class="mobile-record__value">{{ c.percentage }}%</span>
                </div>
                <div class="mobile-record__row">
                  <span class="mobile-record__label">Комиссия</span>
                  <span class="mobile-record__value mobile-record__value--accent">{{ formatCurrency(c.amount) }}</span>
                </div>
              </article>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { useAuthStore } from '../store/auth'

const authStore = useAuthStore()
const API_URL = '/api/partner'

const loading = ref(true)
const accessDenied = ref(false)
const stats = ref({})
const promoCodes = ref([])
const partnerUsers = ref([])
const commissions = ref([])
const dailyStats = ref([])
const usersLoading = ref(false)
const filterStartDate = ref('')
const filterEndDate = ref('')

function isPartnerAccessError(error) {
  const status = error?.response?.status
  return status === 403 || status === 404
}

async function fetchStats() {
  const { data } = await axios.get(`${API_URL}/cabinet/stats`)
  stats.value = data.stats || {}
}

async function fetchPromoCodes() {
  const { data } = await axios.get(`${API_URL}/cabinet/promo-code`)
  promoCodes.value = data.promoCodes || []
}

async function fetchUsers() {
  usersLoading.value = true
  try {
    const params = {}
    if (filterStartDate.value) params.startDate = filterStartDate.value
    if (filterEndDate.value) params.endDate = filterEndDate.value

    const { data } = await axios.get(`${API_URL}/cabinet/users`, { params })
    partnerUsers.value = data.users || []
  } finally {
    usersLoading.value = false
  }
}

async function handleUsersFilterChange() {
  try {
    await fetchUsers()
  } catch (error) {
    if (isPartnerAccessError(error)) {
      accessDenied.value = true
    }
  }
}

async function fetchCommissions() {
  const { data } = await axios.get(`${API_URL}/cabinet/commissions`)
  commissions.value = data.commissions || []
}

async function fetchDailyStats() {
  const { data } = await axios.get(`${API_URL}/cabinet/daily-stats`, { params: { days: 30 } })
  dailyStats.value = data.dailyStats || []
}

function exportReport() {
  const params = {}
  if (filterStartDate.value) params.startDate = filterStartDate.value
  if (filterEndDate.value) params.endDate = filterEndDate.value

  const queryString = new URLSearchParams(params).toString()
  const url = `${window.location.origin}/api/partner/cabinet/export${queryString ? '?' + queryString : ''}`

  window.open(url, '_blank', 'noopener,noreferrer')
}

function getBarHeight(amount) {
  if (!dailyStats.value.length) return 0
  const max = Math.max(...dailyStats.value.map(d => d.commission), 1)
  return Math.max((amount / max) * 100, 2)
}

function getOrdersBarHeight(count) {
  if (!dailyStats.value.length) return 0
  const max = Math.max(...dailyStats.value.map(d => d.ordersCount), 1)
  return Math.max((count / max) * 100, 2)
}

function formatCurrency(value) {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(Number(value || 0))
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('ru-RU')
}

function formatChartDate(dateStr) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

onMounted(async () => {
  try {
    await Promise.all([
      fetchStats(),
      fetchPromoCodes(),
      fetchUsers(),
      fetchCommissions(),
      fetchDailyStats()
    ])
    accessDenied.value = false
  } catch (error) {
    if (isPartnerAccessError(error)) {
      accessDenied.value = true
      return
    }
    console.error('Failed to load partner cabinet:', error)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.partner-cabinet {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 0.25rem 3rem;
}

.page-header {
  margin-bottom: 1.5rem;
}

.page-title {
  margin: 0;
  font-size: clamp(1.4rem, 3.5vw, 2rem);
}

.page-subtitle {
  margin-top: 0.5rem;
  color: var(--text-secondary);
}

.access-denied {
  padding: 1.5rem;
  text-align: center;
}

.access-denied h3 {
  margin: 0 0 0.5rem;
}

.access-denied p {
  margin: 0;
  color: var(--text-secondary);
}

.section-space {
  margin-top: 1.5rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.9rem;
}

.stat-card {
  padding: 1rem;
  text-align: center;
  min-height: 130px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.stat-card.highlight {
  background: var(--accent-dim);
  border: 1px solid var(--accent);
}

.stat-card--success .stat-card__value {
  color: #22c55e;
}

.stat-card--warning .stat-card__value {
  color: #f59e0b;
}

.stat-card__icon {
  display: flex;
  justify-content: center;
  margin-bottom: 0.6rem;
  color: var(--accent);
}

.stat-card__value {
  font-size: clamp(1rem, 2.6vw, 1.5rem);
  font-weight: 700;
  margin-bottom: 0.35rem;
  line-height: 1.2;
}

.stat-card__label {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1rem;
}

.card-header {
  padding: 0.9rem 1rem;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
}

.card-header--stack-mobile {
  flex-wrap: wrap;
}

.card-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
}

.card-body {
  padding: 1rem;
}

.promo-codes-section {
  margin-top: 0.2rem;
}

.section-title {
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
}

.promo-codes-list {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.promo-code-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: var(--bg-secondary);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
}

.pc-info {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  min-width: 0;
}

.pc-code {
  font-weight: 600;
  background: var(--bg-card);
  padding: 0.2rem 0.45rem;
  border-radius: var(--radius-sm);
}

.pc-discount {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.pc-stats {
  font-size: 0.72rem;
  color: var(--text-muted);
  white-space: nowrap;
}

.card-actions .card-body {
  display: flex;
  align-items: flex-start;
}

.action-btn {
  width: 100%;
  justify-content: center;
}

.chart-container {
  padding-top: 0.5rem;
}

.chart-bars {
  display: flex;
  align-items: flex-end;
  gap: 5px;
  height: 140px;
  padding-bottom: 1.5rem;
  overflow-x: auto;
}

.chart-bar-wrapper {
  min-width: 24px;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  position: relative;
}

.chart-bar {
  width: 100%;
  max-width: 20px;
  background: var(--accent);
  border-radius: 4px 4px 0 0;
  position: absolute;
  bottom: 20px;
  transition: height 0.3s ease;
}

.chart-bar.orders {
  background: #22c55e;
  opacity: 0.74;
}

.chart-label {
  position: absolute;
  bottom: 0;
  font-size: 0.62rem;
  color: var(--text-muted);
  transform: rotate(-45deg);
  white-space: nowrap;
}

.chart-legend {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 0.75rem;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.75rem;
}

.legend-color {
  width: 11px;
  height: 11px;
  border-radius: 3px;
}

.legend-color--commission {
  background: var(--accent);
}

.legend-color--orders {
  background: #22c55e;
}

.date-filter {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.45rem;
}

.table-wrapper {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 620px;
}

.data-table th,
.data-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid var(--border);
}

.data-table th {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-secondary);
  background: var(--bg-secondary);
}

.data-table tr:last-child td {
  border-bottom: none;
}

.cell-amount,
.cell-commission {
  font-weight: 600;
}

.cell-commission {
  color: var(--accent);
}

.empty-state {
  text-align: center;
  padding: 1.2rem;
  color: var(--text-secondary);
}

.loading-state {
  display: flex;
  justify-content: center;
  padding: 2rem;
}

.spinner {
  width: 26px;
  height: 26px;
  border: 2px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.mobile-only {
  display: none;
}

.mobile-list {
  display: grid;
  gap: 0.65rem;
}

.mobile-record {
  padding: 0.85rem;
}

.mobile-record__row {
  display: grid;
  grid-template-columns: minmax(120px, 44%) 1fr;
  gap: 0.6rem;
  align-items: start;
  padding: 0.3rem 0;
}

.mobile-record__label {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-muted);
}

.mobile-record__value {
  font-size: 0.86rem;
  color: var(--text-primary);
  word-break: break-word;
}

.mobile-record__value--accent {
  color: var(--accent);
  font-weight: 600;
}

.btn-sm {
  padding: 0.4rem 0.75rem;
  font-size: 0.75rem;
}

.input-sm {
  padding: 0.45rem 0.6rem;
  font-size: 0.82rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .partner-cabinet {
    padding: 0 0 2.2rem;
  }

  .page-header {
    margin-bottom: 1rem;
  }

  .stats-grid {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }

  .stat-card {
    min-height: 105px;
  }

  .card-header {
    padding: 0.8rem;
  }

  .card-body {
    padding: 0.85rem;
  }

  .promo-code-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .pc-stats {
    white-space: normal;
  }

  .date-filter {
    width: 100%;
    grid-template-columns: 1fr;
  }

  .desktop-only {
    display: none;
  }

  .mobile-only {
    display: block;
  }
}
</style>
