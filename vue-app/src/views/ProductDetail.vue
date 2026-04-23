<template>
  <div class="product-detail">
    <Loader v-if="loading" text="Загрузка товара..." />
    <div class="container" v-else>
      <div class="breadcrumb">
        <router-link to="/">Главная</router-link>
        <span>/</span>
        <router-link to="/catalog">Каталог</router-link>
        <span>/</span>
        <span>{{ product.title }}</span>
      </div>
      
      <div class="product-layout" v-if="product">
        <div class="product-gallery">
          <div class="gallery-main">
            <img v-if="product.image" :src="product.image" :alt="product.title" @error="$event.target.style.display='none'">
            <div v-else class="gallery-placeholder">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <path d="M21 15l-5-5L5 21"/>
              </svg>
            </div>
          </div>
        </div>
        
        <div class="product-info">
          <div class="product-meta">
            <span class="product-category">{{ getCategoryName(product.category) }}</span>
            <span class="product-stock" :class="{ available: product.stock > 0 }">
              {{ product.stock > 0 ? 'В наличии' : 'Нет в наличии' }}
            </span>
          </div>
          
          <h1 class="product-title">{{ product.title }}</h1>
          
          <div class="product-price-block">
            <span class="product-price">{{ product.price }}</span>
            <span class="product-currency">₽</span>
            <span class="price-unit">/ уп.</span>
          </div>
          
          <div class="product-description">
            <h3>Описание</h3>
            <p>{{ product.description }}</p>
          </div>
          
          <div class="product-specs" v-if="product.specs">
            <h3>Характеристики</h3>
            <div class="specs-grid">
              <div class="spec-item" v-for="(value, key) in product.specs" :key="key">
                <span class="spec-label">{{ key }}</span>
                <span class="spec-value">{{ value }}</span>
              </div>
            </div>
          </div>
          
          <div class="product-actions">
            <div class="quantity-selector">
              <button @click="decreaseQty" :disabled="quantity <= 1">−</button>
              <span>{{ quantity }}</span>
              <button @click="quantity++">+</button>
            </div>
            <button class="btn btn-primary btn-add-cart" @click="addToCart" :disabled="product.stock <= 0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
              Добавить в корзину
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
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useProductStore } from '../store/products'
import { useCartStore } from '../store/cart'
import Loader from '../components/Loader.vue'

const route = useRoute()
const productStore = useProductStore()
const cartStore = useCartStore()

const quantity = ref(1)
const loading = ref(true)

const product = computed(() => {
  return productStore.products.find(p => p.id == route.params.id) || null
})

function getCategoryName(slug) {
  if (!slug || !slug.length) return ''
  const cat = productStore.categories.find(c => c.slug === slug[0])
  return cat ? cat.name : slug
}

function decreaseQty() {
  if (quantity.value > 1) quantity.value--
}

function addToCart() {
  if (product.value) {
    for (let i = 0; i < quantity.value; i++) {
      cartStore.addItem(product.value)
    }
  }
}

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
}

.gallery-main img {
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
  font-family: var(--font-display);
  font-size: 2rem;
  font-weight: 800;
  line-height: 1.2;
  margin-bottom: 1.5rem;
}

.product-price-block {
  display: flex;
  align-items: baseline;
  gap: 0.25rem;
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid var(--border);
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
}

.product-specs {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
}

.specs-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.spec-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.spec-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
}

.spec-value {
  font-weight: 600;
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
}

@media (max-width: 640px) {
  .product-detail {
    padding: 1rem 0 2rem;
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
  .product-specs h3 {
    font-size: 0.875rem;
    margin-bottom: 0.75rem;
  }

  .product-description p {
    font-size: 0.875rem;
    line-height: 1.6;
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