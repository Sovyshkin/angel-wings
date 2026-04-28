<template>
  <div class="products-page">
    <div class="page-header">
      <div>
        <h1 class="page-title" style="font-size: 1.75rem; margin-bottom: 0.25rem;">Товары</h1>
        <p class="page-subtitle">Управление каталогом товаров</p>
      </div>
      <router-link to="/admin/products/new" class="btn btn-primary">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Добавить товар
      </router-link>
    </div>
    
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
    </div>
    
    <div v-else-if="error" class="error-message">{{ error }}</div>
    
    <div v-else class="card">
      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Название</th>
            <th>Категория</th>
            <th>Цена</th>
            <th>Stock</th>
            <th>Статус</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="product in products" :key="product.id">
            <td class="cell-id">{{ product.id }}</td>
            <td>
              <div class="product-cell">
                <img v-if="product.image" :src="product.image" :alt="product.title" class="product-thumb">
                <span class="product-title">{{ product.title }}</span>
              </div>
            </td>
            <td class="cell-category">
              {{ product.categories?.map(c => c.name).join(', ') || '—' }}
            </td>
            <td class="cell-price">{{ formatPrice(product.price) }}</td>
            <td :class="['cell-stock', { low: product.stock <= 10 }]">{{ product.stock }}</td>
            <td>
              <span :class="['badge', product.active ? 'badge-success' : 'badge-danger']">
                {{ product.active ? 'Активен' : 'Скрыт' }}
              </span>
            </td>
            <td class="cell-actions">
              <div class="actions-wrapper">
                <router-link :to="`/admin/products/${product.id}/edit`" class="action-btn" title="Редактировать">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </router-link>
                <button @click="deleteProduct(product.id)" class="action-btn danger" title="Удалить">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      
      <div v-if="products.length === 0" class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
        </svg>
        <span>Нет товаров</span>
        <router-link to="/admin/products/new" class="btn btn-primary btn-sm">Добавить первый</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const API_URL = '/api/admin/products'

const products = ref([])
const loading = ref(true)
const error = ref('')

async function fetchProducts() {
  try {
    const { data } = await axios.get(API_URL)
    products.value = data.products
  } catch (e) {
    error.value = 'Ошибка загрузки товаров'
  } finally {
    loading.value = false
  }
}

async function deleteProduct(id) {
  if (!confirm('Удалить этот товар?')) return
  try {
    await axios.delete(`${API_URL}/${id}`)
    products.value = products.value.filter(p => p.id !== id)
  } catch (e) {
    alert('Ошибка удаления')
  }
}

function formatPrice(val) {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 0 }).format(val)
}

onMounted(fetchProducts)
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 1rem 1.25rem;
  text-align: left;
  border-bottom: 1px solid var(--border);
}

.data-table th {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-secondary);
  background: var(--bg-secondary);
}

.data-table tr:last-child td {
  border-bottom: none;
}

.data-table tr:hover td {
  background: var(--bg-hover);
}

.cell-id {
  font-family: var(--font-body);
  font-size: 0.8125rem;
  color: var(--text-muted);
}

.product-cell {
  display: flex;
  align-items: center;
  gap: 0.875rem;
}

.product-thumb {
  width: 44px;
  height: 44px;
  object-fit: cover;
  border-radius: var(--radius-sm);
  background: var(--bg-secondary);
}

.product-title {
  font-weight: 600;
}

.cell-category {
  color: var(--text-secondary);
  font-size: 0.9375rem;
}

.cell-price {
  font-weight: 600;
}

.cell-stock {
  font-family: var(--font-body);
}

.cell-stock.low {
  color: var(--danger);
  font-weight: 600;
}

.badge {
  display: inline-block;
  padding: 0.25rem 0.625rem;
  border-radius: 20px;
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.badge-success { background: #22c55e22; color: #22c55e; }
.badge-danger { background: #ef444422; color: #ef4444; }

.cell-actions {
  width: 90px;
}

.actions-wrapper {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  transition: var(--transition);
}

.action-btn:hover {
  background: var(--accent);
  color: #fff;
}

.action-btn.danger:hover {
  background: var(--danger);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 4rem;
  color: var(--text-muted);
}

.loading-state {
  display: flex;
  justify-content: center;
  padding: 4rem;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.error-message {
  background: var(--danger);
  color: white;
  padding: 1rem;
  border-radius: var(--radius-sm);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 1rem;
  }
  
  .data-table th,
  .data-table td {
    padding: 0.75rem 1rem;
  }
}
</style>