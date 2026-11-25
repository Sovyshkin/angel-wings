<template>
  <div class="admin-layout" :class="{ 'is-collapsed': sidebarCollapsed, 'is-mobile-open': mobileMenuOpen }">
    <div v-if="mobileMenuOpen" class="sidebar-backdrop" @click="closeMobileMenu(true)" aria-hidden="true"></div>
    <aside ref="sidebarEl" class="admin-sidebar" aria-label="Навигация админ-панели" :role="mobileMenuOpen ? 'dialog' : undefined" :aria-modal="mobileMenuOpen ? 'true' : undefined" @keydown="handleSidebarKeydown">
      <router-link :to="authStore.landingPath" class="sidebar-brand" @click="closeMobileMenu">
        <img src="../assets/angel-wings-logo-light.svg" alt="" class="sidebar-logo">
        <span class="sidebar-brand-copy"><strong>ANGEL WINGS</strong><small>Панель управления</small></span>
      </router-link>
      <nav class="sidebar-navigation" aria-label="Разделы админ-панели" @mouseover="showNavTooltip" @mouseout="hideNavTooltip" @focusin="showNavTooltip" @focusout="hideNavTooltip">
          <template v-if="authStore.isAdmin || authStore.isStaff">
          <router-link v-if="authStore.can('DASHBOARD')" to="/dashboard" class="nav-item" @click="closeMobileMenu">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            </svg>
            <span class="nav-text">Dashboard</span>
          </router-link>
          <router-link v-if="authStore.can('PRODUCTS')" to="/products" class="nav-item" @click="closeMobileMenu">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            <span class="nav-text">Товары</span>
          </router-link>
          <router-link v-if="authStore.can('ANALYTICS')" to="/analytics" class="nav-item" @click="closeMobileMenu">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 3v18h18"/><rect x="7" y="12" width="3" height="5" rx="1"/><rect x="12" y="8" width="3" height="9" rx="1"/><rect x="17" y="5" width="3" height="12" rx="1"/>
            </svg>
            <span class="nav-text">Аналитика</span>
          </router-link>
          <router-link v-if="authStore.can('CATEGORIES') && !authStore.can('PRODUCTS')" to="/products/categories" class="nav-item" @click="closeMobileMenu">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
            </svg>
            <span class="nav-text">Категории</span>
          </router-link>
          </template>
          <router-link v-if="authStore.can('BLOG')" to="/blog" class="nav-item" @click="closeMobileMenu">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 3h12a4 4 0 0 1 4 4v14H8a4 4 0 0 0-4-4z"/><path d="M4 3v14a4 4 0 0 1 4 4M8 7h8M8 11h8"/></svg>
            <span class="nav-text">Блог</span>
          </router-link>
          <router-link v-if="authStore.can('FORUM')" to="/forum" class="nav-item" @click="closeMobileMenu">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M7 8h10M7 12h7M7 16h5"/></svg>
            <span class="nav-text">Розыгрыш</span>
            <span v-if="forumApplicationsCount" class="nav-badge">{{ forumApplicationsCount }}</span>
          </router-link>
          <template v-if="authStore.isAdmin || authStore.isStaff">
          <router-link v-if="authStore.can('ORDERS')" to="/orders" class="nav-item" @click="closeMobileMenu">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            <span class="nav-text">Заказы</span>
          </router-link>
          <router-link v-if="authStore.can('CONSULTATIONS')" to="/consultations" class="nav-item" @click="closeMobileMenu">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H11L6 20v-4.1a2.5 2.5 0 0 1-2-2.4v-8Z"/><path d="M8 9h8M8 12h5"/>
            </svg>
            <span class="nav-text">Консультации</span>
          </router-link>
          <router-link v-if="authStore.isAdmin" to="/users" class="nav-item" @click="closeMobileMenu">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
            </svg>
            <span class="nav-text">Пользователи</span>
          </router-link>
          <router-link v-if="authStore.isAdmin" to="/roles" class="nav-item" @click="closeMobileMenu">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2 4 6v6c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V6l-8-4Z"/><path d="M9 12h6M12 9v6"/></svg>
            <span class="nav-text">Роли</span>
          </router-link>
          <router-link v-if="authStore.can('POINTS')" to="/user-points" class="nav-item" @click="closeMobileMenu">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="9"/><path d="M12 7v10M8 11h8"/>
            </svg>
            <span class="nav-text">Баллы</span>
          </router-link>
          <router-link v-if="authStore.can('PARTNERS')" to="/partners" class="nav-item" @click="closeMobileMenu">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>
            </svg>
            <span class="nav-text">Партнёры</span>
          </router-link>
          <router-link v-if="authStore.can('APPLICATIONS')" to="/partner-applications" class="nav-item" @click="closeMobileMenu">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <path d="M14 2v6h6"/>
              <path d="M9 15h6M9 18h4"/>
            </svg>
            <span class="nav-text">Заявки</span>
            <span v-if="pendingApplicationsCount" class="nav-badge">{{ pendingApplicationsCount }}</span>
          </router-link>
          <router-link v-if="authStore.can('PAYOUTS')" to="/partner-payouts" class="nav-item" @click="closeMobileMenu">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/><path d="M7 15h4"/>
            </svg>
            <span class="nav-text">Выплаты</span>
          </router-link>
          <router-link v-if="authStore.can('DEALERS')" to="/dealers" class="nav-item" @click="closeMobileMenu">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 21h18"/>
              <path d="M5 21V7l8-4 6 4v14"/>
              <path d="M9 9h1M9 13h1M14 9h1M14 13h1"/>
              <path d="M10 21v-4h4v4"/>
            </svg>
            <span class="nav-text">Дилеры</span>
          </router-link>
          <router-link v-if="authStore.can('PROMO')" to="/promo-codes" class="nav-item" @click="closeMobileMenu">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/>
            </svg>
            <span class="nav-text">Промокоды</span>
          </router-link>
          <router-link v-if="authStore.can('EMAIL')" to="/email-campaigns" class="nav-item" @click="closeMobileMenu">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2z"/><polyline points="22,6 12,13 2,6"/>
            </svg>
            <span class="nav-text">Рассылки</span>
          </router-link>
          <router-link v-if="authStore.can('CDEK')" to="/cdek" class="nav-item" @click="closeMobileMenu">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
            </svg>
            <span class="nav-text">СДЭК</span>
          </router-link>
          </template>
      </nav>
      <div class="sidebar-footer">
        <button class="sidebar-collapse" type="button" :aria-label="sidebarCollapsed ? 'Раскрыть меню' : 'Свернуть меню'" :aria-expanded="!sidebarCollapsed" @click="toggleSidebar">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m14 6-6 6 6 6"/></svg>
          <span class="sidebar-collapse-label">Свернуть меню</span>
        </button>
        <button class="sidebar-mobile-close" type="button" aria-label="Закрыть меню" @click="closeMobileMenu">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </div>
    </aside>
    <div class="admin-workspace">
      <header class="admin-header">
        <div class="header-container">
          <button ref="mobileMenuButton" class="mobile-menu-btn" type="button" :aria-expanded="mobileMenuOpen" aria-label="Открыть меню" @click="openMobileMenu">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
          </button>
          <span class="header-brand">ANGEL WINGS</span>
          <div class="header-actions">
            <button class="theme-toggle" type="button" :aria-label="themeStore.isDark ? 'Включить светлую тему' : 'Включить тёмную тему'" @click="themeStore.toggle()">
              <svg v-if="themeStore.isDark" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72 1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
              <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"/></svg>
            </button>
            <span class="header-divider" aria-hidden="true"></span>
            <div ref="profileEl" class="profile-wrap">
              <button class="profile-trigger" type="button" :aria-expanded="profileOpen" aria-haspopup="menu" @click="profileOpen = !profileOpen">
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>
                <span class="user-name">{{ authStore.user?.name || 'Профиль' }}</span>
                <svg class="profile-chevron" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>
              </button>
              <div v-if="profileOpen" class="profile-menu" role="menu">
                <span class="profile-menu-name">{{ authStore.user?.name || 'Профиль' }}</span>
                <button type="button" role="menuitem" @click="logout">Выйти из аккаунта</button>
              </div>
            </div>
          </div>
        </div>
      </header>
      <main class="admin-main"><router-view /></main>
    </div>
    <Teleport to="body"><div v-if="tooltip.text && sidebarCollapsed && !mobileMenuOpen" class="sidebar-tooltip" :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }" role="tooltip">{{ tooltip.text }}</div></Teleport>
  </div>
</template>
<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import axios from 'axios'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../store/auth'
import { useThemeStore } from '../store/theme'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const themeStore = useThemeStore()
const SIDEBAR_STORAGE_KEY = 'angel-wings-admin-sidebar-collapsed'
let storedCollapsed = false
try { storedCollapsed = window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true' } catch { /* storage may be blocked */ }
const sidebarCollapsed = ref(storedCollapsed)
const mobileMenuOpen = ref(false)
const profileOpen = ref(false)
const tooltip = ref({ text: '', x: 0, y: 0 })
const pendingApplicationsCount = ref(0)
const forumApplicationsCount = ref(0)
const sidebarEl = ref(null)
const mobileMenuButton = ref(null)
const profileEl = ref(null)
let forumCountTimer = null
let previousBodyOverflow = ''

function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value
  tooltip.value.text = ''
  try { window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(sidebarCollapsed.value)) } catch { /* storage may be blocked */ }
}
function openMobileMenu() {
  mobileMenuOpen.value = true
  profileOpen.value = false
  nextTick(() => sidebarEl.value?.querySelector('.sidebar-mobile-close')?.focus())
}
function closeMobileMenu(restoreFocus = false) {
  if (!mobileMenuOpen.value) return
  mobileMenuOpen.value = false
  if (restoreFocus === true) nextTick(() => mobileMenuButton.value?.focus())
}
function showNavTooltip(event) {
  if (!sidebarCollapsed.value || window.matchMedia('(max-width: 1024px)').matches) return
  const link = event.target.closest?.('.nav-item')
  if (!link) return
  const text = link.querySelector('.nav-text')?.textContent?.trim()
  if (!text) return
  const box = link.getBoundingClientRect()
  tooltip.value = { text, x: box.right + 12, y: box.top + box.height / 2 }
}
function hideNavTooltip(event) {
  if (event.relatedTarget?.closest?.('.nav-item') === event.target.closest?.('.nav-item')) return
  tooltip.value.text = ''
}
function handleSidebarKeydown(event) {
  if (!mobileMenuOpen.value || event.key !== 'Tab') return
  const focusable = Array.from(sidebarEl.value?.querySelectorAll('a[href], button:not([disabled])') || [])
  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
}
function handleWindowKeydown(event) {
  if (event.key !== 'Escape') return
  if (mobileMenuOpen.value) closeMobileMenu(true)
  profileOpen.value = false
}
function handleDocumentClick(event) {
  if (profileOpen.value && !profileEl.value?.contains(event.target)) profileOpen.value = false
}
async function fetchPendingApplicationsCount() {
  if (!authStore.can('APPLICATIONS')) return
  try {
    const [partnerResult, contactResult, consultationResult] = await Promise.allSettled([
      axios.get('/api/admin/partner-applications', {
        params: { status: 'PENDING', limit: 1 }
      }),
      axios.get('/api/admin/contact-requests', {
        params: { status: 'NEW', limit: 1 }
      }),
      axios.get('/api/admin/consultations', {
        params: { status: 'NEW', limit: 1 }
      })
    ])
    const partnerCount = partnerResult.status === 'fulfilled' ? Number(partnerResult.value.data.pendingCount || 0) : 0
    const contactCount = contactResult.status === 'fulfilled' ? Number(contactResult.value.data.newCount || 0) : 0
    const consultationCount = consultationResult.status === 'fulfilled' ? Number(consultationResult.value.data.newCount || 0) : 0
    pendingApplicationsCount.value = partnerCount + contactCount + consultationCount
  } catch (error) {
    console.error('[ADMIN] failed to fetch applications count', error)
  }
}

async function fetchForumApplicationsCount() {
  if (!authStore.can('FORUM')) return
  try {
    const { data } = await axios.get('/api/forum/admin/applications', { params: { limit: 1 } })
    forumApplicationsCount.value = Number(data.newCount || 0)
  } catch (error) {
    console.error('[ADMIN] failed to fetch forum applications count', error)
  }
}

function handleForumApplicationsCount(event) {
  forumApplicationsCount.value = Number(event?.detail?.newCount || 0)
}

function handlePartnerApplicationsCount(event) {
  pendingApplicationsCount.value = Number(
    event?.detail?.totalCount ?? (
        Number(event?.detail?.pendingCount || 0) + Number(event?.detail?.contactCount || 0)
        + Number(event?.detail?.consultationCount || 0)
    )
  )
}

function logout() {
  authStore.logout()
  router.push('/login')
}

onMounted(() => {
  fetchPendingApplicationsCount()
  fetchForumApplicationsCount()
  if (authStore.can('FORUM')) forumCountTimer = window.setInterval(fetchForumApplicationsCount, 60_000)
  window.addEventListener('partner-applications-count', handlePartnerApplicationsCount)
  window.addEventListener('forum-applications-count', handleForumApplicationsCount)
  window.addEventListener('keydown', handleWindowKeydown)
  document.addEventListener('pointerdown', handleDocumentClick)
})
onBeforeUnmount(() => {
  if (forumCountTimer) window.clearInterval(forumCountTimer)
  window.removeEventListener('partner-applications-count', handlePartnerApplicationsCount)
  window.removeEventListener('forum-applications-count', handleForumApplicationsCount)
  window.removeEventListener('keydown', handleWindowKeydown)
  document.removeEventListener('pointerdown', handleDocumentClick)
  document.body.style.overflow = previousBodyOverflow
})
watch(mobileMenuOpen, (open) => {
  if (open) { previousBodyOverflow = document.body.style.overflow; document.body.style.overflow = 'hidden' }
  else document.body.style.overflow = previousBodyOverflow
})
watch(() => route.fullPath, () => {
  closeMobileMenu()
  profileOpen.value = false
  tooltip.value.text = ''
  fetchPendingApplicationsCount()
  fetchForumApplicationsCount()
})
</script>
<style scoped>
@import "./adminLayout.css";
</style>
