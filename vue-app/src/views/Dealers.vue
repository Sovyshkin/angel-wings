<template>
  <div class="dealers-page">
    <section class="dealers-hero">
      <div class="container dealers-hero__container">
        <div class="dealers-hero__copy">
          <span class="dealers-kicker">
            <span></span>
            Официальные точки
          </span>
          <h1>Дилеры Angel Wings</h1>
          <p>Найдите ближайшего представителя и выберите удобный канал связи. В карточках показаны только те контакты, которые заполнены администратором.</p>
        </div>

        <div class="dealers-search">
          <label for="dealer-city">Поиск по городу</label>
          <div class="dealers-search__field">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              id="dealer-city"
              v-model="search"
              type="search"
              placeholder="Например, Москва"
            >
          </div>
        </div>
      </div>
    </section>

    <section class="dealers-section">
      <div class="container">
        <div v-if="loading" class="dealers-state">
          <span class="dealers-spinner"></span>
          Загружаем дилеров
        </div>

        <div v-else-if="error" class="dealers-state dealers-state--error">
          {{ error }}
        </div>

        <div v-else-if="filteredDealers.length" class="dealers-grid">
          <article v-for="dealer in filteredDealers" :key="dealer.id" class="dealer-card">
            <div class="dealer-card__top">
              <div class="dealer-card__pin">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1118 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
              </div>
              <div>
                <span class="dealer-card__label">Дилер</span>
                <h2>{{ dealer.city }}</h2>
              </div>
            </div>

            <div class="dealer-card__contacts">
              <a v-if="dealer.phone" class="dealer-contact dealer-contact--phone" :href="phoneHref(dealer.phone)">
                <span class="dealer-contact__icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
                  </svg>
                </span>
                <span>
                  <small>Телефон</small>
                  {{ dealer.phone }}
                </span>
              </a>

              <div v-if="dealer.address" class="dealer-contact">
                <span class="dealer-contact__icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 21h18"/>
                    <path d="M5 21V8l7-5 7 5v13"/>
                    <path d="M9 21v-6h6v6"/>
                  </svg>
                </span>
                <span>
                  <small>Адрес</small>
                  {{ dealer.address }}
                </span>
              </div>
            </div>

            <div v-if="socialLinks(dealer).length" class="dealer-socials">
              <component
                v-for="item in socialLinks(dealer)"
                :key="`${dealer.id}-${item.type}`"
                :is="item.href ? 'a' : 'span'"
                class="dealer-social"
                :href="item.href || undefined"
                :target="item.href ? '_blank' : undefined"
                :rel="item.href ? 'noopener noreferrer' : undefined"
                :aria-label="item.label"
              >
                <span class="dealer-social__icon" :class="`dealer-social__icon--${item.type}`" v-html="item.icon"></span>
                <span>{{ item.text }}</span>
              </component>
            </div>
          </article>
        </div>

        <div v-else class="dealers-state dealers-state--empty">
          <strong>Дилеры пока не добавлены</strong>
          <span>Как только администратор опубликует первую карточку, она появится здесь.</span>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import axios from 'axios'

const dealers = ref([])
const loading = ref(true)
const error = ref('')
const search = ref('')

const icons = {
  telegram: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19.8 4.4 3.7 10.6c-1.1.4-1.1 1.1-.2 1.4l4.1 1.3 1.6 5c.2.6.3.8.7.8.4 0 .6-.2.9-.5l2.1-2 4.4 3.2c.8.4 1.3.2 1.5-.8l2.7-12.8c.3-1.1-.4-1.6-1.7-1.1Zm-2.4 3-8.3 7.5-.3 3.1-1.4-4.6 10-6Z"/></svg>',
  instagram: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1"/></svg>',
  max: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="2.5" y="4" width="19" height="16" rx="5" fill="currentColor" opacity=".18"/><path d="M6.7 15V9h1.4l1.8 2.5L11.7 9h1.4v6h-1.5v-3.4l-1.3 1.8h-.8l-1.3-1.8V15H6.7Zm7.6 0 2.1-6h1.6l2.1 6h-1.6l-.3-1h-2.1l-.3 1h-1.5Zm2.2-2.2h1.3l-.6-2-.7 2Z" fill="currentColor"/></svg>'
}

const filteredDealers = computed(() => {
  const query = search.value.trim().toLowerCase()
  if (!query) return dealers.value
  return dealers.value.filter((dealer) => dealer.city.toLowerCase().includes(query))
})

function phoneHref(phone) {
  return `tel:${String(phone).replace(/[^\d+]/g, '')}`
}

function socialHref(type, value) {
  const text = String(value || '').trim()
  if (!text) return null
  if (/^https?:\/\//i.test(text)) return text

  const handle = text.replace(/^@/, '')
  if (type === 'telegram') return `https://t.me/${handle}`
  if (type === 'instagram') return `https://instagram.com/${handle}`
  return null
}

function socialText(value) {
  return String(value || '').trim().replace(/^https?:\/\/(t\.me|telegram\.me|instagram\.com)\//i, '@')
}

function socialLinks(dealer) {
  return [
    dealer.telegram && {
      type: 'telegram',
      label: 'Telegram',
      text: socialText(dealer.telegram),
      href: socialHref('telegram', dealer.telegram),
      icon: icons.telegram
    },
    dealer.instagram && {
      type: 'instagram',
      label: 'Instagram',
      text: socialText(dealer.instagram),
      href: socialHref('instagram', dealer.instagram),
      icon: icons.instagram
    },
    dealer.max && {
      type: 'max',
      label: 'MAX',
      text: dealer.max,
      href: socialHref('max', dealer.max),
      icon: icons.max
    }
  ].filter(Boolean)
}

async function fetchDealers() {
  loading.value = true
  error.value = ''

  try {
    const { data } = await axios.get('/api/dealers')
    dealers.value = data.dealers || []
  } catch (requestError) {
    console.error(requestError)
    error.value = 'Не удалось загрузить дилеров. Попробуйте обновить страницу.'
  } finally {
    loading.value = false
  }
}

onMounted(fetchDealers)
</script>

<style scoped>
.dealers-page {
  position: relative;
  min-height: 100vh;
  padding: 6.5rem 0 5rem;
  overflow: hidden;
}

.dealers-page::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 72% 12%, rgba(46, 135, 255, 0.18), transparent 26rem),
    radial-gradient(circle at 18% 36%, rgba(166, 185, 248, 0.12), transparent 28rem),
    linear-gradient(180deg, rgba(8, 12, 24, 0.34), transparent 42%);
  pointer-events: none;
}

[data-theme="light"] .dealers-page::before {
  background:
    radial-gradient(circle at 72% 12%, rgba(70, 130, 255, 0.14), transparent 25rem),
    radial-gradient(circle at 18% 36%, rgba(166, 185, 248, 0.16), transparent 26rem);
}

.dealers-hero,
.dealers-section {
  position: relative;
  z-index: 1;
}

.dealers-hero__container {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(280px, 420px);
  align-items: end;
  gap: 2rem;
}

.dealers-hero__copy {
  max-width: 780px;
}

.dealers-kicker {
  display: inline-flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.72rem 1rem;
  margin-bottom: 1.5rem;
  border: 1px solid rgba(166, 185, 248, 0.42);
  border-radius: 999px;
  color: var(--accent);
  background: rgba(166, 185, 248, 0.08);
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.dealers-kicker span {
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 18px rgba(166, 185, 248, 0.9);
}

.dealers-hero h1 {
  max-width: 760px;
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(2.6rem, 6vw, 5.3rem);
  font-weight: 800;
  line-height: 0.98;
  letter-spacing: 0;
}

.dealers-hero p {
  max-width: 650px;
  margin-top: 1.4rem;
  color: var(--text-secondary);
  font-size: clamp(1rem, 1.5vw, 1.2rem);
}

.dealers-search {
  padding: 1.1rem;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: color-mix(in srgb, var(--bg-card) 78%, transparent);
  backdrop-filter: blur(14px);
}

.dealers-search label {
  display: block;
  margin-bottom: 0.65rem;
  color: var(--text-secondary);
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.dealers-search__field {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-height: 3.25rem;
  padding: 0 1rem;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--bg-secondary);
  color: var(--accent);
}

.dealers-search input {
  width: 100%;
  min-width: 0;
  border: 0;
  background: transparent;
  color: var(--text-primary);
  font-size: 1rem;
}

.dealers-search input::placeholder {
  color: var(--text-muted);
}

.dealers-section {
  margin-top: 3rem;
}

.dealers-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}

.dealer-card {
  position: relative;
  min-height: 320px;
  padding: 1.35rem;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background:
    linear-gradient(160deg, rgba(166, 185, 248, 0.12), transparent 40%),
    color-mix(in srgb, var(--bg-card) 88%, transparent);
  box-shadow: 0 22px 60px rgba(0, 0, 0, 0.18);
  overflow: hidden;
}

.dealer-card::after {
  content: '';
  position: absolute;
  right: -4rem;
  top: -4rem;
  width: 11rem;
  height: 11rem;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(48, 144, 255, 0.22), transparent 62%);
  pointer-events: none;
}

.dealer-card__top {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding-bottom: 1.15rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid var(--border);
}

.dealer-card__pin {
  width: 3rem;
  height: 3rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  background: var(--accent);
  color: #07101f;
  box-shadow: 0 12px 34px rgba(166, 185, 248, 0.32);
  flex: 0 0 auto;
}

.dealer-card__label {
  display: block;
  margin-bottom: 0.2rem;
  color: var(--text-muted);
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.dealer-card h2 {
  margin: 0;
  font-size: clamp(1.35rem, 2vw, 1.8rem);
  line-height: 1.1;
}

.dealer-card__contacts {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 0.75rem;
}

.dealer-contact,
.dealer-social {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.035);
}

.dealer-contact {
  padding: 0.85rem;
  color: var(--text-primary);
}

[data-theme="light"] .dealer-contact,
[data-theme="light"] .dealer-social {
  background: rgba(12, 18, 32, 0.035);
}

.dealer-contact__icon,
.dealer-social__icon {
  width: 2.25rem;
  height: 2.25rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  flex: 0 0 auto;
  background: rgba(166, 185, 248, 0.14);
  color: var(--accent);
}

.dealer-contact span:last-child {
  min-width: 0;
  overflow-wrap: anywhere;
}

.dealer-contact small {
  display: block;
  color: var(--text-muted);
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
}

.dealer-contact--phone:hover,
.dealer-social:hover {
  border-color: rgba(166, 185, 248, 0.5);
  background: rgba(166, 185, 248, 0.08);
}

.dealer-socials {
  position: relative;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
  margin-top: 1rem;
}

.dealer-social {
  padding: 0.55rem 0.75rem;
  color: var(--text-primary);
  font-weight: 700;
}

.dealer-social__icon--telegram {
  background: rgba(35, 164, 240, 0.15);
  color: #35a8f2;
}

.dealer-social__icon--instagram {
  background: rgba(238, 78, 138, 0.14);
  color: #f16aa3;
}

.dealer-social__icon--max {
  background: rgba(55, 134, 255, 0.14);
  color: #6ea6ff;
}

.dealers-state {
  min-height: 18rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 2rem;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg-card);
  color: var(--text-secondary);
  text-align: center;
}

.dealers-state--empty {
  flex-direction: column;
}

.dealers-state--empty strong {
  color: var(--text-primary);
  font-size: 1.25rem;
}

.dealers-state--error {
  color: var(--danger);
}

.dealers-spinner {
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  border: 2px solid var(--border);
  border-top-color: var(--accent);
  animation: dealers-spin 0.8s linear infinite;
}

@keyframes dealers-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 1024px) {
  .dealers-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .dealers-page {
    padding: 5.5rem 0 3.5rem;
  }

  .dealers-hero__container {
    grid-template-columns: 1fr;
    align-items: stretch;
  }

  .dealers-hero h1 {
    font-family: var(--font-body);
    font-size: clamp(2.15rem, 11vw, 3.25rem);
    line-height: 1.04;
  }

  .dealers-search {
    padding: 0.85rem;
  }

  .dealers-grid {
    grid-template-columns: 1fr;
  }

  .dealer-card {
    min-height: auto;
    padding: 1rem;
  }
}
</style>
