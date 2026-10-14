<template>
  <div class="app telegram-app">
    <header class="header">
      <div class="header__container">
        <router-link to="/catalog" class="header__logo" aria-label="Angel Wings — каталог">
          <img class="header-logo header-logo--wordmark" :src="theme.isDark ? '/angel-wings-wordmark-light.svg' : '/angel-wings-wordmark-dark.svg'" alt="Angel Wings" width="1030" height="200">
        </router-link>
        <nav class="header__nav" aria-label="Разделы магазина">
          <router-link class="nav-link" to="/catalog">Каталог</router-link>
          <router-link class="nav-link" to="/cart">Корзина</router-link>
          <router-link class="nav-link" to="/profile">Профиль</router-link>
          <router-link class="nav-link" to="/orders">Заказы</router-link>
        </nav>
        <div class="header__actions">
          <button class="theme-toggle" type="button" @click="theme.toggle()" :aria-label="theme.isDark ? 'Светлая тема' : 'Тёмная тема'">
            <svg v-if="theme.isDark" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
            <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
          </button>
          <router-link to="/cart" class="cart-btn" aria-label="Корзина">
            <svg class="cart-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
            <span v-if="cart.count" class="cart-count">{{ cart.count }}</span>
          </router-link>
        </div>
      </div>
    </header>

    <main v-if="ready"><router-view :key="route.fullPath" /></main>
    <main v-else class="telegram-auth-state" role="status">
      <div v-if="error">
        <h1>Не удалось войти через Telegram</h1>
        <p>{{ error }}</p>
        <button class="btn btn-primary" type="button" @click="authenticate">Повторить</button>
      </div>
      <p v-else>Входим через Telegram…</p>
    </main>

    <nav class="telegram-bottom-nav" aria-label="Основные разделы">
      <router-link to="/catalog">Каталог</router-link>
      <router-link to="/cart">Корзина <span v-if="cart.count">{{ cart.count }}</span></router-link>
      <router-link to="/profile">Профиль</router-link>
      <router-link to="/orders">Заказы</router-link>
    </nav>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
import { useAuthStore } from './store/auth.js'
import { useCartStore } from './store/cart.js'
import { useThemeStore } from './store/theme.js'

const route = useRoute()
const auth = useAuthStore()
const cart = useCartStore()
const theme = useThemeStore()
const ready = ref(false)
const error = ref('')
const webApp = window.Telegram?.WebApp

async function authenticate() {
  ready.value = false
  error.value = ''
  if (!webApp?.initData) {
    // A bank may return to this URL in an ordinary browser. Preserve the
    // already issued Telegram session solely for the payment result page.
    if (/^\/order-(success|failed)$/.test(route.path) && auth.isAuthenticated) {
      await auth.fetchUser()
      if (auth.isAuthenticated) {
        ready.value = true
        return
      }
    }
    error.value = 'Откройте приложение из Telegram через кнопку бота.'
    return
  }
  try {
    const { data } = await axios.post('/api/auth/telegram', { initData: webApp.initData })
    const previousTelegramId = localStorage.getItem('aw_tg_last_user_id')
    if (previousTelegramId && previousTelegramId !== String(data.user.telegramId)) {
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith('aw_tg_')) localStorage.removeItem(key)
      }
      cart.clear()
    }
    localStorage.setItem('aw_tg_last_user_id', String(data.user.telegramId))
    auth.setAuth(data.token, data.user)
    ready.value = true
  } catch (cause) {
    error.value = cause?.response?.data?.error || 'Проверьте подключение и попробуйте снова.'
  }
}

function onExpired() { authenticate() }
onMounted(() => {
  webApp?.ready()
  webApp?.expand()
  window.addEventListener('telegram-auth-expired', onExpired)
  authenticate()
})
onBeforeUnmount(() => window.removeEventListener('telegram-auth-expired', onExpired))
</script>
