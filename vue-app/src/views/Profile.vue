<template>
  <div class="profile">
    <div class="profile__hero" data-aos="fade-up">
      <div class="container">
        <h1 class="page-title">Личный кабинет</h1>
      </div>
    </div>

    <div class="container">
      <div class="profile__layout">
        <aside class="profile__sidebar" data-aos="fade-right" data-aos-delay="100">
          <div class="user-card">
            <div class="user-avatar">
              {{ getInitials }}
            </div>
            <div class="user-info">
              <h3>{{ authStore.user?.name || 'Пользователь' }}</h3>
              <p>{{ authStore.user?.email }}</p>
            </div>
          </div>
          
          <nav class="profile-nav">
            <button
              v-for="tab in visibleTabs"
              :key="tab.id"
              class="profile-nav__item"
              :class="{ active: activeTab === tab.id }"
              @click="navigateTab(tab)"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" v-html="tab.icon"></svg>
              {{ tab.label }}
            </button>
            <button @click="handleLogout" class="profile-nav__item logout-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Выйти
            </button>
          </nav>
        </aside>
        
        <div class="profile__content" data-aos="fade-left" data-aos-delay="200">
          <div v-if="activeTab === 'info'" class="tab-content">
            <div class="section-card">
              <h2 class="section-title">Личные данные</h2>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Имя</span>
                  <span class="info-value">{{ authStore.user?.name || '—' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Email</span>
                  <span class="info-value">{{ authStore.user?.email || '—' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Телефон</span>
                  <span class="info-value">{{ authStore.user?.phone || '—' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Адрес</span>
                  <span class="info-value">{{ authStore.user?.address || '—' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Дата регистрации</span>
                  <span class="info-value">{{ formatDate(authStore.user?.createdAt) }}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div v-if="activeTab === 'orders'" class="tab-content">
            <div class="section-card">
              <h2 class="section-title">История заказов</h2>
              <div v-if="orders.length === 0" class="empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <path d="M16 10a4 4 0 0 1-8 0"/>
                </svg>
                <p>У вас пока нет заказов</p>
                <router-link to="/catalog" class="btn btn-secondary">Перейти в каталог</router-link>
              </div>
              <div v-else class="orders-list">
                <article v-for="order in orders" :key="order.id" class="order-card">
                  <div class="order-card__header">
                    <div class="order-card__heading">
                      <span class="order-id">Заказ #{{ order.id }}</span>
                      <span class="order-date">{{ order.date }}</span>
                    </div>
                    <div class="order-status-wrap">
                      <span class="order-status" :class="order.status">{{ order.statusText }}</span>
                      <span class="payment-status" :class="getPaymentStatusTone(order.paymentStatus)">
                        {{ getPaymentStatusLabel(order.paymentStatus) }}
                      </span>
                      <div
                        v-if="order.deliveryStatusSource === 'cdek' && (order.cdekStatusName || order.cdekStatusCode)"
                        class="order-delivery-status"
                        :class="`order-delivery-status--${getCdekStatusTone(order)}`"
                      >
                        <span class="order-delivery-status__brand">СДЭК</span>
                        <span class="order-delivery-status__value">{{ order.cdekStatusName || order.cdekStatusCode }}</span>
                        <span v-if="order.cdekStatusDate" class="order-delivery-status__time">{{ formatDateTime(order.cdekStatusDate) }}</span>
                      </div>
                    </div>
                  </div>

                  <div v-if="canPayOrder(order)" class="order-payment-alert">
                    <div>
                      <strong>Заказ ожидает оплату</strong>
                      <span>Если вы вернулись со страницы оплаты без платежа, можно продолжить оплату по новой ссылке.</span>
                    </div>
                    <button
                      class="order-pay-button"
                      :disabled="payingOrderId === order.id"
                      @click="payOrder(order)"
                    >
                      {{ payingOrderId === order.id ? 'Создаём ссылку...' : 'Оплатить' }}
                    </button>
                  </div>

                  <div v-if="paymentErrorByOrderId[order.id]" class="order-payment-error">
                    {{ paymentErrorByOrderId[order.id] }}
                  </div>

                  <div class="order-metrics">
                    <div class="order-metric">
                      <span>Сумма</span>
                      <strong>{{ formatCurrency(order.total) }}</strong>
                    </div>
                    <div class="order-metric">
                      <span>Позиции</span>
                      <strong>{{ order.items?.length || 0 }}</strong>
                    </div>
                    <div class="order-metric">
                      <span>Доставка</span>
                      <strong>{{ formatCurrency(order.deliveryPrice || 0) }}</strong>
                    </div>
                  </div>

                  <div class="order-products">
                    <h4 class="order-products__title">Товары в заказе</h4>
                    <div v-if="!order.items?.length" class="order-products-empty">Позиции заказа не найдены</div>
                    <div v-else class="order-products-grid">
                      <article v-for="item in order.items" :key="item.id" class="order-product-card">
                        <div class="order-product-card__media">
                          <img
                            :src="item.product?.image || '/logo.png'"
                            :alt="item.product?.title || `Товар #${item.productId}`"
                            @error="onOrderImageError"
                          >
                        </div>
                        <div class="order-product-card__body">
                          <h5 class="order-product-card__title">{{ item.product?.title || `Товар #${item.productId}` }}</h5>
                          <span v-if="item.dosage" class="order-item-dosage">{{ item.dosage }}</span>
                          <div class="order-product-card__meta">
                            <span>{{ item.quantity }} шт</span>
                            <span>{{ formatCurrency(item.price) }}</span>
                          </div>
                          <div class="order-product-card__sum">{{ formatCurrency((item.price || 0) * (item.quantity || 0)) }}</div>
                        </div>
                      </article>
                    </div>
                  </div>

                  <button class="order-toggle" @click="toggleOrderDetails(order.id)">
                    {{ expandedOrderId === order.id ? 'Скрыть детали' : 'Показать детали' }}
                  </button>

                  <div v-if="expandedOrderId === order.id" class="order-expanded">
                    <div class="order-expanded-grid">
                      <div>
                        <h4>Получатель</h4>
                        <p>{{ order.customerName || '—' }}</p>
                        <p>{{ order.customerPhone || '—' }}</p>
                        <p>{{ order.customerEmail || '—' }}</p>
                      </div>
                      <div>
                        <h4>Доставка</h4>
                        <p>{{ order.shippingAddress || order.deliveryPickupName || order.deliveryCity || '—' }}</p>
                        <p v-if="order.deliveryTariffName">{{ order.deliveryTariffName }}</p>
                        <p>Стоимость доставки: {{ formatCurrency(order.deliveryPrice || 0) }}</p>
                        <p v-if="order.cdekOrderUuid">Трек-номер СДЭК: {{ order.cdekOrderUuid }}</p>
                      </div>
                    </div>
                    <div class="order-note" v-if="order.notes">
                      <h4>Комментарий</h4>
                      <p>{{ order.notes }}</p>
                    </div>

                    <div class="order-addition">
                      <div class="order-addition__head">
                        <div>
                          <h4>Добавить товары к заказу</h4>
                          <p v-if="canAddItems(order)">Перейдите в корзину: там будут видны текущие товары заказа и сумма доплаты только за новые позиции.</p>
                          <p v-else>Дозаказ доступен только пока заказ не отправлен.</p>
                        </div>
                        <button
                          v-if="canAddItems(order)"
                          class="order-addition__open"
                          @click="startOrderAddition(order)"
                        >
                          Добавить товары
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              </div>
            </div>
          </div>
          
          <div v-if="activeTab === 'settings'" class="tab-content">
            <div class="section-card">
              <h2 class="section-title">Настройки профиля</h2>
              <form @submit.prevent="updateProfile" class="settings-form">
                <div class="form-group">
                  <label>Имя</label>
                  <input v-model="editForm.name" type="text" class="input" placeholder="Введите ваше имя">
                </div>
                <div class="form-group">
                  <label>Email</label>
                  <input v-model="editForm.email" type="email" class="input" placeholder="Ваш email" disabled>
                  <span class="input-hint">Email нельзя изменить</span>
                </div>
                <div class="form-group">
                  <label>Телефон</label>
                  <input v-model="editForm.phone" type="tel" class="input" placeholder="+7 (999) 999-99-99">
                </div>
                <div class="form-group">
                  <label>Адрес доставки</label>
                  <input v-model="editForm.address" type="text" class="input" placeholder="Город, улица, дом, квартира">
                </div>
                <div class="form-group">
                  <label>Новый пароль</label>
                  <input v-model="editForm.newPassword" type="password" class="input" placeholder="Оставьте пустым, чтобы не менять">
                </div>
                <button type="submit" class="btn btn-primary">Сохранить изменения</button>
              </form>
              <div v-if="successMessage" class="success-message">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                {{ successMessage }}
              </div>
            </div>
            
            <div class="section-card">
              <h2 class="section-title">Выйти из аккаунта</h2>
              <p>Вы сможете войти снова с помощью email и пароля.</p>
              <button @click="handleLogout" class="btn btn-secondary btn-logout">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Выйти из аккаунта
              </button>
            </div>
            
            <div class="section-card danger-zone">
              <h2 class="section-title">Опасная зона</h2>
              <p>Это действие нельзя отменить. Ваш аккаунт будет удален навсегда.</p>
              <button @click="handleDeleteAccount" class="btn btn-danger">Удалить аккаунт</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import axios from 'axios'
import { useAuthStore } from '../store/auth'
import { useCartStore } from '../store/cart'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const cartStore = useCartStore()

const activeTab = ref('info')
const orders = ref([])
const successMessage = ref('')
const expandedOrderId = ref(null)
const partnerTabAvailable = ref(authStore.user?.role === 'ADMIN')
const payingOrderId = ref(null)
const paymentErrorByOrderId = ref({})

const tabs = [
  { id: 'info', label: 'Мои данные', icon: '<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>' },
  { id: 'orders', label: 'Заказы', icon: '<path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>' },
  { id: 'partner', label: 'Партнёрский кабинет', icon: '<polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/>', role: 'PARTNER' },
  { id: 'settings', label: 'Настройки', icon: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>' }
]

const editForm = ref({
  name: '',
  email: '',
  phone: '',
  address: '',
  newPassword: ''
})

const getInitials = computed(() => {
  if (!authStore.user?.name) return '?'
  return authStore.user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
})

const visibleTabs = computed(() => {
  return tabs.filter(tab => {
    if (!tab.role) return true
    if (tab.role === 'PARTNER') return partnerTabAvailable.value
    return true
  })
})

async function resolvePartnerTabAvailability() {
  if (!authStore.isAuthenticated) {
    partnerTabAvailable.value = false
    return
  }

  if (authStore.user?.role === 'ADMIN') {
    partnerTabAvailable.value = true
    return
  }

  try {
    await axios.get('/api/partner/cabinet/stats')
    partnerTabAvailable.value = true
  } catch (error) {
    partnerTabAvailable.value = false
  }
}

function mapOrderStatus(status) {
  const normalized = String(status || '').toUpperCase()
  if (normalized === 'DELIVERED') return { css: 'completed', text: 'Доставлен' }
  if (normalized === 'CANCELLED') return { css: 'cancelled', text: 'Отменён' }
  if (normalized === 'SHIPPED') return { css: 'pending', text: 'В доставке' }
  if (normalized === 'PROCESSING') return { css: 'pending', text: 'Собирается' }
  if (normalized === 'PENDING') return { css: 'pending', text: 'Принят' }
  return { css: 'pending', text: 'В обработке' }
}

function formatCurrency(value) {
  return `${Number(value || 0).toLocaleString('ru-RU')} ₽`
}

function formatDateTime(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getCdekStatusTone(order) {
  const localStatus = String(order?.status || '').toLowerCase()
  if (localStatus === 'completed') return 'success'
  if (localStatus === 'cancelled') return 'danger'
  return 'progress'
}

function getPaymentStatusLabel(status) {
  const normalized = String(status || '').toUpperCase()
  if (normalized === 'PAID') return 'Оплачен'
  if (normalized === 'CASH_ON_DELIVERY') return 'Оплата наличными'
  if (normalized === 'FAILED') return 'Не оплачен'
  if (normalized === 'PENDING') return 'Ожидает оплату'
  return 'Ожидает оплату'
}

function getPaymentStatusTone(status) {
  const normalized = String(status || '').toUpperCase()
  if (normalized === 'PAID') return 'payment-status--paid'
  if (normalized === 'CASH_ON_DELIVERY') return 'payment-status--cash'
  if (normalized === 'FAILED') return 'payment-status--failed'
  return 'payment-status--pending'
}

function canPayOrder(order) {
  const paymentStatus = String(order?.paymentStatus || '').toUpperCase()
  const orderStatus = String(order?.rawStatus || '').toUpperCase()
  return Number(order?.total || 0) > 0 &&
    ['PENDING', 'FAILED', ''].includes(paymentStatus) &&
    orderStatus !== 'CANCELLED'
}

async function payOrder(order) {
  if (!order?.id || payingOrderId.value) return

  payingOrderId.value = order.id
  paymentErrorByOrderId.value = {
    ...paymentErrorByOrderId.value,
    [order.id]: ''
  }

  try {
    const syncResponse = await axios.post(`/api/payment/sync-order/${order.id}`)
    const syncedStatus = String(syncResponse?.data?.paymentStatus || '').toUpperCase()
    if (syncedStatus === 'PAID') {
      order.paymentStatus = 'PAID'
      return
    }

    const { data } = await axios.post(`/api/payment/create-for-order/${order.id}`, {
      description: `Оплата заказа #${order.id}`
    })

    if (data.alreadyPaid) {
      order.paymentStatus = 'PAID'
      return
    }

    if (data.success && data.paymentUrl) {
      window.location.href = data.paymentUrl
      return
    }

    throw new Error(data.error || 'Не удалось создать ссылку для оплаты')
  } catch (error) {
    paymentErrorByOrderId.value = {
      ...paymentErrorByOrderId.value,
      [order.id]: error?.response?.data?.error || error.message || 'Не удалось создать ссылку для оплаты'
    }
  } finally {
    payingOrderId.value = null
  }
}

function onOrderImageError(event) {
  const img = event?.target
  if (!img || img.dataset.fallbackApplied === 'true') return
  img.dataset.fallbackApplied = 'true'
  img.src = '/logo.png'
}

function canAddItems(order) {
  const status = String(order?.rawStatus || order?.status || '').toUpperCase()
  return ['PENDING', 'PROCESSING'].includes(status)
}

function startOrderAddition(order) {
  if (!order?.id || !canAddItems(order)) return
  cartStore.clear()
  localStorage.setItem('peptidi_order_addition_id', String(order.id))
  router.push({ path: '/cart', query: { addToOrder: order.id } })
}

function toggleOrderDetails(orderId) {
  expandedOrderId.value = expandedOrderId.value === orderId ? null : orderId
}

async function loadOrders() {
  try {
    const { data } = await axios.get('/api/orders/my')
    orders.value = (data.orders || []).map(order => {
      const statusView = mapOrderStatus(order.status)
      return {
        ...order,
        rawStatus: order.status,
        date: formatDate(order.createdAt),
        status: statusView.css,
        statusText: statusView.text
      }
    })
  } catch (error) {
    orders.value = []
    console.error('Failed to load orders:', error)
  }
}

function navigateTab(tab) {
  if (tab.id === 'partner') {
    if (!partnerTabAvailable.value) {
      return
    }
    router.push('/partner')
  } else {
    activeTab.value = tab.id
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

function updateProfile() {
  authStore.updateUser({
    name: editForm.value.name,
    phone: editForm.value.phone,
    address: editForm.value.address
  })
  successMessage.value = 'Профиль успешно обновлен!'
  setTimeout(() => { successMessage.value = '' }, 3000)
}

function handleLogout() {
  authStore.logout()
  router.push('/')
}

function handleDeleteAccount() {
  if (confirm('Вы уверены? Это действие нельзя отменить.')) {
    authStore.logout()
    router.push('/')
  }
}

onMounted(async () => {
  if (!authStore.isAuthenticated) {
    router.push('/auth')
    return
  }

  await resolvePartnerTabAvailability()

  const tabParam = route.query.tab
  if (
    tabParam &&
    tabs.some(t => t.id === tabParam) &&
    (tabParam !== 'partner' || partnerTabAvailable.value)
  ) {
    activeTab.value = tabParam
  }

  editForm.value = {
    name: authStore.user?.name || '',
    email: authStore.user?.email || '',
    phone: authStore.user?.phone || '',
    address: authStore.user?.address || '',
    newPassword: ''
  }

  loadOrders()
})
</script>

<style scoped>
.profile {
  padding-bottom: 6rem;
}

.profile__hero {
  padding: 3rem 0;
  background: linear-gradient(180deg, var(--bg-secondary) 0%, var(--bg-primary) 100%);
  border-bottom: 1px solid var(--border);
  margin-bottom: 3rem;
}

.profile__layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 3rem;
  align-items: start;
}

.profile__sidebar {
  position: sticky;
  top: 100px;
}

.user-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 16px;
  margin-bottom: 1.5rem;
}

.user-avatar {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent);
  color: #ffffff;
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 700;
  border-radius: 14px;
}

.user-info h3 {
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.user-info p {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.profile-nav {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.profile-nav__item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.875rem 1rem;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  color: var(--text-secondary);
  font-size: 0.9rem;
  font-weight: 500;
  text-align: left;
  transition: all 0.3s ease;
}

.profile-nav__item:hover {
  border-color: var(--border-hover);
  color: var(--text-primary);
}

.profile-nav__item.active {
  background: var(--accent-dim);
  border-color: var(--accent);
  color: var(--accent);
}

.profile-nav__item.logout-btn {
  margin-top: auto;
  border-color: var(--danger);
  color: var(--danger);
}

.profile-nav__item.logout-btn:hover {
  background: var(--danger);
  color: #ffffff;
}

.profile-nav__item.logout-btn svg {
  transition: transform 0.3s ease;
}

.profile-nav__item.logout-btn:hover svg {
  transform: translateX(-4px);
}

.section-card {
  padding: 2rem;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 20px;
  margin-bottom: 1.5rem;
}

.section-title {
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.info-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
}

.info-value {
  font-weight: 600;
}

.empty-state {
  text-align: center;
  padding: 3rem 0;
  color: var(--text-muted);
}

.empty-state svg {
  margin-bottom: 1rem;
}

.empty-state p {
  margin-bottom: 1.5rem;
}

.orders-list {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.order-card {
  position: relative;
  padding: 1.25rem;
  background:
    radial-gradient(circle at 100% 0, rgba(166, 185, 248, 0.1), transparent 55%),
    linear-gradient(160deg, rgba(255, 255, 255, 0.02) 0%, rgba(255, 255, 255, 0) 100%),
    var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 16px;
  overflow: hidden;
}

.order-card__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.95rem;
  gap: 1rem;
}

.order-card__heading {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.order-id {
  font-family: var(--font-mono);
  font-weight: 700;
  font-size: 0.9rem;
}

.order-date {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.order-status {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  padding: 0.25rem 0.75rem;
  border-radius: 100px;
}

.order-status-wrap {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.45rem;
}

.order-delivery-status {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  font-size: 0.72rem;
  padding: 0.3rem 0.55rem;
  border-radius: 999px;
  border: 1px solid rgba(87, 200, 111, 0.3);
  background: rgba(87, 200, 111, 0.12);
  color: #8de9a1;
}

.order-delivery-status__brand {
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #5ad070;
}

.order-delivery-status__value {
  color: var(--text-primary);
}

.order-delivery-status__time {
  color: var(--text-muted);
  font-size: 0.68rem;
}

.order-delivery-status--progress {
  border-color: rgba(90, 208, 112, 0.35);
  background: rgba(90, 208, 112, 0.14);
}

.order-delivery-status--success {
  border-color: rgba(85, 229, 130, 0.45);
  background: rgba(85, 229, 130, 0.18);
}

.order-delivery-status--danger {
  border-color: rgba(255, 100, 100, 0.4);
  background: rgba(255, 100, 100, 0.15);
  color: #ffc0c0;
}

.order-delivery-status--danger .order-delivery-status__brand {
  color: #ff8f8f;
}

.order-status.completed {
  background: rgba(166, 185, 248, 0.15);
  color: var(--accent);
}

.order-status.pending {
  background: rgba(255, 200, 0, 0.15);
  color: #ffc800;
}

.order-status.cancelled {
  background: rgba(255, 100, 100, 0.15);
  color: var(--danger);
}

.payment-status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: fit-content;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  border: 1px solid transparent;
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.payment-status--paid {
  border-color: rgba(34, 197, 94, 0.34);
  background: rgba(34, 197, 94, 0.13);
  color: #77f0a0;
}

.payment-status--pending {
  border-color: rgba(251, 191, 36, 0.34);
  background: rgba(251, 191, 36, 0.13);
  color: #ffd36a;
}

.payment-status--failed {
  border-color: rgba(239, 68, 68, 0.36);
  background: rgba(239, 68, 68, 0.13);
  color: #ff9d9d;
}

.payment-status--cash {
  border-color: rgba(166, 185, 248, 0.34);
  background: rgba(166, 185, 248, 0.13);
  color: var(--accent);
}

.order-payment-alert {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
  padding: 0.9rem;
  border: 1px solid rgba(251, 191, 36, 0.28);
  border-radius: 14px;
  background:
    radial-gradient(circle at 0 0, rgba(251, 191, 36, 0.16), transparent 42%),
    rgba(251, 191, 36, 0.06);
}

.order-payment-alert strong,
.order-payment-alert span {
  display: block;
}

.order-payment-alert strong {
  margin-bottom: 0.2rem;
  color: var(--text-primary);
  font-size: 0.95rem;
}

.order-payment-alert span {
  color: var(--text-secondary);
  font-size: 0.84rem;
  line-height: 1.45;
}

.order-pay-button {
  flex: 0 0 auto;
  min-height: 42px;
  padding: 0.65rem 1rem;
  border: 1px solid rgba(166, 185, 248, 0.55);
  border-radius: 12px;
  background: linear-gradient(135deg, var(--accent), #d8e0ff);
  color: #11131c;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 10px 25px rgba(166, 185, 248, 0.18);
}

.order-pay-button:disabled {
  opacity: 0.7;
  cursor: wait;
}

.order-payment-error {
  margin: -0.35rem 0 1rem;
  padding: 0.7rem 0.85rem;
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 12px;
  background: rgba(239, 68, 68, 0.1);
  color: #ffb4b4;
  font-size: 0.86rem;
}

.order-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.order-metric {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.7rem 0.85rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border);
  border-radius: 12px;
}

.order-metric span {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
}

.order-metric strong {
  font-size: 0.96rem;
  color: var(--text-primary);
}

.order-products {
  margin-bottom: 1rem;
}

.order-products__title {
  margin: 0 0 0.55rem;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
}

.order-products-empty {
  padding: 0.9rem;
  border-radius: 12px;
  border: 1px dashed var(--border);
  color: var(--text-muted);
  font-size: 0.86rem;
}

.order-products-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}

.order-product-card {
  display: grid;
  grid-template-columns: 74px 1fr;
  gap: 0.75rem;
  padding: 0.75rem;
  border: 1px solid var(--border);
  border-radius: 13px;
  background: var(--bg-primary);
}

.order-product-card__media {
  width: 74px;
  height: 74px;
  border-radius: 10px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border);
}

.order-product-card__media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.order-product-card__body {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.order-product-card__title {
  margin: 0;
  font-size: 0.88rem;
  line-height: 1.35;
  font-weight: 700;
  color: var(--text-primary);
}

.order-product-card__meta {
  display: flex;
  gap: 0.65rem;
  flex-wrap: wrap;
  font-size: 0.78rem;
  color: var(--text-secondary);
}

.order-product-card__sum {
  margin-top: auto;
  font-size: 0.86rem;
  font-weight: 700;
  color: var(--accent);
}

.order-toggle {
  margin-top: 0.1rem;
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text-primary);
  padding: 0.5rem 0.8rem;
  border-radius: 10px;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
}

.order-toggle:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.order-expanded {
  margin-top: 0.9rem;
  border-top: 1px solid var(--border);
  padding-top: 0.95rem;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.order-expanded-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.9rem;
}

.order-expanded h4 {
  margin: 0 0 0.35rem;
  font-size: 0.82rem;
  text-transform: uppercase;
  color: var(--text-muted);
}

.order-expanded p {
  margin: 0.1rem 0;
  font-size: 0.9rem;
}

.order-item-dosage {
  align-self: flex-start;
  font-size: 0.8rem;
  padding: 0.18rem 0.5rem;
  border-radius: 999px;
  background: var(--accent-dim);
  color: var(--accent);
}

.order-note p {
  color: var(--text-secondary);
}

.order-addition {
  padding: 1rem;
  border: 1px solid rgba(166, 185, 248, 0.18);
  border-radius: 16px;
  background:
    radial-gradient(circle at 0 0, rgba(166, 185, 248, 0.14), transparent 38%),
    rgba(255, 255, 255, 0.025);
}

.order-addition__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.order-addition__head h4 {
  margin: 0 0 0.25rem;
  color: var(--text-primary);
}

.order-addition__head p {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.85rem;
}

.order-addition__open,
.order-addition__add,
.addition-quote__refresh {
  border: 1px solid var(--accent);
  border-radius: 10px;
  background: var(--accent-dim);
  color: var(--accent);
  font-weight: 700;
  cursor: pointer;
}

.order-addition__open {
  padding: 0.65rem 0.95rem;
  white-space: nowrap;
}

.order-addition-panel {
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.order-addition-alert {
  padding: 0.75rem 0.85rem;
  border-radius: 12px;
  font-size: 0.86rem;
  font-weight: 600;
}

.order-addition-alert--error {
  border: 1px solid rgba(239, 68, 68, 0.35);
  background: rgba(239, 68, 68, 0.12);
  color: #ffb4b4;
}

.order-addition-alert--success {
  border: 1px solid rgba(34, 197, 94, 0.35);
  background: rgba(34, 197, 94, 0.12);
  color: #9ff0b9;
}

.order-addition-form {
  display: grid;
  grid-template-columns: minmax(220px, 1fr) minmax(150px, 0.6fr) 118px auto;
  gap: 0.75rem;
  align-items: end;
}

.addition-field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.addition-field label {
  font-size: 0.7rem;
  font-weight: 800;
  color: var(--text-muted);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.addition-field .input {
  min-height: 42px;
}

.addition-qty {
  display: grid;
  grid-template-columns: 34px 1fr 34px;
  align-items: center;
  min-height: 42px;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--bg-primary);
}

.addition-qty button,
.addition-draft-item__qty button {
  height: 100%;
  border: 0;
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-primary);
  font-size: 1.05rem;
  cursor: pointer;
}

.addition-qty span,
.addition-draft-item__qty span {
  text-align: center;
  font-weight: 800;
}

.order-addition__add {
  min-height: 42px;
  padding: 0 0.9rem;
}

.order-addition__add:disabled,
.addition-quote__refresh:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.addition-draft {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.addition-draft-item {
  display: grid;
  grid-template-columns: 52px minmax(0, 1fr) 96px auto 28px;
  gap: 0.7rem;
  align-items: center;
  padding: 0.65rem;
  border: 1px solid var(--border);
  border-radius: 13px;
  background: var(--bg-primary);
}

.addition-draft-item img {
  width: 52px;
  height: 52px;
  object-fit: cover;
  border-radius: 10px;
  border: 1px solid var(--border);
}

.addition-draft-item__body {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.18rem;
}

.addition-draft-item__body strong {
  overflow: hidden;
  color: var(--text-primary);
  font-size: 0.88rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.addition-draft-item__body span,
.addition-draft-item__body small {
  color: var(--text-muted);
  font-size: 0.78rem;
}

.addition-draft-item__qty {
  display: grid;
  grid-template-columns: 28px 1fr 28px;
  align-items: center;
  height: 34px;
  border: 1px solid var(--border);
  border-radius: 9px;
  overflow: hidden;
}

.addition-draft-item__sum {
  color: var(--accent);
  white-space: nowrap;
}

.addition-draft-item__remove {
  width: 28px;
  height: 28px;
  border: 1px solid rgba(239, 68, 68, 0.28);
  border-radius: 8px;
  background: rgba(239, 68, 68, 0.1);
  color: #ff9a9a;
  cursor: pointer;
}

.addition-quote {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.9rem;
  align-items: start;
  padding: 0.85rem;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.025);
}

.addition-quote__refresh {
  padding: 0.65rem 0.9rem;
}

.addition-quote__rows {
  display: grid;
  gap: 0.45rem;
}

.addition-quote__rows > div {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  color: var(--text-secondary);
  font-size: 0.88rem;
}

.addition-quote__rows strong {
  color: var(--text-primary);
  white-space: nowrap;
}

.addition-quote__total {
  padding-top: 0.45rem;
  border-top: 1px solid var(--border);
}

.addition-quote__total strong {
  color: var(--accent);
  font-size: 1rem;
}

.addition-quote__warning {
  grid-column: 1 / -1;
  margin: 0;
  color: #ffd88a;
  font-size: 0.82rem;
}

.order-addition-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.7rem;
  flex-wrap: wrap;
}

.settings-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
}

.input-hint {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: 0.25rem;
}

.success-message {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 1rem;
  padding: 1rem;
  background: rgba(166, 185, 248, 0.1);
  border: 1px solid rgba(166, 185, 248, 0.2);
  border-radius: 12px;
  color: var(--accent);
  font-size: 0.9rem;
}

.success-message svg {
  flex-shrink: 0;
}

.btn-logout {
  margin-top: 0.5rem;
  gap: 0.75rem;
}

.danger-zone {
  border-color: var(--danger);
}

.danger-zone .section-title {
  color: var(--danger);
}

.danger-zone p {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-bottom: 1rem;
}

.btn-danger {
  background: var(--danger);
  color: #ffffff;
  padding: 0.75rem 1.5rem;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.875rem;
}

.btn-danger:hover {
  opacity: 0.9;
}

@media (max-width: 1024px) {
  .profile__layout {
    grid-template-columns: 1fr;
  }

  .profile__sidebar {
    position: static;
  }

  .user-card {
    margin-bottom: 1rem;
  }

  .profile-nav {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .profile-nav__item {
    flex: 1;
    min-width: 140px;
  }

  .profile-nav__item.logout-btn {
    flex: 0 0 100%;
    justify-content: center;
    margin-top: 0.5rem;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .order-expanded-grid {
    grid-template-columns: 1fr;
  }

  .order-addition-form {
    grid-template-columns: 1fr 1fr;
  }

  .addition-field--product {
    grid-column: 1 / -1;
  }

  .order-addition__add {
    grid-column: 1 / -1;
  }

  .addition-quote {
    grid-template-columns: 1fr;
  }

  .order-products-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .profile__hero {
    padding: 2rem 0;
  }

  .page-title {
    font-size: 1.75rem;
  }

  .profile-nav {
    flex-direction: column;
  }

  .profile-nav__item {
    min-width: auto;
    padding: 0.75rem;
    font-size: 0.875rem;
  }

  .profile-nav__item.logout-btn {
    flex: none;
  }

  .user-card {
    padding: 1rem;
  }

  .user-avatar {
    width: 44px;
    height: 44px;
    font-size: 0.875rem;
    border-radius: 10px;
  }

  .user-info h3 {
    font-size: 0.9rem;
  }

  .user-info p {
    font-size: 0.75rem;
  }

  .section-card {
    padding: 1.25rem;
    margin-bottom: 1rem;
  }

  .section-title {
    font-size: 1rem;
    margin-bottom: 1rem;
  }

  .info-grid {
    gap: 0.75rem;
  }

  .info-label {
    font-size: 0.7rem;
  }

  .info-value {
    font-size: 0.875rem;
  }

  .order-card__header {
    flex-direction: column;
    align-items: flex-start;
  }

  .order-metrics {
    grid-template-columns: 1fr;
  }

  .order-product-card {
    grid-template-columns: 64px 1fr;
  }

  .order-product-card__media {
    width: 64px;
    height: 64px;
  }

  .order-status-wrap {
    align-items: flex-start;
    width: 100%;
  }

  .order-delivery-status {
    width: 100%;
  }

  .payment-status {
    width: 100%;
  }

  .order-payment-alert {
    flex-direction: column;
    align-items: stretch;
  }

  .order-pay-button {
    width: 100%;
  }

  .order-addition {
    padding: 0.85rem;
  }

  .order-addition__head {
    flex-direction: column;
    align-items: stretch;
  }

  .order-addition__open {
    width: 100%;
  }

  .order-addition-form {
    grid-template-columns: 1fr;
  }

  .addition-field--product,
  .order-addition__add {
    grid-column: auto;
  }

  .addition-draft-item {
    grid-template-columns: 48px minmax(0, 1fr) 28px;
    align-items: start;
  }

  .addition-draft-item img {
    width: 48px;
    height: 48px;
  }

  .addition-draft-item__qty {
    grid-column: 2;
    width: 96px;
  }

  .addition-draft-item__sum {
    grid-column: 2;
  }

  .addition-draft-item__remove {
    grid-column: 3;
    grid-row: 1;
  }

  .addition-quote__rows > div {
    font-size: 0.82rem;
  }

  .order-addition-actions .btn {
    width: 100%;
  }

  .settings-form {
    gap: 0.875rem;
  }

  .form-group label {
    font-size: 0.7rem;
  }

  .btn-danger {
    width: 100%;
    padding: 0.75rem;
    font-size: 0.8rem;
  }
}
</style>
