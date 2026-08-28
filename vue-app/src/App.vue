<template>
  <div class="app">
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
    <a
      class="telegram-fab"
      href="https://t.me/+UwZu11Bt55FhNTIy"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Написать в Telegram"
      title="Написать в Telegram"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.03-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.37.09 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
      </svg>
    </a>
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
              <li><router-link to="/about">О компании</router-link></li>
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
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useCartStore } from './store/cart'
import { useThemeStore } from './store/theme'
import { useAuthStore } from './store/auth'
import PageLoader from './components/PageLoader.vue'

const cartStore = useCartStore()
const themeStore = useThemeStore()
const authStore = useAuthStore()
const mobileMenuOpen = ref(false)
const cursorRoot = ref(null)
const cursorDotRefs = ref([])
const cursorDots = Array.from({ length: 8 })
const ATTRIBUTION_STORAGE_KEY = 'angel_wings_attribution'
const ATTRIBUTION_KEYS = ['aw_m', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']
let cursorFrameId = 0
let removeCursorMoveListener = null
let removePageActivityListener = null
let cursorScrollIdleTimer = null
let cursorPausedByScroll = false

const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value
}

const closeMobileMenu = () => {
  mobileMenuOpen.value = false
}

watch(mobileMenuOpen, (isOpen) => {
  document.body.style.overflow = isOpen ? 'hidden' : ''
})

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

onMounted(() => {
  captureAttributionFromUrl()

  const updatePageActivity = () => {
    const isInactive = document.hidden || !document.hasFocus()
    document.documentElement.classList.toggle('is-page-inactive', isInactive)
  }

  updatePageActivity()
  document.addEventListener('visibilitychange', updatePageActivity)
  window.addEventListener('blur', updatePageActivity)
  window.addEventListener('focus', updatePageActivity)
  removePageActivityListener = () => {
    document.removeEventListener('visibilitychange', updatePageActivity)
    window.removeEventListener('blur', updatePageActivity)
    window.removeEventListener('focus', updatePageActivity)
  }

  const canUseCustomCursor =
    window.matchMedia('(min-width: 1024px) and (pointer: fine)').matches &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (!canUseCustomCursor || !cursorRoot.value) {
    document.documentElement.classList.remove('has-goo-cursor')
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
    cursorPausedByScroll = true
    cursorRoot.value?.classList.remove('is-visible')
    document.documentElement.classList.add('is-page-scrolling')
    stopCursorLoop()

    if (cursorScrollIdleTimer) window.clearTimeout(cursorScrollIdleTimer)
    cursorScrollIdleTimer = window.setTimeout(() => {
      cursorPausedByScroll = false
      document.documentElement.classList.remove('is-page-scrolling')
    }, 240)
  }

  const onPointerMove = (event) => {
    if (event.pointerType === 'touch') return
    mouse.x = event.clientX
    mouse.y = event.clientY

    if (cursorPausedByScroll) return

    if (document.hidden || !document.hasFocus()) {
      cursorRoot.value?.classList.remove('is-visible')
      stopCursorLoop()
      return
    }
    if (event.target?.closest?.(nativeCursorSelector)) {
      cursorRoot.value?.classList.remove('is-visible')
      return
    }
    cursorRoot.value?.classList.add('is-visible')

    if (!cursorStarted) {
      cursorStarted = true
      renderCursor()
    }
  }

  const onPointerOver = (event) => {
    if (event.pointerType === 'touch') return
    if (event.target?.closest?.(nativeCursorSelector)) {
      cursorRoot.value?.classList.remove('is-visible')
    }
  }

  const onPointerOut = (event) => {
    if (event.pointerType === 'touch') return
    const fromNativeCursor = event.target?.closest?.(nativeCursorSelector)
    const toNativeCursor = event.relatedTarget?.closest?.(nativeCursorSelector)
    if (fromNativeCursor && !toNativeCursor) {
      cursorRoot.value?.classList.add('is-visible')
    }
  }

  const renderCursor = () => {
    if (document.hidden || !document.hasFocus()) {
      cursorRoot.value?.classList.remove('is-visible')
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
    if (cursorScrollIdleTimer) window.clearTimeout(cursorScrollIdleTimer)
  }
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
  document.documentElement.classList.remove('has-goo-cursor')
  document.documentElement.classList.remove('is-page-inactive')
  document.documentElement.classList.remove('is-page-scrolling')
})
</script>

<style>
@media (min-width: 1024px) and (pointer: fine) and (prefers-reduced-motion: no-preference) {
  html.has-goo-cursor,
  html.has-goo-cursor * {
    cursor: none !important;
  }

  html.has-goo-cursor [data-native-cursor],
  html.has-goo-cursor [data-native-cursor] iframe {
    cursor: auto !important;
  }

  html.has-goo-cursor [data-native-cursor] a,
  html.has-goo-cursor [data-native-cursor] button {
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

html.is-page-inactive .cursor-goo {
  opacity: 0 !important;
}

html.is-page-scrolling .cursor-goo {
  opacity: 0 !important;
  filter: none;
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
  min-height: 100vh;
  display: flex;
  flex-direction: column;
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
  padding: 0 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: var(--header-height);
  gap: 1rem;
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
  height: 100px;
  width: auto;
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
  font-size: 1.25rem;
  letter-spacing: 0.2em;
  color: var(--text-primary);
  transition: color 0.4s ease;
  white-space: nowrap;
}

.header-logo {
  height: 100px;
  width: auto;
  object-fit: contain;
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
  padding-top: var(--header-height);
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

.telegram-fab {
  position: fixed;
  right: 22px;
  bottom: 22px;
  width: 58px;
  height: 58px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  background: linear-gradient(145deg, #33a8ff 0%, #1f85ff 100%);
  border: 1px solid rgba(255, 255, 255, 0.22);
  box-shadow: 0 16px 36px rgba(32, 118, 255, 0.45);
  z-index: 95;
  transition: transform 0.25s ease, box-shadow 0.25s ease, filter 0.25s ease;
  animation: telegramPulse 2.4s ease-in-out infinite;
}

.telegram-fab:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 18px 38px rgba(32, 118, 255, 0.58);
  filter: saturate(1.1);
}

.telegram-fab:active {
  transform: translateY(0) scale(0.98);
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

@media (max-width: 1107px) {
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
    padding: 1rem;
    gap: 0.5rem;
    background: var(--bg-card);
    border-radius: 0 0 20px 20px;
    min-height: calc(100dvh - var(--header-height));
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
  .header__container {
    padding: 0 0.75rem;
    gap: 0.5rem;
    height: 64px;
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
  .header__container {
    height: 60px;
  }

  .mobile-menu {
    top: 56px;
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

  .telegram-fab {
    width: 44px;
    height: 44px;
    right: 12px;
    bottom: 12px;
  }

  .telegram-fab svg {
    width: 20px;
    height: 20px;
  }
}
</style>
