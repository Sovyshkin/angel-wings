<template>
    <div
      class="app"
      :class="[
        `app--molecule-${moleculeTransition.stage}`,
        { 'app--has-global-dock': showGlobalDock }
      ]"
      :data-route="route.path"
    >
    <PageLoader />
    <div ref="cursorRoot" class="cursor-goo" aria-hidden="true">
      <svg class="cursor-goo__filter" width="0" height="0" focusable="false">
        <defs>
          <filter id="cursor-goo-filter">
            <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 28 -11"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>
      <span
        v-for="(_, index) in cursorDots"
        :key="index"
        :ref="el => setCursorDotRef(el, index)"
      ></span>
    </div>
    <div
      v-if="pointsToast"
      class="points-toast"
      :class="{ 'points-toast--closing': pointsToastClosing }"
      role="status"
      aria-live="polite"
    >
      <div>
        <span>Баллы начислены</span>
        <strong>+{{ pointsToast.amount.toLocaleString('ru-RU') }} баллов</strong>
        <p>{{ pointsToast.message || 'Баллы уже доступны для списания в корзине.' }}</p>
      </div>
      <router-link to="/profile?tab=points" class="points-toast__link" @click="dismissPointsToast">Открыть</router-link>
      <button class="points-toast__close" @click="dismissPointsToast" aria-label="Закрыть уведомление">
          <img src="/orthodox-cross-close-mask.png" alt="">
      </button>
    </div>
    <header class="header">
      <div class="header__container">
        <router-link to="/" class="header__logo">
          <img
            class="header-logo"
            src="/logo-192.webp"
            alt=""
            width="192"
            height="192"
            fetchpriority="high"
            decoding="async"
          >
          <span class="logo-text">ANGEL WINGS</span>
        </router-link>
        <nav class="header__nav">
          <router-link to="/" class="nav-link">Главная</router-link>
          <router-link to="/about" class="nav-link" @click.prevent="beginAboutTransition">О нас</router-link>
          <router-link to="/catalog" class="nav-link">Каталог</router-link>
          <router-link to="/dealers" class="nav-link">Дилеры</router-link>
          <router-link to="/#faq" class="nav-link">FAQ</router-link>
          <router-link to="/partnership" class="nav-link">Партнерам</router-link>
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

          <router-link to="/cart" class="mobile-cart-btn" @click="closeMobileMenu" aria-label="Корзина">
            <svg class="cart-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
            <span class="mobile-header-cart-count" v-if="cartStore.items.length">{{ cartStore.items.length }}</span>
          </router-link>

          <button class="mobile-menu-btn" @click.stop="toggleMobileMenu">
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
    
    <!-- Mobile Menu - Outside header -->
    <div class="mobile-menu" :class="{ open: mobileMenuOpen }">
      <nav class="mobile-menu__nav">
        <router-link to="/" class="nav-link" @click="closeMobileMenu">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
          </svg>
          Главная
        </router-link>
        <router-link to="/about" class="nav-link" @click.prevent="beginAboutTransition(true)">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 16v-4M12 8h.01"/>
          </svg>
          О нас
        </router-link>
        <router-link to="/catalog" class="nav-link" @click="closeMobileMenu">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
          </svg>
          Каталог
        </router-link>
        <router-link to="/partnership" class="nav-link" @click="closeMobileMenu">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M16 21v-2a4 4 0 00-8 0v2"/>
            <circle cx="12" cy="7" r="4"/>
            <path d="M22 21v-2a4 4 0 00-3-3.87"/>
            <path d="M16 3.13a4 4 0 010 7.75"/>
            <path d="M2 21v-2a4 4 0 013-3.87"/>
            <path d="M8 3.13a4 4 0 000 7.75"/>
          </svg>
          Партнерам
        </router-link>
        <router-link to="/dealers" class="nav-link" @click="closeMobileMenu">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 21h18"/>
            <path d="M5 21V7l8-4 6 4v14"/>
            <path d="M9 9h1M9 13h1M14 9h1M14 13h1"/>
            <path d="M10 21v-4h4v4"/>
          </svg>
          Дилеры
        </router-link>
        <router-link to="/#faq" class="nav-link" @click="closeMobileMenu">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M9.09 9a3 3 0 115.82 1c0 2-3 2-3 4"/>
            <path d="M12 17h.01"/>
          </svg>
          FAQ
        </router-link>
        <router-link v-if="authStore.isAuthenticated" to="/profile" class="nav-link" @click="closeMobileMenu">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
          </svg>
          Профиль
        </router-link>
        <router-link v-else to="/auth" class="nav-link" @click="closeMobileMenu">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
          </svg>
          Войти
        </router-link>
        <router-link to="/cart" class="nav-link" @click="closeMobileMenu">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 00-8 0"/>
          </svg>
          Корзина
          <span class="mobile-cart-count" v-if="cartStore.items.length">{{ cartStore.items.length }}</span>
        </router-link>
        <button class="nav-link theme-link" @click="themeStore.toggle(); closeMobileMenu()">
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
    <main class="main">
      <router-view />
    </main>

    <nav
      v-if="showGlobalDock"
      class="global-dock"
      :style="{ '--global-dock-active-index': activeGlobalDockIndex }"
      aria-label="Основная навигация"
    >
      <span class="global-dock__active-pill" aria-hidden="true"></span>
      <router-link
        v-for="item in globalDockItems"
        :key="item.to"
        :to="item.to"
        class="global-dock__item"
        :class="{ 'is-active': isGlobalDockItemActive(item) }"
        :aria-current="isGlobalDockItemActive(item) ? 'page' : undefined"
        @click="closeMobileMenu"
      >
        <svg v-if="item.icon === 'home'" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="m3.5 10 8.5-7 8.5 7v10.25a.75.75 0 0 1-.75.75H4.25a.75.75 0 0 1-.75-.75V10Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
          <path d="M9 21v-6h6v6" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
        </svg>
        <svg v-else-if="item.icon === 'catalog'" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="3.5" y="3.5" width="6.5" height="6.5" rx="1.2" stroke="currentColor" stroke-width="1.7"/>
          <rect x="14" y="3.5" width="6.5" height="6.5" rx="1.2" stroke="currentColor" stroke-width="1.7"/>
          <rect x="3.5" y="14" width="6.5" height="6.5" rx="1.2" stroke="currentColor" stroke-width="1.7"/>
          <rect x="14" y="14" width="6.5" height="6.5" rx="1.2" stroke="currentColor" stroke-width="1.7"/>
        </svg>
        <svg v-else-if="item.icon === 'about'" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="8.5" stroke="currentColor" stroke-width="1.7"/>
          <path d="M12 10.7v5.1M12 7.6h.01" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/>
        </svg>
        <svg v-else viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="8" r="3.5" stroke="currentColor" stroke-width="1.7"/>
          <path d="M4.5 21c.7-4.1 3.2-6.3 7.5-6.3s6.8 2.2 7.5 6.3" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
        </svg>
        <span class="global-dock__label">{{ item.label }}</span>
      </router-link>
    </nav>

    <!-- One persistent molecule video. It is deliberately outside router-view. -->
    <div class="molecule-transition" aria-hidden="true">
      <video
        class="molecule-transition__video"
        src="/about-assets/about-sphere-transparent.webm"
        autoplay
        muted
        loop
        playsinline
        preload="auto"
      ></video>
    </div>
    <div ref="telegramWidget" class="telegram-widget">
      <Transition name="telegram-card">
        <aside
          v-if="telegramChatOpen"
          id="telegram-chat-card"
          class="telegram-chat-card"
          aria-label="Чат Angel Wings"
        >
          <button
            type="button"
            class="telegram-chat-card__close"
            aria-label="Закрыть"
            @click="closeTelegramChat"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>

          <div class="telegram-chat-card__avatar-wrap">
            <img
              src="/telegram-chat-avatar.webp"
              alt="Angel Wings Chat"
              class="telegram-chat-card__avatar"
              width="96"
              height="96"
            >
            <span class="telegram-chat-card__status" aria-hidden="true"></span>
          </div>

          <span class="telegram-chat-card__eyebrow">Официальное сообщество</span>
          <strong>Angel Wings Chat</strong>
          <p>Общение, новости и ответы команды в закрытом Telegram-чате.</p>

          <div class="telegram-chat-card__actions">
            <a
              class="telegram-chat-card__join telegram-chat-card__join--chat"
              href="https://t.me/+G8SAtpWBSFAzZDcy"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="m21.6 3.4-3.1 14.8c-.2 1-.9 1.2-1.8.7L12 15.4l-2.3 2.2c-.3.3-.5.5-1 .5l.3-4.8 8.8-7.9c.4-.3-.1-.5-.6-.2L6.3 12.1l-4.7-1.5c-1-.3-1-1 .2-1.5L20.2 2c.9-.3 1.6.2 1.4 1.4Z"/>
              </svg>
              Вступить в чат
            </a>
            <a
              class="telegram-chat-card__join telegram-chat-card__join--channel"
              href="https://t.me/+UwZu11Bt55FhNTIy"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                <path d="M5 4h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-4 3v-3a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"/>
                <path d="M8 9h8M8 13h5"/>
              </svg>
              Вступить в канал
            </a>
          </div>
        </aside>
      </Transition>

      <button
        type="button"
        class="telegram-fab"
        :class="{ 'telegram-fab--open': telegramChatOpen }"
        :aria-expanded="telegramChatOpen"
        aria-controls="telegram-chat-card"
        aria-label="Открыть чат Angel Wings"
        title="Чат Angel Wings"
        @click="toggleTelegramChat"
      >
        <img
          src="/telegram-chat-avatar.webp"
          alt=""
          class="telegram-fab__avatar"
          width="48"
          height="48"
          aria-hidden="true"
        >
      </button>
    </div>
    <footer class="footer">
      <div class="footer__container">
        <div class="footer__grid">
          <div class="footer__col footer__col--brand">
            <div class="footer__logo">ANGEL WINGS</div>
            <p class="footer__desc">Высокочистые пептиды для научных исследований и персональной оптимизации. GMP-сертифицированное производство.</p>
            <div class="footer__requisites">
              <p><strong>ИП Кириллов Никита Сергеевич</strong></p>
              <p>ИНН: 773323389224</p>
              <p>ОГРН: 325774600301379</p>
              <p>Юридический адрес: 125362, РОССИЯ, Г МОСКВА, УЛ ТУШИНСКАЯ, Д 13, КВ 70</p>
              <p>Email: <a href="mailto:info@angel-wings.ru">info@angel-wings.ru</a></p>
            </div>
            <div class="footer__social">
              <a href="https://t.me/+UwZu11Bt55FhNTIy" target="_blank" rel="noopener noreferrer" class="social-link" aria-label="Telegram">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.03-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.37.09 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/></svg>
              </a>
              <a href="https://www.instagram.com/angelwings_health?igsh=ODNtNDZtZDVjdWxq&utm_source=qr" target="_blank" rel="noopener noreferrer" class="social-link" aria-label="Instagram">
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
              <li><router-link to="/about" @click.prevent="beginAboutTransition">О компании</router-link></li>
              <li><router-link to="/delivery-payment">Доставка и оплата</router-link></li>
              <li><router-link to="/guarantees">Гарантии</router-link></li>
              <li><router-link to="/faq">Частые вопросы</router-link></li>
              <li><router-link to="/dealers">Дилеры</router-link></li>
              <li><router-link to="/partnership">Партнёрство</router-link></li>
              <li><router-link to="/contact">Контакты</router-link></li>
              <li><a href="/certificate-pts-105445.pdf" target="_blank" rel="noopener">Сертификат</a></li>
              <li><a href="/policy.pdf" target="_blank" rel="noopener">Политика Конфиденциальности</a></li>
              <li><a href="/public-offer-2026.pdf" target="_blank" rel="noopener">Публичная оферта</a></li>
            </ul>
          </div>
          
          <div class="footer__col">
            <h4 class="footer__title">Контакты</h4>
            <div class="footer__contact">
              <div class="contact-item">
                <span class="contact-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>
                </span>
                <a href="tel:+79661790013">+7 966 179-00-13</a>
              </div>
              <div class="contact-item">
                <span class="contact-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                </span>
                <a href="mailto:info@angel-wings.ru">info@angel-wings.ru</a>
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
              <a
                class="footer-support-btn"
                href="https://t.me/+UwZu11Bt55FhNTIy"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.03-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.37.09 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                </svg>
                <span>Написать в техподдержку</span>
              </a>
            </div>
          </div>
        </div>

        <div class="footer__legal-note">
          <p>
            ВСЯ ПЕПТИДНАЯ ПРОДУКЦИЯ НА ЭТОМ САЙТЕ ПРЕДНАЗНАЧЕНА ИСКЛЮЧИТЕЛЬНО ДЛЯ ИССЛЕДОВАТЕЛЬСКИХ ЦЕЛЕЙ. Она разработана для испытаний in vitro и исключительно для лабораторных экспериментов. Вся предоставленная на этом веб-сайте информация имеет исключительно образовательный характер. Любое введение этого продукта в организм человека или животного строго запрещено. Важно, чтобы этим продуктом обращались только лицензированные и квалифицированные специалисты. Этот продукт не предназначен для использования в качестве лекарства, продукта питания или косметического средства. Его не следует ошибочно маркировать, использовать или обозначать как таковой. Его назначение и использование строго ограничены исследованиями и научным расследованием.
          </p>
        </div>
        
        <div class="footer__bottom">
          <div class="footer__payments">
            <span class="payment-label">Способы оплаты:</span>
            <div class="payment-icons">
              <span class="payment-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
              </span>
              <span class="payment-icon payment-icon--sbp" aria-label="СБП">
                <svg width="19" height="24" viewBox="0 0 97 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0 26.12l14.532 25.975v15.844L.017 93.863 0 26.12z" fill="#5B57A2"/>
                  <path d="M55.797 42.643l13.617-8.346 27.868-.026-41.485 25.414V42.643z" fill="#D90751"/>
                  <path d="M55.72 25.967l.077 34.39-14.566-8.95V0l14.49 25.967z" fill="#FAB718"/>
                  <path d="M97.282 34.271l-27.869.026-13.693-8.33L41.231 0l56.05 34.271z" fill="#ED6F26"/>
                  <path d="M55.797 94.007V77.322l-14.566-8.78.008 51.458 14.558-25.993z" fill="#63B22F"/>
                  <path d="M69.38 85.737L14.531 52.095 0 26.12l97.223 59.583-27.844.034z" fill="#1487C9"/>
                  <path d="M41.24 120l14.556-25.993 13.583-8.27 27.843-.034L41.24 120z" fill="#017F36"/>
                  <path d="M.017 93.863l41.333-25.32-13.896-8.526-12.922 7.922L.017 93.863z" fill="#984995"/>
                </svg>
              </span>
            </div>
          </div>
          <p class="footer__copyright">© 2026 Angel Wings. Все права защищены.</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import axios from 'axios'
import { useRoute, useRouter } from 'vue-router'
import { useCartStore } from './store/cart'
import { useThemeStore } from './store/theme'
import { useAuthStore } from './store/auth'
import PageLoader from './components/PageLoader.vue'
import { moleculeTransition } from './composables/moleculeTransition'

const cartStore = useCartStore()
const themeStore = useThemeStore()
const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()

const globalDockItems = computed(() => [
  { to: '/', label: 'Главная', icon: 'home' },
  { to: '/catalog', label: 'Каталог', icon: 'catalog' },
  { to: '/about', label: 'О нас', icon: 'about' },
  { to: '/profile', label: 'Профиль', icon: 'user' }
])

const showGlobalDock = computed(() => route.path !== '/about' && route.path !== '/cart')

const isGlobalDockItemActive = (item) => {
  if (item.to === '/') return route.path === '/'
  if (item.to === '/catalog') return route.path === '/catalog' || route.path.startsWith('/product/')
  return route.path === item.to
}

const activeGlobalDockIndex = computed(() => {
  const index = globalDockItems.value.findIndex((item) => isGlobalDockItemActive(item))
  return index === -1 ? 0 : index
})

const mobileMenuOpen = ref(false)
const cursorRoot = ref(null)
const cursorDotRefs = ref([])
const cursorDots = Array.from({ length: 8 })
const pointsToast = ref(null)
const pointsToastClosing = ref(false)
const telegramWidget = ref(null)
const telegramChatOpen = ref(false)
const ATTRIBUTION_STORAGE_KEY = 'angel_wings_attribution'
const ATTRIBUTION_KEYS = ['aw_m', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']
const TAB_RESUME_RELOAD_AFTER_MS = 10_000
let cursorFrameId = 0
let removeCursorMoveListener = null
let removePageActivityListener = null
let removeTelegramWidgetListeners = null
let removeRouteRecoveryListeners = null

const waitFor = (duration) => new Promise(resolve => window.setTimeout(resolve, duration))

async function beginAboutTransition(closeMenu = false) {
  if (closeMenu) closeMobileMenu()
  if (moleculeTransition.isRunning || route.path === '/about') return

  if (route.path !== '/') {
    moleculeTransition.stage = 'arriving'
    await router.push('/about')
    await nextTick()
    moleculeTransition.stage = 'about'
    return
  }

  moleculeTransition.isRunning = true
  moleculeTransition.stage = 'exiting'
  await waitFor(460)

  // The molecule is not shown on the home page. The route changes first;
  // it then appears over the clean About scene using this same video node.
  await router.push('/about')
  await nextTick()
  moleculeTransition.stage = 'center'
  await waitFor(1520)
  await waitFor(620)

  requestAnimationFrame(() => {
    moleculeTransition.stage = 'about'
  })

  await waitFor(2920)
  moleculeTransition.isRunning = false
}

const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value
}

const closeMobileMenu = () => {
  mobileMenuOpen.value = false
}

const toggleTelegramChat = () => {
  telegramChatOpen.value = !telegramChatOpen.value
}

const closeTelegramChat = () => {
  telegramChatOpen.value = false
}

watch(mobileMenuOpen, (isOpen) => {
  document.body.style.overflow = isOpen ? 'hidden' : ''
})

watch(() => route.path, (path) => {
  // Leaving the About page must always cancel a pending entrance animation.
  // Otherwise its final frame can remain visible above the Home hero.
  if (path !== '/about') {
    moleculeTransition.isRunning = false
    moleculeTransition.stage = path === '/' ? 'home' : 'idle'
    return
  }

  if (moleculeTransition.isRunning) return
  moleculeTransition.stage = path === '/' ? 'home' : path === '/about' ? 'about' : 'idle'
}, { immediate: true })

const getInitials = computed(() => {
  if (!authStore.user?.name) return '?'
  return authStore.user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
})

function setCursorDotRef(el, index) {
  if (el) {
    cursorDotRefs.value[index] = el
  }
}

function captureAttributionFromUrl() {
  const params = new URLSearchParams(window.location.search)
  const attribution = {}

  ATTRIBUTION_KEYS.forEach((key) => {
    const value = params.get(key)
    if (value) attribution[key] = value.slice(0, 160)
  })

  if (!Object.keys(attribution).length) return

  try {
    localStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify({
      ...attribution,
      capturedAt: new Date().toISOString()
    }))
  } catch {
    // UTM-метки не должны ломать работу сайта.
  }
}

async function checkPointNotifications() {
  if (!authStore.isAuthenticated) {
    pointsToast.value = null
    return
  }

  try {
    const { data } = await axios.get('/api/points/summary')
    const unseenCredits = data?.unseenCredits || []
    const total = unseenCredits.reduce((sum, transaction) => sum + Math.max(0, Number(transaction.amount || 0)), 0)
    if (total <= 0) return

    pointsToast.value = {
      ids: unseenCredits.map(transaction => transaction.id),
      amount: total,
      message: unseenCredits[0]?.message || ''
    }
    pointsToastClosing.value = false
  } catch {
    pointsToast.value = null
  }
}

async function dismissPointsToast() {
  const ids = pointsToast.value?.ids || []
  if (pointsToastClosing.value) return
  pointsToastClosing.value = true
  await new Promise(resolve => setTimeout(resolve, 260))
  pointsToast.value = null
  pointsToastClosing.value = false
  if (!ids.length) return
  try {
    await axios.post('/api/points/seen', { ids })
  } catch {
    // Уведомление не должно мешать работе сайта.
  }
}

onMounted(() => {
  captureAttributionFromUrl()
  checkPointNotifications()

  const closeTelegramOnOutsideInteraction = (event) => {
    if (telegramChatOpen.value && !telegramWidget.value?.contains(event.target)) {
      closeTelegramChat()
    }
  }
  const closeTelegramOnEscape = (event) => {
    if (event.key === 'Escape') closeTelegramChat()
  }
  document.addEventListener('pointerdown', closeTelegramOnOutsideInteraction)
  document.addEventListener('keydown', closeTelegramOnEscape)
  removeTelegramWidgetListeners = () => {
    document.removeEventListener('pointerdown', closeTelegramOnOutsideInteraction)
    document.removeEventListener('keydown', closeTelegramOnEscape)
  }

  const updatePageActivity = () => {
    // `document.hasFocus()` becomes false when mobile DevTools or the browser
    // chrome receives focus, even while the page is fully visible. Pausing all
    // animations in that state freezes elements on their opacity: 0 keyframe.
    const isInactive = document.visibilityState === 'hidden'
    document.documentElement.classList.toggle('is-page-inactive', isInactive)
  }

  updatePageActivity()
  document.addEventListener('visibilitychange', updatePageActivity)
  removePageActivityListener = () => {
    document.removeEventListener('visibilitychange', updatePageActivity)
  }

  // Some mobile browsers restore an inactive tab from their page cache with the
  // persistent App shell intact but an empty router-view. Keep the current URL
  // and recover the route before the user sees a blank page.
  let hiddenAt = 0
  let reloadQueued = false
  const reloadCurrentRoute = () => {
    if (reloadQueued) return
    reloadQueued = true
    window.location.reload()
  }
  const checkRouteAfterResume = (forceReload = false) => {
    window.setTimeout(async () => {
      if (document.visibilityState !== 'visible') return

      await router.isReady()
      await nextTick()

      // Timers are suspended while a mobile tab is in the background. If that
      // happens during the molecule transition, it can remain in its hidden
      // "center" frame forever. Resolve the transition before checking the
      // router view so restored pages are always readable.
      if (moleculeTransition.isRunning || ['exiting', 'center', 'arriving'].includes(moleculeTransition.stage)) {
        moleculeTransition.isRunning = false
        moleculeTransition.stage = route.path === '/' ? 'home' : route.path === '/about' ? 'about' : 'idle'
        await nextTick()
      }

      const routeContent = document.querySelector('.main > *')
      if (forceReload || !routeContent) reloadCurrentRoute()
    }, 0)
  }
  const recoverRouteOnVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      hiddenAt = Date.now()
      return
    }

    const wasInactiveLongEnough = hiddenAt > 0 && Date.now() - hiddenAt >= TAB_RESUME_RELOAD_AFTER_MS
    hiddenAt = 0
    checkRouteAfterResume(wasInactiveLongEnough)
  }
  const recoverRouteFromPageCache = (event) => {
    if (event.persisted || document.wasDiscarded) checkRouteAfterResume(true)
  }

  document.addEventListener('visibilitychange', recoverRouteOnVisibilityChange)
  window.addEventListener('pageshow', recoverRouteFromPageCache)
  removeRouteRecoveryListeners = () => {
    document.removeEventListener('visibilitychange', recoverRouteOnVisibilityChange)
    window.removeEventListener('pageshow', recoverRouteFromPageCache)
  }

  const canUseCustomCursor =
    window.matchMedia('(min-width: 1024px) and (pointer: fine)').matches &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (!canUseCustomCursor || !cursorRoot.value) {
    document.documentElement.classList.remove('has-goo-cursor')
    document.documentElement.classList.remove('is-goo-cursor-visible')
    return
  }

  document.documentElement.classList.add('has-goo-cursor')

  const dots = cursorDots.map((_, index) => ({
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    scale: Math.max(0.58, 1 - index * 0.032)
  }))
  const mouse = {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2
  }
  const nativeCursorSelector = '[data-native-cursor]'
  let cursorStarted = false

  const stopCursorLoop = () => {
    if (cursorFrameId) {
      window.cancelAnimationFrame(cursorFrameId)
      cursorFrameId = 0
    }
    cursorStarted = false
  }

  const pauseCursorForScroll = () => {
    // Keep the custom cursor alive during wheel and programmatic scrolling.
    // Hiding it here caused a visible switch back to the native cursor.
  }

  const onPointerMove = (event) => {
    if (event.pointerType === 'touch') return
    mouse.x = event.clientX
    mouse.y = event.clientY

    if (document.hidden || !document.hasFocus()) {
      cursorRoot.value?.classList.remove('is-visible')
      document.documentElement.classList.remove('is-goo-cursor-visible')
      stopCursorLoop()
      return
    }
    if (event.target?.closest?.(nativeCursorSelector)) {
      cursorRoot.value?.classList.remove('is-visible')
      document.documentElement.classList.remove('is-goo-cursor-visible')
      return
    }
    cursorRoot.value?.classList.add('is-visible')
    document.documentElement.classList.add('is-goo-cursor-visible')

    if (!cursorStarted) {
      cursorStarted = true
      renderCursor()
    }
  }

  const onPointerOver = (event) => {
    if (event.pointerType === 'touch') return
    if (event.target?.closest?.(nativeCursorSelector)) {
      cursorRoot.value?.classList.remove('is-visible')
      document.documentElement.classList.remove('is-goo-cursor-visible')
    }
  }

  const onPointerOut = (event) => {
    if (event.pointerType === 'touch') return
    const fromNativeCursor = event.target?.closest?.(nativeCursorSelector)
    const toNativeCursor = event.relatedTarget?.closest?.(nativeCursorSelector)
    if (fromNativeCursor && !toNativeCursor) {
      cursorRoot.value?.classList.add('is-visible')
      document.documentElement.classList.add('is-goo-cursor-visible')
    }
  }

  const renderCursor = () => {
    if (document.hidden || !document.hasFocus()) {
      cursorRoot.value?.classList.remove('is-visible')
      document.documentElement.classList.remove('is-goo-cursor-visible')
      stopCursorLoop()
      return
    }

    let x = mouse.x
    let y = mouse.y

    dots.forEach((dot, index) => {
      const element = cursorDotRefs.value[index]
      const easing = index === 0 ? 0.74 : 0.56
      const maxSegmentDistance = 8

      dot.x += (x - dot.x) * easing
      dot.y += (y - dot.y) * easing

      if (index > 0) {
        const dx = dot.x - x
        const dy = dot.y - y
        const distance = Math.hypot(dx, dy)

        if (distance > maxSegmentDistance) {
          const ratio = maxSegmentDistance / distance
          dot.x = x + dx * ratio
          dot.y = y + dy * ratio
        }
      }

      if (element) {
        element.style.transform = `translate3d(${dot.x}px, ${dot.y}px, 0) translate(-50%, -50%) scale(${dot.scale})`
      }

      x = dot.x
      y = dot.y
    })

    cursorFrameId = window.requestAnimationFrame(renderCursor)
  }

  window.addEventListener('pointermove', onPointerMove, { passive: true })
  window.addEventListener('scroll', pauseCursorForScroll, { passive: true })
  document.addEventListener('pointerover', onPointerOver, { passive: true })
  document.addEventListener('pointerout', onPointerOut, { passive: true })
  window.addEventListener('blur', stopCursorLoop)
  document.addEventListener('visibilitychange', stopCursorLoop)
  removeCursorMoveListener = () => {
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('scroll', pauseCursorForScroll)
    document.removeEventListener('pointerover', onPointerOver)
    document.removeEventListener('pointerout', onPointerOut)
    window.removeEventListener('blur', stopCursorLoop)
    document.removeEventListener('visibilitychange', stopCursorLoop)
  }
})

watch(() => authStore.isAuthenticated, () => {
  checkPointNotifications()
})

onBeforeUnmount(() => {
  if (cursorFrameId) {
    window.cancelAnimationFrame(cursorFrameId)
  }
  if (removeCursorMoveListener) {
    removeCursorMoveListener()
  }
  if (removePageActivityListener) {
    removePageActivityListener()
  }
  if (removeTelegramWidgetListeners) {
    removeTelegramWidgetListeners()
  }
  if (removeRouteRecoveryListeners) {
    removeRouteRecoveryListeners()
  }
  document.documentElement.classList.remove('has-goo-cursor')
  document.documentElement.classList.remove('is-goo-cursor-visible')
  document.documentElement.classList.remove('is-page-inactive')
  document.documentElement.classList.remove('is-page-scrolling')
})
</script>

<style>
@media (min-width: 1024px) and (pointer: fine) and (prefers-reduced-motion: no-preference) {
  html.has-goo-cursor.is-goo-cursor-visible,
  html.has-goo-cursor.is-goo-cursor-visible * {
    cursor: none !important;
  }

  html.has-goo-cursor.is-goo-cursor-visible [data-native-cursor],
  html.has-goo-cursor.is-goo-cursor-visible [data-native-cursor] iframe {
    cursor: auto !important;
  }

  html.has-goo-cursor.is-goo-cursor-visible [data-native-cursor] a,
  html.has-goo-cursor.is-goo-cursor-visible [data-native-cursor] button {
    cursor: pointer !important;
  }
}

.cursor-goo {
  position: fixed;
  inset: 0;
  z-index: 999999;
  display: block;
  pointer-events: none;
  opacity: 0;
  overflow: hidden;
  filter: url("#cursor-goo-filter");
  mix-blend-mode: difference;
  transition: opacity 0.16s ease;
  contain: strict;
}

.cursor-goo.is-visible {
  opacity: 1;
}

.points-toast {
  position: fixed;
  right: 1.25rem;
  bottom: 6rem;
  z-index: 10000;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 0.85rem;
  width: min(430px, calc(100vw - 2rem));
  padding: 1rem;
  border: 1px solid rgba(152, 177, 255, 0.42);
  border-radius: 18px;
  background:
    radial-gradient(circle at 8% 12%, rgba(152, 177, 255, 0.26), transparent 34%),
    rgba(15, 18, 30, 0.94);
  color: #fff;
  box-shadow: 0 24px 70px rgba(16, 56, 180, 0.28);
  backdrop-filter: blur(18px);
  transform-origin: 92% 50%;
  animation: pointsToastIn 0.34s cubic-bezier(0.16, 1, 0.3, 1) both;
  will-change: transform, opacity;
}

.points-toast--closing {
  pointer-events: none;
  animation: pointsToastOut 0.26s cubic-bezier(0.72, 0, 0.24, 1) both;
}

.points-toast span {
  display: block;
  color: #9fb5ff;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.points-toast strong {
  display: block;
  margin-top: 0.2rem;
  font-family: var(--font-display);
  font-size: 1.35rem;
}

.points-toast p {
  margin: 0.25rem 0 0;
  color: rgba(255, 255, 255, 0.72);
  font-size: 0.9rem;
  line-height: 1.35;
}

.points-toast__link,
.points-toast__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
}

.points-toast__link {
  min-height: 42px;
  padding: 0 0.9rem;
  background: #9fb5ff;
  color: #050814;
  font-weight: 800;
}

.points-toast__close {
  width: 42px;
  height: 42px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: transparent;
  color: #fff;
  cursor: pointer;
  transition: transform 0.22s ease, border-color 0.22s ease, background 0.22s ease;
}

.points-toast__close::before {
  content: '';
  width: 22px;
  height: 22px;
  background: currentColor;
  opacity: 0.92;
  filter: drop-shadow(0 0 8px rgba(159, 181, 255, 0.28));
  mask: url('/orthodox-cross-close-mask.png') center / contain no-repeat;
  -webkit-mask: url('/orthodox-cross-close-mask.png') center / contain no-repeat;
}

.points-toast__close:hover {
  border-color: rgba(159, 181, 255, 0.48);
  background: rgba(159, 181, 255, 0.08);
  transform: translateY(-1px) rotate(4deg) scale(1.04);
}

.points-toast__close img {
  display: none;
}

[data-theme="light"] .points-toast__close {
  border-color: rgba(5, 8, 20, 0.12);
  color: #050814;
}

[data-theme="light"] .points-toast__close:hover {
  border-color: rgba(55, 88, 170, 0.28);
  background: rgba(55, 88, 170, 0.08);
}

@keyframes pointsToastIn {
  from {
    opacity: 0;
    transform: translate3d(16px, 10px, 0) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translate3d(0, 0, 0) scale(1);
  }
}

@keyframes pointsToastOut {
  0% {
    opacity: 1;
    transform: translate3d(0, 0, 0) rotate(0) scale(1);
  }
  55% {
    opacity: 0.72;
    transform: translate3d(8px, -2px, 0) rotate(1.5deg) scale(1.025);
  }
  100% {
    opacity: 0;
    transform: translate3d(26px, 8px, 0) rotate(4deg) scale(0.88);
  }
}

@media (max-width: 640px) {
  .points-toast {
    left: 1rem;
    right: 1rem;
    bottom: 5.25rem;
    grid-template-columns: 1fr auto;
  }

  .points-toast__link {
    grid-column: 1 / 2;
  }

  .points-toast__close {
    grid-column: 2 / 3;
    grid-row: 1 / 2;
  }
}

html.is-page-inactive .cursor-goo {
  opacity: 0 !important;
}

html.is-page-inactive *,
html.is-page-inactive *::before,
html.is-page-inactive *::after {
  animation-play-state: paused !important;
}

.cursor-goo__filter {
  position: absolute;
  width: 0;
  height: 0;
}

.cursor-goo span {
  position: absolute;
  top: 0;
  left: 0;
  display: block;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #fff;
  box-shadow: none;
  will-change: transform;
  transform: translate3d(-100px, -100px, 0);
}

[data-theme="light"] .cursor-goo {
  mix-blend-mode: normal;
}

[data-theme="light"] .cursor-goo span {
  background: #11131c;
  box-shadow: none;
}

@media (pointer: coarse), (max-width: 1023px), (prefers-reduced-motion: reduce) {
  .cursor-goo {
    display: none;
  }
}
</style>

<style scoped>
.app {
  --header-height: 72px;
  position: relative;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header,
.main,
.footer,
.telegram-widget {
  transition: opacity 0.62s cubic-bezier(0.22, 1, 0.36, 1), transform 0.62s cubic-bezier(0.22, 1, 0.36, 1), filter 0.62s ease;
}

.app--molecule-exiting .header,
.app--molecule-exiting .main,
.app--molecule-exiting .footer,
.app--molecule-exiting .telegram-widget,
.app--molecule-center .header,
.app--molecule-center .main,
.app--molecule-center .footer,
.app--molecule-center .telegram-widget,
.app--molecule-arriving .header,
.app--molecule-arriving .telegram-widget {
  opacity: 0;
  filter: blur(7px);
  pointer-events: none;
}

.app--molecule-exiting .header,
.app--molecule-center .header,
.app--molecule-arriving .header {
  transform: translate3d(0, -20px, 0);
}

.app--molecule-exiting .main,
.app--molecule-center .main,
.app--molecule-exiting .footer,
.app--molecule-center .footer {
  transform: translate3d(0, 18px, 0);
}

.app--molecule-about .header {
  transition-delay: 0.26s;
}

.molecule-transition {
  position: absolute;
  top: 0;
  left: 50%;
  z-index: 90;
  width: min(47vw, 670px);
  aspect-ratio: 1;
  pointer-events: none;
  opacity: 0;
  transform: translate3d(-50%, calc(50vh - 50%), 0) scale(0.74);
  transform-origin: center;
  will-change: transform, opacity;
  contain: layout style;
  backface-visibility: hidden;
  transition: transform 1.48s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.55s ease;
}

.molecule-transition__video {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: transparent;
  transform: translateZ(0);
  backface-visibility: hidden;
  will-change: transform;
}

/* The persistent video remains mounted for seamless playback, but is never visible outside /about. */
.app:not([data-route="/about"]) .molecule-transition {
  visibility: hidden;
  opacity: 0 !important;
}

.app--molecule-home .molecule-transition {
  opacity: 0;
  transform: translate3d(calc(-50% + 24vw), calc(-50% - 22vh), 0) scale(0.48);
}

.app--molecule-exiting .molecule-transition {
  opacity: 0;
  transform: translate3d(calc(-50% + 12vw), calc(-50% - 12vh), 0) scale(0.76);
}

.app--molecule-center .molecule-transition,
.app--molecule-arriving .molecule-transition {
  opacity: 1;
  transform: translate3d(-50%, calc(50vh - 50%), 0) scale(1.08);
}

.app--molecule-about .molecule-transition {
  opacity: 1;
  transform: translate3d(calc(-50% + 29vw), calc(46vh - 50% + var(--about-sphere-scroll-y, 0px)), 0) scale(0.76);
  transition-duration: 2.85s, 0.6s;
  transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1), ease;
}

.app.is-about-hero-scrolling .molecule-transition {
  transition: opacity 0.6s ease;
}

.app--molecule-idle .molecule-transition {
  opacity: 0;
}

@media (max-width: 1050px) {
  .molecule-transition { width: min(52vw, 520px); }
  .app--molecule-home .molecule-transition { transform: translate3d(calc(-50% + 22vw), calc(-50% - 18vh), 0) scale(0.43); }
  .app--molecule-about .molecule-transition { transform: translate3d(calc(-50% + 25vw), calc(60vh - 50% + var(--about-sphere-scroll-y, 0px)), 0) scale(0.68); }
}

@media (max-width: 768px) {
  /* Never conceal page content while a mobile browser resumes a suspended
     molecule transition. The visual transition remains decorative only. */
  .app--molecule-exiting .main,
  .app--molecule-center .main {
    opacity: 1;
    filter: none;
    pointer-events: auto;
    transform: none;
  }

  /* Some mobile WebM decoders flatten alpha to black. Blend the whole composited video layer, not its hardware video surface. */
  .molecule-transition {
    width: min(90vw, 420px);
    z-index: 90;
    mix-blend-mode: screen;
    -webkit-mask-image: radial-gradient(ellipse 45% 45% at 50% 50%, #000 88%, rgba(0, 0, 0, 0.52) 95%, transparent 100%);
    mask-image: radial-gradient(ellipse 45% 45% at 50% 50%, #000 88%, rgba(0, 0, 0, 0.52) 95%, transparent 100%);
    -webkit-mask-repeat: no-repeat;
    mask-repeat: no-repeat;
  }
  .molecule-transition__video { mix-blend-mode: normal; filter: contrast(1.18) saturate(1.2) brightness(1.08); }
  .app--molecule-home .molecule-transition { opacity: 0; transform: translate3d(calc(-50% + 16vw), calc(-50% - 19vh), 0) scale(0.45); }
  .app--molecule-exiting .molecule-transition { transform: translate3d(calc(-50% + 8vw), calc(-50% - 10vh), 0) scale(0.77); }
  .app--molecule-center .molecule-transition,
  .app--molecule-arriving .molecule-transition { transform: translate3d(-50%, calc(50vh - 50%), 0) scale(1.02); }
  .app--molecule-about .molecule-transition {
    opacity: 1;
    transform: translate3d(-50%, calc(82svh - 50% + clamp(3rem, 8vw, 4rem) + 6rem + var(--about-sphere-scroll-y, 0px)), 0) scale(0.58);
  }
}

@media (max-width: 768px) and (max-height: 760px) {
  .app--molecule-about .molecule-transition {
    transform: translate3d(-50%, calc(84svh - 50% + clamp(3rem, 8vw, 4rem) + 6rem + var(--about-sphere-scroll-y, 0px)), 0) scale(0.56);
  }
}

@media (min-width: 540px) and (max-width: 768px) {
  .app--molecule-about .molecule-transition {
    transform: translate3d(-50%, calc(65svh - 50% + clamp(3rem, 8vw, 4rem) + 6rem + var(--about-sphere-scroll-y, 0px)), 0) scale(0.58);
  }
}

@media (min-width: 540px) and (max-width: 768px) and (max-height: 760px) {
  .app--molecule-about .molecule-transition {
    transform: translate3d(-50%, calc(66svh - 50% + clamp(3rem, 8vw, 4rem) + 6rem + var(--about-sphere-scroll-y, 0px)), 0) scale(0.56);
  }
}

@media (prefers-reduced-motion: reduce) {
  .molecule-transition,
  .header,
  .main,
  .footer,
  .telegram-widget { transition-duration: 0.01ms !important; }
}

.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  width: 100%;
  z-index: 100;
  background: var(--bg-card);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border);
  transition: background 0.4s ease, border-color 0.4s ease;
  overflow: hidden;
}

.header__container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 clamp(1rem, 2.25vw, 2rem);
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: var(--header-height);
  gap: clamp(0.75rem, 1.5vw, 1.5rem);
}

.header__logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
  flex-shrink: 0;
  min-width: 0;
}

.header-logo {
  width: 64px;
  height: 64px;
  object-fit: contain;
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
  font-size: clamp(1rem, 1.3vw, 1.18rem);
  letter-spacing: 0.18em;
  color: var(--text-primary);
  transition: color 0.4s ease;
  white-space: nowrap;
}

.header__nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: clamp(1.15rem, 2.1vw, 2.25rem);
  min-width: 0;
  white-space: nowrap;
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
  flex-shrink: 0;
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
  padding-top: var(--header-height);
}

.app--has-global-dock .footer {
  padding-bottom: calc(6.75rem + env(safe-area-inset-bottom));
}

.global-dock {
  --global-dock-item-width: 25%;
  position: fixed;
  z-index: 96;
  left: 50%;
  bottom: max(1rem, env(safe-area-inset-bottom));
  display: grid;
  grid-template-columns: repeat(4, minmax(4.5rem, 1fr));
  align-items: stretch;
  width: min(24rem, calc(100vw - 2rem));
  overflow: hidden;
  isolation: isolate;
  border: 1px solid rgba(170, 192, 255, 0.28);
  border-radius: 999px;
  background:
    linear-gradient(140deg, rgba(41, 53, 91, 0.78), rgba(6, 10, 24, 0.88) 68%),
    rgba(11, 16, 34, 0.72);
  box-shadow:
    inset 0 1px 0 rgba(237, 245, 255, 0.2),
    inset 0 -1px 0 rgba(82, 121, 224, 0.24),
    0 0.75rem 2.75rem rgba(0, 5, 22, 0.46);
  backdrop-filter: blur(18px) saturate(135%);
  -webkit-backdrop-filter: blur(18px) saturate(135%);
  transform: translateX(-50%);
  animation: global-dock-enter 0.52s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.global-dock::before {
  content: '';
  position: absolute;
  z-index: -1;
  inset: 0;
  background: linear-gradient(105deg, rgba(166, 191, 255, 0.12), transparent 37%, rgba(77, 129, 255, 0.09));
  pointer-events: none;
}

.global-dock__active-pill {
  position: absolute;
  z-index: 0;
  inset: 0 auto 0 0;
  width: var(--global-dock-item-width);
  border: 1px solid rgba(192, 210, 255, 0.36);
  border-radius: 999px;
  background: linear-gradient(145deg, rgba(146, 168, 229, 0.4), rgba(71, 86, 135, 0.37));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 0 1.2rem rgba(104, 137, 242, 0.16);
  transform: translateX(calc(var(--global-dock-active-index) * 100%));
  transition: transform 0.42s cubic-bezier(0.22, 1, 0.36, 1);
}

.global-dock__item {
  position: relative;
  z-index: 1;
  display: flex;
  min-height: 3.7rem;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.24rem;
  padding: 0.45rem 0.35rem;
  color: rgba(221, 227, 245, 0.68);
  text-decoration: none;
  transition: color 0.25s ease, transform 0.25s ease;
  -webkit-tap-highlight-color: transparent;
}

.global-dock__item svg {
  width: 1.22rem;
  height: 1.22rem;
  flex: 0 0 auto;
}

.global-dock__label {
  overflow: hidden;
  max-width: 100%;
  font-size: 0.62rem;
  font-weight: 650;
  line-height: 1;
  letter-spacing: -0.015em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.global-dock__item.is-active {
  color: #fff;
}

@media (hover: hover) and (pointer: fine) {
  .global-dock__item:hover {
    color: #fff;
    transform: translateY(-1px);
  }
}

@keyframes global-dock-enter {
  from {
    opacity: 0;
    transform: translate3d(-50%, 0.9rem, 0);
  }
  to {
    opacity: 1;
    transform: translate3d(-50%, 0, 0);
  }
}

[data-theme="light"] .global-dock {
  border-color: rgba(96, 123, 191, 0.28);
  background:
    linear-gradient(140deg, rgba(255, 255, 255, 0.8), rgba(225, 233, 252, 0.82)),
    rgba(245, 248, 255, 0.76);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.86),
    inset 0 -1px 0 rgba(113, 145, 218, 0.18),
    0 0.75rem 2.3rem rgba(49, 70, 126, 0.16);
}

[data-theme="light"] .global-dock__active-pill {
  border-color: rgba(112, 141, 215, 0.35);
  background: linear-gradient(145deg, rgba(175, 194, 244, 0.72), rgba(135, 159, 225, 0.54));
}

[data-theme="light"] .global-dock__item {
  color: rgba(35, 49, 87, 0.68);
}

[data-theme="light"] .global-dock__item.is-active,
[data-theme="light"] .global-dock__item:hover {
  color: #263a76;
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
  margin-bottom: 1rem;
}

.footer__requisites {
  margin-bottom: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.footer__requisites p {
  margin: 0;
  font-size: 0.8rem;
  line-height: 1.5;
  color: var(--text-secondary);
}

.footer__requisites p strong {
  color: var(--text-primary);
  font-weight: 700;
}

.footer__requisites a {
  color: var(--accent);
}

.footer__requisites a:hover {
  opacity: 0.85;
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

.footer-support-btn {
  margin-top: 0.5rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: fit-content;
  padding: 0.7rem 1rem;
  border-radius: 10px;
  border: 1px solid var(--accent);
  background: var(--accent-dim);
  color: var(--text-primary);
  font-size: 0.875rem;
  font-weight: 600;
  text-decoration: none;
  transition: transform 0.2s ease, background 0.2s ease, border-color 0.2s ease;
}

.footer-support-btn:hover {
  transform: translateY(-1px);
  background: rgba(166, 185, 248, 0.22);
  border-color: var(--accent);
}

.footer__bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 2rem;
  border-top: 1px solid var(--border);
}

.footer__legal-note {
  margin-top: 1.5rem;
  padding: 1rem 1.25rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg-secondary);
}

.footer__legal-note p {
  margin: 0;
  font-size: 0.8rem;
  line-height: 1.5;
  color: var(--text-muted);
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
  width: 52px;
  height: 34px;
  padding: 0;
  background: var(--bg-secondary);
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
}

.payment-icon--sbp {
  line-height: 1;
}

.payment-icon svg {
  width: 26px;
  height: 26px;
  display: block;
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
  width: 44px;
  height: 44px;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 12px;
  color: var(--text-primary);
  transition: all 0.3s ease;
  flex-shrink: 0;
  padding: 0;
  margin: 0;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

.mobile-cart-btn {
  display: none;
  position: relative;
  width: 44px;
  height: 44px;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 12px;
  text-decoration: none;
  flex-shrink: 0;
}

.mobile-header-cart-count {
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

.mobile-menu {
  display: none;
  position: fixed;
  top: var(--header-height);
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--bg-primary);
  z-index: 99;
  overflow-y: auto;
  pointer-events: none;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  overscroll-behavior: contain;
  min-height: calc(100vh - var(--header-height));
}

.telegram-widget {
  position: fixed;
  right: 22px;
  bottom: 22px;
  z-index: 95;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 14px;
}

.telegram-fab {
  width: 58px;
  height: 58px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(145deg, #33a8ff 0%, #1f85ff 100%);
  padding: 4px;
  border: 1px solid rgba(255, 255, 255, 0.22);
  box-shadow: 0 16px 36px rgba(32, 118, 255, 0.45);
  cursor: pointer;
  transition: transform 0.25s ease, box-shadow 0.25s ease, filter 0.25s ease;
  animation: telegramPulse 2.4s ease-in-out infinite;
}

.telegram-fab__avatar {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  background: #f8edcf;
  box-shadow: inset 0 0 0 1px rgba(16, 23, 40, 0.12);
}

.telegram-fab:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 18px 38px rgba(32, 118, 255, 0.58);
  filter: saturate(1.1);
}

.telegram-fab:active {
  transform: translateY(0) scale(0.98);
}

.telegram-fab--open {
  animation: none;
  box-shadow: 0 14px 32px rgba(32, 118, 255, 0.5), 0 0 0 7px rgba(51, 168, 255, 0.12);
}

.telegram-chat-card {
  position: relative;
  width: min(350px, calc(100vw - 32px));
  padding: 22px;
  border: 1px solid rgba(166, 185, 248, 0.28);
  border-radius: 18px;
  background:
    radial-gradient(circle at 12% 0%, rgba(103, 145, 255, 0.2), transparent 38%),
    rgba(15, 18, 30, 0.97);
  color: #f8f9ff;
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.38), 0 8px 24px rgba(32, 118, 255, 0.14);
  text-align: center;
  transform-origin: calc(100% - 28px) 100%;
}

.telegram-chat-card::after {
  content: '';
  position: absolute;
  right: 20px;
  bottom: -7px;
  width: 14px;
  height: 14px;
  border-right: 1px solid rgba(166, 185, 248, 0.28);
  border-bottom: 1px solid rgba(166, 185, 248, 0.28);
  background: #0f121e;
  transform: rotate(45deg);
}

.telegram-chat-card__close {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 34px;
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: rgba(248, 249, 255, 0.58);
  cursor: pointer;
  transition: color 0.2s ease, background 0.2s ease, transform 0.2s ease;
}

.telegram-chat-card__close:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.08);
  transform: rotate(6deg);
}

.telegram-chat-card__avatar-wrap {
  position: relative;
  width: 78px;
  height: 78px;
  margin: 0 auto 14px;
  padding: 3px;
  border-radius: 50%;
  background: linear-gradient(145deg, #dbe5ff, #79a0ff 56%, #258eff);
  box-shadow: 0 10px 28px rgba(57, 125, 255, 0.28);
}

.telegram-chat-card__avatar {
  width: 100%;
  height: 100%;
  display: block;
  border: 3px solid #101421;
  border-radius: 50%;
  object-fit: cover;
}

.telegram-chat-card__status {
  position: absolute;
  right: 2px;
  bottom: 5px;
  width: 14px;
  height: 14px;
  border: 3px solid #101421;
  border-radius: 50%;
  background: #39d98a;
}

.telegram-chat-card__eyebrow {
  display: block;
  margin-bottom: 5px;
  color: #9fb7ff;
  font-size: 0.68rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.telegram-chat-card strong {
  display: block;
  font-family: var(--font-display);
  font-size: 1.25rem;
  line-height: 1.25;
}

.telegram-chat-card p {
  max-width: 270px;
  margin: 9px auto 17px;
  color: rgba(232, 235, 247, 0.68);
  font-size: 0.86rem;
  line-height: 1.55;
}

.telegram-chat-card__join {
  position: relative;
  z-index: 1;
  min-height: 46px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  border: 1px solid rgba(159, 183, 255, 0.62);
  border-radius: 10px;
  background: rgba(111, 147, 244, 0.12);
  color: #f8f9ff;
  font-weight: 800;
  text-decoration: none;
  transition: background 0.22s ease, border-color 0.22s ease, transform 0.22s ease;
}

.telegram-chat-card__actions {
  display: grid;
  gap: 9px;
}

.telegram-chat-card__join--chat {
  background: linear-gradient(135deg, rgba(80, 137, 255, 0.24), rgba(111, 147, 244, 0.1));
}

.telegram-chat-card__join--channel {
  min-height: 42px;
  border-color: rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.025);
  color: rgba(248, 249, 255, 0.78);
  font-size: 0.88rem;
}

.telegram-chat-card__join:hover {
  border-color: #a6b9f8;
  background: rgba(111, 147, 244, 0.22);
  transform: translateY(-1px);
}

[data-theme="light"] .telegram-chat-card {
  border-color: rgba(67, 96, 170, 0.2);
  background:
    radial-gradient(circle at 12% 0%, rgba(107, 145, 246, 0.18), transparent 38%),
    rgba(255, 255, 255, 0.98);
  color: #101522;
  box-shadow: 0 24px 70px rgba(38, 55, 98, 0.18), 0 8px 24px rgba(65, 110, 220, 0.1);
}

[data-theme="light"] .telegram-chat-card::after {
  border-color: rgba(67, 96, 170, 0.2);
  background: #fff;
}

[data-theme="light"] .telegram-chat-card__close {
  color: rgba(16, 21, 34, 0.5);
}

[data-theme="light"] .telegram-chat-card__close:hover {
  color: #101522;
  background: rgba(34, 65, 140, 0.08);
}

[data-theme="light"] .telegram-chat-card__avatar {
  border-color: #fff;
}

[data-theme="light"] .telegram-chat-card__status {
  border-color: #fff;
}

[data-theme="light"] .telegram-chat-card p {
  color: rgba(30, 39, 63, 0.68);
}

[data-theme="light"] .telegram-chat-card__join {
  border-color: rgba(66, 103, 199, 0.38);
  background: rgba(84, 124, 224, 0.1);
  color: #172342;
}

[data-theme="light"] .telegram-chat-card__join--channel {
  border-color: rgba(31, 48, 88, 0.16);
  background: rgba(31, 48, 88, 0.035);
  color: rgba(23, 35, 66, 0.78);
}

.telegram-card-enter-active,
.telegram-card-leave-active {
  transition: opacity 0.24s ease, transform 0.32s cubic-bezier(0.16, 1, 0.3, 1);
}

.telegram-card-enter-from,
.telegram-card-leave-to {
  opacity: 0;
  transform: translate3d(10px, 14px, 0) scale(0.92);
}

@keyframes telegramPulse {
  0%, 100% { box-shadow: 0 16px 36px rgba(32, 118, 255, 0.45); }
  50% { box-shadow: 0 16px 36px rgba(32, 118, 255, 0.45), 0 0 0 10px rgba(51, 168, 255, 0.2); }
}

.mobile-menu.open {
  display: flex;
  flex-direction: column;
  z-index: 101;
  pointer-events: auto;
}

@media (max-width: 1199px) {
  .app {
    --header-height: 64px;
  }

  .header__nav {
    display: none;
  }

  .auth-btn span {
    display: none;
  }

  .mobile-menu-btn {
    display: flex;
  }

  .mobile-cart-btn {
    display: inline-flex;
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
    top: var(--header-height);
  }

  .mobile-menu.open {
    pointer-events: auto !important;
  }

  .mobile-menu__nav {
    display: flex;
    flex-direction: column;
    padding: 0.75rem clamp(0.75rem, 2.5vw, 1.25rem) calc(1rem + env(safe-area-inset-bottom));
    gap: 0.375rem;
    background: var(--bg-card);
    border-radius: 0 0 20px 20px;
    min-height: calc(100dvh - var(--header-height));
  }

  .mobile-menu__nav .nav-link {
    display: flex;
    align-items: center;
    gap: 0.875rem;
    min-height: 52px;
    padding: 0.8rem 1rem;
    font-size: 0.94rem;
    font-weight: 500;
    border-radius: 12px;
    background: var(--bg-secondary);
    color: var(--text-primary);
    transition: all 0.2s ease;
    width: 100%;
    text-align: left;
    border: none;
    margin-bottom: 0;
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

  .theme-link {
    margin-top: 0.5rem;
    background: var(--bg-primary);
    border: 1px dashed var(--border);
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
  .app--has-global-dock .footer {
    padding-bottom: calc(6.15rem + env(safe-area-inset-bottom));
  }

  .global-dock {
    bottom: max(0.8rem, env(safe-area-inset-bottom));
    width: min(22rem, calc(100vw - 1.25rem));
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .global-dock__item {
    min-height: 3.45rem;
    gap: 0.2rem;
    padding: 0.38rem 0.18rem;
  }

  .global-dock__item svg {
    width: 1.14rem;
    height: 1.14rem;
  }

  .global-dock__label {
    font-size: 0.53rem;
  }

  .app--has-global-dock .telegram-widget {
    bottom: calc(4.8rem + env(safe-area-inset-bottom));
  }

  .header__container {
    padding: 0 0.75rem;
    gap: 0.5rem;
    height: var(--header-height);
  }

  .header__logo {
    gap: 0.5rem;
    min-width: 0;
  }

  .header-logo {
    height: 56px;
  }

  .logo-icon {
    width: 24px;
    height: 24px;
  }

  .logo-text {
    font-size: 0;
    letter-spacing: 0;
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

  .footer-support-btn {
    width: 100%;
    justify-content: center;
    font-size: 0.8rem;
  }

  .footer__bottom {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
}

@media (max-width: 640px) {
  .app {
    --header-height: 60px;
  }

  .header__container {
    height: var(--header-height);
  }

  .mobile-menu {
    top: var(--header-height);
  }

  .mobile-menu__nav {
    min-height: calc(100dvh - var(--header-height));
  }

  .footer__grid {
    grid-template-columns: 1fr;
    gap: 1.25rem;
  }

  .footer__col--brand {
    grid-column: auto;
  }

  .footer__payments {
    width: 100%;
    justify-content: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .telegram-widget {
    right: 12px;
    bottom: 12px;
    gap: 10px;
  }

  .telegram-fab {
    width: 44px;
    height: 44px;
  }

  .telegram-fab__avatar {
    width: 100%;
    height: 100%;
  }

  .telegram-chat-card {
    width: min(320px, calc(100vw - 24px));
    padding: 18px;
    border-radius: 16px;
  }

  .telegram-chat-card__avatar-wrap {
    width: 68px;
    height: 68px;
    margin-bottom: 12px;
  }

  .telegram-chat-card strong {
    font-size: 1.1rem;
  }

  .telegram-chat-card p {
    margin-bottom: 14px;
    font-size: 0.8rem;
  }
}

@media (max-width: 360px) {
  .header__container {
    padding-inline: 0.625rem;
  }

  .header-logo {
    width: 52px;
    height: 52px;
  }

  .header__actions {
    gap: 0.25rem;
  }

  .auth-btn,
  .mobile-cart-btn,
  .mobile-menu-btn {
    width: 42px;
    height: 42px;
    padding: 0;
    justify-content: center;
  }

  .mobile-menu__nav .nav-link {
    min-height: 48px;
    padding-block: 0.7rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .telegram-fab {
    animation: none;
  }

  .telegram-card-enter-active,
  .telegram-card-leave-active {
    transition-duration: 0.01ms;
  }
}
</style>
