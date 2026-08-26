<template>
  <div class="admin-layout">
    <header class="admin-header">
      <div class="header-container">
        <router-link to="/" class="header-logo">
          <img src="../assets/logo.jpg" alt="Logo" class="logo-img">
        </router-link>

        <nav class="admin-nav">
          <router-link to="/dashboard" class="nav-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            </svg>
            <span class="nav-text">Dashboard</span>
          </router-link>
          <router-link to="/products" class="nav-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            <span class="nav-text">Товары</span>
          </router-link>
          <router-link to="/analytics" class="nav-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 3v18h18"/><rect x="7" y="12" width="3" height="5" rx="1"/><rect x="12" y="8" width="3" height="9" rx="1"/><rect x="17" y="5" width="3" height="12" rx="1"/>
            </svg>
            <span class="nav-text">Аналитика</span>
          </router-link>
          <router-link to="/categories" class="nav-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
            </svg>
            <span class="nav-text">Категории</span>
          </router-link>
          <router-link to="/orders" class="nav-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            <span class="nav-text">Заказы</span>
          </router-link>
          <router-link to="/users" class="nav-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
            </svg>
            <span class="nav-text">Пользователи</span>
          </router-link>
          <router-link to="/partners" class="nav-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>
            </svg>
            <span class="nav-text">Партнёры</span>
          </router-link>
          <router-link to="/partner-applications" class="nav-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <path d="M14 2v6h6"/>
              <path d="M9 15h6M9 18h4"/>
            </svg>
            <span class="nav-text">Заявки</span>
            <span v-if="pendingApplicationsCount" class="nav-badge">{{ pendingApplicationsCount }}</span>
          </router-link>
          <router-link to="/partner-payouts" class="nav-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/><path d="M7 15h4"/>
            </svg>
            <span class="nav-text">Выплаты</span>
          </router-link>
          <router-link to="/promo-codes" class="nav-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/>
            </svg>
            <span class="nav-text">Промокоды</span>
          </router-link>
          <router-link to="/email-campaigns" class="nav-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2z"/><polyline points="22,6 12,13 2,6"/>
            </svg>
            <span class="nav-text">Рассылки</span>
          </router-link>
          <router-link to="/cdek" class="nav-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
            </svg>
            <span class="nav-text">СДЭК</span>
          </router-link>
        </nav>

        <div class="header-actions">
          <button class="theme-toggle" @click="themeStore.toggle()">
            <svg v-if="themeStore.isDark" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
            <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
            </svg>
          </button>

          <div class="user-menu">
            <span class="user-name">{{ authStore.user?.name }}</span>
            <button @click="logout" class="btn btn-secondary btn-sm">Выйти</button>
          </div>

          <button class="mobile-menu-btn" @click="mobileMenuOpen = !mobileMenuOpen">
            <svg v-if="!mobileMenuOpen" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
            <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>
    </header>

    <div class="mobile-menu" :class="{ open: mobileMenuOpen }" @click="mobileMenuOpen = false">
      <nav class="mobile-menu__nav" @click.stop>
        <button class="mobile-menu__close" @click="mobileMenuOpen = false">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
        <div class="mobile-menu__header">
          <img src="../assets/logo.jpg" alt="Logo" class="mobile-logo">
          <span class="mobile-menu__title">Админ-панель</span>
        </div>
        <div class="mobile-menu__links">
<router-link to="/dashboard" class="nav-link" @click="mobileMenuOpen = false">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
              </svg>
              Dashboard
            </router-link>
            <router-link to="/products" class="nav-link" @click="mobileMenuOpen = false">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
              </svg>
              Товары
            </router-link>
            <router-link to="/analytics" class="nav-link" @click="mobileMenuOpen = false">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 3v18h18"/><rect x="7" y="12" width="3" height="5" rx="1"/><rect x="12" y="8" width="3" height="9" rx="1"/><rect x="17" y="5" width="3" height="12" rx="1"/>
              </svg>
              Аналитика
            </router-link>
            <router-link to="/categories" class="nav-link" @click="mobileMenuOpen = false">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
              </svg>
              Категории
            </router-link>
            <router-link to="/orders" class="nav-link" @click="mobileMenuOpen = false">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              Заказы
            </router-link>
            <router-link to="/users" class="nav-link" @click="mobileMenuOpen = false">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
              </svg>
              Пользователи
            </router-link>
            <router-link to="/partners" class="nav-link" @click="mobileMenuOpen = false">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>
              </svg>
              Партнёры
            </router-link>
            <router-link to="/partner-applications" class="nav-link" @click="mobileMenuOpen = false">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <path d="M14 2v6h6"/>
                <path d="M9 15h6M9 18h4"/>
              </svg>
              Заявки партнёров
              <span v-if="pendingApplicationsCount" class="nav-badge nav-badge--mobile">{{ pendingApplicationsCount }}</span>
            </router-link>
            <router-link to="/partner-payouts" class="nav-link" @click="mobileMenuOpen = false">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/><path d="M7 15h4"/>
              </svg>
              Выплаты
            </router-link>
            <router-link to="/promo-codes" class="nav-link" @click="mobileMenuOpen = false">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/>
              </svg>
              Промокоды
            </router-link>
            <router-link to="/email-campaigns" class="nav-link" @click="mobileMenuOpen = false">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2z"/><polyline points="22,6 12,13 2,6"/>
              </svg>
              Рассылки
            </router-link>
            <router-link to="/cdek" class="nav-link" @click="mobileMenuOpen = false">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
              </svg>
              СДЭК
            </router-link>
            <button @click="logout" class="nav-link logout-link">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Выйти
            </button>
        </div>
      </nav>
    </div>

    <main class="admin-main">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import axios from 'axios'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../store/auth'
import { useThemeStore } from '../store/theme'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const themeStore = useThemeStore()
const mobileMenuOpen = ref(false)
const pendingApplicationsCount = ref(0)

async function fetchPendingApplicationsCount() {
  try {
    const { data } = await axios.get('/api/admin/partner-applications', {
      params: { status: 'PENDING', limit: 1 }
    })
    pendingApplicationsCount.value = Number(data.pendingCount || 0)
  } catch (error) {
    console.error('[ADMIN] failed to fetch partner applications count', error)
  }
}

function handlePartnerApplicationsCount(event) {
  pendingApplicationsCount.value = Number(event?.detail?.pendingCount || 0)
}

function logout() {
  authStore.logout()
  router.push('/login')
}

onMounted(() => {
  fetchPendingApplicationsCount()
  window.addEventListener('partner-applications-count', handlePartnerApplicationsCount)
})

onBeforeUnmount(() => {
  window.removeEventListener('partner-applications-count', handlePartnerApplicationsCount)
})

watch(() => route.fullPath, () => {
  fetchPendingApplicationsCount()
})
</script>

<style scoped>
.admin-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.admin-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--bg-card);
  border-bottom: 1px solid var(--border);
  backdrop-filter: blur(20px);
}

.header-container {
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
  padding: 0 1.5rem;
  height: 64px;
  display: flex;
  align-items: center;
  gap: clamp(0.75rem, 1.5vw, 2rem);
  min-width: 0;
}

.header-logo {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.logo-img {
  height: 36px;
  width: auto;
  object-fit: contain;
}

.admin-nav {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex: 1 1 auto;
  min-width: 0;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
}

.admin-nav::-webkit-scrollbar {
  display: none;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
  border-radius: var(--radius-sm);
  transition: var(--transition);
  flex: 0 0 auto;
  white-space: nowrap;
}

.nav-item:hover {
  color: var(--text-primary);
  background: var(--bg-hover);
}

.nav-item.router-link-active {
  color: var(--accent);
  background: var(--accent-dim);
}

.nav-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 0.4rem;
  border-radius: 999px;
  background: #ff6464;
  color: #fff;
  font-size: 0.72rem;
  font-weight: 800;
  line-height: 1;
  box-shadow: 0 0 0 3px rgba(255, 100, 100, 0.14);
}

.nav-badge--mobile {
  margin-left: auto;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: clamp(0.5rem, 1vw, 1rem);
  margin-left: auto;
  flex: 0 0 auto;
  min-width: 0;
}

.theme-toggle {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  transition: var(--transition);
}

.theme-toggle:hover {
  background: var(--accent);
  border-color: var(--accent);
}

.user-menu {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
}

.user-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
  max-width: clamp(90px, 10vw, 180px);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.8125rem;
  flex-shrink: 0;
}

.admin-main {
  flex: 1;
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

@media (max-width: 1024px) {
  .admin-nav {
    display: none;
  }

  .mobile-menu-btn {
    display: flex;
  }

  .nav-text {
    display: none;
  }

  .nav-item {
    padding: 0.625rem 0.75rem;
  }
}

.mobile-menu-btn {
  width: 40px;
  height: 40px;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  transition: var(--transition);
  flex-shrink: 0;
}

.mobile-menu-btn:hover {
  background: var(--accent);
  border-color: var(--accent);
}

@media (min-width: 1025px) {
  .mobile-menu-btn {
    display: none;
  }
}

.mobile-menu-btn:hover {
  background: var(--accent);
  border-color: var(--accent);
}

@media (max-width: 768px) {
  .header-container {
    padding: 0 1rem;
    gap: 1rem;
  }

  .user-name {
    display: none;
  }

  .admin-main {
    padding: 1.5rem 1rem;
  }
}

.mobile-menu {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  z-index: 100;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
  pointer-events: none;
}

.mobile-menu.open {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
}

@media (min-width: 1025px) {
  .mobile-menu {
    display: none;
  }
}

.mobile-menu__nav {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 85%;
  max-width: 320px;
  display: flex;
  flex-direction: column;
  background: var(--bg-card);
  padding: 1rem;
  transform: translateX(100%);
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  overflow-y: auto;
}

.mobile-menu.open .mobile-menu__nav {
  transform: translateX(0);
}

.mobile-menu__close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  align-self: flex-end;
}

.mobile-menu__header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 0 1.5rem;
  margin-bottom: 0.5rem;
  border-bottom: 1px solid var(--border);
}

.mobile-logo {
  height: 40px;
  width: auto;
  object-fit: contain;
}

.mobile-menu__title {
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-secondary);
}

.mobile-menu__links {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}

.mobile-menu__nav .nav-link {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 1rem 1rem;
  font-size: 1rem;
  font-weight: 500;
  border-radius: 12px;
  color: var(--text-primary);
  transition: all 0.2s ease;
  width: 100%;
  text-align: left;
  border: none;
  background: transparent;
}

.mobile-menu__nav .nav-link:hover {
  background: var(--bg-hover);
}

.mobile-menu__nav .nav-link.router-link-active {
  background: var(--accent-dim);
  color: var(--accent);
}

.mobile-menu__nav .nav-link svg {
  flex-shrink: 0;
  color: var(--text-muted);
  transition: color 0.2s ease;
}

.mobile-menu__nav .nav-link:hover svg,
.mobile-menu__nav .nav-link.router-link-active svg {
  color: var(--accent);
}

.mobile-menu__footer {
  padding-top: 1rem;
  border-top: 1px solid var(--border);
  margin-top: auto;
}

.mobile-menu__nav .logout-link {
  color: var(--danger);
  background: transparent;
  border: 1px dashed var(--border);
  justify-content: center;
}

.mobile-menu__nav .logout-link:hover {
  background: var(--danger);
  color: white;
  border-color: var(--danger);
}

.mobile-menu__nav .logout-link svg {
  color: var(--danger);
}

.mobile-menu__nav .logout-link:hover svg {
  color: white;
}

@media (max-width: 768px) {
  .header-actions .theme-toggle,
  .header-actions .user-menu {
    display: none;
  }
}
</style>
