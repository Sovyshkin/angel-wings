<template>
  <div class="home">
    <section class="hero">
      <div class="hero__bg">
        <div class="orb orb-1"></div>
        <div class="orb orb-2"></div>
        <div class="grid-lines"></div>
      </div>
      <div class="hero__container">
        <div class="hero__badge">
          <span class="badge-dot"></span>
          Высокочистые пептиды
        </div>
        <h1 class="hero__title">
          Научный подход<br>
          <span class="accent">к здоровью</span>
        </h1>
        <p class="hero__desc">
          Единственный производитель пептидов с действующей фармацевтической лицензией
        </p>
        <div class="hero__chips">
          <span class="hero-chip">in vitro only</span>
          <span class="hero-chip">Фармлицензия</span>
          <span class="hero-chip">Контроль партий</span>
        </div>
        <div class="hero__actions">
          <router-link to="/catalog" class="btn btn-primary">
            Перейти в каталог
            <svg class="btn-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </router-link>
          <a href="#features" class="btn btn-secondary">Узнать больше</a>
          <a href="/pharmaceutical-license.pdf" class="btn btn-license" target="_blank" rel="noopener">
            Лицензия PDF
            <svg class="btn-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <path d="M14 2v6h6"/>
              <path d="M9 15h6M9 18h4"/>
            </svg>
          </a>
        </div>
        <div class="hero__stats">
          <div class="stat">
            <span class="stat-value">99.9%</span>
            <span class="stat-label">Чистота</span>
          </div>
          <div class="stat">
            <span class="stat-value">20+</span>
            <span class="stat-label">Продуктов</span>
          </div>
          <div class="stat">
            <span class="stat-value">24/7</span>
            <span class="stat-label">Поддержка</span>
          </div>
        </div>
      </div>
    </section>

    <section class="features" id="features" data-aos="fade-up" data-aos-offset="100">
      <div class="container">
        <div class="features-panel" data-aos="fade-up" data-aos-delay="100">
          <article class="features-lead">
            <span class="features-kicker">Производственный контур Angel Wings</span>
            <h2>Фармацевтическая дисциплина на каждом этапе</h2>
            <p>
              Мы выстроили цикл от разработки до выпуска так, чтобы клиент получал прогнозируемое качество,
              а не случайный результат от партии к партии.
            </p>
            <a href="/pharmaceutical-license.pdf" class="features-license" target="_blank" rel="noopener">
              <span class="features-license__icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  <path d="M9 12l2 2 4-4"/>
                </svg>
              </span>
              <span>
                Действующая фармацевтическая лицензия
                <small>Открыть документ PDF</small>
              </span>
            </a>
            <div class="features-metrics">
              <div class="features-metric">
                <strong>100%</strong>
                <span>собственное производство</span>
              </div>
              <div class="features-metric">
                <strong>20+</strong>
                <span>лет экспертизы в фарме</span>
              </div>
            </div>
          </article>

          <div class="features-cards">
            <article class="feature-card">
              <div class="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/>
                </svg>
              </div>
              <h3>Свое производство</h3>
              <p>Единственные, кто производит 100% своих продуктов самостоятельно и ничего не перепродает.</p>
            </article>

            <article class="feature-card">
              <div class="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 12l2 2 4-4"/>
                  <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c1.71 0 3.37.5 4.8 1.4"/>
                  <circle cx="12" cy="12" r="9"/>
                </svg>
              </div>
              <h3>Фармацевтическое качество</h3>
              <p>В основе процессов — стандарты фармкомпании с 20-летней экспертизой в разработке лекарств.</p>
            </article>

            <article class="feature-card">
              <div class="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <h3>Генноинженерные продукты</h3>
              <p>Основные продукты создаются без химического синтеза и содержат минимальный уровень примесей.</p>
            </article>

            <article class="feature-card">
              <div class="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <h3>Уникальные разработки</h3>
              <p>Многие препараты не имеют прямых аналогов в мире и формируют отдельные продуктовые ниши.</p>
            </article>
          </div>
        </div>
      </div>
    </section>

    <section ref="catalogPreview" class="categories-preview" data-aos="fade-left" data-aos-offset="100">
      <div class="container">
        <div class="section-header" data-aos="fade-up">
          <h2 class="section-title">Категории</h2>
          <router-link to="/catalog" class="view-all">
            Все категории
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </router-link>
        </div>

        <div class="categories-lab" data-aos="fade-up" data-aos-delay="100">
          <aside class="categories-lab__panel">
            <span class="categories-lab__kicker">Навигатор ассортимента</span>
            <h3>Выберите направление и соберите свой протокол под задачу</h3>
            <p>
              Категории распределены по функциональным направлениям: восстановление, нейро-поддержка,
              иммунный баланс и регенерация.
            </p>
            <div class="categories-lab__metrics">
              <div class="categories-lab__metric"><strong>{{ totalProductsCount }}</strong><span>позиций</span></div>
              <div class="categories-lab__metric"><strong>{{ totalDirectionsCount }}</strong><span>направления</span></div>
              <div class="categories-lab__metric"><strong>100%</strong><span>in-house</span></div>
            </div>
            <router-link to="/catalog" class="categories-lab__cta">
              Открыть полный каталог
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </router-link>
          </aside>

          <div class="categories-lanes">
            <router-link to="/catalog?category=longevitiya" class="category-lane lane-longevity">
              <div class="category-lane__left">
                <span class="category-lane__icon">
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M18.178 8c5.096 0 5.096 8 0 8-5.095 0-7.133-8-12.739-8-4.585 0-4.585 8 0 8 5.606 0 7.644-8 12.74-8z"/>
                  </svg>
                </span>
                <div>
                  <h4>Долголетие</h4>
                  <p>Восстановление, устойчивый функциональный тонус и anti-age подход.</p>
                </div>
              </div>
              <div class="category-lane__right">
                <span class="category-lane__count">{{ getCategoryCount('longevitiya') }}</span>
                <span class="category-lane__meta">{{ getProductWord(getCategoryCount('longevitiya')) }}</span>
              </div>
            </router-link>

            <router-link to="/catalog?category=immunomodulyatory" class="category-lane lane-immune">
              <div class="category-lane__left">
                <span class="category-lane__icon">
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    <path d="M9 12l2 2 4-4"/>
                  </svg>
                </span>
                <div>
                  <h4>Иммуномодуляторы</h4>
                  <p>Поддержка иммунного ответа и адаптации к стрессовым факторам.</p>
                </div>
              </div>
              <div class="category-lane__right">
                <span class="category-lane__count">{{ getCategoryCount('immunomodulyatory') }}</span>
                <span class="category-lane__meta">{{ getProductWord(getCategoryCount('immunomodulyatory')) }}</span>
              </div>
            </router-link>

            <router-link to="/catalog?category=neiropeptide" class="category-lane lane-neuro">
              <div class="category-lane__left">
                <span class="category-lane__icon">
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M12 2a7 7 0 017 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 01-2 2H10a2 2 0 01-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 017-7z"/>
                    <path d="M9 22h6"/>
                  </svg>
                </span>
                <div>
                  <h4>Нейропептиды</h4>
                  <p>Когнитивные функции, ясность мышления и поддержка нервной системы.</p>
                </div>
              </div>
              <div class="category-lane__right">
                <span class="category-lane__count">{{ getCategoryCount('neiropeptide') }}</span>
                <span class="category-lane__meta">{{ getProductWord(getCategoryCount('neiropeptide')) }}</span>
              </div>
            </router-link>

            <router-link to="/catalog?category=growth" class="category-lane lane-growth">
              <div class="category-lane__left">
                <span class="category-lane__icon">
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                  </svg>
                </span>
                <div>
                  <h4>Факторы роста</h4>
                  <p>Регенеративные механизмы и усиление восстановительных процессов.</p>
                </div>
              </div>
              <div class="category-lane__right">
                <span class="category-lane__count">{{ getCategoryCount('growth') }}</span>
                <span class="category-lane__meta">{{ getProductWord(getCategoryCount('growth')) }}</span>
              </div>
            </router-link>
          </div>
        </div>
      </div>
    </section>

    <section class="featured-products" data-aos="fade-right" data-aos-offset="100">
      <div class="container">
        <div class="section-header" data-aos="fade-up">
          <h2 class="section-title">Популярные товары</h2>
          <router-link to="/catalog" class="view-all">
            Смотреть все
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </router-link>
        </div>
        <div class="featured-grid" data-aos="fade-up" data-aos-delay="100">
          <router-link 
            v-for="product in featuredProducts" 
            :key="product.id" 
            :to="`/product/${product.id}`"
            class="featured-card"
          >
            <div class="featured-image">
              <img
                :src="product.image"
                :alt="product.title"
                width="480"
                height="480"
                loading="lazy"
                decoding="async"
                @error="handleImageError"
              >
            </div>
            <div class="featured-content">
              <div class="featured-meta">
                <span class="featured-category">{{ product.categories?.[0]?.name || product.categories?.[0]?.slug }}</span>
                <span v-if="isLowStock(product)" class="featured-low-stock">Меньше 10 осталось</span>
              </div>
              <h3>{{ product.title }}</h3>
              <div class="featured-footer">
                <div class="featured-price-block">
                  <span class="featured-price">{{ formatPrice(product.price) }} ₽</span>
                  <div v-if="getOldPrice(product)" class="featured-discount-row">
                    <span class="featured-old-price">{{ formatPrice(getOldPrice(product)) }} ₽</span>
                    <span class="featured-discount-badge">-{{ getDiscountPercent(product) }}%</span>
                  </div>
                </div>
                <button
                  v-if="getFeaturedCartQty(product.id) === 0"
                  class="featured-add-btn"
                  type="button"
                  aria-label="Добавить в корзину"
                  @click.stop.prevent="increaseFeaturedQty(product)"
                  :disabled="!product.stock"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 5v14M5 12h14"/>
                  </svg>
                </button>
                <div v-else class="featured-qty-control" @click.stop.prevent>
                  <button
                    class="featured-qty-btn"
                    type="button"
                    aria-label="Уменьшить"
                    @click.stop.prevent="decreaseFeaturedQty(product)"
                    :disabled="getFeaturedCartQty(product.id) <= 0"
                  >
                    −
                  </button>
                  <span class="featured-qty-value">{{ getFeaturedCartQty(product.id) }}</span>
                  <button
                    class="featured-qty-btn"
                    type="button"
                    aria-label="Увеличить"
                    @click.stop.prevent="increaseFeaturedQty(product)"
                    :disabled="!product.stock || getFeaturedCartQty(product.id) >= product.stock"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </router-link>
        </div>
      </div>
    </section>

    <section class="cta" data-aos="zoom-in" data-aos-offset="100">
      <div class="container">
        <div class="cta__inner">
          <div class="cta__content">
            <h2>Нужна консультация?</h2>
            <p>Наши специалисты помогут подобрать оптимальный комплекс пептидов для ваших целей</p>
            <router-link to="/contact" class="btn btn-primary">Связаться с нами</router-link>
          </div>
          <div class="cta__decoration">
            <div class="molecule">
              <div class="atom"></div>
              <div class="atom"></div>
              <div class="atom"></div>
              <div class="orbit"></div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="benefits" data-aos="fade-up" data-aos-offset="100">
      <div class="container">
        <div class="section-header" data-aos="fade-up">
          <h2 class="section-title">Почему выбирают нас</h2>
        </div>
        <div class="benefits__timeline" data-aos="fade-up" data-aos-delay="100">
          <div class="timeline-item">
            <div class="timeline-index">01</div>
            <div class="timeline-content">
              <h3>GMP-сертификация</h3>
              <p>Все производственные площадки имеют сертификаты GMP — гарантия качества на каждом этапе.</p>
            </div>
          </div>
          <div class="timeline-item">
            <div class="timeline-index">02</div>
            <div class="timeline-content">
              <h3>Тройной контроль</h3>
              <p>HPLC, Mass-Spectrometry, Amino Acid Analysis — три независимых метода проверки каждой партии.</p>
            </div>
          </div>
          <div class="timeline-item">
            <div class="timeline-index">03</div>
            <div class="timeline-content">
              <h3>Быстрая доставка</h3>
              <p>Отправка в течение 24 часов. DHL, FedEx, EMS — доставка в 150+ стран мира.</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="promo-banner" data-aos="fade-right" data-aos-offset="100">
      <div class="promo-bg">
        <div class="promo-orb promo-orb-1"></div>
        <div class="promo-orb promo-orb-2"></div>
        <div class="promo-orb promo-orb-3"></div>
      </div>
      <div class="container">
        <div class="promo-content">
          <div class="promo-badge">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a4 4 0 01-4 4H7l-4 4V7a4 4 0 014-4h10a4 4 0 014 4z"/>
            </svg>
            Персональная консультация
          </div>
          <h2>Подберем пептидный комплекс под задачу</h2>
          <p>Поможем сориентироваться в каталоге и выбрать продукты под исследовательский протокол</p>
          <div class="promo-actions">
            <a href="https://t.me/Seraphim_angelwings" target="_blank" rel="noopener noreferrer" class="btn btn-accent">
              Получить консультацию
            </a>
            <router-link to="/catalog" class="promo-link">Открыть каталог</router-link>
          </div>
        </div>
      </div>
    </section>

    <section class="newsletter" data-aos="fade-up" data-aos-offset="100">
      <div class="container">
        <div class="newsletter__inner">
          <div class="newsletter__content">
            <h2>Подпишитесь на обновления</h2>
            <p>Получайте информацию о новинках, скидках и эксклюзивных предложениях первыми</p>
          </div>
          <form class="newsletter__form" @submit.prevent>
            <input type="email" placeholder="Ваш email" class="newsletter-input">
            <button type="submit" class="btn btn-accent">Подписаться</button>
          </form>
        </div>
      </div>
    </section>

    <section class="floating-elements" aria-hidden="true">
      <div class="float-shape float-shape-1"></div>
      <div class="float-shape float-shape-2"></div>
      <div class="float-shape float-shape-3"></div>
      <div class="float-shape float-shape-4"></div>
      <div class="float-shape float-shape-5"></div>
      <div class="float-shape float-shape-6"></div>
    </section>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useProductStore } from '../store/products'
import { useCartStore } from '../store/cart'
import { trackProductEvent } from '../api/analytics'

const productStore = useProductStore()
const cartStore = useCartStore()
const DISPLAY_CATEGORY_SLUGS = ['longevitiya', 'immunomodulyatory', 'neiropeptide', 'growth']
const catalogPreview = ref(null)
let catalogObserver = null
let catalogFallbackTimer = null
let catalogLoaded = false

const featuredProducts = computed(() => {
  return productStore.products.slice(0, 4)
})

const totalProductsCount = computed(() => productStore.totalProducts || productStore.products.length)

const categoryProductCountMap = computed(() => {
  const counts = Object.create(null)
  for (const slug of DISPLAY_CATEGORY_SLUGS) counts[slug] = 0

  for (const category of productStore.categories) {
    const slug = String(category?.slug || '').trim()
    if (counts[slug] !== undefined) {
      counts[slug] = Math.max(0, Number(category?.count || 0))
    }
  }

  return counts
})

const totalDirectionsCount = computed(() => {
  return DISPLAY_CATEGORY_SLUGS.filter((slug) => getCategoryCount(slug) > 0).length
})

async function loadCatalogPreview() {
  if (catalogLoaded) return
  catalogLoaded = true
  catalogObserver?.disconnect()
  if (catalogFallbackTimer) window.clearTimeout(catalogFallbackTimer)

  await Promise.all([
    productStore.fetchProducts('', { limit: 4 }),
    productStore.fetchCategories()
  ])
}

onMounted(() => {
  if ('IntersectionObserver' in window && catalogPreview.value) {
    catalogObserver = new IntersectionObserver((entries) => {
      if (entries.some(entry => entry.isIntersecting)) loadCatalogPreview()
    }, { rootMargin: '600px 0px' })
    catalogObserver.observe(catalogPreview.value)
    return
  }

  catalogFallbackTimer = window.setTimeout(loadCatalogPreview, 1500)
})

onBeforeUnmount(() => {
  catalogObserver?.disconnect()
  if (catalogFallbackTimer) window.clearTimeout(catalogFallbackTimer)
})

function handleImageError(e) {
  const img = e.target
  if (img.dataset.fallbackApplied === 'true') return
  img.dataset.fallbackApplied = 'true'
  img.src = '/logo-192.webp'
}

function normalizePrice(value) {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? n : 0
}

function formatPrice(value) {
  return normalizePrice(value).toLocaleString('ru-RU')
}

function getOldPrice(product) {
  const current = normalizePrice(product?.price)
  const old = normalizePrice(product?.comparePrice)
  if (!old || old <= current) return null
  return old
}

function getDiscountPercent(product) {
  const current = normalizePrice(product?.price)
  const old = getOldPrice(product)
  if (!old || old <= 0 || current <= 0 || old <= current) return 0
  return Math.round(((old - current) / old) * 100)
}

function isLowStock(product) {
  const stock = Number(product?.stock || 0)
  return stock > 0 && stock < 10
}

function getFeaturedBaseCartItem(productId) {
  return cartStore.items.find(item => item.id === productId && !item.selectedDosage)
}

function getFeaturedCartQty(productId) {
  const baseItem = getFeaturedBaseCartItem(productId)
  return Math.max(0, Number(baseItem?.quantity || 0))
}

function increaseFeaturedQty(product) {
  const qty = getFeaturedCartQty(product.id)
  const maxStock = Math.max(0, Number(product?.stock || 0))
  if (maxStock > 0 && qty >= maxStock) return
  cartStore.addItem({
    ...product,
    selectedDosage: null
  })
  trackProductEvent(product.id, 'add_to_cart', { source: 'home_featured', quantity: 1 })
}

function decreaseFeaturedQty(product) {
  const baseItem = getFeaturedBaseCartItem(product.id)
  if (!baseItem) return
  if (baseItem.quantity <= 1) {
    cartStore.removeItem(product.id, null)
    return
  }
  cartStore.updateQuantity(product.id, baseItem.quantity - 1, null)
}

function getCategoryCount(slug) {
  return categoryProductCountMap.value[slug] || 0
}

function getProductWord(count) {
  const value = Math.abs(Number(count) || 0)
  const mod10 = value % 10
  const mod100 = value % 100
  if (mod10 === 1 && mod100 !== 11) return 'товар'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'товара'
  return 'товаров'
}
</script>

<style scoped>
.home {
  padding-bottom: 0;
}

.features,
.categories-preview,
.featured-products,
.cta,
.benefits,
.promo-banner,
.newsletter {
  content-visibility: auto;
  contain-intrinsic-size: auto 900px;
}

.hero {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  padding: 8rem 0;
  overflow: hidden;
}

.hero__bg {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  transition: background 0.4s ease;
}

.orb-1 {
  width: 800px;
  height: 800px;
  background: radial-gradient(circle, var(--accent-dim) 0%, transparent 60%);
  top: -300px;
  left: -200px;
  animation: float 12s ease-in-out infinite;
}

.orb-2 {
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(166, 185, 248, 0.1) 0%, transparent 60%);
  bottom: -200px;
  right: -100px;
  animation: float 15s ease-in-out infinite reverse;
}

[data-theme="light"] .orb-2 {
  background: radial-gradient(circle, rgba(166, 185, 248, 0.15) 0%, transparent 60%);
}

.grid-lines {
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
  background-size: 80px 80px;
  mask-image: radial-gradient(ellipse 100% 80% at 50% 50%, black 0%, transparent 70%);
  transition: opacity 0.4s ease;
}

[data-theme="light"] .grid-lines {
  background-image: 
    linear-gradient(rgba(26, 26, 26, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(26, 26, 26, 0.03) 1px, transparent 1px);
}

@keyframes float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -30px) scale(1.05); }
  66% { transform: translate(-20px, 20px) scale(0.95); }
}

.hero__container {
  position: relative;
  z-index: 1;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
}

.hero__badge {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.5rem;
  background: var(--accent-dim);
  border: 1px solid var(--accent);
  border-radius: 100px;
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--accent);
  margin-bottom: 2.5rem;
  animation: fadeIn 0.8s ease-out;
}

.badge-dot {
  width: 8px;
  height: 8px;
  background: var(--accent);
  border-radius: 50%;
  box-shadow: 0 0 10px var(--accent);
  animation: pulse 2s ease-in-out infinite;
}

.hero__title {
  font-family: var(--font-display);
  font-size: clamp(3.5rem, 10vw, 7rem);
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.03em;
  margin-bottom: 2rem;
  animation: slideUp 0.8s ease-out 0.1s both;
}

.accent {
  color: var(--accent);
  text-shadow: 0 0 80px rgba(166, 185, 248, 0.4);
}

.hero__desc {
  font-size: 1.25rem;
  line-height: 1.7;
  color: var(--text-secondary);
  max-width: 560px;
  margin-bottom: 1.5rem;
  animation: slideUp 0.8s ease-out 0.2s both;
}

.hero__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin-bottom: 2.25rem;
  animation: slideUp 0.8s ease-out 0.25s both;
}

.hero-chip {
  padding: 0.4rem 0.75rem;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: linear-gradient(135deg, var(--bg-card), transparent);
  color: var(--text-secondary);
  font-size: 0.72rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.hero__actions {
  display: flex;
  gap: 1rem;
  margin-bottom: 5rem;
  animation: slideUp 0.8s ease-out 0.3s both;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 2rem;
  font-size: 0.9375rem;
  font-weight: 700;
  border-radius: 14px;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  letter-spacing: 0.02em;
}

.btn-primary {
  background: var(--accent);
  color: var(--bg-primary);
}

.btn-primary:hover {
  background: var(--accent-hover);
  transform: translateY(-3px);
  box-shadow: 0 15px 40px rgba(166, 185, 248, 0.3);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-primary);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
}

.btn-license {
  background: rgba(166, 185, 248, 0.1);
  color: var(--accent);
  border: 1px solid rgba(166, 185, 248, 0.28);
}

.btn-license:hover {
  background: rgba(166, 185, 248, 0.16);
  border-color: rgba(166, 185, 248, 0.46);
  transform: translateY(-3px);
}

.btn-icon {
  transition: transform 0.3s ease;
}

.btn:hover .btn-icon {
  transform: translateX(5px);
}

.hero__stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: clamp(1.25rem, 4vw, 4rem);
  max-width: 620px;
  animation: slideUp 0.8s ease-out 0.4s both;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  min-width: 0;
}

.stat-value {
  font-family: var(--font-mono);
  font-size: 2.75rem;
  font-weight: 700;
  color: var(--accent);
  line-height: 1;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-muted);
  margin-top: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  white-space: nowrap;
}

.features {
  padding: 8rem 0;
}

.features-panel {
  display: grid;
  grid-template-columns: 1.05fr 1fr;
  gap: 1.25rem;
}

.features-lead {
  position: relative;
  padding: 2.2rem;
  border-radius: 22px;
  border: 1px solid var(--border);
  background:
    radial-gradient(circle at 18% 15%, rgba(166, 185, 248, 0.16), transparent 42%),
    linear-gradient(160deg, var(--bg-card), var(--bg-secondary));
  overflow: hidden;
}

.features-lead::after {
  content: '';
  position: absolute;
  right: -120px;
  bottom: -120px;
  width: 260px;
  height: 260px;
  border-radius: 50%;
  border: 1px dashed rgba(166, 185, 248, 0.2);
}

.features-kicker {
  display: inline-flex;
  margin-bottom: 1rem;
  padding: 0.32rem 0.65rem;
  border: 1px solid var(--border);
  border-radius: 999px;
  color: var(--text-muted);
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.features-lead h2 {
  font-family: var(--font-display);
  font-size: clamp(1.4rem, 2.4vw, 2rem);
  line-height: 1.15;
  margin-bottom: 0.9rem;
}

.features-lead p {
  color: var(--text-secondary);
  line-height: 1.7;
  margin-bottom: 1.2rem;
}

.features-license {
  position: relative;
  z-index: 1;
  display: inline-grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 0.75rem;
  width: min(100%, 420px);
  padding: 0.85rem 1rem;
  margin-bottom: 1.2rem;
  border: 1px solid rgba(166, 185, 248, 0.24);
  border-radius: 14px;
  background: rgba(166, 185, 248, 0.08);
  color: var(--text-primary);
  font-size: 0.9rem;
  font-weight: 700;
  transition: transform 0.3s ease, border-color 0.3s ease, background 0.3s ease;
}

.features-license:hover {
  transform: translateY(-2px);
  border-color: rgba(166, 185, 248, 0.44);
  background: rgba(166, 185, 248, 0.12);
}

.features-license__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: var(--accent);
  color: var(--bg-primary);
}

.features-license small {
  display: block;
  margin-top: 0.1rem;
  color: var(--text-muted);
  font-size: 0.72rem;
  font-weight: 600;
}

.features-metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}

.features-metric {
  background: rgba(166, 185, 248, 0.08);
  border: 1px solid rgba(166, 185, 248, 0.18);
  border-radius: 14px;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.features-metric strong {
  font-family: var(--font-mono);
  color: var(--accent);
  font-size: 1.15rem;
}

.features-metric span {
  color: var(--text-secondary);
  font-size: 0.8rem;
}

.features-cards {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.9rem;
}

.feature-card {
  position: relative;
  padding: 1.35rem;
  background:
    linear-gradient(145deg, rgba(166, 185, 248, 0.07), transparent 35%),
    linear-gradient(145deg, var(--bg-card) 0%, var(--bg-secondary) 100%);
  border: 1px solid var(--border);
  border-radius: 18px;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  overflow: hidden;
}

.feature-card:hover {
  border-color: rgba(166, 185, 248, 0.3);
  transform: translateY(-6px);
  box-shadow: 0 14px 30px rgba(0, 0, 0, 0.28);
}

.feature-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent-dim);
  border-radius: 14px;
  color: var(--accent);
  margin-bottom: 0.9rem;
  transition: all 0.4s ease;
}

.feature-card:hover .feature-icon {
  background: var(--accent);
  color: var(--bg-primary);
  transform: rotate(-5deg) scale(1.1);
}

.feature-card h3 {
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: 0.45rem;
}

.feature-card p {
  font-size: 0.84rem;
  color: var(--text-secondary);
  line-height: 1.55;
}

.categories-preview {
  padding: 4rem 0 8rem;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 3rem;
}

.section-title {
  font-family: var(--font-display);
  font-size: 2.5rem;
  font-weight: 800;
}

.view-all {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--accent);
  transition: all 0.3s ease;
}

.view-all:hover {
  gap: 0.75rem;
}

.categories-lab {
  display: grid;
  grid-template-columns: minmax(280px, 0.9fr) 1.2fr;
  gap: 1rem;
}

.categories-lab__panel {
  padding: 1.5rem;
  border-radius: 22px;
  border: 1px solid var(--border);
  background:
    radial-gradient(circle at 25% 12%, rgba(166, 185, 248, 0.16), transparent 40%),
    linear-gradient(155deg, var(--bg-card), var(--bg-secondary));
}

.categories-lab__kicker {
  display: inline-flex;
  margin-bottom: 0.9rem;
  padding: 0.32rem 0.62rem;
  border-radius: 999px;
  border: 1px solid rgba(166, 185, 248, 0.35);
  color: var(--accent);
  font-size: 0.66rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.categories-lab__panel h3 {
  font-family: var(--font-display);
  font-size: clamp(1.2rem, 2.1vw, 1.8rem);
  line-height: 1.2;
  margin-bottom: 0.75rem;
}

.categories-lab__panel p {
  color: var(--text-secondary);
  font-size: 0.9rem;
  line-height: 1.65;
}

.categories-lab__metrics {
  margin-top: 1rem;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.5rem;
}

.categories-lab__metric {
  padding: 0.55rem;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.02);
  text-align: center;
}

.categories-lab__metric strong {
  display: block;
  font-family: var(--font-mono);
  color: var(--accent);
  font-size: 0.98rem;
}

.categories-lab__metric span {
  display: block;
  margin-top: 0.15rem;
  font-size: 0.68rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.categories-lab__cta {
  margin-top: 1.1rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--accent);
  font-weight: 600;
  font-size: 0.85rem;
}

.categories-lab__cta:hover {
  gap: 0.7rem;
}

.categories-lanes {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}

.category-lane {
  position: relative;
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 0.9rem;
  padding: 1rem 1.1rem;
  border-radius: 18px;
  border: 1px solid var(--border);
  background:
    linear-gradient(90deg, rgba(166, 185, 248, 0.08), transparent 42%),
    var(--bg-card);
  overflow: hidden;
  transition: transform 0.35s ease, border-color 0.35s ease, box-shadow 0.35s ease;
}

.category-lane::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: 0;
  width: var(--lane-progress, 40%);
  height: 2px;
  background: linear-gradient(90deg, var(--accent), transparent);
}

.category-lane:hover {
  transform: translateX(6px);
  border-color: rgba(166, 185, 248, 0.32);
  box-shadow: 0 14px 26px rgba(0, 0, 0, 0.2);
}

.lane-longevity { --lane-progress: 88%; }
.lane-immune { --lane-progress: 76%; }
.lane-neuro { --lane-progress: 74%; }
.lane-growth { --lane-progress: 62%; }

.category-lane__left {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.8rem;
  align-items: center;
}

.category-lane__icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--accent);
  background: rgba(166, 185, 248, 0.13);
  border: 1px solid rgba(166, 185, 248, 0.3);
}

.category-lane h4 {
  margin: 0 0 0.3rem;
  font-family: var(--font-display);
  font-size: 1.05rem;
}

.category-lane p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.83rem;
  line-height: 1.45;
}

.category-lane__right {
  text-align: right;
  min-width: 72px;
}

.category-lane__count {
  display: block;
  font-family: var(--font-mono);
  font-size: 1.4rem;
  color: var(--accent);
  line-height: 1;
}

.category-lane__meta {
  font-size: 0.72rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.featured-products {
  padding: 0 0 8rem;
}

.featured-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
}

.featured-card {
  position: relative;
  background:
    linear-gradient(160deg, rgba(166, 185, 248, 0.07), transparent 35%),
    var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 20px;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.featured-card:hover {
  border-color: rgba(166, 185, 248, 0.3);
  transform: translateY(-8px) scale(1.01);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
}

.featured-card::after {
  content: '';
  position: absolute;
  inset: -120% auto auto -40%;
  width: 60%;
  height: 260%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.08), transparent);
  transform: rotate(18deg);
  pointer-events: none;
  transition: transform 0.7s ease;
}

.featured-card:hover::after {
  transform: translateX(280%) rotate(18deg);
}

.featured-image {
  aspect-ratio: 4/3;
  overflow: hidden;
}

.featured-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.6s ease;
}

.featured-card:hover .featured-image img {
  transform: scale(1.08);
}

.featured-content {
  padding: 1.25rem;
}

.featured-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.featured-category {
  display: inline-block;
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--accent);
  background: var(--accent-dim);
  padding: 0.3rem 0.6rem;
  border-radius: 6px;
}

.featured-low-stock {
  display: inline-flex;
  align-items: center;
  font-size: 0.62rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.12);
  border: 1px solid rgba(245, 158, 11, 0.28);
  border-radius: 999px;
  padding: 0.28rem 0.55rem;
}

.featured-content h3 {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.featured-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.featured-price-block {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.featured-price {
  font-family: var(--font-mono);
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
}

.featured-discount-row {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.featured-old-price {
  font-size: 0.78rem;
  color: var(--text-muted);
  text-decoration: line-through;
}

.featured-discount-badge {
  font-size: 0.7rem;
  font-weight: 700;
  color: #ef4444;
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 999px;
  padding: 0.1rem 0.42rem;
}

.featured-add-btn {
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 9px;
  color: var(--text-primary);
  transition: all 0.3s ease;
}

.featured-add-btn:hover:not(:disabled) {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--bg-primary);
}

.featured-add-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.featured-qty-control {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.18rem;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--bg-secondary);
}

.featured-qty-btn {
  width: 26px;
  height: 26px;
  border: 1px solid transparent;
  border-radius: 7px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  color: var(--text-primary);
  font-size: 1rem;
  font-weight: 700;
  line-height: 1;
  transition: all 0.3s ease;
}

.featured-qty-btn:hover:not(:disabled) {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--bg-primary);
}

.featured-qty-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.featured-qty-value {
  min-width: 18px;
  text-align: center;
  font-family: var(--font-mono);
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--text-primary);
}

.cta {
  padding: 4rem 0 8rem;
}

.cta__inner {
  position: relative;
  padding: 5rem;
  background:
    radial-gradient(circle at 90% 15%, rgba(166, 185, 248, 0.13), transparent 35%),
    var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 28px;
  overflow: hidden;
  transition: background 0.4s ease, border-color 0.4s ease;
}

.cta__inner::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--accent), transparent);
}

.cta__content {
  position: relative;
  z-index: 1;
  max-width: 500px;
}

.cta__content h2 {
  font-family: var(--font-display);
  font-size: 2.5rem;
  font-weight: 800;
  margin-bottom: 1rem;
}

.cta__content p {
  font-size: 1.125rem;
  color: var(--text-secondary);
  margin-bottom: 2rem;
}

.cta__decoration {
  position: absolute;
  right: 5rem;
  top: 50%;
  transform: translateY(-50%);
}

.molecule {
  position: relative;
  width: 200px;
  height: 200px;
}

.atom {
  position: absolute;
  width: 24px;
  height: 24px;
  background: var(--accent);
  border-radius: 50%;
  box-shadow: 0 0 30px var(--accent);
}

.atom:nth-child(1) { top: 50%; left: 50%; transform: translate(-50%, -50%); }
.atom:nth-child(2) { top: 10%; left: 50%; transform: translate(-50%, -50%); }
.atom:nth-child(3) { bottom: 10%; left: 50%; transform: translate(-50%, 50%); }

.orbit {
  position: absolute;
  inset: 10%;
  border: 2px dashed rgba(166, 185, 248, 0.2);
  border-radius: 50%;
  animation: spin 30s linear infinite;
  transition: border-color 0.4s ease;
}

[data-theme="light"] .orbit {
  border-color: rgba(166, 185, 248, 0.3);
}

[data-theme="light"] .cta__content p {
  color: var(--text-secondary);
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(40px); }
  to { opacity: 1; transform: translateY(0); }
}

.benefits {
  padding: 8rem 0;
}

.benefits__timeline {
  position: relative;
  display: grid;
  gap: 0.85rem;
}

.timeline-item {
  position: relative;
  display: grid;
  grid-template-columns: 64px 1fr;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid var(--border);
  border-radius: 18px;
  background:
    linear-gradient(175deg, rgba(166, 185, 248, 0.06), transparent 28%),
    var(--bg-card);
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.timeline-item:hover {
  transform: translateX(6px);
  border-color: rgba(166, 185, 248, 0.35);
}

.timeline-index {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  background: var(--accent-dim);
  color: var(--accent);
  font-family: var(--font-mono);
  font-weight: 800;
  font-size: 1.2rem;
}

.timeline-content h3 {
  font-family: var(--font-display);
  font-size: 1.08rem;
  margin-bottom: 0.35rem;
}

.timeline-content p {
  margin: 0;
  font-size: 0.92rem;
  color: var(--text-secondary);
  line-height: 1.6;
}

.promo-banner {
  position: relative;
  padding: 6rem 0;
  margin: 4rem 0 8rem;
  overflow: hidden;
}

.promo-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, var(--accent) 0%, #1a4a6e 100%);
  clip-path: polygon(0 0, 100% 0, 100% 92%, 84% 100%, 0 94%);
  z-index: 0;
}

.promo-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.4;
}

.promo-orb-1 {
  width: 400px;
  height: 400px;
  background: rgba(255, 255, 255, 0.3);
  top: -150px;
  right: -100px;
  animation: float 10s ease-in-out infinite;
}

.promo-orb-2 {
  width: 300px;
  height: 300px;
  background: rgba(166, 185, 248, 0.3);
  bottom: -100px;
  left: 10%;
  animation: float 12s ease-in-out infinite reverse;
}

.promo-orb-3 {
  width: 200px;
  height: 200px;
  background: rgba(255, 255, 255, 0.2);
  top: 50%;
  right: 30%;
  animation: float 8s ease-in-out infinite;
}

.promo-content {
  position: relative;
  z-index: 1;
  text-align: center;
  color: white;
}

.promo-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 100px;
  font-size: 0.8rem;
  font-weight: 600;
  margin-bottom: 2rem;
}

.promo-content h2 {
  font-family: var(--font-display);
  font-size: 3rem;
  font-weight: 800;
  margin-bottom: 1rem;
}

.promo-content p {
  font-size: 1.25rem;
  opacity: 0.9;
  margin-bottom: 2rem;
}

.promo-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2rem;
}

.btn-accent {
  background: white;
  color: var(--bg-primary);
}

.btn-accent:hover {
  background: var(--bg-secondary);
  transform: translateY(-3px);
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3);
}

[data-theme="dark"] .btn-accent {
  background: var(--accent);
  color: var(--bg-primary);
}

[data-theme="dark"] .btn-accent:hover {
  background: var(--accent-hover);
}

[data-theme="light"] .btn-accent {
  background: var(--accent);
  color: var(--bg-primary);
}

[data-theme="light"] .btn-accent:hover {
  background: var(--accent-hover);
}

.promo-timer {
  font-family: var(--font-mono);
  font-size: 0.9rem;
  opacity: 0.8;
}

.promo-link {
  color: white;
  font-size: 0.9rem;
  font-weight: 700;
  opacity: 0.86;
  transition: opacity 0.3s ease;
}

.promo-link:hover {
  opacity: 1;
}

.author-avatar {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent-dim);
  color: var(--accent);
  border-radius: 50%;
  font-weight: 700;
  font-size: 0.9rem;
}

.author-info {
  display: flex;
  flex-direction: column;
}

.author-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
}

.author-date {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.newsletter {
  padding: 4rem 0 8rem;
}

.newsletter__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4rem;
  background:
    radial-gradient(circle at 12% 20%, rgba(166, 185, 248, 0.12), transparent 30%),
    var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 28px;
}

.newsletter__content h2 {
  font-family: var(--font-display);
  font-size: 2rem;
  font-weight: 800;
  margin-bottom: 0.5rem;
}

.newsletter__content p {
  color: var(--text-secondary);
}

.newsletter__form {
  display: flex;
  gap: 1rem;
}

.newsletter-input {
  padding: 1rem 1.5rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 14px;
  font-size: 0.9rem;
  color: var(--text-primary);
  outline: none;
  transition: border-color 0.3s;
  min-width: 280px;
}

.newsletter-input:focus {
  border-color: var(--accent);
}

.newsletter-input::placeholder {
  color: var(--text-muted);
}

.floating-elements {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

.float-shape {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.15;
  animation: floatRandom 20s ease-in-out infinite;
}

.float-shape-1 {
  width: 500px;
  height: 500px;
  background: linear-gradient(135deg, var(--accent), transparent);
  top: -200px;
  right: -150px;
  animation-delay: 0s;
}

.float-shape-2 {
  width: 350px;
  height: 350px;
  background: linear-gradient(135deg, #fd79a8, transparent);
  bottom: 20%;
  left: -100px;
  animation-delay: -5s;
}

.float-shape-3 {
  width: 280px;
  height: 280px;
  background: linear-gradient(135deg, #74b9ff, transparent);
  top: 40%;
  right: 5%;
  animation-delay: -10s;
}

.float-shape-4 {
  width: 220px;
  height: 220px;
  background: linear-gradient(135deg, #fab1a0, transparent);
  bottom: -50px;
  right: 35%;
  animation-delay: -15s;
}

.float-shape-5 {
  width: 200px;
  height: 200px;
  background: linear-gradient(135deg, #55efc4, transparent);
  top: 15%;
  left: 15%;
  animation-delay: -7s;
}

.float-shape-6 {
  width: 180px;
  height: 180px;
  background: linear-gradient(135deg, #a29bfe, transparent);
  top: 60%;
  left: 50%;
  animation-delay: -12s;
}

@keyframes floatRandom {
  0%, 100% { transform: translate(0, 0) scale(1); }
  25% { transform: translate(40px, -40px) scale(1.1); }
  50% { transform: translate(-30px, 30px) scale(0.9); }
  75% { transform: translate(20px, 10px) scale(1.05); }
}

@media (max-width: 1280px) {
  .features-panel { grid-template-columns: 1fr; }
  .features-cards { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .featured-grid { grid-template-columns: repeat(2, 1fr); }

  .categories-lab {
    grid-template-columns: 1fr;
  }

}

@media (max-width: 768px) {
  .hero {
    padding: 4rem 0;
    min-height: auto;
  }

  .hero__badge,
  .hero__title,
  .hero__desc,
  .hero__chips,
  .hero__actions,
  .hero__stats {
    animation: none;
  }

  .orb,
  .promo-orb {
    animation: none;
  }

  .floating-elements {
    display: none;
  }

  .hero__container {
    padding: 0 1rem;
  }

  .hero__badge {
    padding: 0.5rem 1rem;
    font-size: 0.7rem;
    margin-bottom: 1.5rem;
  }

  .hero__title {
    font-size: 2rem;
    margin-bottom: 1rem;
  }

  .hero__desc {
    font-size: 1rem;
    margin-bottom: 2rem;
  }

  .hero__chips {
    margin-bottom: 1.5rem;
  }

  .hero__stats {
    width: 100%;
    max-width: none;
    gap: 0.75rem;
  }

  .stat-value {
    font-size: clamp(1.85rem, 8vw, 2.25rem);
  }

  .stat-label {
    font-size: clamp(0.65rem, 2.8vw, 0.78rem);
    letter-spacing: 0.08em;
  }

  .hero__actions {
    flex-direction: column;
    gap: 0.75rem;
    margin-bottom: 3rem;
  }

  .hero__actions .btn {
    width: 100%;
  }

  .feature-card,
  .btn {
    padding: 0.875rem 1.5rem;
    font-size: 0.875rem;
  }

  .features {
    padding: 4rem 0;
  }

  .features-panel,
  .featured-grid {
    grid-template-columns: 1fr;
  }

  .features-lead {
    padding: 1.4rem;
  }

  .features-metrics {
    grid-template-columns: 1fr;
  }

  .features-cards {
    grid-template-columns: 1fr;
  }

  .categories-lab {
    grid-template-columns: 1fr;
    gap: 0.8rem;
  }

  .categories-lab__panel {
    padding: 1.2rem 1rem;
  }

  .categories-lab__metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .categories-lane {
    grid-template-columns: 1fr;
    align-items: start;
    padding: 0.95rem;
  }

  .category-lane:hover {
    transform: none;
  }

  .category-lane__left {
    grid-template-columns: 46px 1fr;
    gap: 0.65rem;
  }

  .category-lane__icon {
    width: 46px;
    height: 46px;
    border-radius: 12px;
  }

  .category-lane h4 {
    font-size: 0.95rem;
  }

  .category-lane p {
    font-size: 0.79rem;
  }

  .category-lane__right {
    margin-top: 0.55rem;
    display: flex;
    align-items: baseline;
    gap: 0.4rem;
    text-align: left;
  }

  .featured-products {
    padding: 0 0 2rem;
  }

  .featured-products .section-header {
    margin-bottom: 1rem;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .section-title {
    font-size: 1.75rem;
  }

  .feature-card {
    padding: 1.5rem;
  }

  .categories-lab__panel p {
    font-size: 0.85rem;
    line-height: 1.55;
  }

  .cta {
    padding: 1rem 0 3rem;
  }

  .cta__decoration {
    display: none;
  }

  .cta__inner {
    padding: 1.5rem;
  }

  .cta__content h2 {
    font-size: 1.5rem;
  }

  .cta__content p {
    font-size: 1rem;
    margin-bottom: 1.5rem;
  }

  .benefits {
    padding: 4rem 0;
  }

  .timeline-item {
    grid-template-columns: 52px 1fr;
    padding: 0.85rem;
  }

  .timeline-index {
    font-size: 1rem;
  }

  .timeline-content h3 {
    font-size: 0.95rem;
  }

  .timeline-content p {
    font-size: 0.84rem;
  }

  .promo-banner {
    padding: 3rem 0;
    margin: 2rem 0 4rem;
  }

  .promo-bg {
    clip-path: none;
  }

  .promo-content h2 {
    font-size: 1.5rem;
  }

  .promo-content p {
    font-size: 1rem;
  }

  .promo-actions {
    flex-direction: column;
    gap: 1rem;
  }

  .promo-timer {
    font-size: 0.8rem;
  }

  .newsletter {
    padding: 2rem 0 4rem;
  }

  .newsletter__inner {
    flex-direction: column;
    text-align: center;
    gap: 1.5rem;
    padding: 1.5rem;
  }

  .newsletter__content h2 {
    font-size: 1.5rem;
  }

  .newsletter__form {
    flex-direction: column;
    width: 100%;
  }

  .newsletter-input {
    min-width: auto;
    width: 100%;
  }
}

.btn {
  position: relative;
  overflow: hidden;
}

.btn::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: width 0.4s ease, height 0.4s ease;
}

.btn:active::after {
  width: 300px;
  height: 300px;
}

.feature-card {
  cursor: pointer;
}

.feature-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(166, 185, 248, 0.05), transparent);
  transition: left 0.5s ease;
}

.feature-card:hover::before {
  left: 100%;
}

@keyframes ripple {
  0% { transform: scale(0); opacity: 0.5; }
  100% { transform: scale(4); opacity: 0; }
}

.add-to-cart-btn {
  position: relative;
  overflow: hidden;
}

.add-to-cart-btn::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: var(--accent);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: width 0.4s ease, height 0.4s ease;
}

.add-to-cart-btn:not(:disabled):hover::before {
  width: 60px;
  height: 60px;
}

.add-to-cart-btn svg {
  position: relative;
  z-index: 1;
}

.product-card {
  cursor: pointer;
}

.product-card::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, var(--accent-dim), transparent);
  opacity: 0;
  transition: opacity 0.4s ease;
}

.product-card:hover::after {
  opacity: 1;
}

.nav-link {
  position: relative;
}

.nav-link::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 0;
  height: 2px;
  background: var(--accent);
  transition: width 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.nav-link:hover::after,
.nav-link.router-link-active::after {
  width: 100%;
}

.theme-toggle {
  position: relative;
  overflow: hidden;
}

.theme-toggle::after {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--accent);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.theme-toggle:hover::after {
  opacity: 0.2;
}

.theme-toggle svg {
  position: relative;
  z-index: 1;
}

.cart-btn {
  position: relative;
  overflow: hidden;
}

.cart-btn::after {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--accent);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.cart-btn:hover::after {
  opacity: 0.2;
}

.cart-btn .cart-icon {
  position: relative;
  z-index: 1;
}

@keyframes countBounce {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.3); }
}

.cart-count {
  animation: countBounce 0.3s ease;
}
</style>
