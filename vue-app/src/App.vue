<template>
  <div class="app">
    <PageLoader />
    <div class="cursor-snake">
      <svg width="100%" height="100%">
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <linearGradient id="snakeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="var(--accent)" stop-opacity="0"/>
            <stop offset="20%" stop-color="var(--accent)" stop-opacity="0.8"/>
            <stop offset="80%" stop-color="var(--accent)" stop-opacity="0.8"/>
            <stop offset="100%" stop-color="var(--accent)" stop-opacity="0"/>
          </linearGradient>
        </defs>
        <path fill="none" stroke="url(#snakeGrad)" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" filter="url(#glow)"/>
      </svg>
    </div>
    <header class="header">
      <div class="header__container">
        <router-link to="/" class="header__logo">
          <svg class="logo-icon" width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path d="M14 2L4 8v12l10 6 10-6V8L14 2z" stroke="currentColor" stroke-width="2" fill="none"/>
            <path d="M14 8l-6 3.5v7L14 22l6-3.5v-7L14 8z" fill="currentColor" opacity="0.3"/>
            <circle cx="14" cy="14" r="3" fill="currentColor"/>
          </svg>
          <span class="logo-text">ANGEL WINGS</span>
        </router-link>
        <nav class="header__nav">
          <router-link to="/" class="nav-link">Главная</router-link>
          <router-link to="/catalog" class="nav-link">Каталог</router-link>
        </nav>
        <div class="header__actions">
          <button class="theme-toggle" @click="themeStore.toggle()" :title="themeStore.isDark ? 'Светлая тема' : 'Тёмная тема'">
            <svg v-if="themeStore.isDark" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1" x2="12" y2="3"/>
              <line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/>
              <line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
            <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
            </svg>
          </button>

          <router-link v-if="authStore.isAuthenticated" to="/profile" class="user-btn" :title="authStore.user?.name">
            <span class="user-avatar">{{ getInitials }}</span>
          </router-link>

          <router-link v-else to="/auth" class="auth-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            <span>Войти</span>
          </router-link>

          <router-link to="/cart" class="cart-btn">
            <svg class="cart-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
            <span class="cart-count" v-if="cartStore.items.length">{{ cartStore.items.length }}</span>
          </router-link>

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
            <router-link to="/" class="nav-link" @click="mobileMenuOpen = false">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
              </svg>
              Главная
            </router-link>
            <router-link to="/catalog" class="nav-link" @click="mobileMenuOpen = false">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
              </svg>
              Каталог
            </router-link>
            <router-link v-if="authStore.isAuthenticated" to="/profile" class="nav-link" @click="mobileMenuOpen = false">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
              Профиль
            </router-link>
            <router-link v-else to="/auth" class="nav-link" @click="mobileMenuOpen = false">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
              Войти
            </router-link>
            <router-link to="/cart" class="nav-link" @click="mobileMenuOpen = false">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 00-8 0"/>
              </svg>
              Корзина
              <span class="mobile-cart-count" v-if="cartStore.items.length">{{ cartStore.items.length }}</span>
            </router-link>
            <button class="nav-link theme-link" @click="themeStore.toggle(); mobileMenuOpen = false">
              <svg v-if="themeStore.isDark" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
              <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
              </svg>
              {{ themeStore.isDark ? 'Светлая тема' : 'Тёмная тема' }}
            </button>
          </nav>
        </div>
      </div>
    </header>
    <main class="main">
      <router-view />
    </main>
    <footer class="footer">
      <div class="footer__container">
        <div class="footer__grid">
          <div class="footer__col footer__col--brand">
            <div class="footer__logo">Peptidi</div>
            <p class="footer__desc">Высокочистые пептиды для научных исследований и персональной оптимизации. GMP-сертифицированное производство.</p>
            <div class="footer__social">
              <a href="#" class="social-link" aria-label="Telegram">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.03-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.37.09 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/></svg>
              </a>
              <a href="#" class="social-link" aria-label="WhatsApp">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.471-.1-.661-.216-.306-.3-.478-.31-.63-.025-.21.069-.437.26-.73.164-.27.298-.305.4-.305h.203c.178 0 .304.069.405.178.071.079.227.26.227.52.006.168-.008.347.032.52l.026.05c.099.173.297.406.426.56.13.152.265.2.371.126.096-.066.415-.446.53-.73.128-.317.148-.66.11-.92-.054-.37-.21-.543-.36-.75-.125-.176-.256-.203-.411-.15-.169.059-.99.463-1.923.873-.606.267-1.14.385-1.576.322-.315-.045-.978-.3-1.32-.952-.265-.506-.264-1.06-.185-1.5.108-.597.725-.996 1.364-1.442.74-.514 1.647-.793 2.662-.793.196 0 .392.02.57.062.357.083.714.285 1.05.557-.213.052-.47.082-.727.082l-.002.002z"/></svg>
              </a>
              <a href="#" class="social-link" aria-label="Instagram">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
            </div>
          </div>
          
          <div class="footer__col">
            <h4 class="footer__title">Каталог</h4>
            <ul class="footer__links">
              <li><router-link to="/catalog?category=longevitiya">Долголетие</router-link></li>
              <li><router-link to="/catalog?category=immunomodulyatory">Иммуномодуляторы</router-link></li>
              <li><router-link to="/catalog?category=neiropeptide">Нейропептиды</router-link></li>
              <li><router-link to="/catalog?category=growth">Факторы роста</router-link></li>
              <li><router-link to="/catalog">Все товары</router-link></li>
            </ul>
          </div>
          
          <div class="footer__col">
            <h4 class="footer__title">Информация</h4>
            <ul class="footer__links">
              <li><a href="#">О компании</a></li>
              <li><a href="#">Доставка и оплата</a></li>
              <li><a href="#">Гарантии</a></li>
              <li><a href="#">Частые вопросы</a></li>
              <li><a href="#">Контакты</a></li>
            </ul>
          </div>
          
          <div class="footer__col">
            <h4 class="footer__title">Контакты</h4>
            <div class="footer__contact">
              <div class="contact-item">
                <span class="contact-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>
                </span>
                <span>+7 (800) 555-35-35</span>
              </div>
              <div class="contact-item">
                <span class="contact-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                </span>
                <span>info@peptidi.shop</span>
              </div>
              <div class="contact-item">
                <span class="contact-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                </span>
                <span>Москва, Россия</span>
              </div>
              <div class="contact-item">
                <span class="contact-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </span>
                <span>Поддержка: 24/7</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="footer__bottom">
          <div class="footer__payments">
            <span class="payment-label">Способы оплаты:</span>
            <div class="payment-icons">
              <span class="payment-icon">💳</span>
              <span class="payment-icon">₿</span>
              <span class="payment-icon">PayPal</span>
            </div>
          </div>
          <p class="footer__copyright">© 2026 Peptidi Shop. Все права защищены.</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useCartStore } from './store/cart'
import { useThemeStore } from './store/theme'
import { useAuthStore } from './store/auth'
import PageLoader from './components/PageLoader.vue'

const cartStore = useCartStore()
const themeStore = useThemeStore()
const authStore = useAuthStore()
const mobileMenuOpen = ref(false)

const getInitials = computed(() => {
  if (!authStore.user?.name) return '?'
  return authStore.user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
})

onMounted(() => {
  if (window.matchMedia('(pointer: fine)').matches) {
    const snake = document.querySelector('.cursor-snake')
    const path = snake.querySelector('path')
    
    const maxSegments = 12
    const segLength = 200 / maxSegments
    const points = Array.from({ length: maxSegments + 1 }, () => ({ x: 0, y: 0 }))
    let mx = 0, my = 0, lastMove = Date.now()
    
    document.addEventListener('mousemove', (e) => { 
      mx = e.clientX; my = e.clientY
      lastMove = Date.now()
    })
    
    function animate() {
      const elapsed = Date.now() - lastMove
      const shrink = elapsed > 100 ? Math.max(0, 1 - (elapsed - 100) / 400) : 1
      
      points[0].x += (mx - points[0].x) * 0.5
      points[0].y += (my - points[0].y) * 0.5
      
      for (let i = 1; i <= maxSegments; i++) {
        const prev = points[i - 1], curr = points[i]
        curr.x += (prev.x - curr.x) * 0.2
        curr.y += (prev.y - curr.y) * 0.2
        const dx = curr.x - prev.x
        const dy = curr.y - prev.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist > segLength) {
          const ratio = (dist - segLength) / dist * 0.5
          curr.x -= dx * ratio
          curr.y -= dy * ratio
        }
      }
      
      const activeSeg = Math.max(1, Math.ceil(shrink * maxSegments))
      
      let d = `M ${points[0].x} ${points[0].y}`
      for (let i = 1; i <= activeSeg; i++) {
        const p1 = points[i - 1], p2 = points[i]
        d += ` Q ${p1.x} ${p1.y} ${(p1.x + p2.x) / 2} ${(p1.y + p2.y) / 2}`
      }
      path.setAttribute('d', d)
      path.setAttribute('stroke-width', String(14))
      snake.style.opacity = '1'
      
      requestAnimationFrame(animate)
    }
    animate()
  }
})
</script>

<style>
* { cursor: none !important; }

.cursor-snake {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 99999;
  opacity: 0;
  overflow: visible;
  max-width: 100vw;
}

.cursor-snake svg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  max-width: 100vw;
}

.cursor-snake path {
  transition: stroke-width 0.15s;
}

@media (pointer: coarse) {
  .cursor-snake { display: none; }
}
</style>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--bg-card);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border);
  transition: background 0.4s ease, border-color 0.4s ease;
}

.header__container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 72px;
  gap: 1rem;
}

.header__logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
  flex-shrink: 0;
}

.logo-icon {
  color: var(--accent);
  transition: color 0.4s ease;
  width: 24px;
  height: 24px;
}

.logo-text {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 1.25rem;
  letter-spacing: 0.2em;
  color: var(--text-primary);
  transition: color 0.4s ease;
}

.header__nav {
  display: flex;
  gap: 2.5rem;
}

.nav-link {
  font-family: var(--font-body);
  font-weight: 500;
  font-size: 0.875rem;
  color: var(--text-secondary);
  text-decoration: none;
  transition: color 0.3s ease;
  letter-spacing: 0.05em;
}

.nav-link:hover,
.nav-link.router-link-active {
  color: var(--accent);
}

.header__actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.theme-toggle {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 12px;
  color: var(--text-primary);
  transition: all 0.3s ease;
}

.theme-toggle:hover {
  background: var(--accent);
  border-color: var(--accent);
}

.user-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
}

.user-avatar {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent);
  color: #ffffff;
  font-family: var(--font-display);
  font-size: 0.875rem;
  font-weight: 700;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.user-btn:hover .user-avatar {
  transform: scale(1.05);
  box-shadow: 0 4px 15px rgba(163, 255, 18, 0.3);
}

.auth-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 12px;
  color: var(--text-primary);
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.3s ease;
}

.auth-btn:hover {
  background: var(--accent);
  border-color: var(--accent);
}

.cart-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  text-decoration: none;
  transition: all 0.3s ease;
}

.cart-btn:hover {
  background: var(--accent);
  border-color: var(--accent);
}

.cart-icon {
  color: var(--text-primary);
  transition: color 0.3s ease;
}

.cart-count {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  background: var(--accent);
  color: var(--text-primary);
  font-family: var(--font-body);
  font-weight: 700;
  font-size: 0.65rem;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.main {
  flex: 1;
}

.footer {
  background: var(--bg-card);
  border-top: 1px solid var(--border);
  padding: 4rem 0 2rem;
  margin-top: 4rem;
  transition: background 0.4s ease, border-color 0.4s ease;
}

.footer__container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
}

.footer__grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1.5fr;
  gap: 4rem;
  margin-bottom: 3rem;
}

.footer__col--brand {
  padding-right: 2rem;
}

.footer__logo {
  font-family: var(--font-display);
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--accent);
  margin-bottom: 1rem;
}

.footer__desc {
  font-size: 0.875rem;
  color: var(--text-secondary);
  line-height: 1.7;
  margin-bottom: 1.5rem;
}

.footer__social {
  display: flex;
  gap: 0.75rem;
}

.social-link {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  border-radius: 10px;
  color: var(--text-secondary);
  transition: all 0.3s ease;
}

.social-link:hover {
  background: var(--accent);
  color: var(--bg-primary);
  transform: translateY(-3px);
}

.footer__title {
  font-family: var(--font-display);
  font-size: 0.9rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-primary);
  margin-bottom: 1.5rem;
}

.footer__links {
  list-style: none;
  padding: 0;
  margin: 0;
}

.footer__links li {
  margin-bottom: 0.75rem;
}

.footer__links a {
  font-size: 0.875rem;
  color: var(--text-secondary);
  transition: color 0.3s ease;
}

.footer__links a:hover {
  color: var(--accent);
}

.footer__contact {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.contact-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent-dim);
  border-radius: 8px;
  color: var(--accent);
  flex-shrink: 0;
}

.footer__bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 2rem;
  border-top: 1px solid var(--border);
}

.footer__payments {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.payment-label {
  font-size: 0.75rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.payment-icons {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.payment-icon {
  padding: 0.35rem 0.6rem;
  background: var(--bg-secondary);
  border-radius: 6px;
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.footer__copyright {
  font-family: var(--font-body);
  font-size: 0.8rem;
  color: var(--text-muted);
  letter-spacing: 0.05em;
  transition: color 0.4s ease;
}

.mobile-menu-btn {
  display: none;
  width: 36px;
  height: 36px;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text-primary);
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.mobile-menu {
  visibility: hidden;
  opacity: 0;
}

.mobile-menu__nav {
  display: none;
}

@media (max-width: 768px) {
  .mobile-menu-btn {
    display: flex;
  }

  .header__actions {
    gap: 0.375rem;
  }

  .theme-toggle,
  .user-btn .user-avatar,
  .cart-btn {
    display: none;
  }

  .mobile-menu {
    visibility: hidden;
    opacity: 0;
    position: fixed;
    top: 64px;
    left: 0;
    right: 0;
    bottom: 0;
    background: var(--bg-primary);
    z-index: 99;
    overflow-y: auto;
    display: none;
  }

  .mobile-menu.open {
    visibility: visible;
    opacity: 1;
    display: block;
  }

  .mobile-menu__nav {
    display: flex;
    flex-direction: column;
    padding: 1rem;
    gap: 0.5rem;
    background: var(--bg-card);
    border-radius: 0 0 20px 20px;
    min-height: auto;
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

  .mobile-cart-count {
    margin-left: auto;
    background: var(--accent);
    color: var(--bg-primary);
    font-size: 0.7rem;
    font-weight: 700;
    padding: 0.2rem 0.5rem;
    border-radius: 10px;
  }

  .theme-link {
    margin-top: 0.5rem;
    background: var(--bg-primary);
    border: 1px dashed var(--border);
  }
}

@media (max-width: 1024px) {
  .footer__grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 2rem;
  }

  .footer__col--brand {
    grid-column: span 2;
    padding-right: 0;
  }
}

@media (max-width: 768px) {
  .header__nav {
    display: none;
  }

  .auth-btn span {
    display: none;
  }

  .header__container {
    padding: 0 0.75rem;
    gap: 0.5rem;
    height: 64px;
  }

  .header__logo {
    gap: 0.5rem;
  }

  .logo-icon {
    width: 24px;
    height: 24px;
  }

  .logo-text {
    font-size: 1rem;
    letter-spacing: 0.1em;
  }

  .footer {
    padding: 2rem 0 1rem;
    margin-top: 2rem;
  }

  .footer__grid {
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
  }

  .footer__col--brand {
    grid-column: span 2;
    padding-right: 0;
  }

  .footer__logo {
    font-size: 1.25rem;
  }

  .footer__desc {
    font-size: 0.8rem;
  }

  .footer__social {
    justify-content: flex-start;
  }

  .footer__title {
    font-size: 0.75rem;
    margin-bottom: 1rem;
  }

  .footer__links a {
    font-size: 0.8rem;
  }

  .contact-item {
    font-size: 0.8rem;
  }

  .footer__bottom {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
}
</style>