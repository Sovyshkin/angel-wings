<template>
  <div class="profile">
    <div class="profile__hero">
      <div class="container">
        <h1 class="page-title">Личный кабинет</h1>
      </div>
    </div>
    
    <div class="container">
      <div class="profile__layout">
        <aside class="profile__sidebar">
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
              v-for="tab in tabs" 
              :key="tab.id"
              class="profile-nav__item"
              :class="{ active: activeTab === tab.id }"
              @click="activeTab = tab.id"
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
        
        <div class="profile__content">
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
                  <span class="info-label">Дата регистрации</span>
                  <span class="info-value">{{ formatDate(authStore.user?.registered) }}</span>
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
import { useRouter } from 'vue-router'
import { useAuthStore } from '../store/auth'

const router = useRouter()
const authStore = useAuthStore()

const activeTab = ref('info')
const orders = ref([])
const successMessage = ref('')

const tabs = [
  { id: 'info', label: 'Мои данные', icon: '<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>' },
  { id: 'orders', label: 'Заказы', icon: '<path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>' },
  { id: 'settings', label: 'Настройки', icon: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>' }
]

const editForm = ref({
  name: '',
  email: '',
  phone: '',
  newPassword: ''
})

const getInitials = computed(() => {
  if (!authStore.user?.name) return '?'
  return authStore.user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
})

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

function updateProfile() {
  const updatedUser = {
    ...authStore.user,
    name: editForm.value.name,
    phone: editForm.value.phone
  }
  authStore.updateUser(updatedUser)
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
  editForm.value = {
    name: authStore.user?.name || '',
    email: authStore.user?.email || '',
    phone: authStore.user?.phone || '',
    newPassword: ''
  }
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
  background: rgba(163, 255, 18, 0.15);
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
  background: rgba(163, 255, 18, 0.1);
  border: 1px solid rgba(163, 255, 18, 0.2);
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
}

@media (max-width: 640px) {
  .profile__hero {
    padding: 2rem 0;
  }

  .profile-nav {
    flex-direction: column;
  }

  .profile-nav__item {
    min-width: auto;
  }

  .profile-nav__item.logout-btn {
    flex: none;
  }

  .user-card {
    padding: 1rem;
  }

  .user-avatar {
    width: 48px;
    height: 48px;
    font-size: 1rem;
  }

  .section-card {
    padding: 1.5rem;
  }

  .section-title {
    font-size: 1.1rem;
  }

  .info-grid {
    gap: 1rem;
  }

  .settings-form {
    gap: 1rem;
  }

  .btn-danger {
    width: 100%;
  }
}
</style>