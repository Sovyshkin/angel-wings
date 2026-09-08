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
          <h1 class="page-title" style="font-size: 1.75rem; margin-bottom: 0.25rem;">{{ partner?.user?.name || (notFound ? 'Партнёр не найден' : 'Партнёр') }}</h1>
          <p class="page-subtitle">{{ partner?.user?.email || (notFound ? 'Возможно, он уже удалён' : '') }}</p>
        </div>
      </div>
      <div v-if="partner" class="header-actions">
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
        <div class="stat-card card stat-card--balance">
          <div class="stat-card__value">{{ formatCurrency(partner.balance?.availableBalance || 0) }}</div>
          <div class="stat-card__label">Доступный баланс</div>
        </div>
        <div class="stat-card card">
          <div class="stat-card__value">{{ partner.percentage }}%</div>
          <div class="stat-card__label">Процент комиссии</div>
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

        <div class="card info-card credit-card">
          <div class="credit-card__heading">
            <div>
              <h3 class="card-title">Начислить баллы</h3>
              <p>Сумма сразу попадёт на баланс партнёра.</p>
            </div>
          </div>

          <form class="credit-form" @submit.prevent="grantPartnerCredit">
            <div class="form-group">
              <label class="form-label">Сумма начисления</label>
              <input
                v-model="creditForm.amount"
                type="number"
                min="1"
                step="0.01"
                class="input"
                placeholder="Например, 1500"
              >
            </div>

            <div class="form-group">
              <label class="form-label">Комментарий</label>
              <textarea
                v-model="creditForm.comment"
                class="input"
                rows="4"
                maxlength="700"
                placeholder="Например: бонус за активность в июле"
              ></textarea>
            </div>

            <p v-if="creditError" class="credit-message credit-message--error">{{ creditError }}</p>
            <p v-if="creditSuccess" class="credit-message credit-message--success">{{ creditSuccess }}</p>

            <button class="btn btn-primary credit-submit" :disabled="creditLoading">
              {{ creditLoading ? 'Начисляем...' : 'Начислить баллы' }}
            </button>
          </form>
        </div>

        <div class="card info-card debit-card">
          <div class="credit-card__heading">
            <div>
              <h3 class="card-title">Списать баллы</h3>
              <p>Можно списать часть баланса или обнулить его полностью.</p>
            </div>
          </div>

          <form class="credit-form" @submit.prevent="debitPartnerBalance('amount')">
            <div class="form-group">
              <label class="form-label">Сумма списания</label>
              <input
                v-model="debitForm.amount"
                type="number"
                min="1"
                step="0.01"
                class="input"
                placeholder="Например, 500"
              >
            </div>

            <div class="form-group">
              <label class="form-label">Комментарий (необязательно)</label>
              <textarea
                v-model="debitForm.comment"
                class="input"
                rows="3"
                maxlength="700"
                placeholder="Причина списания для внутренней истории"
              ></textarea>
            </div>

            <p v-if="debitError" class="credit-message credit-message--error">{{ debitError }}</p>
            <p v-if="debitSuccess" class="credit-message credit-message--success">{{ debitSuccess }}</p>

            <div class="debit-actions">
              <button class="btn btn-secondary credit-submit" :disabled="debitLoading">
                {{ debitLoading ? 'Списываем...' : 'Списать' }}
              </button>
              <button
                type="button"
                class="btn btn-danger credit-submit"
                :disabled="debitLoading || !hasAvailableBalance"
                @click="debitPartnerBalance('reset')"
              >
                Обнулить баланс
              </button>
            </div>
          </form>
        </div>
      </div>

      <div class="section balance-history-section">
        <div class="section-heading-row">
          <div>
            <span class="section-kicker">Финансовый журнал</span>
            <h2 class="section-title section-title--flush">История баланса</h2>
            <p class="section-description">Все начисления, списания, комиссии и заявки на вывод в одной ленте.</p>
          </div>
          <div class="history-balance-card">
            <span>Доступно сейчас</span>
            <strong>{{ formatCurrency(historyBalance?.availableBalance ?? partner.balance?.availableBalance ?? 0) }}</strong>
          </div>
        </div>

        <div class="history-panel card">
          <div class="history-toolbar">
            <div class="history-filters" role="tablist" aria-label="Фильтр истории баланса">
              <button
                v-for="filter in historyFilters"
                :key="filter.value"
                type="button"
                :class="['history-filter', { 'history-filter--active': historyDirection === filter.value }]"
                :aria-selected="historyDirection === filter.value"
                role="tab"
                @click="setHistoryDirection(filter.value)"
              >
                {{ filter.label }}
              </button>
            </div>
            <span v-if="!historyLoading" class="history-count">{{ historyTotal }} {{ transactionWord(historyTotal) }}</span>
          </div>

          <div v-if="historyLoading && !balanceHistory.length" class="history-state">
            <div class="spinner"></div>
            <span>Загружаем операции...</span>
          </div>
          <div v-else-if="historyError && !balanceHistory.length" class="history-state history-state--error">
            <span>{{ historyError }}</span>
            <button type="button" class="btn btn-secondary btn-sm" @click="fetchBalanceHistory(true)">Повторить</button>
          </div>
          <template v-else-if="balanceHistory.length">
            <div class="history-table-wrap">
              <table class="data-table history-table">
                <thead>
                  <tr>
                    <th>Дата</th>
                    <th>Операция</th>
                    <th>Статус</th>
                    <th>Изменение</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="transaction in balanceHistory" :key="transaction.id">
                    <td class="history-date">{{ formatDateTime(transaction.createdAt) }}</td>
                    <td>
                      <div class="history-operation">
                        <span :class="['history-marker', `history-marker--${transaction.direction.toLowerCase()}`]">
                          {{ transaction.direction === 'INCOME' ? '+' : transaction.direction === 'OUTCOME' ? '−' : '·' }}
                        </span>
                        <div>
                          <strong>{{ transaction.title }}</strong>
                          <p v-if="transaction.description">{{ transaction.description }}</p>
                          <small v-if="transaction.actor">Администратор: {{ transaction.actor.name || transaction.actor.email }}</small>
                        </div>
                      </div>
                    </td>
                    <td><span :class="['history-status', historyStatusClass(transaction.status)]">{{ historyStatusLabel(transaction.status) }}</span></td>
                    <td :class="['history-amount', `history-amount--${transaction.direction.toLowerCase()}`]">
                      {{ formatTransactionAmount(transaction) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="history-mobile-list">
              <article v-for="transaction in balanceHistory" :key="`history-mobile-${transaction.id}`" class="history-mobile-card">
                <div class="history-mobile-card__top">
                  <span :class="['history-marker', `history-marker--${transaction.direction.toLowerCase()}`]">
                    {{ transaction.direction === 'INCOME' ? '+' : transaction.direction === 'OUTCOME' ? '−' : '·' }}
                  </span>
                  <div>
                    <strong>{{ transaction.title }}</strong>
                    <time>{{ formatDateTime(transaction.createdAt) }}</time>
                  </div>
                  <span :class="['history-amount', `history-amount--${transaction.direction.toLowerCase()}`]">{{ formatTransactionAmount(transaction) }}</span>
                </div>
                <p v-if="transaction.description">{{ transaction.description }}</p>
                <div class="history-mobile-card__footer">
                  <span :class="['history-status', historyStatusClass(transaction.status)]">{{ historyStatusLabel(transaction.status) }}</span>
                  <small v-if="transaction.actor">{{ transaction.actor.name || transaction.actor.email }}</small>
                </div>
              </article>
            </div>

            <div v-if="historyHasMore || historyLoading || historyError" class="history-footer">
              <span v-if="historyError" class="history-inline-error">{{ historyError }}</span>
              <button
                v-if="historyHasMore"
                type="button"
                class="btn btn-secondary history-more"
                :disabled="historyLoading"
                @click="fetchBalanceHistory(false)"
              >
                {{ historyLoading ? 'Загружаем...' : 'Показать ещё' }}
              </button>
            </div>
          </template>
          <div v-else class="history-state">
            <span>Операций по выбранному фильтру пока нет.</span>
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
        <div v-if="partner.users?.length" class="detail-cards">
          <div v-for="user in partner.users" :key="`user-mobile-${user.id}`" class="detail-mobile-card card">
            <div class="detail-mobile-card__title">{{ user.name || 'Пользователь #' + user.id }}</div>
            <div class="detail-mobile-card__meta">{{ user.email }}</div>
            <div class="detail-mobile-card__row"><span>ID</span><strong>{{ user.id }}</strong></div>
            <div class="detail-mobile-card__row"><span>Дата привязки</span><strong>{{ formatDate(user.boundAt) }}</strong></div>
          </div>
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
        <div v-if="partner.recentOrders?.length" class="detail-cards">
          <div v-for="order in partner.recentOrders" :key="`order-mobile-${order.id}`" class="detail-mobile-card card">
            <div class="detail-mobile-card__title">Заказ #{{ order.id }}</div>
            <div class="detail-mobile-card__meta">{{ order.user?.name || '—' }} · {{ order.user?.email || '—' }}</div>
            <div class="detail-mobile-card__row"><span>Сумма</span><strong>{{ formatCurrency(order.total) }}</strong></div>
            <div class="detail-mobile-card__row"><span>Статус</span><strong>{{ getStatusLabel(order.status) }}</strong></div>
            <div class="detail-mobile-card__row"><span>Дата</span><strong>{{ formatDate(order.createdAt) }}</strong></div>
          </div>
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
              <span class="promo-discount">
                {{ code.discountType === 'percentage' ? code.discountValue + '%' : formatCurrency(code.discountValue) }}
              </span>
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
        <div v-if="partner.commissions?.length" class="detail-cards">
          <div v-for="comm in partner.commissions" :key="`comm-mobile-${comm.id}`" class="detail-mobile-card card">
            <div class="detail-mobile-card__title">Комиссия #{{ comm.id }}</div>
            <div class="detail-mobile-card__row"><span>Заказ</span><strong>#{{ comm.orderId }}</strong></div>
            <div class="detail-mobile-card__row"><span>Сумма</span><strong>{{ formatCurrency(comm.amount) }}</strong></div>
            <div class="detail-mobile-card__row"><span>Дата</span><strong>{{ formatDate(comm.createdAt) }}</strong></div>
          </div>
        </div>
        <div v-else class="empty-state card">
          <p>Нет комиссий</p>
        </div>
      </div>
    </div>

    <div v-else class="empty-detail card">
      <div class="empty-detail__icon" aria-hidden="true">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </div>
      <h2 class="empty-detail__title">{{ notFound ? 'Партнёр не найден' : 'Не удалось загрузить партнёра' }}</h2>
      <p class="empty-detail__text">
        {{ loadError || 'Проверьте ссылку или откройте список партнёров.' }}
      </p>
      <div class="empty-detail__actions">
        <button class="btn btn-primary" @click="router.push('/partners')">К списку партнёров</button>
        <button class="btn btn-secondary" @click="router.push('/dashboard')">На дашборд</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'

const route = useRoute()
const router = useRouter()

const API_URL = '/api/admin/partners'
const partner = ref(null)
const loading = ref(true)
const percentage = ref(5)
const notFound = ref(false)
const loadError = ref('')
const creditLoading = ref(false)
const creditError = ref('')
const creditSuccess = ref('')
const creditForm = ref({
  amount: '',
  comment: ''
})
const debitLoading = ref(false)
const debitError = ref('')
const debitSuccess = ref('')
const debitForm = ref({
  amount: '',
  comment: ''
})
const HISTORY_PAGE_SIZE = 25
const historyFilters = [
  { value: 'ALL', label: 'Все операции' },
  { value: 'INCOME', label: 'Начисления' },
  { value: 'OUTCOME', label: 'Списания' }
]
const balanceHistory = ref([])
const historyBalance = ref(null)
const historyDirection = ref('ALL')
const historyTotal = ref(0)
const historyHasMore = ref(false)
const historyLoading = ref(false)
const historyError = ref('')
let historyRequestId = 0

const hasAvailableBalance = computed(() => Number(partner.value?.balance?.availableBalance || 0) > 0)

async function fetchPartner() {
  loading.value = true
  notFound.value = false
  loadError.value = ''
  partner.value = null
  try {
    const { data } = await axios.get(`${API_URL}/${route.params.id}`)
    partner.value = data.partner
    percentage.value = data.partner.percentage
  } catch (e) {
    const status = e?.response?.status
    if (status === 404) {
      notFound.value = true
      loadError.value = 'Партнёр был удалён или ссылка больше не актуальна.'
    } else {
      loadError.value = e?.response?.data?.error || 'Ошибка загрузки данных партнёра.'
      console.error(e)
    }
  } finally {
    loading.value = false
  }
}

async function fetchBalanceHistory(reset = false) {
  if (historyLoading.value && !reset) return

  const requestId = ++historyRequestId

  if (reset) {
    balanceHistory.value = []
    historyTotal.value = 0
    historyHasMore.value = false
  }

  historyLoading.value = true
  historyError.value = ''
  try {
    const offset = reset ? 0 : balanceHistory.value.length
    const { data } = await axios.get(`${API_URL}/${route.params.id}/transactions`, {
      params: {
        direction: historyDirection.value,
        limit: HISTORY_PAGE_SIZE,
        offset
      }
    })
    if (requestId !== historyRequestId) return
    balanceHistory.value = reset
      ? data.transactions || []
      : [...balanceHistory.value, ...(data.transactions || [])]
    historyTotal.value = Number(data.total || 0)
    historyHasMore.value = Boolean(data.hasMore)
    historyBalance.value = data.balance || null
  } catch (e) {
    if (requestId !== historyRequestId) return
    historyError.value = e?.response?.data?.error || 'Не удалось загрузить историю баланса'
  } finally {
    if (requestId === historyRequestId) historyLoading.value = false
  }
}

function setHistoryDirection(direction) {
  if (historyDirection.value === direction) return
  historyDirection.value = direction
  fetchBalanceHistory(true)
}

async function updatePercentage() {
  if (!partner.value) return
  try {
    await axios.put(`${API_URL}/${route.params.id}`, { percentage: percentage.value })
    partner.value.percentage = percentage.value
  } catch (e) {
    console.error(e)
  }
}

async function toggleActive() {
  if (!partner.value) return
  try {
    const newStatus = !partner.value.isActive
    await axios.put(`${API_URL}/${route.params.id}`, { isActive: newStatus })
    partner.value.isActive = newStatus
  } catch (e) {
    console.error(e)
  }
}

async function grantPartnerCredit() {
  if (!partner.value || creditLoading.value) return

  creditError.value = ''
  creditSuccess.value = ''

  const amount = Number(creditForm.value.amount)
  const comment = String(creditForm.value.comment || '').trim()

  if (!Number.isFinite(amount) || amount <= 0) {
    creditError.value = 'Укажите сумму начисления больше 0'
    return
  }

  if (!comment) {
    creditError.value = 'Добавьте комментарий к начислению'
    return
  }

  creditLoading.value = true
  try {
    const { data } = await axios.post(`${API_URL}/${route.params.id}/credits`, {
      amount,
      comment
    })

    if (data.balance) {
      partner.value.balance = data.balance
    }

    creditForm.value.amount = ''
    creditForm.value.comment = ''
    creditSuccess.value = data.emailSent
      ? 'Баллы начислены, письмо партнёру отправлено.'
      : 'Баллы начислены. Письмо не отправилось, почтовый сервис временно недоступен.'
    await Promise.all([fetchPartner(), fetchBalanceHistory(true)])
  } catch (e) {
    creditError.value = e?.response?.data?.error || 'Не удалось начислить баллы'
  } finally {
    creditLoading.value = false
  }
}

async function debitPartnerBalance(mode = 'amount') {
  if (!partner.value || debitLoading.value) return

  debitError.value = ''
  debitSuccess.value = ''

  const amount = Number(debitForm.value.amount)
  const comment = String(debitForm.value.comment || '').trim()

  if (mode !== 'reset' && (!Number.isFinite(amount) || amount <= 0)) {
    debitError.value = 'Укажите сумму списания больше 0'
    return
  }

  if (!hasAvailableBalance.value) {
    debitError.value = 'У партнёра нет доступного баланса для списания'
    return
  }

  debitLoading.value = true
  try {
    const payload = mode === 'reset'
      ? { mode: 'reset', comment }
      : { mode: 'amount', amount, comment }

    const { data } = await axios.post(`${API_URL}/${route.params.id}/debits`, payload)

    if (data.balance) {
      partner.value.balance = data.balance
    }

    debitForm.value.amount = ''
    debitForm.value.comment = ''
    debitSuccess.value = mode === 'reset' ? 'Баланс партнёра обнулён.' : 'Баллы списаны.'
    await Promise.all([fetchPartner(), fetchBalanceHistory(true)])
  } catch (e) {
    debitError.value = e?.response?.data?.error || 'Не удалось списать баллы'
  } finally {
    debitLoading.value = false
  }
}

function goBack() {
  if (window.history.length > 1) {
    router.back()
    return
  }
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

function formatDateTime(date) {
  return new Date(date).toLocaleString('ru-RU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatTransactionAmount(transaction) {
  const amount = formatCurrency(transaction.amount || 0)
  if (transaction.direction === 'INCOME') return `+${amount}`
  if (transaction.direction === 'OUTCOME') return `−${amount}`
  return amount
}

function historyStatusLabel(status) {
  const labels = {
    COMPLETED: 'Завершено',
    PAID: 'Выполнено',
    ADMIN_CREDITED: 'Начислено',
    ADMIN_DEBITED: 'Списано',
    SPENT_ON_ORDER: 'Оплачено',
    PAYOUT_REQUESTED: 'Ожидает вывода',
    PAYOUT_APPROVED: 'Выведено',
    PAYOUT_REJECTED: 'Отклонено',
    PENDING: 'В обработке'
  }
  return labels[status] || status
}

function historyStatusClass(status) {
  if (['COMPLETED', 'PAID', 'ADMIN_CREDITED', 'ADMIN_DEBITED', 'SPENT_ON_ORDER', 'PAYOUT_APPROVED'].includes(status)) {
    return 'history-status--complete'
  }
  if (status === 'PAYOUT_REJECTED') return 'history-status--rejected'
  return 'history-status--pending'
}

function transactionWord(count) {
  const value = Math.abs(Number(count)) % 100
  const digit = value % 10
  if (value > 10 && value < 20) return 'операций'
  if (digit === 1) return 'операция'
  if (digit >= 2 && digit <= 4) return 'операции'
  return 'операций'
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

onMounted(() => {
  fetchPartner()
  fetchBalanceHistory(true)
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

.stat-card--balance .stat-card__value {
  color: #22c55e;
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

.credit-card {
  background:
    radial-gradient(circle at 100% 0%, rgba(159, 179, 255, 0.16), transparent 34%),
    var(--bg-card);
}

.debit-card {
  background:
    radial-gradient(circle at 100% 0%, rgba(248, 113, 113, 0.13), transparent 34%),
    var(--bg-card);
}

.credit-card__heading p {
  margin: -0.35rem 0 1rem;
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.credit-form {
  display: grid;
  gap: 1rem;
}

.credit-form textarea {
  resize: vertical;
}

.credit-message {
  margin: 0;
  padding: 0.8rem 0.95rem;
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  font-weight: 700;
  line-height: 1.45;
}

.credit-message--error {
  color: #fca5a5;
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.credit-message--success {
  color: #86efac;
  background: rgba(34, 197, 94, 0.12);
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.credit-submit {
  width: 100%;
  justify-content: center;
}

.debit-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.btn-danger {
  color: #fecaca;
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.28);
}

.btn-danger:hover:not(:disabled) {
  color: #fff;
  background: rgba(239, 68, 68, 0.22);
  border-color: rgba(239, 68, 68, 0.45);
}

.balance-history-section {
  position: relative;
}

.section-heading-row {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1.5rem;
  margin-bottom: 1rem;
}

.section-kicker {
  display: block;
  margin-bottom: 0.35rem;
  color: #8fa6f7;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.section-title--flush {
  margin-bottom: 0.35rem !important;
}

.section-description {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.history-balance-card {
  min-width: 220px;
  padding: 0.9rem 1.1rem;
  border: 1px solid rgba(143, 166, 247, 0.3);
  border-radius: 16px;
  background:
    radial-gradient(circle at 100% 0%, rgba(143, 166, 247, 0.24), transparent 48%),
    #171b26;
}

.history-balance-card span {
  display: block;
  margin-bottom: 0.25rem;
  color: #949caf;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.history-balance-card strong {
  color: #b5c5ff;
  font-size: 1.35rem;
  font-variant-numeric: tabular-nums;
}

.history-panel {
  overflow: hidden;
  padding: 0;
}

.history-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.2rem;
  border-bottom: 1px solid var(--border);
}

.history-filters {
  display: inline-flex;
  gap: 0.25rem;
  padding: 0.25rem;
  border-radius: 12px;
  background: var(--bg-secondary);
}

.history-filter {
  border: 0;
  border-radius: 9px;
  padding: 0.55rem 0.8rem;
  color: var(--text-secondary);
  background: transparent;
  font: inherit;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 160ms ease, color 160ms ease, box-shadow 160ms ease;
}

.history-filter:hover {
  color: var(--text-primary);
}

.history-filter--active {
  color: #111522;
  background: #9fb4ff;
  box-shadow: 0 4px 14px rgba(86, 111, 201, 0.24);
}

.history-count {
  color: var(--text-muted);
  font-size: 0.78rem;
}

.history-table-wrap {
  overflow-x: auto;
}

.history-table th:first-child,
.history-table td:first-child {
  width: 160px;
}

.history-table th:last-child,
.history-table td:last-child {
  width: 150px;
  text-align: right;
}

.history-date {
  color: var(--text-secondary);
  font-size: 0.8rem;
  white-space: nowrap;
}

.history-operation {
  display: flex;
  align-items: flex-start;
  gap: 0.8rem;
}

.history-operation strong {
  display: block;
  color: var(--text-primary);
  font-size: 0.9rem;
}

.history-operation p {
  max-width: 520px;
  margin: 0.22rem 0 0;
  color: var(--text-secondary);
  font-size: 0.8rem;
  line-height: 1.45;
}

.history-operation small {
  display: block;
  margin-top: 0.28rem;
  color: var(--text-muted);
  font-size: 0.72rem;
}

.history-marker {
  display: inline-flex;
  flex: 0 0 30px;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 900;
}

.history-marker--income {
  color: #86efac;
  background: rgba(34, 197, 94, 0.13);
}

.history-marker--outcome {
  color: #fda4af;
  background: rgba(244, 63, 94, 0.13);
}

.history-marker--neutral {
  color: #aeb7ca;
  background: rgba(148, 163, 184, 0.13);
}

.history-amount {
  font-size: 0.92rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.history-amount--income { color: #4ade80; }
.history-amount--outcome { color: #fb7185; }
.history-amount--neutral { color: var(--text-muted); }

.history-status {
  display: inline-flex;
  align-items: center;
  border: 1px solid transparent;
  border-radius: 999px;
  padding: 0.35rem 0.55rem;
  font-size: 0.68rem;
  font-weight: 750;
  white-space: nowrap;
}

.history-status--complete {
  color: #86efac;
  border-color: rgba(34, 197, 94, 0.24);
  background: rgba(34, 197, 94, 0.09);
}

.history-status--pending {
  color: #fde68a;
  border-color: rgba(234, 179, 8, 0.24);
  background: rgba(234, 179, 8, 0.09);
}

.history-status--rejected {
  color: #fda4af;
  border-color: rgba(244, 63, 94, 0.24);
  background: rgba(244, 63, 94, 0.09);
}

.history-state {
  min-height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 0.85rem;
  padding: 2rem;
  color: var(--text-muted);
  text-align: center;
}

.history-state--error,
.history-inline-error {
  color: #fca5a5;
}

.history-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem 1.25rem 1.25rem;
  border-top: 1px solid var(--border);
}

.history-more {
  min-width: 180px;
  justify-content: center;
}

.history-mobile-list {
  display: none;
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

.detail-cards {
  display: none;
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

.empty-detail {
  margin-top: 1rem;
  padding: 2.25rem;
  text-align: center;
}

.empty-detail__icon {
  width: 56px;
  height: 56px;
  margin: 0 auto 1rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  color: var(--text-muted);
}

.empty-detail__title {
  margin: 0 0 0.5rem;
  font-size: 1.25rem;
}

.empty-detail__text {
  margin: 0 auto 1.25rem;
  max-width: 540px;
  color: var(--text-secondary);
}

.empty-detail__actions {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  flex-wrap: wrap;
}

.detail-mobile-card {
  padding: 1rem;
}

.detail-mobile-card__title {
  font-weight: 700;
  margin-bottom: 0.2rem;
}

.detail-mobile-card__meta {
  color: var(--text-muted);
  font-size: 0.82rem;
  margin-bottom: 0.6rem;
}

.detail-mobile-card__row {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.35rem;
  font-size: 0.9rem;
}

.detail-mobile-card__row:last-child {
  margin-bottom: 0;
}

.detail-mobile-card__row span {
  color: var(--text-muted);
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

  .table-wrapper {
    display: none;
  }

  .detail-cards {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .info-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.2rem;
  }

  .percentage-edit {
    flex-wrap: wrap;
  }

  .debit-actions {
    grid-template-columns: 1fr;
  }

  .section-heading-row {
    align-items: stretch;
    flex-direction: column;
  }

  .history-balance-card {
    min-width: 0;
  }

  .history-toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .history-filters {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
  }

  .history-filter {
    padding-inline: 0.4rem;
  }

  .history-count {
    text-align: right;
  }

  .history-table-wrap {
    display: none;
  }

  .history-mobile-list {
    display: grid;
  }

  .history-mobile-card {
    padding: 1rem;
    border-bottom: 1px solid var(--border);
  }

  .history-mobile-card__top {
    display: grid;
    grid-template-columns: 30px minmax(0, 1fr) auto;
    align-items: start;
    gap: 0.75rem;
  }

  .history-mobile-card__top strong {
    display: block;
    font-size: 0.86rem;
    line-height: 1.35;
  }

  .history-mobile-card__top time {
    display: block;
    margin-top: 0.18rem;
    color: var(--text-muted);
    font-size: 0.7rem;
  }

  .history-mobile-card > p {
    margin: 0.7rem 0 0 2.8rem;
    color: var(--text-secondary);
    font-size: 0.78rem;
    line-height: 1.45;
  }

  .history-mobile-card__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    margin: 0.75rem 0 0 2.8rem;
  }

  .history-mobile-card__footer small {
    color: var(--text-muted);
    text-align: right;
  }
}
</style>
