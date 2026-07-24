<template>
  <div class="product-detail">
    <Loader v-if="loading" text="Загрузка товара..." />
    <div class="container" v-else>
      <div class="breadcrumb" data-aos="fade-up">
        <router-link to="/">Главная</router-link>
        <span>/</span>
        <router-link to="/catalog">Каталог</router-link>
        <span>/</span>
        <span>{{ product.title }}</span>
      </div>

      <div class="product-layout" v-if="product" data-aos="fade-up" data-aos-delay="100">
        <div class="product-gallery" data-aos="fade-right" data-aos-delay="200">
          <div class="gallery-main">
            <img
              v-if="activeImageUrl"
              :src="activeImageUrl"
              :alt="product.title"
              width="800"
              height="800"
              fetchpriority="high"
              decoding="async"
              @error="handleImageError"
            >
            <div v-else class="gallery-placeholder">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <path d="M21 15l-5-5L5 21"/>
              </svg>
            </div>
            <button v-if="productImages.length > 1" type="button" class="gallery-nav prev" @click="prevImage">‹</button>
            <button v-if="productImages.length > 1" type="button" class="gallery-nav next" @click="nextImage">›</button>
          </div>
          <div v-if="productImages.length > 1" class="gallery-thumbs">
            <button
              v-for="(imageUrl, index) in productImages"
              :key="`${imageUrl}-${index}`"
              type="button"
              class="thumb-item"
              :class="{ active: index === activeImageIndex }"
              @click="activeImageIndex = index"
            >
              <img
                :src="imageUrl"
                :alt="`${product.title} ${index + 1}`"
                width="96"
                height="96"
                loading="lazy"
                decoding="async"
                @error="handleImageError"
              >
            </button>
          </div>
        </div>
        
        <div class="product-info" data-aos="fade-left" data-aos-delay="300">
          <div class="product-meta">
            <span class="product-category">{{ getCategoryName(product.categories?.[0]) }}</span>
            <span class="product-stock" :class="{ available: currentStock > 0 }">
              {{ getPublicStockLabel(currentStock) }}
            </span>
          </div>
          
          <h1 class="product-title">{{ product.title }}</h1>
          
          <div class="product-price-block">
            <div class="product-price-main">
              <span class="product-price">{{ formatPrice(currentPrice) }}</span>
              <span class="product-currency">₽</span>
              <span class="price-unit">/ уп.</span>
            </div>
            <div v-if="hasMainDiscount" class="product-price-discount">
              <span class="product-old-price">{{ formatPrice(mainOldPrice) }} ₽</span>
              <span class="product-discount-badge">-{{ mainDiscountPercent }}%</span>
            </div>
          </div>

          <div class="product-variants" v-if="dosageSpecs.length">
            <h3>Выберите дозировку</h3>
            <div class="variants-grid">
              <button
                v-for="(item, index) in dosageSpecs"
                :key="`variant-${index}`"
                type="button"
                class="variant-card"
                :class="{ active: selectedDosageIndex === index, disabled: item.quantity <= 0 }"
                :disabled="item.quantity <= 0"
                @click="selectedDosageIndex = index"
              >
                <span class="variant-title">{{ item.dosage }}</span>
                <span class="variant-price">{{ formatPrice(getDosagePrice(item)) }} ₽</span>
                <div v-if="getDosageComparePrice(item)" class="variant-price-meta">
                  <span class="variant-old-price">{{ formatPrice(getDosageComparePrice(item)) }} ₽</span>
                  <span class="variant-discount-badge">
                    -{{ getDiscountPercentByValues(getDosagePrice(item), getDosageComparePrice(item)) }}%
                  </span>
                </div>
                <span class="variant-stock" :class="{ low: isLowStock(item.quantity) }">
                  {{ getPublicStockLabel(item.quantity) }}
                </span>
              </button>
            </div>
          </div>
          
          <div class="product-description">
            <h3>Описание</h3>
            <p>{{ visibleDescription }}</p>
            <button
              v-if="canToggleDescription"
              type="button"
              class="description-toggle"
              @click="descriptionExpanded = !descriptionExpanded"
            >
              {{ descriptionExpanded ? 'Скрыть' : 'Показать полностью' }}
            </button>
          </div>
          
          <div class="product-country" v-if="product.country">
            <div class="country-badge">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
              <span>{{ product.country }}</span>
            </div>
          </div>
          
          <div class="product-specs" v-if="hasSpecs">
            <h3>Характеристики</h3>
            <div class="specs-table">
              <div class="spec-row" v-for="(value, key) in visibleSpecs" :key="key">
                <span class="spec-key">{{ key }}</span>
                <span class="spec-val">{{ value }}</span>
              </div>
            </div>
          </div>
          
          <div class="product-actions">
            <div class="quantity-selector">
              <button @click="decreaseQty" :disabled="displayedQuantity <= 1">−</button>
              <span>{{ displayedQuantity }}</span>
              <button @click="increaseQty" :disabled="displayedQuantity >= currentStock">+</button>
            </div>
            <button
              class="btn btn-primary btn-add-cart"
              :class="{ 'just-added': justAdded, 'in-cart': isCurrentVariantInCart }"
              @click="addToCart"
              :disabled="currentStock <= 0"
            >
              <svg v-if="justAdded" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <svg v-else-if="isCurrentVariantInCart" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
              <span>{{ justAdded ? 'Добавлено!' : (isCurrentVariantInCart ? `Уже в корзине (${currentVariantCartQty})` : 'Добавить в корзину') }}</span>
            </button>
          </div>
          
          <div class="product-guarantee">
            <div class="guarantee-item">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              <span>Гарантия качества</span>
            </div>
            <div class="guarantee-item">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="1" y="3" width="15" height="13"/>
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
                <circle cx="5.5" cy="18.5" r="2.5"/>
                <circle cx="18.5" cy="18.5" r="2.5"/>
              </svg>
              <span>Быстрая доставка</span>
            </div>
            <div class="guarantee-item">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              <span>Консультация специалиста</span>
            </div>
          </div>
        </div>
      </div>
      
      <div v-else-if="!product" class="not-found">
        <h2>Товар не найден</h2>
        <router-link to="/catalog" class="btn btn-primary">Вернуться в каталог</router-link>
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
import { pushProductDetail } from '../utils/ecommerce'

const route = useRoute()
const productStore = useProductStore()
const cartStore = useCartStore()

const quantity = ref(1)
const loading = ref(true)
const justAdded = ref(false)
const selectedDosageIndex = ref(0)
const activeImageIndex = ref(0)
const descriptionExpanded = ref(false)

const product = computed(() => {
  return productStore.products.find(p => p.id == route.params.id) || null
})

const productImages = computed(() => {
  if (!product.value) return []
  const list = []
  if (product.value.image) list.push(product.value.image)
  if (Array.isArray(product.value.images)) list.push(...product.value.images)
  return [...new Set(list.filter(Boolean))]
})

const activeImageUrl = computed(() => {
  if (!productImages.value.length) return null
  return productImages.value[activeImageIndex.value] || productImages.value[0]
})

const fullDescription = computed(() => String(product.value?.description || '').trim())

const firstDescriptionSentence = computed(() => {
  const text = fullDescription.value
  if (!text) return ''

  const match = text.match(/^.*?[.!?…](?:\s|$)/u)
  if (match?.[0]?.trim()) {
    return match[0].trim()
  }

  const firstLine = text.split(/\n+/).find(Boolean)
  return firstLine ? firstLine.trim() : text
})

const canToggleDescription = computed(() => {
  return fullDescription.value.length > firstDescriptionSentence.value.length
})

const visibleDescription = computed(() => {
  if (!canToggleDescription.value || descriptionExpanded.value) {
    return fullDescription.value
  }

  return firstDescriptionSentence.value
})

const visibleSpecs = computed(() => {
  if (!product.value?.specs || typeof product.value.specs !== 'object') return {}

  return Object.entries(product.value.specs).reduce((acc, [key, value]) => {
    if (key === 'dosages') return acc
    acc[key] = value
    return acc
  }, {})
})

const dosageSpecs = computed(() => {
  const dosages = product.value?.specs?.dosages
  if (!Array.isArray(dosages)) return []

  return dosages
    .map(item => ({
      dosage: typeof item?.dosage === 'string' ? item.dosage.trim() : '',
      quantity: Math.max(0, parseInt(item?.quantity) || 0),
      price: item?.price !== undefined && item?.price !== null ? Math.max(0, parseFloat(item.price) || 0) : null,
      comparePrice: item?.comparePrice !== undefined && item?.comparePrice !== null ? Math.max(0, parseFloat(item.comparePrice) || 0) : null
    }))
    .filter(item => item.dosage)
})

const currentPrice = computed(() => {
  if (!dosageSpecs.value.length) return product.value?.price || 0
  return getDosagePrice(dosageSpecs.value[selectedDosageIndex.value])
})

const currentStock = computed(() => {
  if (!dosageSpecs.value.length) return product.value?.stock || 0
  const selected = dosageSpecs.value[selectedDosageIndex.value]
  return selected ? selected.quantity : 0
})

function isLowStock(stockValue) {
  const stock = Number(stockValue || 0)
  return stock > 0 && stock < 10
}

function getPublicStockLabel(stockValue) {
  if (Number(stockValue || 0) <= 0) return 'Нет в наличии'
  if (isLowStock(stockValue)) return 'Меньше 10 осталось'
  return 'В наличии'
}

const currentComparePrice = computed(() => {
  if (!product.value) return null

  if (!dosageSpecs.value.length) {
    const old = normalizePrice(product.value.comparePrice)
    const current = normalizePrice(product.value.price)
    return old > current ? old : null
  }

  const selected = dosageSpecs.value[selectedDosageIndex.value]
  return getDosageComparePrice(selected)
})

const currentDiscountPercent = computed(() => {
  return getDiscountPercentByValues(currentPrice.value, currentComparePrice.value)
})

const currentSelectedDosage = computed(() => {
  return dosageSpecs.value[selectedDosageIndex.value]?.dosage || null
})

const currentVariantCartQty = computed(() => {
  if (!product.value?.id) return 0
  const keyDosage = currentSelectedDosage.value || null
  const item = cartStore.items.find(i => i.id === product.value.id && (i.selectedDosage || null) === keyDosage)
  return Math.max(0, Number(item?.quantity || 0))
})

const isCurrentVariantInCart = computed(() => currentVariantCartQty.value > 0)

const displayedQuantity = computed(() => {
  return isCurrentVariantInCart.value ? currentVariantCartQty.value : quantity.value
})

const productCardComparePrice = computed(() => {
  const old = normalizePrice(product.value?.comparePrice)
  const current = normalizePrice(product.value?.price)
  return old > current ? old : null
})

const productCardDiscountPercent = computed(() => {
  return getDiscountPercentByValues(product.value?.price, productCardComparePrice.value)
})

const hasMainDiscount = computed(() => {
  return currentDiscountPercent.value > 0 || productCardDiscountPercent.value > 0
})

const mainOldPrice = computed(() => {
  if (currentDiscountPercent.value > 0 && currentComparePrice.value) {
    return currentComparePrice.value
  }
  return productCardComparePrice.value
})

const mainDiscountPercent = computed(() => {
  if (currentDiscountPercent.value > 0) {
    return currentDiscountPercent.value
  }
  return productCardDiscountPercent.value
})

const hasSpecs = computed(() => {
  return Object.keys(visibleSpecs.value).length > 0
})

function getCategoryName(category) {
  if (!category) return ''
  if (category.name) return category.name

  if (category.slug) {
    const bySlug = productStore.categories.find(c => c.slug === category.slug)
    if (bySlug?.name) return bySlug.name
  }

  if (category.id !== undefined && category.id !== null) {
    const byId = productStore.categories.find(c => Number(c.id ?? c.term_id) === Number(category.id))
    if (byId?.name) return byId.name
  }

  return ''
}

function decreaseQty() {
  if (isCurrentVariantInCart.value) {
    cartStore.updateQuantity(product.value.id, currentVariantCartQty.value - 1, currentSelectedDosage.value)
    quantity.value = Math.max(1, currentVariantCartQty.value - 1)
    return
  }

  if (quantity.value > 1) quantity.value--
}

function increaseQty() {
  const nextQuantity = Math.min(currentStock.value, displayedQuantity.value + 1)

  if (isCurrentVariantInCart.value) {
    cartStore.updateQuantity(product.value.id, nextQuantity, currentSelectedDosage.value)
    trackProductEvent(product.value.id, 'add_to_cart', { source: 'product_detail_quantity', quantity: 1 })
    quantity.value = nextQuantity
    return
  }

  quantity.value = nextQuantity
}

function addToCart() {
  if (product.value && currentStock.value > 0) {
    for (let i = 0; i < quantity.value; i++) {
      const selectedDosage = dosageSpecs.value[selectedDosageIndex.value]?.dosage || null
      cartStore.addItem({
        ...product.value,
        price: currentPrice.value,
        selectedDosage
      })
    }
    trackProductEvent(product.value.id, 'add_to_cart', { source: 'product_detail', quantity: quantity.value })
    justAdded.value = true
    setTimeout(() => { justAdded.value = false }, 2000)
  }
}

function getDosagePrice(item) {
  if (!item) return product.value?.price || 0
  if (item.price === null || item.price === undefined) return product.value?.price || 0
  return item.price
}

function normalizePrice(value) {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? n : 0
}

function formatPrice(value) {
  return normalizePrice(value).toLocaleString('ru-RU')
}

function getDosageComparePrice(item) {
  if (!item) return null
  const current = normalizePrice(getDosagePrice(item))

  if (item.comparePrice !== null && item.comparePrice !== undefined) {
    const dosageCompare = normalizePrice(item.comparePrice)
    if (dosageCompare > current) return dosageCompare
  }

  const baseCompare = normalizePrice(product.value?.comparePrice)
  if (baseCompare > current) return baseCompare

  return null
}

function getDiscountPercentByValues(currentValue, oldValue) {
  const current = normalizePrice(currentValue)
  const old = normalizePrice(oldValue)
  if (!old || old <= current || current <= 0) return 0
  return Math.round(((old - current) / old) * 100)
}

function nextImage() {
  if (!productImages.value.length) return
  activeImageIndex.value = (activeImageIndex.value + 1) % productImages.value.length
}

function prevImage() {
  if (!productImages.value.length) return
  activeImageIndex.value = (activeImageIndex.value - 1 + productImages.value.length) % productImages.value.length
}

function handleImageError(e) {
  const img = e.target
  if (img.dataset.fallbackApplied === 'true') return
  img.dataset.fallbackApplied = 'true'
  img.src = '/logo-192.webp'
}

watch(productImages, () => {
  activeImageIndex.value = 0
})

watch(() => route.params.id, () => {
  descriptionExpanded.value = false
  quantity.value = 1
})

watch(selectedDosageIndex, () => {
  quantity.value = 1
})

watch(() => product.value?.id, (productId) => {
  if (productId) {
    trackProductEvent(productId, 'view', { source: 'product_detail' })
    pushProductDetail(product.value)
  }
}, { immediate: true })

onMounted(async () => {
  loading.value = true
  await productStore.fetchProducts()
  await productStore.fetchCategories()
  loading.value = false
})
</script>

<style scoped>
.product-detail {
  padding: 2rem 0 4rem;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 2rem;
  font-size: 0.875rem;
  color: var(--text-muted);
}

.breadcrumb a {
  color: var(--text-secondary);
  transition: color 0.3s;
}

.breadcrumb a:hover {
  color: var(--accent);
}

.breadcrumb span:last-child {
  color: var(--text-primary);
}

.product-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  align-items: start;
}

.product-gallery {
  position: sticky;
  top: 100px;
}

.gallery-main {
  aspect-ratio: 1;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.gallery-main img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.gallery-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.45);
  color: #fff;
  font-size: 1.5rem;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
}

.gallery-nav.prev {
  left: 0.75rem;
}

.gallery-nav.next {
  right: 0.75rem;
}

.gallery-thumbs {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.thumb-item {
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  overflow: hidden;
  background: var(--bg-card);
  aspect-ratio: 1;
}

.thumb-item.active {
  border-color: var(--accent);
  box-shadow: 0 0 0 1px var(--accent);
}

.thumb-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.gallery-placeholder {
  color: var(--text-muted);
}

.product-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.product-category {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--accent);
  padding: 0.375rem 0.75rem;
  background: var(--accent-dim);
  border-radius: 100px;
}

.product-stock {
  font-size: 0.8rem;
  color: var(--danger);
}

.product-stock.available {
  color: var(--accent);
}

.product-title {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 2rem;
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 1.5rem;
}

.product-price-block {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid var(--border);
}

.product-price-main {
  display: flex;
  align-items: baseline;
  gap: 0.25rem;
}

.product-price {
  font-family: var(--font-mono);
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--text-primary);
}

.product-currency {
  font-size: 1.5rem;
  color: var(--text-muted);
}

.price-unit {
  font-size: 0.9rem;
  color: var(--text-muted);
  margin-left: 0.5rem;
}

.product-price-discount {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.product-old-price {
  font-size: 1rem;
  color: var(--text-muted);
  text-decoration: line-through;
}

.product-discount-badge {
  font-size: 0.8rem;
  font-weight: 700;
  color: #ef4444;
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.35);
  border-radius: 999px;
  padding: 0.16rem 0.5rem;
}

.product-variants {
  margin-bottom: 2rem;
}

.product-variants h3 {
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: var(--text-secondary);
}

.variants-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}

.variant-card {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  text-align: left;
  padding: 0.9rem 1rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg-card);
  transition: var(--transition);
}

.variant-card:hover:not(.disabled) {
  border-color: var(--accent);
}

.variant-card.active {
  border-color: var(--accent);
  box-shadow: 0 0 0 1px var(--accent);
  background: var(--accent-dim);
}

.variant-card.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.variant-title {
  font-weight: 700;
  color: var(--text-primary);
}

.variant-price {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--accent);
}

.variant-price-meta {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.variant-old-price {
  font-size: 0.75rem;
  color: var(--text-muted);
  text-decoration: line-through;
}

.variant-discount-badge {
  font-size: 0.68rem;
  font-weight: 700;
  color: #ef4444;
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 999px;
  padding: 0.08rem 0.35rem;
}

.variant-stock {
  font-size: 0.8125rem;
  color: var(--text-secondary);
}

.variant-stock.low {
  color: #f59e0b;
  font-weight: 700;
}

.product-country {
  margin-bottom: 1.5rem;
}

.country-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.25rem;
  background: linear-gradient(135deg, var(--accent-dim), rgba(59, 130, 246, 0.1));
  border: 1px solid var(--accent);
  border-radius: 100px;
  color: var(--accent);
}

.country-badge svg {
  flex-shrink: 0;
}

.country-badge span {
  font-size: 0.9375rem;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.product-description {
  margin-bottom: 2rem;
}

.product-description h3,
.product-specs h3 {
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: var(--text-secondary);
}

.product-description p {
  line-height: 1.7;
  color: var(--text-secondary);
  white-space: pre-line;
  word-break: break-word;
}

.description-toggle {
  display: inline-flex;
  align-items: center;
  margin-top: 0.85rem;
  padding: 0;
  background: transparent;
  border: 0;
  color: var(--accent);
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
  transition: color 0.2s ease, opacity 0.2s ease;
}

.description-toggle:hover {
  color: var(--text-primary);
}

.product-attributes {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
}

.attributes-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.attribute-item {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  padding: 1rem;
  background: var(--bg-secondary);
  border-radius: var(--radius-sm);
}

.attribute-label {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
}

.attribute-value {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.product-specs {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
}

.specs-table {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.spec-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.875rem 1rem;
  border-bottom: 1px solid var(--border);
}

.spec-row:last-child {
  border-bottom: none;
}

.spec-row:nth-child(odd) {
  background: var(--bg-secondary);
  border-radius: var(--radius-sm);
  margin-bottom: 0.5rem;
}

.spec-key {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.spec-val {
  font-weight: 600;
  font-size: 0.9375rem;
}

.product-actions {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
}

.quantity-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--bg-secondary);
  border-radius: var(--radius-sm);
  padding: 0.25rem;
}

.quantity-selector button {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  color: var(--text-primary);
  font-size: 1.25rem;
  border-radius: var(--radius-sm);
  transition: all 0.2s;
}

.quantity-selector button:hover:not(:disabled) {
  background: var(--accent);
  color: var(--bg-primary);
}

.quantity-selector button:disabled {
  opacity: 0.3;
}

.quantity-selector span {
  min-width: 40px;
  text-align: center;
  font-weight: 700;
  font-size: 1.125rem;
}

.btn-add-cart {
  flex: 1;
  gap: 0.75rem;
}

.btn-add-cart svg {
  flex-shrink: 0;
}

.btn-add-cart.just-added {
  animation: cart-success 0.4s ease;
}

.btn-add-cart.in-cart:not(.just-added) {
  border-color: var(--accent);
  background: var(--accent-dim);
}

@keyframes cart-success {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

@media (prefers-reduced-motion: no-preference) {
  .breadcrumb {
    animation: detail-reveal-down 0.45s cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  .product-gallery {
    animation: detail-gallery-reveal 0.7s 0.08s cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  .gallery-main {
    animation: detail-gallery-focus 0.85s 0.12s cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  .thumb-item {
    animation: detail-thumb-reveal 0.45s cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  .thumb-item:nth-child(1) { animation-delay: 0.18s; }
  .thumb-item:nth-child(2) { animation-delay: 0.23s; }
  .thumb-item:nth-child(3) { animation-delay: 0.28s; }
  .thumb-item:nth-child(4) { animation-delay: 0.33s; }
  .thumb-item:nth-child(n + 5) { animation-delay: 0.38s; }

  .product-info > * {
    animation: detail-info-reveal 0.58s cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  .product-info > :nth-child(1) { animation-delay: 0.08s; }
  .product-info > :nth-child(2) { animation-delay: 0.12s; }
  .product-info > :nth-child(3) { animation-delay: 0.16s; }
  .product-info > :nth-child(4) { animation-delay: 0.2s; }
  .product-info > :nth-child(5) { animation-delay: 0.24s; }
  .product-info > :nth-child(6) { animation-delay: 0.28s; }
  .product-info > :nth-child(7) { animation-delay: 0.32s; }
  .product-info > :nth-child(n + 8) { animation-delay: 0.36s; }
}

@keyframes detail-reveal-down {
  from { opacity: 0; translate: 0 -12px; }
  to { opacity: 1; translate: 0 0; }
}

@keyframes detail-gallery-reveal {
  from { opacity: 0; translate: -28px 0; }
  to { opacity: 1; translate: 0 0; }
}

@keyframes detail-gallery-focus {
  from { scale: 0.965; }
  to { scale: 1; }
}

@keyframes detail-thumb-reveal {
  from { opacity: 0; translate: 0 10px; scale: 0.94; }
  to { opacity: 1; translate: 0 0; scale: 1; }
}

@keyframes detail-info-reveal {
  from { opacity: 0; translate: 22px 0; }
  to { opacity: 1; translate: 0 0; }
}

.product-guarantee {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.guarantee-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  text-align: center;
}

.guarantee-item svg {
  color: var(--accent);
}

.guarantee-item span {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.not-found {
  text-align: center;
  padding: 4rem 0;
}

.not-found h2 {
  font-family: var(--font-display);
  margin-bottom: 1.5rem;
}

@media (max-width: 1024px) {
  .product-layout {
    grid-template-columns: 1fr;
    gap: 2rem;
  }

  .product-gallery {
    position: static;
  }

  .product-guarantee {
    grid-template-columns: 1fr;
  }

  .gallery-thumbs {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .product-detail {
    padding: 1rem 0 2rem;
  }

  .gallery-thumbs {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .breadcrumb {
    font-size: 0.7rem;
    gap: 0.375rem;
    flex-wrap: wrap;
    margin-bottom: 1rem;
  }

  .product-meta {
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }

  .product-category {
    font-size: 0.65rem;
    padding: 0.25rem 0.5rem;
  }

  .product-stock {
    font-size: 0.7rem;
  }

  .product-title {
    font-size: 1.25rem;
    margin-bottom: 1rem;
  }

  .product-price {
    font-size: 1.75rem;
  }

  .product-price-block {
    flex-wrap: wrap;
    padding-bottom: 1rem;
    margin-bottom: 1rem;
  }

  .product-description h3,
  .product-specs h3,
  .product-variants h3 {
    font-size: 0.875rem;
    margin-bottom: 0.75rem;
  }

  .variants-grid {
    grid-template-columns: 1fr;
  }

  .product-description p {
    font-size: 0.875rem;
    line-height: 1.6;
  }

  .description-toggle {
    font-size: 0.875rem;
  }

  .product-specs {
    padding: 1rem;
    margin-bottom: 1rem;
  }

  .product-actions {
    flex-direction: column;
    padding: 1rem;
    margin-bottom: 1rem;
  }

  .quantity-selector {
    width: 100%;
    justify-content: center;
  }

  .btn-add-cart {
    width: 100%;
    padding: 0.875rem;
  }

  .specs-grid {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }

  .spec-item {
    flex-direction: row;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .spec-label {
    font-size: 0.7rem;
  }

  .spec-value {
    font-size: 0.8rem;
  }

  .product-guarantee {
    gap: 0.5rem;
  }

  .guarantee-item {
    flex-direction: row;
    justify-content: flex-start;
    gap: 0.75rem;
    padding: 0.75rem;
    text-align: left;
    font-size: 0.75rem;
  }
}
</style>
