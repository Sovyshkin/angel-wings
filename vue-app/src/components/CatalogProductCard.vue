<template>
  <router-link
    :to="`/product/${product.id}`"
    class="product-card"
    :class="{ 'product-card--animated': animated }"
    :style="animated ? { '--reveal-delay': `${Math.min(index, 8) * 45}ms` } : undefined"
    :data-aos="animated ? 'fade-up' : undefined"
    :data-aos-delay="animated ? 100 + index * 50 : undefined"
    @click="emit('open')"
  >
    <div class="product-image">
      <img
        v-if="product.image"
        :src="product.image"
        :alt="product.title"
        width="480"
        height="480"
        :loading="animated && index < 4 ? 'eager' : 'lazy'"
        :fetchpriority="animated && index < 2 ? 'high' : 'auto'"
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
        <span v-if="categoryName" class="product-category-badge">{{ categoryName }}</span>
        <span v-if="isLowStock" class="product-low-stock">Меньше 10 осталось</span>
      </div>
      <h3 class="product-title">{{ product.title }}</h3>
      <p class="product-desc">{{ truncatedDescription }}</p>
      <div class="product-footer">
        <div class="product-price">
          <div class="price-current">
            <span class="price-value">{{ displayPrice.toLocaleString('ru-RU') }}</span>
            <span class="price-currency">₽</span>
          </div>
          <div v-if="oldPrice" class="price-discount-row">
            <span class="price-old">{{ oldPrice.toLocaleString('ru-RU') }} ₽</span>
            <span class="price-discount-badge">-{{ discountPercent }}%</span>
          </div>
        </div>
        <button
          v-if="cartQuantity === 0"
          class="add-to-cart-btn"
          type="button"
          aria-label="Добавить в корзину"
          :disabled="!product.stock"
          @click.prevent="increaseQuantity"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 5v14M5 12h14"/>
          </svg>
        </button>
        <div v-else class="catalog-qty-control" @click.prevent>
          <button class="qty-btn" type="button" aria-label="Уменьшить" :disabled="cartQuantity <= 0" @click.prevent="decreaseQuantity">−</button>
          <span class="qty-value">{{ cartQuantity }}</span>
          <button class="qty-btn" type="button" aria-label="Увеличить" :disabled="!product.stock || cartQuantity >= product.stock" @click.prevent="increaseQuantity">+</button>
        </div>
      </div>
    </div>
  </router-link>
</template>

<script setup>
import { computed } from 'vue'
import { useProductStore } from '../store/products'
import { useCartStore } from '../store/cart'
import { trackProductEvent } from '../api/analytics'

const props = defineProps({
  product: { type: Object, required: true },
  index: { type: Number, default: 0 },
  animated: { type: Boolean, default: false }
})
const emit = defineEmits(['open'])
const productStore = useProductStore()
const cartStore = useCartStore()

const categoryName = computed(() => {
  const category = props.product.categories?.[0]
  if (!category) return ''
  if (category.name) return category.name
  const knownCategories = productStore.categories || []
  return knownCategories.find(item => item.slug === category.slug || Number(item.id ?? item.term_id) === Number(category.id))?.name || ''
})
const isLowStock = computed(() => Number(props.product.stock || 0) > 0 && Number(props.product.stock) < 10)
const truncatedDescription = computed(() => {
  const description = props.product.description || ''
  return description.length > 100 ? `${description.substring(0, 100)}...` : description
})
const displayPrice = computed(() => {
  const price = Number(props.product.price)
  return Number.isFinite(price) && price > 0 ? price : 0
})
const oldPrice = computed(() => {
  const price = Number(props.product.comparePrice)
  return Number.isFinite(price) && price > displayPrice.value ? price : null
})
const discountPercent = computed(() => oldPrice.value && displayPrice.value > 0
  ? Math.round(((oldPrice.value - displayPrice.value) / oldPrice.value) * 100)
  : 0)
const baseCartItem = computed(() => cartStore.items.find(item => item.id === props.product.id && !item.selectedDosage))
const cartQuantity = computed(() => Math.max(0, Number(baseCartItem.value?.quantity || 0)))

function increaseQuantity() {
  const maxStock = Math.max(0, Number(props.product.stock || 0))
  if (maxStock === 0 || cartQuantity.value >= maxStock) return
  cartStore.addItem({ ...props.product, selectedDosage: null })
  trackProductEvent(props.product.id, 'add_to_cart', { source: 'catalog', quantity: 1 })
}

function decreaseQuantity() {
  if (!baseCartItem.value) return
  if (baseCartItem.value.quantity <= 1) {
    cartStore.removeItem(props.product.id, null)
  } else {
    cartStore.updateQuantity(props.product.id, baseCartItem.value.quantity - 1, null)
  }
}

function handleImageError(event) {
  const image = event.target
  if (image.dataset.fallbackApplied === 'true') return
  image.dataset.fallbackApplied = 'true'
  image.src = '/angel-wings-logo-light.svg'
}
</script>

<style scoped>
.product-card { display: flex; min-width: 0; flex-direction: column; background: var(--bg-card); border: 1px solid var(--border); border-radius: 20px; overflow: hidden; color: var(--text-primary); transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
.product-card:hover { border-color: rgba(166, 185, 248, 0.3); transform: translateY(-8px); box-shadow: 0 25px 50px rgba(0, 0, 0, 0.35); }
.product-image { position: relative; aspect-ratio: 4/3; background: var(--bg-secondary); overflow: hidden; }
.product-image img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.6s ease; }
.product-card:hover .product-image img { transform: scale(1.08); }
.product-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: var(--text-muted); }
.product-overlay { position: absolute; inset: 0; background: rgba(10, 10, 16, 0.7); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.4s ease; }
.product-card:hover .product-overlay { opacity: 1; }
.view-btn { padding: 0.75rem 1.5rem; background: var(--accent); color: var(--bg-primary); font-size: 0.8rem; font-weight: 700; border-radius: 10px; transform: translateY(10px); transition: transform 0.4s ease; }
.product-card:hover .view-btn { transform: translateY(0); }
.product-content { display: flex; flex: 1; flex-direction: column; padding: 1.5rem; }
.product-card-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem; }
.product-category-badge { display: inline-block; font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: var(--accent); background: var(--accent-dim); padding: 0.35rem 0.7rem; border-radius: 6px; }
.product-low-stock { display: inline-flex; align-items: center; gap: 0.35rem; font-size: 0.65rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #f59e0b; background: rgba(245, 158, 11, 0.12); border: 1px solid rgba(245, 158, 11, 0.28); border-radius: 999px; padding: 0.32rem 0.62rem; }
.product-title { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 1.125rem; font-weight: 600; margin-bottom: 0.5rem; line-height: 1.3; }
.product-desc { font-size: 0.85rem; color: var(--text-secondary); line-height: 1.6; margin-bottom: 1.25rem; white-space: pre-line; word-break: break-word; }
.product-footer { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; margin-top: auto; padding-top: 1rem; border-top: 1px solid var(--border); }
.product-price { display: flex; flex-direction: column; align-items: flex-start; gap: 0.25rem; }
.price-current { display: flex; align-items: baseline; gap: 0.25rem; }
.price-value { font-family: var(--font-mono); font-size: 1.5rem; font-weight: 700; }
.price-currency { font-size: 0.875rem; color: var(--text-muted); }
.price-discount-row { display: inline-flex; align-items: center; gap: 0.4rem; }
.price-old { font-size: 0.8rem; color: var(--text-muted); text-decoration: line-through; }
.price-discount-badge { font-size: 0.72rem; font-weight: 700; color: #ef4444; background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 999px; padding: 0.12rem 0.45rem; }
.add-to-cart-btn { width: 40px; height: 40px; flex: 0 0 40px; display: inline-flex; align-items: center; justify-content: center; background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 10px; color: var(--text-primary); transition: all 0.3s ease; }
.add-to-cart-btn:hover:not(:disabled) { background: var(--accent); border-color: var(--accent); color: var(--bg-primary); }
.add-to-cart-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.catalog-qty-control { display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.2rem; border: 1px solid var(--border); border-radius: 12px; background: var(--bg-secondary); }
.qty-btn { width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; background: transparent; border: 1px solid transparent; border-radius: 8px; color: var(--text-primary); font-size: 1.1rem; line-height: 1; font-weight: 700; transition: all 0.3s ease; }
.qty-btn:hover:not(:disabled) { background: var(--accent); border-color: var(--accent); color: var(--bg-primary); }
.qty-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.qty-value { min-width: 20px; text-align: center; font-family: var(--font-mono); font-size: 0.9rem; font-weight: 700; color: var(--text-primary); }
@media (prefers-reduced-motion: no-preference) { .product-card--animated { animation: catalog-card-reveal 0.55s var(--reveal-delay, 0ms) cubic-bezier(0.16, 1, 0.3, 1) both; } }
@keyframes catalog-card-reveal { from { opacity: 0; translate: 0 24px; scale: 0.985; } to { opacity: 1; translate: 0 0; scale: 1; } }
@media (max-width: 640px) { .product-content { padding: 1rem; } .product-title { font-size: 0.9375rem; } .product-desc { font-size: 0.8rem; display: none; } .price-value { font-size: 1.125rem; } }
</style>
