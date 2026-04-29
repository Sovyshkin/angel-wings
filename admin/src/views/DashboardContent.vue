<template>
  <div class="dashboard">
    <div class="page-header">
      <div>
        <h1 class="page-title" style="font-size: 1.75rem; margin-bottom: 0.25rem;">Панель управления</h1>
        <p class="page-subtitle">Обзор активности магазина</p>
      </div>
    </div>
    
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <span>Загрузка...</span>
    </div>
    
    <template v-else>
      <div class="stats-grid">
        <div class="stat-card card hover-lift">
          <div class="stat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ stats.usersCount || 0 }}</span>
            <span class="stat-label">Пользователи</span>
          </div>
        </div>
        
        <div class="stat-card card hover-lift">
          <div class="stat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ stats.productsCount || 0 }}</span>
            <span class="stat-label">Товары</span>
          </div>
        </div>
        
        <div class="stat-card card hover-lift">
          <div class="stat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ stats.ordersCount || 0 }}</span>
            <span class="stat-label">Заказы</span>
          </div>
        </div>
        
        <div class="stat-card card hover-lift">
          <div class="stat-icon accent">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ formatPrice(stats.totalRevenue) }}</span>
            <span class="stat-label">Выручка</span>
          </div>
        </div>
      </div>
      
      <div class="dashboard-grid">
        <div class="card dashboard-card">
          <h3 class="card-title">Последние заказы</h3>
          <div v-if="stats.recentOrders?.length" class="orders-list">
            <div v-for="order in stats.recentOrders" :key="order.id" class="order-item">
              <div class="order-info">
                <span class="order-id">#{{ order.id }}</span>
                <span class="order-customer">{{ order.customerName }}</span>
              </div>
              <div class="order-meta">
                <span class="order-total">{{ formatPrice(order.total) }}</span>
                <span :class="['badge', getStatusBadge(order.status)]">{{ getStatusLabel(order.status) }}</span>
              </div>
            </div>
          </div>
          <div v-else class="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            <span>Нет заказов</span>
          </div>
        </div>
        
        <div class="card dashboard-card">
          <h3 class="card-title">Заканчивается товар</h3>
          <div v-if="stats.lowStock?.length" class="stock-list">
            <div v-for="item in stats.lowStock" :key="item.id" class="stock-item">
              <span class="stock-name">{{ item.title }}</span>
              <span :class="['stock-count', { critical: item.stock <= 5 }]">{{ item.stock }} шт</span>
            </div>
          </div>
          <div v-else class="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <span>Все товары в наличии</span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const API_URL = '/api/admin'

const loading = ref(true)
const stats = ref({})

async function fetchStats() {
  try {
    const { data } = await axios.get(`${API_URL}/stats`)
    stats.value = data.stats
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function formatPrice(val) {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 0 }).format(val || 0)
}

function getStatusBadge(status) {
  const badges = {
    PENDING: 'badge-warning',
    PROCESSING: 'badge-info',
    SHIPPED: 'badge-info',
    DELIVERED: 'badge-success',
    CANCELLED: 'badge-danger'
  }
  return badges[status] || 'badge-info'
}

function getStatusLabel(status) {
  const labels = {
    PENDING: 'Ожидает',
    PROCESSING: 'В обработке',
    SHIPPED: 'Отправлен',
    DELIVERED: 'Доставлен',
    CANCELLED: 'Отменён'
  }
  return labels[status] || status
}

onMounted(fetchStats)
</script>

<style scoped>
.page-header {
  margin-bottom: 2rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
}

.stat-icon {
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent-dim);
  border-radius: var(--radius-sm);
  color: var(--accent);
  flex-shrink: 0;
}

.stat-icon.accent {
  background: var(--accent);
  color: #fff;
}

.stat-value {
  display: block;
  font-family: var(--font-body);
  font-size: 1.75rem;
  font-weight: 700;
  line-height: 1.2;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 1.5rem;
}

.dashboard-card {
  padding: 1.5rem;
}

.card-title {
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 1.25rem;
  color: var(--text-secondary);
}

.orders-list, .stock-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.order-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.875rem 1rem;
  background: var(--bg-secondary);
  border-radius: var(--radius-sm);
  transition: var(--transition);
}

.order-item:hover {
  background: var(--bg-hover);
}

.order-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.order-id {
  font-family: var(--font-body);
  font-size: 0.75rem;
  color: var(--text-muted);
}

.order-customer {
  font-weight: 600;
  font-size: 0.9375rem;
}

.order-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
}

.order-total {
  font-weight: 600;
  font-size: 0.9375rem;
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
.badge-warning { background: #f59e0b22; color: #f59e0b; }
.badge-danger { background: #ef444422; color: #ef4444; }
.badge-info { background: var(--accent-dim); color: var(--accent); }

.stock-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: var(--bg-secondary);
  border-radius: var(--radius-sm);
}

.stock-name {
  font-size: 0.9375rem;
  font-weight: 500;
}

.stock-count {
  font-family: var(--font-body);
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.stock-count.critical {
  color: var(--danger);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 3rem;
  color: var(--text-muted);
  text-align: center;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 4rem;
  color: var(--text-secondary);
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 1024px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  .stat-card {
    flex-direction: column;
    align-items: flex-start;
    padding: 1.25rem;
    gap: 0.75rem;
  }

  .stat-icon {
    width: 44px;
    height: 44px;
  }

  .stat-value {
    font-size: 1.5rem;
  }

  .page-header {
    margin-bottom: 1.5rem;
  }

  .page-title {
    font-size: 1.5rem !important;
  }

  .dashboard-card {
    padding: 1.25rem;
  }

  .card-title {
    font-size: 0.875rem;
    margin-bottom: 1rem;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .stat-card {
    flex-direction: row;
    justify-content: space-between;
  }

  .stat-content {
    text-align: right;
  }
}
</style>