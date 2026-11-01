<template>
  <div class="user-detail-page">
    <button type="button" @click="goBack" class="back-link">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
      </svg>
      Назад
    </button>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
    </div>

    <template v-else-if="user">
      <section class="profile-hero card">
        <div class="profile-hero__avatar">{{ getInitials(user.name || user.email) }}</div>
        <div class="profile-hero__main">
          <span :class="['role-pill', user.role?.toLowerCase()]">{{ getRoleLabel(user.role) }}</span>
          <h1>{{ user.name || 'Пользователь без имени' }}</h1>
          <div class="profile-contacts">
            <a :href="`mailto:${user.email}`">{{ user.email }}</a>
            <a v-if="user.phone" :href="`tel:${user.phone}`">{{ user.phone }}</a>
            <span v-if="user.address">{{ user.address }}</span>
          </div>
        </div>
        <div class="profile-hero__meta">
          <span>Клиент с</span>
          <strong>{{ formatDate(user.createdAt) }}</strong>
        </div>
      </section>

      <section class="stats-grid">
        <article class="stat-card stat-card--accent">
          <span>Потрачено</span>
          <strong>{{ formatCurrency(stats.totalSpent) }}</strong>
          <small>Только оплаченные заказы</small>
        </article>
        <article class="stat-card">
          <span>Заказов</span>
          <strong>{{ stats.totalOrders || 0 }}</strong>
          <small>{{ stats.successfulOrders || 0 }} успешных</small>
        </article>
        <article class="stat-card">
          <span>Средний чек</span>
          <strong>{{ formatCurrency(stats.avgOrderValue) }}</strong>
          <small>По успешным заказам</small>
        </article>
        <article class="stat-card stat-card--points">
          <span>Баллы</span>
          <strong>{{ Number(user.pointsBalance || 0).toLocaleString('ru-RU') }}</strong>
          <small>Доступно к списанию</small>
        </article>
        <article class="stat-card" :class="{ warning: stats.returnedOrders > 0 || stats.cancelledOrders > 0 }">
          <span>Проблемные</span>
          <strong>{{ (stats.returnedOrders || 0) + (stats.cancelledOrders || 0) }}</strong>
          <small>{{ stats.returnedOrders || 0 }} возвратов · {{ stats.cancelledOrders || 0 }} отмен</small>
        </article>
      </section>

      <section v-if="user.role === 'USER'" class="points-panel card">
        <div class="panel-head panel-head--row">
          <div>
            <h2>Баллы пользователя</h2>
            <p>Ручные операции сохраняются в истории. Начисление появится в уведомлениях клиента.</p>
          </div>
          <strong class="points-balance">{{ formatPoints(user.pointsBalance) }} баллов</strong>
        </div>

        <div class="points-actions">
          <form class="points-action points-action--credit" @submit.prevent="submitPoints('credit')">
            <h3>Начислить</h3>
            <label :for="'credit-amount'">Количество баллов</label>
            <input id="credit-amount" v-model="creditForm.amount" type="number" min="1" max="1000000" step="1" required placeholder="Например, 1000">
            <label :for="'credit-message'">Комментарий для пользователя</label>
            <textarea id="credit-message" v-model="creditForm.message" maxlength="500" rows="2" required placeholder="Причина начисления"></textarea>
            <button type="submit" class="points-button points-button--primary" :disabled="pointsBusy">{{ pointsBusy === 'credit' ? 'Начисляем…' : 'Начислить баллы' }}</button>
          </form>

          <form class="points-action points-action--debit" @submit.prevent="submitPoints('debit')">
            <h3>Списать</h3>
            <label for="debit-amount">Количество баллов</label>
            <input id="debit-amount" v-model="debitForm.amount" type="number" min="1" max="1000000" step="1" required placeholder="Например, 500">
            <label for="debit-message">Причина списания</label>
            <textarea id="debit-message" v-model="debitForm.message" maxlength="500" rows="2" required placeholder="Будет сохранена в истории"></textarea>
            <div class="points-action__buttons">
              <button type="submit" class="points-button points-button--danger" :disabled="!!pointsBusy || Number(user.pointsBalance || 0) <= 0">{{ pointsBusy === 'debit' ? 'Списываем…' : 'Списать баллы' }}</button>
              <button type="button" class="points-button points-button--danger" :disabled="!!pointsBusy || Number(user.pointsBalance || 0) <= 0" @click="resetPointsBalance">Обнулить баланс</button>
            </div>
          </form>
        </div>

        <p v-if="pointsError" class="points-feedback points-feedback--error" role="alert">{{ pointsError }}</p>
        <p v-if="pointsSuccess" class="points-feedback points-feedback--success" role="status">{{ pointsSuccess }}</p>

        <div class="points-history">
          <div class="panel-head panel-head--row">
            <div><h3>История баллов</h3><p>Начисления, списания, покупки и возвраты</p></div>
            <span class="orders-count">{{ pointsTotal }}</span>
          </div>
          <p v-if="historyLoading && !pointsTransactions.length" class="empty-mini">Загружаем операции…</p>
          <p v-else-if="historyError && !pointsTransactions.length" class="points-feedback points-feedback--error">{{ historyError }}</p>
          <div v-for="transaction in pointsTransactions" :key="transaction.id" class="points-transaction">
            <span :class="['points-transaction__amount', { 'points-transaction__amount--debit': transaction.amount < 0 }]">{{ transaction.amount > 0 ? '+' : '' }}{{ formatPoints(transaction.amount) }}</span>
            <div>
              <strong>{{ pointTypeLabel(transaction.type) }}</strong>
              <p v-if="transaction.message">{{ transaction.message }}</p>
              <small v-if="transaction.createdBy">Администратор: {{ transaction.createdBy.name || transaction.createdBy.email }}</small>
            </div>
            <div class="points-transaction__meta"><time>{{ formatDateTime(transaction.createdAt) }}</time><span>После: {{ formatPoints(transaction.balanceAfter) }}</span></div>
          </div>
          <p v-if="!historyLoading && !historyError && !pointsTransactions.length" class="empty-mini">Операций пока нет.</p>
          <button v-if="historyHasMore" type="button" class="points-button points-button--more" :disabled="historyLoading" @click="fetchPointsHistory(false)">{{ historyLoading ? 'Загружаем…' : 'Показать ещё' }}</button>
        </div>
      </section>

      <div class="detail-grid">
        <section class="info-panel card">
          <div class="panel-head">
            <h2>Профиль</h2>
            <p>Роль, партнерская привязка и основные данные</p>
          </div>
          <div class="info-list">
            <div><span>ID</span><strong>#{{ user.id }}</strong></div>
            <div><span>Email</span><strong>{{ user.email }}</strong></div>
            <div><span>Телефон</span><strong>{{ user.phone || 'Не указан' }}</strong></div>
            <div><span>Адрес</span><strong>{{ user.address || 'Не указан' }}</strong></div>
            <div v-if="user.partner"><span>Кабинет партнера</span><strong>Партнер #{{ user.partner.id }} · {{ user.partner.percentage }}%</strong></div>
            <div v-if="user.partnerUser"><span>Привязан к партнеру</span><strong>{{ user.partnerUser.partner?.user?.name || user.partnerUser.partner?.user?.email }} · {{ formatDate(user.partnerUser.boundAt) }}</strong></div>
          </div>
        </section>

        <section class="info-panel card">
          <div class="panel-head">
            <h2>Любимые препараты</h2>
            <p>Что чаще всего приносило выручку у клиента</p>
          </div>
          <div class="favorite-list">
            <div v-for="product in stats.favoriteProducts" :key="product.productId" class="favorite-row">
              <div>
                <strong>{{ product.title }}</strong>
                <span>{{ product.units }} уп.</span>
              </div>
              <b>{{ formatCurrency(product.revenue) }}</b>
            </div>
            <div v-if="!stats.favoriteProducts?.length" class="empty-mini">Покупок пока нет.</div>
          </div>
        </section>
      </div>

      <section class="orders-panel card">
        <div class="panel-head panel-head--row">
          <div>
            <h2>История заказов</h2>
            <p>Все заказы пользователя с составом, оплатой и доставкой</p>
          </div>
          <span class="orders-count">{{ user.orders?.length || 0 }}</span>
        </div>

        <div class="order-timeline">
          <article v-for="order in user.orders" :key="order.id" class="order-card">
            <div class="order-card__top">
              <div>
                <strong>Заказ #{{ order.id }}</strong>
                <span>{{ formatDateTime(order.createdAt) }}</span>
              </div>
              <div class="order-badges">
                <span :class="['status-badge', getOrderStatusClass(order.status)]">{{ getOrderStatusLabel(order.status) }}</span>
                <span :class="['payment-badge', getPaymentClass(order.paymentStatus)]">{{ getPaymentLabel(order.paymentStatus) }}</span>
              </div>
            </div>

            <div class="order-card__meta">
              <div><span>Сумма</span><strong>{{ formatCurrency(order.total) }}</strong></div>
              <div><span>Доставка</span><strong>{{ order.deliveryTariffName || 'Не указана' }}</strong></div>
              <div><span>Город</span><strong>{{ order.deliveryCity || '—' }}</strong></div>
              <div><span>Промокод</span><strong>{{ order.promoCode?.code || '—' }}</strong></div>
              <div><span>Баллы</span><strong>{{ Number(order.userPointsUsed || 0).toLocaleString('ru-RU') }}</strong></div>
            </div>

            <div class="order-items">
              <div v-for="item in order.items" :key="item.id" class="order-item">
                <img v-if="item.product?.image" :src="item.product.image" alt="">
                <div v-else class="order-item__placeholder">AW</div>
                <div>
                  <strong>{{ item.product?.title || 'Товар удален' }}</strong>
                  <span>{{ item.quantity }} шт. · {{ formatCurrency(item.price) }}{{ item.dosage ? ` · ${item.dosage}` : '' }}</span>
                </div>
              </div>
            </div>
          </article>
          <div v-if="!user.orders?.length" class="empty-mini">Заказов пока нет.</div>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const user = ref(null)
const stats = ref({})
const roleNames = ref({})
const creditForm = ref({ amount: '', message: '' })
const debitForm = ref({ amount: '', message: '' })
const pointsBusy = ref('')
const pointsError = ref('')
const pointsSuccess = ref('')
const pointsTransactions = ref([])
const pointsTotal = ref(0)
const historyHasMore = ref(false)
const historyLoading = ref(false)
const historyError = ref('')

function formatPoints(value) {
  return Number(value || 0).toLocaleString('ru-RU')
}

function pointTypeLabel(type) {
  return {
    ADMIN_CREDIT: 'Ручное начисление',
    ADMIN_DEBIT: 'Ручное списание',
    CONSULTATION_REWARD: 'Награда за консультацию',
    ORDER_SPEND: 'Оплата заказа',
    ORDER_REFUND: 'Возврат по заказу',
    CAMPAIGN_EXPIRE: 'Сгорание подарочных баллов'
  }[type] || 'Операция с баллами'
}

async function fetchPointsHistory(reset = true) {
  if (historyLoading.value) return
  historyLoading.value = true
  historyError.value = ''
  try {
    const offset = reset ? 0 : pointsTransactions.value.length
    const { data } = await axios.get(`/api/admin/points/users/${route.params.id}/transactions`, { params: { offset } })
    pointsTransactions.value = reset ? data.transactions : [...pointsTransactions.value, ...data.transactions]
    pointsTotal.value = data.total
    historyHasMore.value = data.hasMore
  } catch (error) {
    historyError.value = error.response?.data?.error || 'Не удалось загрузить историю баллов'
  } finally {
    historyLoading.value = false
  }
}

async function submitPoints(action) {
  if (pointsBusy.value) return
  const form = action === 'credit' ? creditForm.value : debitForm.value
  const amount = Number(form.amount)
  const message = form.message.trim()
  pointsError.value = ''
  pointsSuccess.value = ''
  if (!Number.isSafeInteger(amount) || amount < 1 || amount > 1_000_000 || !message) {
    pointsError.value = 'Укажите целое количество баллов от 1 до 1 000 000 и комментарий.'
    return
  }
  if (action === 'debit') {
    if (amount > Number(user.value.pointsBalance || 0)) {
      pointsError.value = 'Сумма списания больше текущего баланса.'
      return
    }
    if (!window.confirm(`Списать ${formatPoints(amount)} баллов у пользователя #${user.value.id}?`)) return
  }

  pointsBusy.value = action
  try {
    const url = action === 'credit' ? '/api/admin/points/credit' : `/api/admin/points/users/${user.value.id}/debit`
    const payload = action === 'credit' ? { scope: 'user', userId: user.value.id, amount, message } : { amount, message }
    const { data } = await axios.post(url, payload)
    user.value.pointsBalance = data.balance
    form.amount = ''
    form.message = ''
    pointsSuccess.value = action === 'credit' ? 'Баллы начислены.' : 'Баллы списаны.'
    await fetchPointsHistory(true)
  } catch (error) {
    pointsError.value = error.response?.data?.error || 'Не удалось выполнить операцию с баллами'
  } finally {
    pointsBusy.value = ''
  }
}

async function resetPointsBalance() {
  if (pointsBusy.value || Number(user.value?.pointsBalance || 0) <= 0) return
  if (!window.confirm(`Обнулить весь баланс (${formatPoints(user.value.pointsBalance)} баллов) у пользователя #${user.value.id}?`)) return
  pointsBusy.value = 'reset'
  pointsError.value = ''
  pointsSuccess.value = ''
  try {
    const { data } = await axios.post(`/api/admin/points/users/${user.value.id}/debit`, {
      mode: 'reset',
      message: debitForm.value.message.trim() || 'Обнуление баланса администратором'
    })
    user.value.pointsBalance = data.balance
    debitForm.value = { amount: '', message: '' }
    pointsSuccess.value = 'Баланс обнулён.'
    await fetchPointsHistory(true)
  } catch (error) {
    pointsError.value = error.response?.data?.error || 'Не удалось обнулить баланс'
  } finally {
    pointsBusy.value = ''
  }
}

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push('/users')
}

function getInitials(value) {
  return String(value || 'AW').trim().slice(0, 2).toUpperCase()
}

function getRoleLabel(role) {
  if (roleNames.value[role]) return roleNames.value[role]
  if (role === 'ADMIN') return 'Админ'
  if (role === 'COPYWRITER') return 'Копирайтер'
  if (role === 'PARTNER') return 'Партнер'
  return 'Пользователь'
}

function formatCurrency(value) {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(Number(value || 0))
}

function formatDate(date) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatDateTime(date) {
  if (!date) return '—'
  return new Date(date).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function getOrderStatusLabel(status) {
  const labels = {
    PENDING: 'Ожидает',
    PROCESSING: 'В обработке',
    SHIPPED: 'Отправлен',
    DELIVERED: 'Доставлен',
    RETURNED: 'Возврат',
    CANCELLED: 'Отменен'
  }
  return labels[status] || status || '—'
}

function getOrderStatusClass(status) {
  if (status === 'DELIVERED') return 'success'
  if (status === 'RETURNED' || status === 'CANCELLED') return 'danger'
  return 'info'
}

function getPaymentLabel(status) {
  const labels = {
    PAID: 'Оплачен',
    PENDING: 'Ожидает оплаты',
    FAILED: 'Не оплачен',
    CASH_ON_DELIVERY: 'Наличными'
  }
  return labels[status] || status || '—'
}

function getPaymentClass(status) {
  if (status === 'PAID') return 'success'
  if (status === 'FAILED') return 'danger'
  if (status === 'CASH_ON_DELIVERY') return 'cash'
  return 'warning'
}

async function fetchUser() {
  loading.value = true
  try {
    const { data } = await axios.get(`/api/admin/users/${route.params.id}`)
    user.value = data.user
    stats.value = data.stats || {}
    if (data.user?.role === 'USER') await fetchPointsHistory(true)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchUser()
  axios.get('/api/admin/roles').then(({ data }) => {
    roleNames.value = Object.fromEntries((data.roles || []).map(role => [role.code, role.name]))
  }).catch(() => {})
})
</script>

<style scoped>
.user-detail-page {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  align-self: flex-start;
  border: 0;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
}

.profile-hero {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 1.25rem;
  align-items: center;
  padding: 1.5rem;
  border: 1px solid rgba(159, 181, 255, 0.28);
  background:
    radial-gradient(circle at 12% 18%, rgba(159, 181, 255, 0.18), transparent 34%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.04), transparent),
    var(--bg-card);
}

.profile-hero__avatar {
  width: 82px;
  height: 82px;
  display: grid;
  place-items: center;
  border-radius: 28px;
  color: #0b0b10;
  background: var(--accent);
  font-size: 1.55rem;
  font-weight: 900;
}

.profile-hero h1 {
  margin: 0.35rem 0;
  color: var(--text-primary);
  font-size: clamp(1.6rem, 4vw, 2.6rem);
}

.role-pill,
.status-badge,
.payment-badge {
  display: inline-flex;
  width: fit-content;
  padding: 0.28rem 0.65rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 800;
}

.role-pill.admin { color: var(--accent); background: rgba(159, 181, 255, 0.14); }
.role-pill.copywriter { color: var(--accent); background: rgba(159, 181, 255, 0.14); }
.role-pill.partner { color: #22c55e; background: rgba(34, 197, 94, 0.14); }
.role-pill.user { color: var(--text-secondary); background: var(--bg-secondary); }

.profile-contacts {
  display: flex;
  flex-wrap: wrap;
  gap: 0.7rem;
  color: var(--text-secondary);
}

.profile-contacts a {
  color: var(--accent);
}

.profile-hero__meta {
  display: grid;
  gap: 0.2rem;
  text-align: right;
  color: var(--text-muted);
}

.profile-hero__meta strong {
  color: var(--text-primary);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 1rem;
}

.stat-card,
.info-panel,
.orders-panel {
  padding: 1.15rem;
}

.stat-card {
  border: 1px solid var(--border);
  border-radius: 24px;
  background: var(--bg-card);
}

.stat-card--accent {
  border-color: rgba(159, 181, 255, 0.38);
}

.stat-card--points {
  border-color: rgba(152, 177, 255, 0.42);
  background: linear-gradient(135deg, rgba(152, 177, 255, 0.12), var(--bg-card));
}

.stat-card.warning {
  border-color: rgba(239, 68, 68, 0.32);
}

.stat-card span,
.info-list span,
.order-card__meta span {
  color: var(--text-muted);
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.stat-card strong {
  display: block;
  margin-top: 0.5rem;
  color: var(--text-primary);
  font-size: clamp(1.35rem, 3vw, 2rem);
}

.stat-card small {
  display: block;
  margin-top: 0.35rem;
  color: var(--text-secondary);
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.points-panel { padding: 1.4rem; }
.points-balance { color: var(--accent); font-size: 1.25rem; white-space: nowrap; }
.points-actions { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; }
.points-action {
  display: grid;
  gap: 0.65rem;
  padding: 1.1rem;
  border: 1px solid var(--border);
  border-radius: 18px;
  background: var(--bg-secondary);
}
.points-action--credit { border-color: rgba(159, 181, 255, 0.35); }
.points-action h3, .points-history h3 { margin: 0; color: var(--text-primary); }
.points-action label { color: var(--text-secondary); font-size: 0.84rem; font-weight: 700; }
.points-action input, .points-action textarea {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 0.75rem 0.9rem;
  background: var(--bg-card);
  color: var(--text-primary);
  font: inherit;
}
.points-action input:focus-visible, .points-action textarea:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
.points-button {
  justify-self: start;
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 0.7rem 1rem;
  background: var(--bg-secondary);
  color: var(--text-primary);
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}
.points-button:disabled { opacity: 0.55; cursor: not-allowed; }
.points-action__buttons { display: flex; flex-wrap: wrap; gap: 0.65rem; }
.points-button--primary { background: var(--accent); color: #0b0b10; border-color: transparent; }
.points-button--danger { color: #ef4444; border-color: rgba(239, 68, 68, 0.45); }
.points-button--more { margin-top: 1rem; }
.points-feedback { margin: 0.9rem 0 0; padding: 0.75rem 1rem; border-radius: 12px; }
.points-feedback--error { color: #ef4444; background: rgba(239, 68, 68, 0.1); }
.points-feedback--success { color: #22c55e; background: rgba(34, 197, 94, 0.1); }
.points-history { margin-top: 1.5rem; }
.points-transaction {
  display: grid;
  grid-template-columns: 100px minmax(0, 1fr) auto;
  gap: 1rem;
  align-items: start;
  padding: 0.9rem 0;
  border-top: 1px solid var(--border);
}
.points-transaction__amount { color: #22c55e; font-weight: 800; font-variant-numeric: tabular-nums; }
.points-transaction__amount--debit { color: #ef4444; }
.points-transaction strong { color: var(--text-primary); }
.points-transaction p { margin: 0.25rem 0; color: var(--text-secondary); overflow-wrap: anywhere; }
.points-transaction small, .points-transaction__meta { color: var(--text-muted); }
.points-transaction__meta { display: grid; gap: 0.25rem; text-align: right; white-space: nowrap; }

.panel-head {
  margin-bottom: 1rem;
}

.panel-head--row {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
}

.panel-head h2 {
  margin: 0 0 0.25rem;
  color: var(--text-primary);
}

.panel-head p {
  color: var(--text-secondary);
}

.info-list,
.favorite-list,
.order-timeline {
  display: grid;
  gap: 0.65rem;
}

.info-list div,
.favorite-row,
.order-card {
  border: 1px solid var(--border);
  border-radius: 18px;
  background: var(--bg-secondary);
}

.info-list div,
.favorite-row {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.85rem;
}

.info-list strong,
.favorite-row strong,
.favorite-row b {
  color: var(--text-primary);
}

.favorite-row span {
  display: block;
  margin-top: 0.2rem;
  color: var(--text-secondary);
}

.orders-count {
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  color: var(--accent);
  background: rgba(159, 181, 255, 0.14);
  font-weight: 900;
}

.order-card {
  padding: 1rem;
}

.order-card__top {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
}

.order-card__top strong {
  display: block;
  color: var(--text-primary);
  font-size: 1.05rem;
}

.order-card__top span {
  color: var(--text-secondary);
}

.order-badges {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.45rem;
}

.status-badge.success,
.payment-badge.success { color: #22c55e; background: rgba(34, 197, 94, 0.14); }
.status-badge.danger,
.payment-badge.danger { color: #ef4444; background: rgba(239, 68, 68, 0.14); }
.status-badge.info { color: var(--accent); background: rgba(159, 181, 255, 0.14); }
.payment-badge.warning { color: #f59e0b; background: rgba(245, 158, 11, 0.14); }
.payment-badge.cash { color: #38bdf8; background: rgba(56, 189, 248, 0.14); }

.order-card__meta {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.65rem;
  margin: 1rem 0;
}

.order-card__meta div {
  display: grid;
  gap: 0.25rem;
}

.order-card__meta strong {
  color: var(--text-primary);
}

.order-items {
  display: grid;
  gap: 0.55rem;
}

.order-item {
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr);
  gap: 0.75rem;
  align-items: center;
  padding: 0.65rem;
  border-radius: 14px;
  background: var(--bg-card);
}

.order-item img,
.order-item__placeholder {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  object-fit: cover;
}

.order-item__placeholder {
  display: grid;
  place-items: center;
  color: #0b0b10;
  background: var(--accent);
  font-size: 0.8rem;
  font-weight: 900;
}

.order-item strong {
  display: block;
  color: var(--text-primary);
}

.order-item span {
  color: var(--text-secondary);
}

.empty-mini {
  padding: 1rem;
  color: var(--text-muted);
  text-align: center;
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

@media (max-width: 1100px) {
  .stats-grid,
  .order-card__meta {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .points-actions, .points-transaction { grid-template-columns: 1fr; }
  .points-transaction { gap: 0.3rem; }
  .points-transaction__meta { text-align: left; white-space: normal; }
  .profile-hero,
  .stats-grid,
  .order-card__meta {
    grid-template-columns: 1fr;
  }

  .profile-hero__meta {
    text-align: left;
  }

  .order-card__top,
  .panel-head--row,
  .info-list div,
  .favorite-row {
    flex-direction: column;
  }

  .order-badges {
    justify-content: flex-start;
  }
}
</style>
