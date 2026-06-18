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
        <article class="stat-card" :class="{ warning: stats.returnedOrders > 0 || stats.cancelledOrders > 0 }">
          <span>Проблемные</span>
          <strong>{{ (stats.returnedOrders || 0) + (stats.cancelledOrders || 0) }}</strong>
          <small>{{ stats.returnedOrders || 0 }} возвратов · {{ stats.cancelledOrders || 0 }} отмен</small>
        </article>
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

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push('/users')
}

function getInitials(value) {
  return String(value || 'AW').trim().slice(0, 2).toUpperCase()
}

function getRoleLabel(role) {
  if (role === 'ADMIN') return 'Админ'
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
  } finally {
    loading.value = false
  }
}

onMounted(fetchUser)
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
  grid-template-columns: repeat(4, minmax(0, 1fr));
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
