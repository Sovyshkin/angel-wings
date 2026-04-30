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
          <div class="stat-card__label">Сумма всех заказов</div>
        </div>

        <div class="stat-card card highlight">
          <div class="stat-card__icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/>
            </svg>
          </div>
          <div class="stat-card__value">{{ formatCurrency(stats.totalEarned || 0) }}</div>
          <div class="stat-card__label">Начислено вознаграждений</div>
        </div>
      </div>

      <div class="stats-row" style="margin-top: 1.5rem;">
        <div class="stat-card card">
          <div class="stat-card__value text-success">{{ formatCurrency(stats.totalPaidOut || 0) }}</div>
          <div class="stat-card__label">Выплачено</div>
        </div>
        <div class="stat-card card">
          <div class="stat-card__value text-warning">{{ formatCurrency(stats.pendingAmount || 0) }}</div>
          <div class="stat-card__label">Ожидает выплаты</div>
        </div>
      </div>

      <div class="dashboard-grid" style="margin-top: 2rem;">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Мой промокод</h3>
          </div>
          <div class="card-body">
            <div class="promo-code-display">
              <div class="referral-section">
                <div class="referral-code-box">
                  <span class="code-label">Ваш реферальный код:</span>
                  <div class="code-value">{{ referralCode }}</div>
                  <button @click="copyCode" class="btn btn-sm btn-secondary">Копировать</button>
                </div>

                <div class="referral-link-box">
                  <span class="code-label">Реферальная ссылка:</span>
                  <div class="link-value">{{ referralLink }}</div>
                  <button @click="copyLink" class="btn btn-sm btn-secondary">Копировать</button>
                </div>
              </div>

              <div class="promo-codes-section" style="margin-top: 1.5rem;">
                <h4 class="section-title">Мои промокоды</h4>
                <div v-if="promoCodes.length === 0" class="empty-state">
                  У вас пока нет промокодов. Создайте свой первый промокод.
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
        </div>

        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Быстрые действия</h3>
          </div>
          <div class="card-body">
            <button @click="exportReport" class="btn btn-primary" style="width: 100%; margin-bottom: 1rem;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Скачать отчёт (CSV)
            </button>
          </div>
        </div>
      </div>

      <div class="card" style="margin-top: 2rem;">
        <div class="card-header">
          <h3 class="card-title">График заказов и начислений</h3>
        </div>
        <div class="card-body">
          <div v-if="dailyStats.length === 0" class="empty-state">
            Нет данных для отображения
          </div>
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
                <div class="legend-color" style="background: var(--accent);"></div>
                <span>Комиссия</span>
              </div>
              <div class="legend-item">
                <div class="legend-color" style="background: #22c55e;"></div>
                <span>Заказы</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="card" style="margin-top: 2rem;">
        <div class="card-header">
          <h3 class="card-title">Мои пользователи</h3>
          <div class="date-filter">
            <input type="date" v-model="filterStartDate" @change="fetchUsers" class="input input-sm" placeholder="От">
            <input type="date" v-model="filterEndDate" @change="fetchUsers" class="input input-sm" placeholder="До">
          </div>
        </div>
        <div class="card-body">
          <div v-if="usersLoading" class="loading-state">
            <div class="spinner"></div>
          </div>
          <div v-else-if="partnerUsers.length === 0" class="empty-state">
            У вас пока нет привлечённых пользователей
          </div>
          <div v-else class="table-wrapper">
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
                  <td>{{ u.name }}</td>
                  <td>{{ formatDate(u.registeredAt) }}</td>
                  <td>{{ formatDate(u.boundAt) }}</td>
                  <td>{{ u.ordersCount }}</td>
                  <td class="cell-amount">{{ formatCurrency(u.totalSpent) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="card" style="margin-top: 2rem;">
        <div class="card-header">
          <h3 class="card-title">История комиссий</h3>
        </div>
        <div class="card-body">
          <div v-if="commissions.length === 0" class="empty-state">
            Нет записей о комиссиях
          </div>
          <div v-else class="table-wrapper">
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
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import { useAuthStore } from '../store/auth'

const authStore = useAuthStore()
const API_URL = '/api/partner'

const loading = ref(true)
const stats = ref({})
const promoCodes = ref([])
const referralCode = ref('')
const partnerUsers = ref([])
const commissions = ref([])
const dailyStats = ref([])
const usersLoading = ref(false)
const filterStartDate = ref('')
const filterEndDate = ref('')

async function fetchStats() {
  try {
    const { data } = await axios.get(`${API_URL}/cabinet/stats`)
    stats.value = data.stats
  } catch (e) {
    console.error(e)
  }
}

async function fetchPromoCodes() {
  try {
    const { data } = await axios.get(`${API_URL}/cabinet/promo-code`)
    promoCodes.value = data.promoCodes || []
    referralCode.value = data.referralCode || ''
  } catch (e) {
    console.error(e)
  }
}

async function fetchUsers() {
  usersLoading.value = true
  try {
    const params = {}
    if (filterStartDate.value) params.startDate = filterStartDate.value
    if (filterEndDate.value) params.endDate = filterEndDate.value
    const { data } = await axios.get(`${API_URL}/cabinet/users`, { params })
    partnerUsers.value = data.users || []
  } catch (e) {
    console.error(e)
  } finally {
    usersLoading.value = false
  }
}

async function fetchCommissions() {
  try {
    const { data } = await axios.get(`${API_URL}/cabinet/commissions`)
    commissions.value = data.commissions || []
  } catch (e) {
    console.error(e)
  }
}

async function fetchDailyStats() {
  try {
    const { data } = await axios.get(`${API_URL}/cabinet/daily-stats`, { params: { days: 30 } })
    dailyStats.value = data.dailyStats || []
  } catch (e) {
    console.error(e)
  }
}

function exportReport() {
  const params = {}
  if (filterStartDate.value) params.startDate = filterStartDate.value
  if (filterEndDate.value) params.endDate = filterEndDate.value

  const queryString = new URLSearchParams(params).toString()
  const url = `${window.location.origin}/api/partner/cabinet/export${queryString ? '?' + queryString : ''}`

  window.open(url, '_blank')
}

function copyCode() {
  navigator.clipboard.writeText(referralCode.value)
}

function copyLink() {
  const link = `${window.location.origin}?ref=${referralCode.value}`
  navigator.clipboard.writeText(link)
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
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(value)
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('ru-RU')
}

function formatChartDate(dateStr) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

onMounted(async () => {
  await Promise.all([
    fetchStats(),
    fetchPromoCodes(),
    fetchUsers(),
    fetchCommissions(),
    fetchDailyStats()
  ])
  loading.value = false
})
</script>

<style scoped>
.partner-cabinet {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 2rem;
}

.page-title {
  font-size: 1.75rem;
  margin-bottom: 0.25rem;
}

.page-subtitle {
  color: var(--text-secondary);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.stats-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  max-width: 500px;
}

.stat-card {
  padding: 1.5rem;
  text-align: center;
}

.stat-card.highlight {
  background: var(--accent-dim);
  border: 1px solid var(--accent);
}

.stat-card__icon {
  display: flex;
  justify-content: center;
  margin-bottom: 0.75rem;
  color: var(--accent);
}

.stat-card__value {
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.stat-card__label {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.text-success {
  color: #22c55e;
}

.text-warning {
  color: #f59e0b;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1.5rem;
}

@media (max-width: 768px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }

  .stats-row {
    max-width: 100%;
  }
}

.card-header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
}

.card-body {
  padding: 1.5rem;
}

.referral-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.referral-code-box,
.referral-link-box {
  padding: 1rem;
  background: var(--bg-secondary);
  border-radius: var(--radius);
}

.code-label {
  display: block;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
}

.code-value {
  font-size: 1.5rem;
  font-weight: 700;
  font-family: var(--font-body);
  letter-spacing: 0.05em;
  margin-bottom: 0.75rem;
}

.link-value {
  font-size: 0.875rem;
  font-family: var(--font-body);
  word-break: break-all;
  margin-bottom: 0.75rem;
  color: var(--text-secondary);
}

.section-title {
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.promo-codes-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.promo-code-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: var(--bg-secondary);
  border-radius: var(--radius-sm);
}

.pc-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.pc-code {
  font-weight: 600;
  background: var(--bg-card);
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius-sm);
}

.pc-discount {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.pc-stats {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.chart-container {
  padding: 1rem 0;
}

.chart-bars {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 120px;
  padding-bottom: 1.5rem;
}

.chart-bar-wrapper {
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
  border-radius: 2px 2px 0 0;
  position: absolute;
  bottom: 20px;
  transition: height 0.3s ease;
}

.chart-bar.orders {
  background: #22c55e;
  opacity: 0.7;
}

.chart-label {
  position: absolute;
  bottom: 0;
  font-size: 0.625rem;
  color: var(--text-muted);
  transform: rotate(-45deg);
  white-space: nowrap;
}

.chart-legend {
  display: flex;
  gap: 1.5rem;
  justify-content: center;
  margin-top: 1rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.date-filter {
  display: flex;
  gap: 0.5rem;
}

.table-wrapper {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 600px;
}

.data-table th,
.data-table td {
  padding: 0.875rem 1rem;
  text-align: left;
  border-bottom: 1px solid var(--border);
}

.data-table th {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-secondary);
  background: var(--bg-secondary);
}

.data-table tr:last-child td {
  border-bottom: none;
}

.cell-amount {
  font-weight: 600;
}

.cell-commission {
  font-weight: 600;
  color: var(--accent);
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: var(--text-secondary);
}

.loading-state {
  display: flex;
  justify-content: center;
  padding: 2rem;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.75rem;
}

.input-sm {
  padding: 0.375rem 0.5rem;
  font-size: 0.875rem;
}
</style>