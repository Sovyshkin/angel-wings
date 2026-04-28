<template>
  <div class="orders-page">
    <div class="page-header">
      <div>
        <h1 class="page-title" style="font-size: 1.75rem; margin-bottom: 0.25rem;">Заказы</h1>
        <p class="page-subtitle">Управление заказами</p>
      </div>
      <select v-model="filterStatus" @change="fetchOrders" class="input status-filter">
        <option value="">Все статусы</option>
        <option value="PENDING">Ожидает</option>
        <option value="PROCESSING">В обработке</option>
        <option value="SHIPPED">Отправлен</option>
        <option value="DELIVERED">Доставлен</option>
        <option value="CANCELLED">Отменён</option>
      </select>
    </div>
    
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
    </div>
    
    <div v-else class="card">
      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Клиент</th>
            <th>Email</th>
            <th>Товары</th>
            <th>Сумма</th>
            <th>Статус</th>
            <th>Дата</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in orders" :key="order.id">
            <td class="cell-id">#{{ order.id }}</td>
            <td class="cell-customer">{{ order.customerName }}</td>
            <td class="cell-email">{{ order.customerEmail }}</td>
            <td class="cell-items">{{ order.items?.length || 0 }} шт</td>
            <td class="cell-price">{{ formatPrice(order.total) }}</td>
            <td>
              <select :value="order.status" @change="updateStatus(order.id, $event.target.value)" class="status-select">
                <option value="PENDING">Ожидает</option>
                <option value="PROCESSING">В обработке</option>
                <option value="SHIPPED">Отправлен</option>
                <option value="DELIVERED">Доставлен</option>
                <option value="CANCELLED">Отменён</option>
              </select>
            </td>
            <td class="cell-date">{{ formatDate(order.createdAt) }}</td>
            <td>
              <button @click="viewOrder(order)" class="action-btn" title="Просмотр">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                </svg>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <div v-if="selectedOrder" class="modal-overlay" @click.self="selectedOrder = null">
      <div class="modal card">
        <div class="modal-header">
          <h3 class="modal-title">Заказ #{{ selectedOrder.id }}</h3>
          <button @click="selectedOrder = null" class="modal-close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        
        <div class="order-details">
          <div class="detail-row">
            <span class="detail-label">Клиент</span>
            <span class="detail-value">{{ selectedOrder.customerName }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Email</span>
            <span class="detail-value">{{ selectedOrder.customerEmail }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Телефон</span>
            <span class="detail-value">{{ selectedOrder.customerPhone }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Адрес</span>
            <span class="detail-value">{{ selectedOrder.shippingAddress || '—' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Статус</span>
            <span :class="['badge', getStatusBadge(selectedOrder.status)]">{{ getStatusLabel(selectedOrder.status) }}</span>
          </div>
          
          <div class="order-items">
            <h4>Товары:</h4>
            <div v-for="item in selectedOrder.items" :key="item.id" class="order-item-row">
              <span>{{ item.product?.title || 'Товар #' + item.productId }}</span>
              <span class="item-qty">{{ item.quantity }} × {{ formatPrice(item.price) }}</span>
            </div>
          </div>
          
          <div class="order-total">
            <span>Итого</span>
            <span class="total-value">{{ formatPrice(selectedOrder.total) }}</span>
          </div>
        </div>
        
        <button @click="selectedOrder = null" class="btn btn-secondary btn-full">Закрыть</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const API_URL = '/api/admin'

const orders = ref([])
const loading = ref(true)
const filterStatus = ref('')
const selectedOrder = ref(null)

async function fetchOrders() {
  loading.value = true
  try {
    const params = filterStatus.value ? { status: filterStatus.value } : {}
    const { data } = await axios.get(`${API_URL}/orders`, { params })
    orders.value = data.orders
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function updateStatus(id, status) {
  try {
    await axios.put(`${API_URL}/orders/${id}/status`, { status })
    const order = orders.value.find(o => o.id === id)
    if (order) order.status = status
  } catch (e) {
    alert('Ошибка обновления статуса')
  }
}

function viewOrder(order) {
  selectedOrder.value = order
}

function formatPrice(val) {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 0 }).format(val)
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('ru-RU')
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

onMounted(fetchOrders)
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
}

.status-filter {
  padding: 0.625rem 1rem;
  min-width: 180px;
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

.cell-customer {
  font-weight: 600;
}

.cell-email {
  color: var(--text-secondary);
  font-size: 0.9375rem;
}

.cell-price {
  font-weight: 600;
}

.cell-date {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.status-select {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  padding: 0.5rem 0.75rem;
  border-radius: var(--radius-sm);
  color: inherit;
  cursor: pointer;
  font-size: 0.8125rem;
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

@keyframes spin {
  to { transform: rotate(360deg); }
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal {
  width: 100%;
  max-width: 500px;
  padding: 2rem;
  animation: modalIn 0.3s ease;
}

@keyframes modalIn {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.modal-title {
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 700;
}

.modal-close {
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

.modal-close:hover {
  background: var(--danger);
  color: white;
}

.order-details {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--border);
}

.detail-label {
  color: var(--text-secondary);
  font-size: 0.9375rem;
}

.detail-value {
  font-weight: 500;
}

.order-items {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border);
}

.order-items h4 {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 0.75rem;
}

.order-item-row {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  font-size: 0.9375rem;
}

.item-qty {
  color: var(--text-secondary);
}

.order-total {
  display: flex;
  justify-content: space-between;
  padding: 1rem;
  margin-top: 1rem;
  background: var(--bg-secondary);
  border-radius: var(--radius-sm);
  font-size: 1.125rem;
}

.total-value {
  font-family: var(--font-display);
  font-weight: 700;
  color: var(--accent);
}

.btn-full {
  width: 100%;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 1rem;
  }
  
  .status-filter {
    width: 100%;
  }
  
  .data-table {
    font-size: 0.875rem;
  }
  
  .data-table th,
  .data-table td {
    padding: 0.75rem;
  }
}
</style>