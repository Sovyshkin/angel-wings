<template>
  <div class="catalog">
    <div class="catalog__hero" data-aos="fade-up">
      <div class="container">
        <h1 class="page-title">Каталог</h1>
        <p class="page-subtitle">Выберите категорию для просмотра пептидов</p>
      </div>
    </div>

    <div class="container">
      <div class="catalog__layout">
        <aside class="sidebar" :class="{ 'sidebar--open': mobileFiltersOpen }">
          <div class="sidebar-header">
            <h3>Фильтры</h3>
            <button class="sidebar-close" type="button" @click="closeMobileFilters" aria-label="Закрыть фильтры">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <div class="filter-section">
            <h3 class="filter-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
              </svg>
              Категории
            </h3>
            <div class="filter-list">
              <button 
                class="filter-item"
                :class="{ active: !selectedCategory }"
                @click="selectCategory(null)"
              >
                <span class="filter-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="7" height="7"/>
                    <rect x="14" y="3" width="7" height="7"/>
                    <rect x="14" y="14" width="7" height="7"/>
                    <rect x="3" y="14" width="7" height="7"/>
                  </svg>
                </span>
                Все товары
                <span class="filter-count">{{ products.length }}</span>
              </button>
              <button 
                v-for="cat in categories" 
                :key="getCategoryKey(cat)"
                class="filter-item"
                :class="{ active: isCategorySelected(cat) }"
                @click="selectCategory(cat)"
              >
                <span class="filter-icon">
                  <img
                    v-if="cat.image && !brokenCategoryIcons.has(cat.term_id)"
                    :src="cat.image"
                    :alt="cat.name"
                    width="48"
                    height="48"
                    loading="lazy"
                    decoding="async"
                    @error="handleCategoryIconError(cat.term_id)"
                  >
                  <span v-else v-html="getCategoryIcon(cat.slug)"></span>
                </span>
                {{ cat.name }}
                <span class="filter-count">{{ getCategoryCount(cat) }}</span>
              </button>
            </div>
          </div>
          
          <div class="filter-section filter-price">
            <h3 class="filter-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="1" x2="12" y2="23"/>
                <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
              </svg>
              Цена
            </h3>
            <div class="price-range">
              <input type="number" v-model="priceMin" class="input price-input" placeholder="От">
              <span class="price-separator">—</span>
              <input type="number" v-model="priceMax" class="input price-input" placeholder="До">
            </div>
          </div>
        </aside>

        <div v-if="mobileFiltersOpen" class="filters-overlay" @click="closeMobileFilters"></div>
        
        <div class="catalog__main">
          <div class="catalog__bar">
            <div class="catalog__bar-left">
              <button class="catalog__filters-toggle" type="button" @click="toggleMobileFilters">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
                </svg>
                Фильтры
              </button>
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
            <p>В этой категории пока нет товаров или измените параметры фильтра</p>
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
                <div class="product-overlay">
                  <span class="view-btn">Подробнее</span>
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
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M12 5v14M5 12h14"/>
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
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useProductStore } from '../store/products'
import { useCartStore } from '../store/cart'
import Loader from '../components/Loader.vue'
import { trackProductEvent } from '../api/analytics'

const route = useRoute()
const productStore = useProductStore()
const cartStore = useCartStore()

const selectedCategory = ref(null)
const sortBy = ref('default')
const priceMin = ref(null)
const priceMax = ref(null)
const loading = ref(false)
const mobileFiltersOpen = ref(false)
const brokenCategoryIcons = ref(new Set())

const products = computed(() => productStore.products)
const categories = computed(() => productStore.categories)

const filteredProducts = computed(() => {
  let result = [...products.value]

  if (selectedCategory.value) {
    result = result.filter(product => product.categories?.some(category => (
      categoriesMatch(category, selectedCategory.value)
    )))
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
  img.src = '/logo-192.webp'
}

onMounted(async () => {
  loading.value = true
  await productStore.fetchProducts()
  await productStore.fetchCategories()
  loading.value = false
  
  if (route.query.category) {
    selectedCategory.value = resolveCategoryQuery(route.query.category)
  }
})

watch(() => route.query.category, (newCat) => {
  selectedCategory.value = resolveCategoryQuery(newCat)
})
</script>

<style scoped>
.catalog {
  padding-bottom: 6rem;
}

.catalog__hero {
  padding: 4rem 0;
  background: linear-gradient(180deg, var(--bg-secondary) 0%, var(--bg-primary) 100%);
  border-bottom: 1px solid var(--border);
  margin-bottom: 3rem;
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

.results-count {
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
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.product-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 20px;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.product-card:hover {
  border-color: rgba(166, 185, 248, 0.3);
  transform: translateY(-8px);
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.35);
}

.product-image {
  position: relative;
  aspect-ratio: 4/3;
  background: var(--bg-secondary);
  overflow: hidden;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.6s ease;
}

.product-card:hover .product-image img {
  transform: scale(1.08);
}

.product-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
}

.product-overlay {
  position: absolute;
  inset: 0;
  background: rgba(10, 10, 16, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.4s ease;
}

.product-card:hover .product-overlay {
  opacity: 1;
}

.view-btn {
  padding: 0.75rem 1.5rem;
  background: var(--accent);
  color: var(--bg-primary);
  font-size: 0.8rem;
  font-weight: 700;
  border-radius: 10px;
  transform: translateY(10px);
  transition: transform 0.4s ease;
}

.product-card:hover .view-btn {
  transform: translateY(0);
}

.product-content {
  padding: 1.5rem;
}

.product-card-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.product-category-badge {
  display: inline-block;
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--accent);
  background: var(--accent-dim);
  padding: 0.35rem 0.7rem;
  border-radius: 6px;
}

.product-low-stock {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.65rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.12);
  border: 1px solid rgba(245, 158, 11, 0.28);
  border-radius: 999px;
  padding: 0.32rem 0.62rem;
}

.product-title {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  line-height: 1.3;
}

.product-desc {
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 1.25rem;
  white-space: pre-line;
  word-break: break-word;
}

.product-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 1rem;
  border-top: 1px solid var(--border);
}

.product-price {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.25rem;
}

.price-current {
  display: flex;
  align-items: baseline;
  gap: 0.25rem;
}

.price-value {
  font-family: var(--font-mono);
  font-size: 1.5rem;
  font-weight: 700;
}

.price-currency {
  font-size: 0.875rem;
  color: var(--text-muted);
}

.price-discount-row {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.price-old {
  font-size: 0.8rem;
  color: var(--text-muted);
  text-decoration: line-through;
}

.price-discount-badge {
  font-size: 0.72rem;
  font-weight: 700;
  color: #ef4444;
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 999px;
  padding: 0.12rem 0.45rem;
}

.add-to-cart-btn {
  width: 40px;
  height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 10px;
  color: var(--text-primary);
  transition: all 0.3s ease;
}

.add-to-cart-btn:hover:not(:disabled) {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--bg-primary);
}

.add-to-cart-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.catalog-qty-control {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.2rem;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--bg-secondary);
}

.qty-btn {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 1.1rem;
  line-height: 1;
  font-weight: 700;
  transition: all 0.3s ease;
}

.qty-btn:hover:not(:disabled) {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--bg-primary);
}

.qty-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.qty-value {
  min-width: 20px;
  text-align: center;
  font-family: var(--font-mono);
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--text-primary);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (prefers-reduced-motion: no-preference) {
  .catalog__hero {
    animation: catalog-reveal-down 0.55s cubic-bezier(0.16, 1, 0.3, 1) both;
  }

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
  .catalog__hero {
    padding: 2rem 0;
  }

  .page-title {
    font-size: 1.75rem;
  }

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
    justify-content: space-between;
  }

  .sort-select {
    width: 100%;
  }

  .results-count {
    font-size: 0.8rem;
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
</style>
