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
                <div v-for="order in orders" :key="order.id" class="order-item">
                  <div class="order-header">
                    <span class="order-id">Заказ #{{ order.id }}</span>
                    <span class="order-status" :class="order.status">{{ order.statusText }}</span>
                  </div>
                  <div class="order-details">
                    <span>{{ order.date }}</span>
                    <span>{{ order.total.toLocaleString() }} ₽</span>
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
                      </div>
                    </div>
                    <div class="order-items">
                      <h4>Состав заказа</h4>
                      <div v-if="!order.items?.length" class="order-item-row empty">Позиции заказа не найдены</div>
                      <div v-for="item in order.items" :key="item.id" class="order-item-row">
                        <div class="order-item-main">
                          <span class="order-item-title">{{ item.product?.title || `Товар #${item.productId}` }}</span>
                          <span v-if="item.dosage" class="order-item-dosage">{{ item.dosage }}</span>
                        </div>
                        <div class="order-item-meta">
                          <span>{{ item.quantity }} шт</span>
                          <span>{{ formatCurrency(item.price) }}</span>
                          <span>{{ formatCurrency((item.price || 0) * (item.quantity || 0)) }}</span>
                        </div>
                      </div>
                    </div>
                    <div class="order-note" v-if="order.notes">
                      <h4>Комментарий</h4>
                      <p>{{ order.notes }}</p>
                    </div>
                  </div>
                </div>
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

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const activeTab = ref('info')
const orders = ref([])
const successMessage = ref('')
const expandedOrderId = ref(null)

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
    if (tab.role === 'PARTNER') return authStore.user?.role === 'PARTNER' || authStore.user?.role === 'ADMIN'
    return true
  })
})

function mapOrderStatus(status) {
  const normalized = String(status || '').toUpperCase()
  if (normalized === 'DELIVERED') return { css: 'completed', text: 'Выполнен' }
  if (normalized === 'CANCELLED') return { css: 'cancelled', text: 'Отменён' }
  return { css: 'pending', text: 'В обработке' }
}

function formatCurrency(value) {
  return `${Number(value || 0).toLocaleString('ru-RU')} ₽`
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

onMounted(() => {
  if (!authStore.isAuthenticated) {
    router.push('/auth')
    return
  }

  const tabParam = route.query.tab
  if (tabParam && tabs.some(t => t.id === tabParam)) {
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
  gap: 1rem;
}

.order-item {
  padding: 1.25rem;
  background: var(--bg-secondary);
  border-radius: 12px;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.order-id {
  font-family: var(--font-mono);
  font-weight: 600;
}

.order-status {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  padding: 0.25rem 0.75rem;
  border-radius: 100px;
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

.order-details {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.order-toggle {
  margin-top: 0.8rem;
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text-primary);
  padding: 0.45rem 0.75rem;
  border-radius: 8px;
  font-size: 0.8rem;
  cursor: pointer;
}

.order-toggle:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.order-expanded {
  margin-top: 0.9rem;
  border-top: 1px solid var(--border);
  padding-top: 0.9rem;
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

.order-items {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.order-item-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.65rem;
  background: var(--bg-primary);
  border: 1px solid var(--border);
  border-radius: 10px;
}

.order-item-row.empty {
  color: var(--text-muted);
}

.order-item-main {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  flex-wrap: wrap;
}

.order-item-title {
  font-weight: 600;
}

.order-item-dosage {
  font-size: 0.8rem;
  padding: 0.18rem 0.5rem;
  border-radius: 999px;
  background: var(--accent-dim);
  color: var(--accent);
}

.order-item-meta {
  display: grid;
  grid-template-columns: repeat(3, auto);
  gap: 0.8rem;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.order-note p {
  color: var(--text-secondary);
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
