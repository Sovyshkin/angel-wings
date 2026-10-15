<template>
  <div class="catalog">
    <div class="catalog-hero" aria-hidden="true">
      <img class="catalog-hero__molecule" :src="catalogMolecule" alt="" width="1254" height="1254" fetchpriority="high" decoding="async">
    </div>
    <div class="container">
      <div class="catalog__layout">
        <div class="catalog-categories" role="group" aria-label="Категории товаров">
          <button class="category-chip" :class="{ 'is-active': !selectedCategory }" type="button" :aria-pressed="!selectedCategory" @click="selectCategory(null)">
            <span class="category-chip__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
            </span>
            <span class="category-chip__label">Все товары</span>
            <span class="category-chip__count">{{ products.length }}</span>
          </button>
          <button v-for="cat in categories" :key="getCategoryKey(cat)" class="category-chip" :class="{ 'is-active': isCategorySelected(cat) }" type="button" :aria-pressed="isCategorySelected(cat)" @click="selectCategory(cat)">
            <span class="category-chip__icon" aria-hidden="true">
              <img v-if="cat.image && !brokenCategoryIcons.has(getCategoryKey(cat))" :src="cat.image" alt="" width="32" height="32" loading="lazy" decoding="async" @error="handleCategoryIconError(getCategoryKey(cat))">
              <span v-else v-html="getCategoryIcon(cat.slug)"></span>
            </span>
            <span class="category-chip__label">{{ cat.name }}</span>
            <span class="category-chip__count">{{ getCategoryCount(cat) }}</span>
          </button>
          <button class="category-chip category-chip--price" :class="{ 'is-active': mobileFiltersOpen || priceMin || priceMax }" type="button" :aria-expanded="mobileFiltersOpen" @click="toggleMobileFilters">
            <span class="category-chip__icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 2v20M17 6H9a3 3 0 0 0 0 6h6a3 3 0 0 1 0 6H6"/></svg></span>
            <span class="category-chip__label">Цена</span>
          </button>
        </div>

        <div v-if="mobileFiltersOpen" class="catalog-price-filter">
          <label>От <input v-model.number="priceMin" type="number" min="0" inputmode="numeric" placeholder="0 ₽"></label>
          <label>До <input v-model.number="priceMax" type="number" min="0" inputmode="numeric" placeholder="Любая"></label>
          <button type="button" @click="closeMobileFilters">Готово</button>
        </div>

        <div class="catalog__main">
          <div class="catalog__bar">
            <div class="catalog__bar-left">
              <label class="catalog-search" aria-label="Поиск по названию товара">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="M21 21l-4.35-4.35"/>
                </svg>
                <input
                  v-model.trim="searchQuery"
                  type="search"
                  placeholder="Найти товар..."
                  autocomplete="off"
                >
                <button
                  v-if="searchQuery"
                  class="catalog-search__clear"
                  type="button"
                  aria-label="Очистить поиск"
                  @click="searchQuery = ''"
                >
                  ×
                </button>
              </label>
              <div class="results-count">
                <span>{{ filteredProducts.length }}</span> товаров
              </div>
            </div>
            <div class="sort-select">
              <select v-model="sortBy" class="input">
                <option value="default">По умолчанию</option>
                <option value="price-asc">Цена: по возрастанию</option>
                <option value="price-desc">Цена: по убыванию</option>
                <option value="name">По названию</option>
              </select>
            </div>
          </div>
          
          <Loader v-if="loading" text="Загрузка товаров..." />
          
          <div v-else-if="filteredProducts.length === 0" class="empty">
            <div class="empty-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <circle cx="11" cy="11" r="8"/>
                <path d="M21 21l-4.35-4.35"/>
              </svg>
            </div>
            <h3>Товары не найдены</h3>
            <p>Попробуйте изменить поиск, категорию или параметры фильтра</p>
            <button class="btn btn-secondary" @click="resetFilters">Сбросить фильтры</button>
          </div>
          
          <div v-else class="products-grid" data-aos="fade-up" data-aos-delay="200">
            <router-link 
              v-for="(product, index) in filteredProducts"
              :key="product.id"
              :to="`/product/${product.id}`"
              class="product-card"
              :style="{ '--reveal-delay': `${Math.min(index, 8) * 45}ms` }"
              :data-aos="'fade-up'"
              :data-aos-delay="100 + index * 50"
              @click="rememberCatalogScroll"
            >
              <div class="product-image">
                <img
                  v-if="product.image"
                  :src="product.image"
                  :alt="product.title"
                  width="480"
                  height="480"
                  :loading="index < 4 ? 'eager' : 'lazy'"
                  :fetchpriority="index < 2 ? 'high' : 'auto'"
                  decoding="async"
                  @error="handleImageError"
                >
                <div v-else class="product-placeholder">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
              </div>
              <div class="product-content">
                <div class="product-card-meta">
                  <span class="product-category-badge">{{ getCategoryName(product.categories?.[0]) }}</span>
                  <span v-if="isLowStock(product)" class="product-low-stock">Меньше 10 осталось</span>
                </div>
                <h3 class="product-title">{{ product.title }}</h3>
                <p class="product-desc">{{ truncate(product.description, 100) }}</p>
                <div class="product-footer">
                  <div class="product-price">
                    <div class="price-current">
                      <span class="price-value">{{ getDisplayPrice(product).toLocaleString('ru-RU') }}</span>
                      <span class="price-currency">₽</span>
                    </div>
                    <div v-if="getOldPrice(product)" class="price-discount-row">
                      <span class="price-old">{{ getOldPrice(product).toLocaleString('ru-RU') }} ₽</span>
                      <span class="price-discount-badge">-{{ getDiscountPercent(product) }}%</span>
                    </div>
                  </div>
                  <button
                    v-if="getCatalogCartQty(product.id) === 0"
                    class="add-to-cart-btn"
                    type="button"
                    aria-label="Добавить в корзину"
                    @click.prevent="increaseCatalogQty(product)"
                    :disabled="!product.stock"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <circle cx="9" cy="20" r="1"/><circle cx="19" cy="20" r="1"/><path d="M2.5 3.5h2l2.2 11.2a2 2 0 0 0 2 1.6h10.4a2 2 0 0 0 2-1.6l1.2-7.2H5.4"/>
                    </svg>
                  </button>
                  <div v-else class="catalog-qty-control" @click.prevent>
                    <button
                      class="qty-btn"
                      type="button"
                      aria-label="Уменьшить"
                      @click.prevent="decreaseCatalogQty(product)"
                      :disabled="getCatalogCartQty(product.id) <= 0"
                    >
                      −
                    </button>
                    <span class="qty-value">{{ getCatalogCartQty(product.id) }}</span>
                    <button
                      class="qty-btn"
                      type="button"
                      aria-label="Увеличить"
                      @click.prevent="increaseCatalogQty(product)"
                      :disabled="!product.stock || getCatalogCartQty(product.id) >= product.stock"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onBeforeUnmount, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useProductStore } from '../store/products'
import { useCartStore } from '../store/cart'
import Loader from '../components/Loader.vue'
import { trackProductEvent } from '../api/analytics'
import catalogMolecule from '../assets/catalog-molecule.png'

const route = useRoute()
const productStore = useProductStore()
const cartStore = useCartStore()

const selectedCategory = ref(null)
const sortBy = ref('default')
const searchQuery = ref('')
const priceMin = ref(null)
const priceMax = ref(null)
const loading = ref(false)
const mobileFiltersOpen = ref(false)
const brokenCategoryIcons = ref(new Set())
const CATALOG_SCROLL_KEY = 'angel-wings:catalog-scroll'
let shouldRestoreCatalogScroll = false

const products = computed(() => productStore.products)
const categories = computed(() => productStore.categories)

const filteredProducts = computed(() => {
  let result = [...products.value]

  if (selectedCategory.value) {
    result = result.filter(product => product.categories?.some(category => (
      categoriesMatch(category, selectedCategory.value)
    )))
  }

  const normalizedSearch = normalizeSearchText(searchQuery.value)
  if (normalizedSearch) {
    result = result.filter(product => normalizeSearchText(product.title).includes(normalizedSearch))
  }

  if (priceMin.value) {
    result = result.filter(p => p.price >= priceMin.value)
  }

  if (priceMax.value) {
    result = result.filter(p => p.price <= priceMax.value)
  }

  switch (sortBy.value) {
    case 'price-asc':
      result.sort((a, b) => a.price - b.price)
      break
    case 'price-desc':
      result.sort((a, b) => b.price - a.price)
      break
    case 'name':
      result.sort((a, b) => a.title.localeCompare(b.title))
      break
  }

  return result
})

function normalizeCategoryText(value) {
  return String(value || '').trim().toLocaleLowerCase('ru-RU')
}

function normalizeSearchText(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('ru-RU')
}

function rememberCatalogScroll() {
  if (typeof window === 'undefined') return
  window.sessionStorage.setItem(CATALOG_SCROLL_KEY, JSON.stringify({
    top: window.scrollY,
    category: route.query.category || null,
    search: searchQuery.value || '',
    createdAt: Date.now()
  }))
}

async function restoreCatalogScroll() {
  if (typeof window === 'undefined' || !shouldRestoreCatalogScroll) return
  shouldRestoreCatalogScroll = false

  let payload = null
  try {
    payload = JSON.parse(window.sessionStorage.getItem(CATALOG_SCROLL_KEY) || 'null')
  } catch {
    payload = null
  }

  if (!payload || !Number.isFinite(Number(payload.top))) return
  if (Date.now() - Number(payload.createdAt || 0) > 30 * 60 * 1000) return
  if ((payload.category || null) !== (route.query.category || null)) return

  if (payload.search) searchQuery.value = payload.search

  await nextTick()
  requestAnimationFrame(() => {
    window.scrollTo({ top: Math.max(0, Number(payload.top)), behavior: 'auto' })
  })
}

function getCategoryId(category) {
  const id = Number(category?.id ?? category?.term_id)
  return Number.isFinite(id) && id > 0 ? id : null
}

function getCategoryKey(category) {
  const id = getCategoryId(category)
  if (id) return `id:${id}`

  const slug = normalizeCategoryText(category?.slug)
  if (slug) return `slug:${slug}`

  return `name:${normalizeCategoryText(category?.name)}`
}

function categoriesMatch(first, second) {
  if (!first || !second) return false

  const firstId = getCategoryId(first)
  const secondId = getCategoryId(second)
  if (firstId && secondId) return firstId === secondId

  const firstSlug = normalizeCategoryText(first.slug)
  const secondSlug = normalizeCategoryText(second.slug)
  if (firstSlug && secondSlug) return firstSlug === secondSlug

  const firstName = normalizeCategoryText(first.name)
  const secondName = normalizeCategoryText(second.name)
  return Boolean(firstName && secondName && firstName === secondName)
}

function isCategorySelected(category) {
  return categoriesMatch(category, selectedCategory.value)
}

function selectCategory(category) {
  selectedCategory.value = category
  closeMobileFilters()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function resetFilters() {
  selectedCategory.value = null
  searchQuery.value = ''
  priceMin.value = null
  priceMax.value = null
  sortBy.value = 'default'
  closeMobileFilters()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function toggleMobileFilters() {
  mobileFiltersOpen.value = !mobileFiltersOpen.value
}

function closeMobileFilters() {
  mobileFiltersOpen.value = false
}

function handleCategoryIconError(categoryId) {
  brokenCategoryIcons.value = new Set([...brokenCategoryIcons.value, categoryId])
}

function getCategoryIcon(slug) {
  const icons = {
    'longevitiya': `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18.178 8c5.096 0 5.096 8 0 8-5.095 0-7.133-8-12.739-8-4.585 0-4.585 8 0 8 5.606 0 7.644-8 12.74-8z"/></svg>`,
    'immunomodulyatory': `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
    'neiropeptide': `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>`,
    'growth': `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>`,
    default: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`
  }
  return icons[slug] || icons.default
}

function getCategoryName(category) {
  if (!category) return ''
  if (category.name) return category.name

  if (category.slug) {
    const bySlug = categories.value.find(c => c.slug === category.slug)
    if (bySlug?.name) return bySlug.name
  }

  if (category.id !== undefined && category.id !== null) {
    const byId = categories.value.find(c => Number(c.id ?? c.term_id) === Number(category.id))
    if (byId?.name) return byId.name
  }

  return ''
}

function getCategoryCount(category) {
  return products.value.filter(product => product.categories?.some(productCategory => (
    categoriesMatch(productCategory, category)
  ))).length
}

function resolveCategoryQuery(value) {
  const queryValue = normalizeCategoryText(value)
  if (!queryValue) return null

  return categories.value.find(category => (
    normalizeCategoryText(category.slug) === queryValue ||
    normalizeCategoryText(category.name) === queryValue ||
    String(getCategoryId(category) || '') === queryValue
  )) || { slug: String(value) }
}

function truncate(text, length) {
  if (!text) return ''
  return text.length > length ? text.substring(0, length) + '...' : text
}

function isLowStock(product) {
  const stock = Number(product?.stock || 0)
  return stock > 0 && stock < 10
}

function getBaseCartItem(productId) {
  return cartStore.items.find(item => item.id === productId && !item.selectedDosage)
}

function getCatalogCartQty(productId) {
  const baseItem = getBaseCartItem(productId)
  return Math.max(0, Number(baseItem?.quantity || 0))
}

function increaseCatalogQty(product) {
  const qty = getCatalogCartQty(product.id)
  const maxStock = Math.max(0, Number(product?.stock || 0))
  if (maxStock > 0 && qty >= maxStock) return
  cartStore.addItem({
    ...product,
    selectedDosage: null
  })
  trackProductEvent(product.id, 'add_to_cart', { source: 'catalog', quantity: 1 })
}

function decreaseCatalogQty(product) {
  const baseItem = getBaseCartItem(product.id)
  if (!baseItem) return
  if (baseItem.quantity <= 1) {
    cartStore.removeItem(product.id, null)
    return
  }
  cartStore.updateQuantity(product.id, baseItem.quantity - 1, null)
}

function normalizePrice(value) {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? n : 0
}

function getDisplayPrice(product) {
  return normalizePrice(product?.price)
}

function getOldPrice(product) {
  const current = getDisplayPrice(product)
  const old = normalizePrice(product?.comparePrice)
  if (!old || old <= current) return null
  return old
}

function getDiscountPercent(product) {
  const current = getDisplayPrice(product)
  const old = getOldPrice(product)
  if (!old || old <= 0 || current <= 0 || old <= current) return 0
  return Math.round(((old - current) / old) * 100)
}

function handleImageError(e) {
  const img = e.target
  if (img.dataset.fallbackApplied === 'true') return
  img.dataset.fallbackApplied = 'true'
  img.src = '/angel-wings-logo-light.svg'
}

onMounted(async () => {
  const historyState = typeof window !== 'undefined' ? window.history.state : null
  shouldRestoreCatalogScroll = typeof historyState?.forward === 'string' && historyState.forward.startsWith('/product/')
  loading.value = true
  await productStore.fetchProducts()
  await productStore.fetchCategories()
  loading.value = false
  
  if (route.query.category) {
    selectedCategory.value = resolveCategoryQuery(route.query.category)
  }

  await restoreCatalogScroll()
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/product/')) {
    rememberCatalogScroll()
  }
})

watch(() => route.query.category, (newCat) => {
  selectedCategory.value = resolveCategoryQuery(newCat)
})
</script>

<style scoped>
.catalog {
  position: relative;
  padding-top: 0;
  padding-bottom: 6rem;
  background: linear-gradient(180deg, #040916 0%, #070c18 31rem, #090d17 100%);
}

.catalog-hero {
  position: relative;
  height: clamp(12rem, 25vw, 17rem);
  pointer-events: none;
}

.catalog-hero__molecule {
  position: absolute;
  z-index: 0;
  top: -7rem;
  left: 58%;
  display: block;
  width: min(34rem, 70vw);
  height: auto;
  max-width: none;
  object-fit: contain;
  transform: translateX(-50%);
  filter: drop-shadow(0 0 20px rgba(29, 126, 255, 0.34));
}

.catalog > .container {
  position: relative;
  z-index: 1;
  margin-top: -2.7rem;
}

.catalog__layout {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 3rem;
}

.sidebar {
  position: sticky;
  top: 100px;
  height: fit-content;
}

.sidebar-header {
  display: none;
}

.filters-overlay {
  display: none;
}

.filter-section {
  padding: 1.5rem;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 20px;
  margin-bottom: 1.5rem;
}

.filter-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font-display);
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-muted);
  margin-bottom: 1.25rem;
}

.filter-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.875rem 1rem;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 12px;
  color: var(--text-secondary);
  font-size: 0.9rem;
  font-weight: 500;
  text-align: left;
  transition: all 0.3s ease;
}

.filter-item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.filter-item.active {
  background: var(--accent-dim);
  border-color: rgba(166, 185, 248, 0.2);
  color: var(--accent);
}

.filter-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: var(--bg-secondary);
  border-radius: 8px;
  font-size: 0.875rem;
  transition: all 0.3s ease;
  overflow: hidden;
}

.filter-item.active .filter-icon {
  background: var(--accent);
  color: var(--bg-primary);
}

.filter-icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.filter-count {
  margin-left: auto;
  font-size: 0.75rem;
  color: var(--text-muted);
  background: var(--bg-secondary);
  padding: 0.25rem 0.6rem;
  border-radius: 100px;
}

.filter-price {
  margin-bottom: 0;
}

.price-range {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.price-input {
  flex: 1;
  padding: 0.75rem;
  font-size: 0.875rem;
  text-align: center;
}

.price-separator {
  color: var(--text-muted);
}

.catalog__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--border);
}

.catalog__bar-left {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
  min-width: 0;
}

.catalog__filters-toggle {
  display: none;
  align-items: center;
  gap: 0.45rem;
  padding: 0.6rem 0.85rem;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--bg-card);
  color: var(--text-primary);
  font-size: 0.8rem;
  font-weight: 600;
}

.catalog-search {
  position: relative;
  width: min(360px, 42vw);
  min-width: 220px;
  display: inline-flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.72rem 0.9rem;
  border: 1px solid var(--border);
  border-radius: 14px;
  background:
    linear-gradient(135deg, rgba(166, 185, 248, 0.1), transparent 46%),
    var(--bg-card);
  color: var(--text-muted);
  transition: border-color 0.25s ease, box-shadow 0.25s ease, background 0.25s ease;
}

.catalog-search:focus-within {
  border-color: rgba(166, 185, 248, 0.45);
  box-shadow: 0 0 0 4px rgba(166, 185, 248, 0.08);
}

.catalog-search svg {
  flex: 0 0 auto;
  color: var(--accent);
}

.catalog-search input {
  width: 100%;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--text-primary);
  font: inherit;
  font-size: 0.9rem;
}

.catalog-search input::placeholder {
  color: var(--text-muted);
}

.catalog-search__clear {
  width: 24px;
  height: 24px;
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border);
  border-radius: 50%;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  font-size: 1rem;
  line-height: 1;
  transition: all 0.2s ease;
}

.catalog-search__clear:hover {
  border-color: rgba(166, 185, 248, 0.35);
  color: var(--text-primary);
}

.results-count {
  flex: 0 0 auto;
  font-size: 0.9rem;
  color: var(--text-muted);
}

.results-count span {
  color: var(--accent);
  font-weight: 700;
}

.sort-select select {
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  min-width: 200px;
  cursor: pointer;
}

.loading {
  display: flex;
  justify-content: center;
  padding: 4rem 0;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 3px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.empty {
  text-align: center;
  padding: 5rem 0;
}

.empty-icon {
  color: var(--text-muted);
  margin-bottom: 1.5rem;
}

.empty h3 {
  font-family: var(--font-display);
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
}

.empty p {
  color: var(--text-muted);
  margin-bottom: 1.5rem;
}


.products-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: clamp(0.7rem, 1.5vw, 1.1rem);
  align-items: stretch;
}

.product-card {
  display: grid;
  grid-template-rows: 50% minmax(0, 1fr);
  min-width: 0;
  min-height: 310px;
  aspect-ratio: 0.785;
  overflow: hidden;
  isolation: isolate;
  border: 1px solid #5caaff;
  border-radius: 24px;
  background: #071225;
  color: #fff;
  text-decoration: none;
  box-shadow:
    inset 0 0 0 1px rgba(162, 210, 255, 0.16),
    0 0 0 1px rgba(52, 149, 255, 0.14),
    0 0 15px rgba(27, 113, 245, 0.32),
    0 8px 18px rgba(1, 8, 25, 0.52);
  transition: transform 0.28s ease, border-color 0.28s ease, box-shadow 0.28s ease;
}

@media (hover: hover) and (pointer: fine) {
  .product-card:hover {
    transform: translateY(-4px);
    border-color: #9ed3ff;
    box-shadow:
      inset 0 0 0 1px rgba(190, 225, 255, 0.2),
      0 0 0 1px rgba(81, 172, 255, 0.2),
      0 0 21px rgba(27, 113, 245, 0.42),
      0 12px 23px rgba(1, 8, 25, 0.56);
  }

  .product-card:hover .product-image img { transform: scale(1.025); }
}

.product-card:focus-visible {
  outline: 2px solid #b5dcff;
  outline-offset: 3px;
}

.product-image {
  position: relative;
  min-height: 0;
  display: grid;
  place-items: center;
  overflow: hidden;
  border-radius: 23px 23px 0 0;
  background: linear-gradient(180deg, #fff 0%, #f6f8fc 100%);
  border-bottom: 1px solid rgba(86, 172, 255, 0.8);
  box-shadow: 0 2px 13px rgba(33, 129, 255, 0.3);
}

.product-image img {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  transition: transform 0.35s ease;
}

.product-placeholder {
  display: grid;
  width: 100%;
  height: 100%;
  place-items: center;
  color: #6b8abc;
}

.product-content {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  padding: clamp(0.72rem, 1.45vw, 1.05rem);
  background: linear-gradient(155deg, #0b1d34 0%, #081326 53%, #050d1d 100%);
}

.product-card-meta {
  display: flex;
  flex-shrink: 0;
  flex-wrap: nowrap;
  align-items: center;
  gap: 0.35rem;
  min-height: 1.7rem;
  margin-bottom: 0.5rem;
}

.product-category-badge {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  padding: 0.34rem 0.65rem;
  border: 1px solid rgba(83, 158, 255, 0.34);
  border-radius: 999px;
  background: linear-gradient(130deg, rgba(35, 78, 136, 0.82), rgba(18, 48, 89, 0.66));
  box-shadow: inset 0 1px 0 rgba(146, 199, 255, 0.18), inset 0 0 8px rgba(60, 143, 255, 0.15);
  color: #bad9ff;
  font-size: clamp(0.56rem, 0.65vw, 0.67rem);
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: 0.09em;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
}

.product-low-stock {
  display: none;
}

.product-title {
  display: -webkit-box;
  flex-shrink: 0;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  color: #fff;
  font-family: var(--font-body);
  font-size: clamp(0.95rem, 1.25vw, 1.1rem);
  font-weight: 650;
  line-height: 1.23;
  margin: 0 0 0.35rem;
}

.product-desc {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  color: #9faec7;
  font-size: clamp(0.76rem, 0.9vw, 0.86rem);
  font-weight: 400;
  line-height: 1.33;
  margin: 0 0 0.4rem;
  white-space: normal;
  word-break: break-word;
}

.product-footer {
  display: flex;
  flex-shrink: 0;
  align-items: end;
  justify-content: space-between;
  gap: 0.4rem;
  min-width: 0;
  padding: 0;
  margin-top: auto;
  border: 0;
}

.product-price {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.2rem;
  min-width: 0;
}

.price-current {
  display: flex;
  align-items: baseline;
  gap: 0.2rem;
  white-space: nowrap;
}

.price-value {
  color: #fff;
  font-family: var(--font-body);
  font-size: clamp(1.18rem, 1.65vw, 1.5rem);
  font-weight: 700;
  letter-spacing: -0.035em;
  line-height: 1;
}

.price-currency { color: #fff; font-size: 0.9em; font-weight: 600; }
.price-discount-row { display: flex; align-items: center; gap: 0.25rem; }
.price-old { color: #879ab8; font-size: 0.65rem; text-decoration: line-through; }
.price-discount-badge { color: #ffb5bd; font-size: 0.6rem; font-weight: 700; }

.add-to-cart-btn {
  display: grid;
  flex: 0 0 auto;
  width: 54px;
  height: 50px;
  place-items: center;
  border: 1px solid rgba(86, 169, 255, 0.86);
  border-radius: 18px;
  background: linear-gradient(150deg, #1b477b, #0b2a58 65%, #091b3f);
  box-shadow: inset 0 1px 0 rgba(192, 225, 255, 0.28), inset 0 0 11px rgba(58, 147, 255, 0.14), 0 0 10px rgba(22, 109, 242, 0.35);
  color: #fff;
  transition: border-color 0.25s ease, background 0.25s ease, box-shadow 0.25s ease;
}

.add-to-cart-btn svg { width: 24px; height: 24px; }
.add-to-cart-btn:hover:not(:disabled) { border-color: #afd9ff; background: linear-gradient(150deg, #22558f, #10396e); box-shadow: inset 0 1px 0 rgba(220, 237, 255, 0.33), 0 0 14px rgba(49, 143, 255, 0.48); }
.add-to-cart-btn:disabled { opacity: 0.45; cursor: not-allowed; }

.catalog-qty-control {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 0.1rem;
  min-height: 42px;
  padding: 0.18rem;
  border: 1px solid rgba(86, 169, 255, 0.75);
  border-radius: 15px;
  background: linear-gradient(150deg, #1b477b, #0b2a58);
  box-shadow: inset 0 1px 0 rgba(192, 225, 255, 0.22), 0 0 9px rgba(22, 109, 242, 0.26);
}

.qty-btn {
  display: grid;
  width: 28px;
  height: 32px;
  place-items: center;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: #fff;
  font-size: 1.1rem;
  font-weight: 700;
  line-height: 1;
}

.qty-btn:hover:not(:disabled) { background: rgba(156, 208, 255, 0.19); }
.qty-btn:disabled { opacity: 0.45; cursor: not-allowed; }
.qty-value { min-width: 0.8rem; color: #fff; font-size: 0.78rem; font-weight: 700; text-align: center; }

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (prefers-reduced-motion: no-preference) {
  .sidebar {
    animation: catalog-reveal-side 0.6s 0.08s cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  .catalog__bar {
    animation: catalog-reveal-up 0.5s 0.12s cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  .product-card {
    animation: catalog-card-reveal 0.55s var(--reveal-delay, 0ms) cubic-bezier(0.16, 1, 0.3, 1) both;
  }
}

@keyframes catalog-reveal-down {
  from { opacity: 0; translate: 0 -18px; }
  to { opacity: 1; translate: 0 0; }
}

@keyframes catalog-reveal-side {
  from { opacity: 0; translate: -22px 0; }
  to { opacity: 1; translate: 0 0; }
}

@keyframes catalog-reveal-up {
  from { opacity: 0; translate: 0 16px; }
  to { opacity: 1; translate: 0 0; }
}

@keyframes catalog-card-reveal {
  from {
    opacity: 0;
    translate: 0 24px;
    scale: 0.985;
  }
  to {
    opacity: 1;
    translate: 0 0;
    scale: 1;
  }
}

@media (max-width: 1024px) {
  .catalog__layout {
    grid-template-columns: 1fr;
  }

  .sidebar {
    position: static;
  }

  .filter-list {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .filter-item {
    width: auto;
    flex: 1;
    min-width: 140px;
  }
}

@media (max-width: 640px) {
  .catalog { padding-top: 1.5rem; }

  .filter-section {
    padding: 1rem;
    margin-bottom: 1rem;
  }

  .filter-item {
    min-width: 0;
    width: 100%;
    padding: 0.625rem 0.5rem;
    font-size: 0.8rem;
  }

  .filter-icon {
    display: none;
  }

  .price-range {
    flex-direction: column;
    gap: 0.5rem;
  }

  .price-separator {
    display: none;
  }

  .price-input {
    width: 100%;
    padding: 0.625rem;
  }

  .catalog__bar {
    flex-direction: column;
    gap: 0.75rem;
    align-items: flex-start;
  }

  .catalog__bar-left {
    width: 100%;
    flex-wrap: wrap;
    justify-content: space-between;
  }

  .sort-select {
    width: 100%;
  }

  .results-count {
    font-size: 0.8rem;
  }

  .catalog-search {
    order: 3;
    width: 100%;
    min-width: 0;
    padding: 0.68rem 0.82rem;
  }

  .sort-select select {
    width: 100%;
    min-width: auto;
    padding: 0.625rem;
    font-size: 0.875rem;
  }

  .products-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .product-content {
    padding: 1rem;
  }

  .product-footer {
    gap: 0.5rem;
  }

  .product-title {
    font-size: 0.9375rem;
  }

  .product-desc {
    font-size: 0.8rem;
    display: none;
  }

  .price-value {
    font-size: 1.125rem;
  }
}

@media (max-width: 768px) {
  .sidebar {
    animation: none;
  }

  .catalog__filters-toggle {
    display: inline-flex;
  }

  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    width: min(86vw, 340px);
    height: 100vh;
    padding: 1rem;
    background: rgba(9, 11, 22, 0.98);
    border-right: 1px solid var(--border);
    transform: translateX(-108%) !important;
    opacity: 0;
    pointer-events: none;
    z-index: 40;
    overflow-y: auto;
    transition: transform 0.28s ease, opacity 0.28s ease;
  }

  .sidebar--open {
    transform: translateX(0) !important;
    opacity: 1;
    pointer-events: auto;
  }

  .sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
  }

  .sidebar-header h3 {
    margin: 0;
    font-family: var(--font-display);
    font-size: 0.95rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-muted);
  }

  .sidebar-close {
    width: 36px;
    height: 36px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--border);
    border-radius: 10px;
    background: var(--bg-card);
    color: var(--text-primary);
  }

  .filters-overlay {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(5, 7, 16, 0.55);
    backdrop-filter: blur(2px);
    z-index: 30;
  }

  .filter-section {
    margin-bottom: 1rem;
  }

  .sidebar .filter-list {
    flex-direction: column;
    flex-wrap: nowrap;
    gap: 0.5rem;
  }

  .sidebar .filter-item {
    width: 100%;
    min-width: 0;
    flex: none;
    padding: 0.8rem 0.85rem;
    font-size: 0.85rem;
  }

  .sidebar .filter-icon {
    display: flex;
    width: 26px;
    height: 26px;
  }

  .sidebar .filter-count {
    margin-left: auto;
    font-size: 0.72rem;
    padding: 0.2rem 0.55rem;
  }

  .sidebar .price-range {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: 0.5rem;
  }

  .sidebar .price-separator {
    display: inline;
  }

  .sidebar .price-input {
    width: 100%;
    text-align: center;
  }
}

@media (max-width: 480px) {
  .sidebar {
    width: 92vw;
    padding: max(0.9rem, env(safe-area-inset-top)) 0.8rem 1rem;
  }

  .sidebar .filter-item {
    padding: 0.72rem 0.75rem;
    font-size: 0.82rem;
  }

  .sidebar-close {
    width: 34px;
    height: 34px;
  }
}

/* Mini App catalog layout: scrollable categories, compact controls, two-card rows. */
.catalog__layout {
  display: block;
}

.catalog-categories {
  display: flex;
  gap: 0.625rem;
  width: 100%;
  overflow-x: auto;
  overscroll-behavior-inline: contain;
  scrollbar-width: none;
  padding: 0.25rem 0 0.25rem;
  margin-bottom: 0.25rem;
  scroll-snap-type: x proximity;
  -webkit-overflow-scrolling: touch;
}

.catalog-categories::-webkit-scrollbar { display: none; }

.category-chip {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 0.5rem;
  max-width: 15rem;
  min-height: 3rem;
  padding: 0.45rem 0.65rem;
  border: 1px solid rgba(80, 145, 229, 0.46);
  border-radius: 1rem;
  background: rgba(7, 21, 44, 0.88);
  color: #d2def3;
  backdrop-filter: blur(12px);
  white-space: nowrap;
  scroll-snap-align: start;
}

.category-chip.is-active {
  border-color: #70baff;
  background: linear-gradient(135deg, rgba(18, 70, 132, 0.94), rgba(7, 32, 72, 0.92));
  color: #f1f7ff;
  box-shadow: inset 0 1px 0 rgba(185, 222, 255, 0.22), 0 0 0.8rem rgba(55, 150, 255, 0.36);
}

.category-chip__icon {
  display: grid;
  flex: 0 0 1.9rem;
  width: 1.9rem;
  height: 1.9rem;
  place-items: center;
  overflow: hidden;
  border-radius: 0.55rem;
  background: var(--bg-secondary);
}

.category-chip__icon svg,
.category-chip__icon :deep(svg) {
  width: 1.2rem;
  height: 1.2rem;
}

.category-chip__icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.category-chip__label {
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 0.78rem;
  font-weight: 600;
}

.category-chip__count {
  flex: 0 0 auto;
  padding: 0.15rem 0.4rem;
  border-radius: 999px;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  font-size: 0.7rem;
}

.catalog-price-filter {
  display: flex;
  align-items: end;
  gap: 0.6rem;
  padding: 0.7rem;
  margin-bottom: 0.85rem;
  border: 1px solid var(--border);
  border-radius: 0.9rem;
  background: var(--bg-card);
}

.catalog-price-filter label {
  flex: 1 1 0;
  min-width: 0;
  color: var(--text-secondary);
  font-size: 0.72rem;
}

.catalog-price-filter input {
  display: block;
  width: 100%;
  min-width: 0;
  margin-top: 0.25rem;
  padding: 0.55rem;
  border: 1px solid var(--border);
  border-radius: 0.55rem;
  background: var(--bg-secondary);
  color: var(--text-primary);
  font: inherit;
}

.catalog-price-filter button {
  flex: 0 0 auto;
  padding: 0.6rem;
  border-radius: 0.55rem;
  background: var(--accent-dim);
  color: var(--accent);
  font-size: 0.75rem;
  font-weight: 700;
}

.catalog__bar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.65rem;
  align-items: center;
  margin-bottom: 0.45rem;
  padding-bottom: 0.35rem;
}

.catalog__bar-left {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.65rem;
  width: 100%;
}

.catalog-search {
  order: 0;
  width: 100%;
  min-width: 0;
  border-color: rgba(66, 134, 226, 0.4);
  background: rgba(7, 23, 47, 0.88);
  backdrop-filter: blur(12px);
}

.results-count {
  white-space: nowrap;
  color: #b3c7e5;
}

.sort-select { width: auto; min-width: 0; }
.sort-select select { width: 100%; min-width: 0; border-color: rgba(66, 134, 226, 0.4); background: rgba(7, 23, 47, 0.9); color: #f1f6ff; }

@media (max-width: 1100px) {
  .products-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}

@media (max-width: 780px) {
  .products-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 640px) {
  .catalog-hero { height: 6rem; }
  .catalog-hero__molecule { top: -5rem; left: 59%; width: min(74vw, 20rem); }
  .catalog > .container { margin-top: -2.5rem; }
  .catalog > .container { padding-inline: 0.5rem; }
  .catalog__bar { grid-template-columns: minmax(0, 1fr) minmax(5.7rem, 7.2rem); gap: 0.4rem; }
  .catalog__bar-left { grid-template-columns: minmax(0, 1fr) auto; gap: 0.4rem; flex-wrap: nowrap; }
  .catalog-search { padding: 0.55rem 0.65rem; }
  .catalog-search input { font-size: 0.72rem; }
  .catalog-search input::placeholder { text-overflow: ellipsis; }
  .results-count { font-size: 0.7rem; }
  .sort-select select { padding: 0.55rem 0.35rem; font-size: 0.68rem; }
  .products-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.65rem; }
  .product-card { width: 100%; height: 286px; min-height: 0; aspect-ratio: auto; grid-template-rows: 49% minmax(0, 1fr); border-radius: 23px; }
  .product-image { border-radius: 22px 22px 0 0; }
  .product-content { padding: 0.52rem 0.6rem 0.58rem; }
  .product-card-meta { min-height: 1.1rem; margin-bottom: 0.27rem; }
  .product-category-badge { padding: 0.2rem 0.42rem; font-size: 0.48rem; letter-spacing: 0.04em; }
  .product-title { font-size: 0.76rem; line-height: 1.3; margin-bottom: 0.25rem; }
  .product-desc { display: -webkit-box; font-size: 0.64rem; line-height: 1.25; -webkit-line-clamp: 2; margin-bottom: 0.2rem; }
  .product-footer { flex-wrap: nowrap; gap: 0.25rem; }
  .price-value { font-size: 0.98rem; }
  .price-currency { font-size: 0.79rem; }
  .add-to-cart-btn { width: 42px; height: 38px; border-radius: 15px; }
  .add-to-cart-btn svg { width: 20px; height: 20px; }
  .catalog-qty-control { min-height: 34px; gap: 0; padding: 0.1rem; border-radius: 12px; }
  .qty-btn { width: 20px; height: 27px; font-size: 0.95rem; }
  .qty-value { min-width: 0.65rem; font-size: 0.67rem; }
}

@media (max-width: 360px) {
  .product-card { height: 292px; }
  .product-content { padding-inline: 0.45rem; }
  .price-value { font-size: 0.86rem; }
  .add-to-cart-btn { width: 36px; height: 34px; }
  .catalog-qty-control .qty-btn { width: 18px; }
}

</style>

<style>
[data-theme="light"] .catalog {
  background: linear-gradient(180deg, #f8fbff 0%, #f5f7fb 31rem, #f5f5f7 100%);
}

[data-theme="light"] .catalog .catalog-hero__molecule {
  filter: drop-shadow(0 0 16px rgba(34, 120, 218, 0.16));
}

[data-theme="light"] .catalog .category-chip {
  border-color: rgba(85, 136, 198, 0.32);
  background: rgba(255, 255, 255, 0.88);
  color: #263b59;
}

[data-theme="light"] .catalog .category-chip.is-active {
  border-color: #5aa2ea;
  background: linear-gradient(135deg, #e7f3ff, #dbeaff);
  color: #15345c;
  box-shadow: inset 0 1px 0 #fff, 0 0 12px rgba(57, 137, 228, 0.18);
}

[data-theme="light"] .catalog .category-chip__icon {
  background: #eaf2fc;
  color: #24476f;
}

[data-theme="light"] .catalog .category-chip.is-active .category-chip__icon {
  background: #d5e8fb;
  color: #143d70;
}

[data-theme="light"] .catalog .category-chip__count {
  background: #eaf2fb;
  color: #405773;
}

[data-theme="light"] .catalog .catalog-search,
[data-theme="light"] .catalog .sort-select select {
  border-color: rgba(85, 136, 198, 0.34);
  background: rgba(255, 255, 255, 0.94);
  color: #1c304e;
}

[data-theme="light"] .catalog .catalog-search svg {
  color: #315f96;
}

[data-theme="light"] .catalog .catalog-search input::placeholder {
  color: #718099;
}

[data-theme="light"] .catalog .results-count {
  color: #506580;
}

[data-theme="light"] .catalog .results-count span {
  color: #295b9d;
}

[data-theme="light"] .catalog .product-card {
  border-color: #69aef0;
  background: #f7fbff;
  color: #142943;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.8), 0 0 12px rgba(64, 144, 227, 0.2), 0 8px 19px rgba(31, 75, 130, 0.12);
}

@media (hover: hover) and (pointer: fine) {
  [data-theme="light"] .catalog .product-card:hover {
    border-color: #3e96ed;
    box-shadow: inset 0 0 0 1px #fff, 0 0 16px rgba(47, 138, 232, 0.28), 0 11px 22px rgba(31, 75, 130, 0.16);
  }
}

[data-theme="light"] .catalog .product-content {
  background: linear-gradient(155deg, #fff 0%, #f3f8ff 58%, #eaf3ff 100%);
}

[data-theme="light"] .catalog .product-category-badge {
  border-color: rgba(63, 128, 205, 0.3);
  background: linear-gradient(130deg, #e7f3ff, #dbeafc);
  box-shadow: inset 0 1px 0 #fff, inset 0 0 8px rgba(73, 153, 240, 0.1);
  color: #2c5688;
}

[data-theme="light"] .catalog .product-title,
[data-theme="light"] .catalog .price-value,
[data-theme="light"] .catalog .price-currency {
  color: #142943;
}

[data-theme="light"] .catalog .product-desc {
  color: #5d708c;
}

[data-theme="light"] .catalog .price-old {
  color: #7389a5;
}

[data-theme="light"] .catalog .price-discount-badge {
  color: #b73d51;
}

[data-theme="light"] .catalog .add-to-cart-btn,
[data-theme="light"] .catalog .catalog-qty-control {
  border-color: #73afea;
  background: linear-gradient(150deg, #eaf5ff, #d6eaff);
  box-shadow: inset 0 1px 0 #fff, 0 0 9px rgba(63, 142, 228, 0.22);
  color: #214e80;
}

[data-theme="light"] .catalog .add-to-cart-btn:hover:not(:disabled) {
  border-color: #3e96ed;
  background: linear-gradient(150deg, #e1f1ff, #c8e2ff);
  box-shadow: inset 0 1px 0 #fff, 0 0 12px rgba(63, 142, 228, 0.3);
}

[data-theme="light"] .catalog .qty-btn,
[data-theme="light"] .catalog .qty-value {
  color: #214e80;
}

[data-theme="light"] .catalog .qty-btn:hover:not(:disabled) {
  background: rgba(45, 118, 200, 0.12);
}
</style>
