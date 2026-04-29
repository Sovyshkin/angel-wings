<template>
  <div class="admin-layout">
    <header class="admin-header">
      <div class="header-container">
        <router-link to="/" class="header-logo">
          <img src="../assets/logo.jpg" alt="Logo" class="logo-img">
        </router-link>
        
        <nav class="admin-nav">
          <router-link to="/admin/dashboard" class="nav-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            </svg>
            Dashboard
          </router-link>
          <router-link to="/admin/products" class="nav-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            Товары
          </router-link>
          <router-link to="/admin/categories" class="nav-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
            </svg>
            Категории
          </router-link>
          <router-link to="/admin/orders" class="nav-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            Заказы
          </router-link>
          <router-link to="/admin/users" class="nav-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
            </svg>
            Пользователи
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
        
        <div class="mobile-menu" :class="{ open: mobileMenuOpen }">
          <nav class="mobile-menu__nav">
            <router-link to="/admin/dashboard" class="nav-link" @click="mobileMenuOpen = false">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
              </svg>
              Dashboard
            </router-link>
            <router-link to="/admin/products" class="nav-link" @click="mobileMenuOpen = false">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
              </svg>
              Товары
            </router-link>
            <router-link to="/admin/categories" class="nav-link" @click="mobileMenuOpen = false">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
              </svg>
              Категории
            </router-link>
            <router-link to="/admin/orders" class="nav-link" @click="mobileMenuOpen = false">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              Заказы
            </router-link>
            <router-link to="/admin/users" class="nav-link" @click="mobileMenuOpen = false">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
              </svg>
              Пользователи
            </router-link>
            <button @click="logout" class="nav-link logout-link">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Выйти
            </button>
          </nav>
        </div>
      </div>
    </header>
    
    <main class="admin-main">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../store/auth'
import { useThemeStore } from '../store/theme'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const themeStore = useThemeStore()
const mobileMenuOpen = ref(false)

function logout() {
  authStore.logout()
  router.push('/admin/login')
}
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
  margin: 0 auto;
  padding: 0 1.5rem;
  height: 64px;
  display: flex;
  align-items: center;
  gap: 2rem;
}

.header-logo {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.logo-img {
  height: 100px;
  width: auto;
  object-fit: contain;
}

.admin-nav {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex: 1;
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
}

.nav-item:hover {
  color: var(--text-primary);
  background: var(--bg-hover);
}

.nav-item.router-link-active {
  color: var(--accent);
  background: var(--accent-dim);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
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
  gap: 1rem;
}

.user-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
}

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.8125rem;
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

.mobile-menu-btn {
  display: none;
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

.mobile-menu {
  display: none;
  position: fixed;
  top: 64px;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--bg-primary);
  z-index: 99;
  overflow-y: auto;
  pointer-events: none;
  min-height: calc(100vh - 64px);
}

.mobile-menu.open {
  display: flex;
  flex-direction: column;
  z-index: 101;
  pointer-events: auto;
}

.mobile-menu__nav {
  display: flex;
  flex-direction: column;
  padding: 1rem;
  gap: 0.5rem;
  background: var(--bg-card);
  border-radius: 0 0 20px 20px;
  min-height: calc(100dvh - 64px);
}

.mobile-menu__nav .nav-link {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 1rem 1.25rem;
  font-size: 1rem;
  font-weight: 500;
  border-radius: 12px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  transition: all 0.2s ease;
  width: 100%;
  text-align: left;
  border: none;
  margin-bottom: 0.25rem;
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

.mobile-menu__nav .logout-link {
  margin-top: auto;
  color: var(--danger);
  background: transparent;
  border: 1px dashed var(--border);
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
</style>