<template>
  <div class="analytics-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Аналитика препаратов</h1>
        <p class="page-subtitle">Продажи, скорость расхода склада, воронка и LTV по каждому пептиду</p>
      </div>
      <div class="period-switcher">
        <button
          v-for="option in periodOptions"
          :key="option.value"
          type="button"
          :class="['period-btn', { active: days === option.value }]"
          @click="setPeriod(option.value)"
        >
          {{ option.label }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
    </div>

    <template v-else>
      <div class="summary-grid">
        <article class="summary-card summary-card--accent">
          <span class="summary-label">LTV препаратов</span>
          <strong>{{ formatCurrency(summary.ltv) }}</strong>
          <small>Выручка по препаратам за всё время в выборке</small>
        </article>
        <article class="summary-card">
          <span class="summary-label">Успешных заказов</span>
          <strong>{{ formatNumber(summary.orders) }}</strong>
          <small>Оплаченные и наличные при получении</small>
        </article>
        <article class="summary-card">
          <span class="summary-label">Продано упаковок</span>
          <strong>{{ formatNumber(summary.units) }}</strong>
          <small>Без отменённых заказов</small>
        </article>
        <article class="summary-card" :class="{ warning: summary.reorderSignals > 0 }">
          <span class="summary-label">Сигналы закупки</span>
          <strong>{{ formatNumber(summary.reorderSignals) }}</strong>
          <small>Остатков меньше чем на 14 дней</small>
        </article>
      </div>

      <div class="analytics-note">
        <strong>Важно:</strong>
        продажи и LTV считаются по существующим заказам, а просмотры и добавления в корзину начнут накапливаться после деплоя этого обновления.
      </div>

      <div class="toolbar card">
        <div class="search-box">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input v-model="search" type="text" placeholder="Поиск по препарату или SKU">
        </div>
        <label class="toggle-alerts">
          <input v-model="onlySignals" type="checkbox">
          <span>Только сигналы закупки</span>
        </label>
      </div>

      <div class="analytics-table card">
        <div class="table-head">
          <span>Препарат</span>
          <span>Скорость</span>
          <span>Воронка</span>
          <span>Средний чек</span>
          <span>LTV</span>
          <span>Склад</span>
        </div>

        <article v-for="item in filteredProducts" :key="item.productId" class="product-row">
          <div class="product-cell">
            <div class="product-icon">{{ getInitials(item.title) }}</div>
            <div>
              <h3>{{ item.title }}</h3>
              <p>{{ item.sku || 'Без SKU' }}</p>
              <div class="combo-list" v-if="item.topCombos?.length">
                <span>Чаще покупают с:</span>
                <strong v-for="combo in item.topCombos" :key="combo.title">{{ combo.title }} · {{ combo.count }}</strong>
              </div>
            </div>
          </div>

          <div class="metric-cell">
            <strong>{{ item.velocityPerDay }}</strong>
            <span>уп./день</span>
            <small>{{ item.velocityPerWeek }} уп./нед.</small>
            <em :class="['delta', item.velocityDelta >= 0 ? 'positive' : 'negative']">
              {{ item.velocityDelta >= 0 ? '+' : '' }}{{ item.velocityDelta }}%
            </em>
          </div>

          <div class="funnel-cell">
            <div class="funnel-line"><span>Просмотры</span><strong>{{ item.funnel.views }}</strong></div>
            <div class="funnel-line"><span>В корзину</span><strong>{{ item.funnel.cartAdds }}</strong></div>
            <div class="funnel-line"><span>Успешные</span><strong>{{ item.funnel.successfulOrders }}</strong></div>
            <div class="funnel-line danger"><span>Отмены</span><strong>{{ item.funnel.cancelledOrders }}</strong></div>
          </div>

          <div class="metric-cell">
            <strong>{{ formatCurrency(item.avgCheck) }}</strong>
            <span>{{ item.ordersCount }} заказов</span>
          </div>

          <div class="metric-cell ltv-cell">
            <strong>{{ formatCurrency(item.ltv) }}</strong>
            <span>{{ item.successfulUnits }} уп.</span>
          </div>

          <div class="stock-cell" :class="{ warning: item.reorderSignal }">
            <strong>{{ item.stock }} шт.</strong>
            <span v-if="item.daysLeft !== null">хватит на {{ item.daysLeft }} дн.</span>
            <span v-else>скорость пока 0</span>
            <small v-if="item.reorderSignal">Закупить заранее</small>
          </div>
        </article>

        <div v-if="!filteredProducts.length" class="empty-state">
          Ничего не найдено по текущим фильтрам.
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import axios from 'axios'

const loading = ref(true)
const products = ref([])
const summary = ref({ ltv: 0, orders: 0, units: 0, reorderSignals: 0 })
const days = ref(30)
const search = ref('')
const onlySignals = ref(false)
const periodOptions = [
  { label: '7 дней', value: 7 },
  { label: '30 дней', value: 30 },
  { label: '90 дней', value: 90 }
]

const filteredProducts = computed(() => {
  const term = search.value.trim().toLowerCase()
  return products.value.filter(item => {
    if (onlySignals.value && !item.reorderSignal) return false
    if (!term) return true
    return String(item.title || '').toLowerCase().includes(term) || String(item.sku || '').toLowerCase().includes(term)
  })
})

function formatCurrency(value) {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0
  }).format(Number(value || 0))
}

function formatNumber(value) {
  return new Intl.NumberFormat('ru-RU').format(Number(value || 0))
}

function getInitials(title) {
  return String(title || 'П').trim().slice(0, 2).toUpperCase()
}

async function fetchAnalytics() {
  loading.value = true
  try {
    const { data } = await axios.get('/api/admin/analytics/products', { params: { days: days.value } })
    products.value = data.products || []
    summary.value = data.summary || { ltv: 0, orders: 0, units: 0, reorderSignals: 0 }
  } finally {
    loading.value = false
  }
}

function setPeriod(nextDays) {
  if (days.value === nextDays) return
  days.value = nextDays
  fetchAnalytics()
}

onMounted(fetchAnalytics)
</script>

<style scoped>
.analytics-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
}

.page-title {
  font-size: 1.75rem;
  margin-bottom: 0.25rem;
}

.period-switcher {
  display: inline-flex;
  gap: 0.35rem;
  padding: 0.35rem;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--bg-card);
}

.period-btn {
  border: 0;
  border-radius: 999px;
  padding: 0.65rem 1rem;
  color: var(--text-secondary);
  background: transparent;
  cursor: pointer;
  transition: var(--transition);
}

.period-btn.active {
  background: var(--accent);
  color: #0b0b10;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
}

.summary-card {
  padding: 1.25rem;
  border: 1px solid var(--border);
  border-radius: 24px;
  background:
    radial-gradient(circle at 85% 15%, rgba(159, 181, 255, 0.14), transparent 34%),
    var(--bg-card);
}

.summary-card--accent {
  border-color: rgba(159, 181, 255, 0.4);
}

.summary-card.warning {
  border-color: rgba(239, 68, 68, 0.45);
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.12), var(--bg-card));
}

.summary-label {
  display: block;
  margin-bottom: 0.7rem;
  color: var(--text-muted);
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.summary-card strong {
  display: block;
  font-size: clamp(1.5rem, 3vw, 2.2rem);
  color: var(--text-primary);
}

.summary-card small {
  display: block;
  margin-top: 0.55rem;
  color: var(--text-secondary);
  line-height: 1.45;
}

.analytics-note {
  padding: 1rem 1.25rem;
  border: 1px solid rgba(159, 181, 255, 0.24);
  border-radius: 18px;
  background: rgba(159, 181, 255, 0.08);
  color: var(--text-secondary);
}

.toolbar {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem;
}

.search-box {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.85rem 1rem;
  border: 1px solid var(--border);
  border-radius: 16px;
  color: var(--text-muted);
  background: var(--bg-secondary);
}

.search-box input {
  width: 100%;
  border: 0;
  outline: 0;
  color: var(--text-primary);
  background: transparent;
}

.toggle-alerts {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  color: var(--text-secondary);
  white-space: nowrap;
}

.analytics-table {
  overflow: hidden;
}

.table-head,
.product-row {
  display: grid;
  grid-template-columns: minmax(260px, 1.5fr) 0.8fr 1fr 0.8fr 0.8fr 0.8fr;
  gap: 1rem;
  align-items: center;
}

.table-head {
  padding: 1rem 1.25rem;
  background: var(--bg-secondary);
  color: var(--text-muted);
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.product-row {
  padding: 1.2rem 1.25rem;
  border-top: 1px solid var(--border);
}

.product-cell {
  display: flex;
  align-items: center;
  gap: 1rem;
  min-width: 0;
}

.product-icon {
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  border-radius: 16px;
  background: var(--accent-dim);
  color: var(--accent);
  font-weight: 800;
}

.product-cell h3 {
  margin: 0 0 0.25rem;
  font-size: 1rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.product-cell p,
.metric-cell span,
.stock-cell span,
.combo-list span {
  color: var(--text-muted);
  font-size: 0.82rem;
}

.combo-list {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem;
  margin-top: 0.5rem;
}

.combo-list strong {
  padding: 0.2rem 0.45rem;
  border-radius: 999px;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  font-size: 0.72rem;
}

.metric-cell,
.stock-cell {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.metric-cell strong,
.stock-cell strong {
  color: var(--text-primary);
  font-size: 1rem;
}

.metric-cell small,
.stock-cell small {
  color: var(--text-secondary);
  font-size: 0.78rem;
}

.delta {
  width: fit-content;
  padding: 0.18rem 0.45rem;
  border-radius: 999px;
  font-style: normal;
  font-size: 0.72rem;
}

.delta.positive {
  color: #22c55e;
  background: rgba(34, 197, 94, 0.12);
}

.delta.negative {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.12);
}

.funnel-cell {
  display: grid;
  gap: 0.35rem;
}

.funnel-line {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  color: var(--text-secondary);
  font-size: 0.82rem;
}

.funnel-line strong {
  color: var(--text-primary);
}

.funnel-line.danger strong {
  color: #ef4444;
}

.stock-cell.warning {
  padding: 0.75rem;
  border: 1px solid rgba(239, 68, 68, 0.35);
  border-radius: 16px;
  background: rgba(239, 68, 68, 0.08);
}

.empty-state,
.loading-state {
  padding: 3rem;
  text-align: center;
  color: var(--text-muted);
}

.spinner {
  width: 32px;
  height: 32px;
  margin: 0 auto;
  border: 3px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 1180px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .table-head {
    display: none;
  }

  .product-row {
    grid-template-columns: 1fr 1fr;
    align-items: stretch;
  }

  .product-cell {
    grid-column: 1 / -1;
  }
}

@media (max-width: 720px) {
  .page-header,
  .toolbar {
    flex-direction: column;
  }

  .period-switcher,
  .toggle-alerts {
    width: 100%;
  }

  .period-btn {
    flex: 1;
  }

  .summary-grid,
  .product-row {
    grid-template-columns: 1fr;
  }
}
</style>
