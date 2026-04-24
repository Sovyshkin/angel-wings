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
        <aside class="sidebar" data-aos="fade-right" data-aos-delay="100">
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
                :key="cat.term_id"
                class="filter-item"
                :class="{ active: selectedCategory === cat.slug }"
                @click="selectCategory(cat.slug)"
              >
                <span class="filter-icon">{{ getCategoryIcon(cat.slug) }}</span>
                {{ cat.name }}
                <span class="filter-count">{{ getCategoryCount(cat.slug) }}</span>
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
        
        <div class="catalog__main">
          <div class="catalog__bar">
            <div class="results-count">
              <span>{{ filteredProducts.length }}</span> товаров
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
              :data-aos="'fade-up'"
              :data-aos-delay="100 + index * 50"
            >
              <div class="product-image">
                <img v-if="product.image" :src="product.image" :alt="product.title" @error="handleImageError">
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
                <span class="product-category-badge">{{ getCategoryName(product.category[0]) }}</span>
                <h3 class="product-title">{{ product.title }}</h3>
                <p class="product-desc">{{ truncate(product.description, 100) }}</p>
                <div class="product-footer">
                  <div class="product-price">
                    <span class="price-value">{{ product.price.toLocaleString() }}</span>
                    <span class="price-currency">₽</span>
                  </div>
                  <button 
                    class="add-to-cart-btn"
                    @click.prevent="cartStore.addItem(product)"
                    :disabled="!product.stock"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M12 5v14M5 12h14"/>
                    </svg>
                  </button>
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

const route = useRoute()
const productStore = useProductStore()
const cartStore = useCartStore()

const selectedCategory = ref(null)
const sortBy = ref('default')
const priceMin = ref(null)
const priceMax = ref(null)
const loading = ref(false)

const products = computed(() => productStore.products)
const categories = computed(() => productStore.categories)

const filteredProducts = computed(() => {
  let result = [...products.value]
  
  if (selectedCategory.value) {
    result = result.filter(p => p.category.includes(selectedCategory.value))
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

function selectCategory(slug) {
  selectedCategory.value = slug
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function resetFilters() {
  selectedCategory.value = null
  priceMin.value = null
  priceMax.value = null
  sortBy.value = 'default'
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function getCategoryIcon(slug) {
  const icons = {
    'longevitiya': '∞',
    'immunomodulyatory': '🛡',
    'neiropeptide': '🧠',
    'growth': '⚡'
  }
  return icons[slug] || '◆'
}

function getCategoryName(slug) {
  if (!slug) return ''
  const cat = categories.value.find(c => c.slug === slug)
  return cat ? cat.name : slug
}

function getCategoryCount(slug) {
  return products.value.filter(p => p.category.includes(slug)).length
}

function truncate(text, length) {
  if (!text) return ''
  return text.length > length ? text.substring(0, length) + '...' : text
}

function handleImageError(e) {
  e.target.style.display = 'none'
}

onMounted(async () => {
  loading.value = true
  await productStore.fetchProducts()
  await productStore.fetchCategories()
  loading.value = false
  
  if (route.query.category) {
    selectedCategory.value = route.query.category
  }
})

watch(() => route.query.category, (newCat) => {
  selectedCategory.value = newCat || null
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
  border-color: rgba(163, 255, 18, 0.2);
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
}

.filter-item.active .filter-icon {
  background: var(--accent);
  color: var(--bg-primary);
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
  border-color: rgba(163, 255, 18, 0.3);
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
  margin-bottom: 0.75rem;
}

.product-title {
  font-family: var(--font-display);
  font-size: 1.125rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  line-height: 1.3;
}

.product-desc {
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 1.25rem;
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

.add-to-cart-btn {
  width: 40px;
  height: 40px;
  display: flex;
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

@keyframes spin {
  to { transform: rotate(360deg); }
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
    min-width: calc(50% - 0.25rem);
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
</style>