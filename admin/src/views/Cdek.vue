<template>
  <div class="cdek-page">
    <div class="page-header">
      <h1>Управление СДЭК</h1>
      <div class="header-actions">
        <button class="btn btn-secondary" @click="loadBalance">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
          </svg>
          Обновить баланс
        </button>
        <button class="btn btn-primary" @click="showCreateOrderModal = true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Создать заказ
        </button>
      </div>
    </div>

    <!-- Tabs -->
    <div class="tabs">
      <button class="tab" :class="{ active: activeTab === 'orders' }" @click="activeTab = 'orders'">Заказы</button>
      <button class="tab" :class="{ active: activeTab === 'pickup' }" @click="activeTab = 'pickup'">ПВЗ</button>
      <button class="tab" :class="{ active: activeTab === 'tariffs' }" @click="activeTab = 'tariffs'">Тарифы</button>
    </div>

    <!-- Balance Info -->
    <div v-if="balance" class="balance-card">
      <div class="balance-icon">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
        </svg>
      </div>
      <div class="balance-info">
        <span class="balance-label">Баланс</span>
        <span class="balance-value">{{ balance.balance?.toFixed(2) || '0.00' }} ₽</span>
      </div>
      <div class="balance-orders">
        <span>Заказов в работе: {{ balance.orders_balance || 0 }}</span>
      </div>
    </div>

    <!-- Tab Content: Orders -->
    <div v-show="activeTab === 'orders'" class="tab-content">
      <div class="search-bar">
        <input 
          v-model="orderSearch" 
          type="text" 
          class="input" 
          placeholder="Номер заказа..."
        >
        <button class="btn btn-secondary" @click="searchOrders">Поиск</button>
      </div>

      <div v-if="loading" class="loading">
        <span class="spinner"></span> Загрузка...
      </div>

      <div v-else-if="cdekOrders.length > 0" class="orders-list">
        <div v-for="order in cdekOrders" :key="order.uuid" class="order-card">
          <div class="order-header">
            <div class="order-main">
              <span class="order-number">{{ formatOrderNumber(order.number) }}</span>
              <span class="order-uuid">UUID: {{ order.uuid }}</span>
            </div>
            <span :class="['status-badge', getStatusClass(order.status)]">
              {{ getStatusText(order.status) }}
            </span>
          </div>
          <div class="order-details">
            <div class="detail">
              <span class="label">Статус API:</span>
              <span class="value value--status">{{ order.status || '—' }}</span>
            </div>
            <div class="detail">
              <span class="label">Тариф:</span>
              <span class="value">{{ order.tariff_code }}</span>
            </div>
            <div v-if="order.entity" class="detail">
              <span class="label">Получатель:</span>
              <span class="value">{{ order.entity?.recipient?.name || '—' }}</span>
            </div>
          </div>
          <div class="order-actions">
            <button class="btn btn-sm btn-secondary" @click="viewOrder(order.uuid)">
              Подробнее
            </button>
            <button class="btn btn-sm btn-primary" :disabled="syncingUuid === order.uuid" @click="syncOrderStatus(order.uuid)">
              {{ syncingUuid === order.uuid ? 'Синхронизация...' : 'Синхронизировать статус' }}
            </button>
            <button class="btn btn-sm btn-danger" @click="cancelOrder(order.uuid)">
              Отменить
            </button>
          </div>
        </div>
      </div>
      <div v-else class="empty-state">
        <p>Нет заказов СДЭК</p>
        <button class="btn btn-primary" @click="showCreateOrderModal = true">
          Создать первый заказ
        </button>
      </div>
    </div>

    <!-- Tab Content: Pickup Points -->
    <div v-show="activeTab === 'pickup'" class="tab-content">
      <div class="search-bar">
        <input 
          v-model="citySearch" 
          type="text" 
          class="input" 
          placeholder="Введите название города..."
          @keyup.enter="searchCityAndLoadPickup"
        >
        <button class="btn btn-secondary" @click="searchCityAndLoadPickup" :disabled="pickupLoading">
          Найти ПВЗ
        </button>
      </div>

      <div v-if="pickupLoading" class="loading">
        <span class="spinner"></span> Поиск...
      </div>

      <div v-else-if="pickupPoints.length > 0" class="pickup-list">
        <p class="found-count">Найдено ПВЗ: {{ pickupPoints.length }} в г. {{ foundCityName }}</p>
        <div v-for="point in pickupPoints" :key="point.code" class="pickup-card">
          <div class="pickup-header">
            <strong>{{ point.name }}</strong>
            <span class="point-code">{{ point.code }}</span>
          </div>
          <div class="pickup-address">{{ point.address }}</div>
          <div v-if="point.work_time" class="pickup-time">{{ point.work_time }}</div>
        </div>
      </div>
    </div>

    <!-- Tab Content: Tariffs -->
    <div v-show="activeTab === 'tariffs'" class="tab-content">
      <div v-if="tariffLoading" class="loading">
        <span class="spinner"></span> Загрузка тарифов...
      </div>
      <div v-else-if="tariffs.length > 0" class="tariffs-list">
        <div v-for="tariff in tariffs" :key="tariff.id" class="tariff-card">
          <div class="tariff-header">
            <strong>{{ tariff.id }}</strong>
            <span>{{ tariff.description || tariff.name }}</span>
          </div>
          <div class="tariff-modes">
            <span :class="['mode-badge', tariff.delivery_mode === 1 ? 'pickup' : 'door']">
              {{ tariff.delivery_mode === 1 ? 'Склад-Склад' : 'Дверь' }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Order Modal -->
    <div v-if="showCreateOrderModal" class="modal-overlay" @click.self="showCreateOrderModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3>Создать заказ СДЭК</h3>
          <button class="close-btn" @click="showCreateOrderModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Номер заказа</label>
            <input v-model="newOrder.number" type="text" class="input" placeholder="order-123">
          </div>
          <div class="form-group">
            <label>Код тарифа</label>
            <select v-model="newOrder.tariff_code" class="input">
              <option value="136">136 - Экспресс лайт склад-склад</option>
              <option value="137">137 - Экспресс лайт склад-дверь</option>
              <option value="138">138 - Экспресс лайт дверь-дверь</option>
              <option value="1">1 - Экономичный склад-склад</option>
              <option value="3">3 - Экономичный дверь-склад</option>
            </select>
          </div>
          <div class="form-group">
            <label>Город (код)</label>
            <input v-model="newOrder.to_code" type="text" class="input" placeholder="44">
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>ФИО получателя</label>
              <input v-model="newOrder.recipient_name" type="text" class="input" placeholder="Иванов Иван">
            </div>
            <div class="form-group">
              <label>Телефон</label>
              <input v-model="newOrder.recipient_phone" type="text" class="input" placeholder="+79001234567">
            </div>
          </div>
          <div class="form-group">
            <label>Email</label>
            <input v-model="newOrder.recipient_email" type="email" class="input" placeholder="email@example.com">
          </div>
          <div class="form-group">
            <label>Вес (г)</label>
            <input v-model="newOrder.weight" type="number" class="input" placeholder="500">
          </div>
          <div class="form-group">
            <label>Адрес</label>
            <textarea v-model="newOrder.address" class="input" rows="2"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showCreateOrderModal = false">Отмена</button>
          <button class="btn btn-primary" @click="createOrder" :disabled="creating">
            {{ creating ? 'Создание...' : 'Создать заказ' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Order Details Modal -->
    <div v-if="showOrderDetailsModal" class="modal-overlay" @click.self="closeOrderDetails">
      <div class="modal details-modal">
        <div class="modal-header">
          <h3>Заказ СДЭК {{ orderDetails?.entity?.number || selectedOrderUuid || '' }}</h3>
          <button class="close-btn" @click="closeOrderDetails">×</button>
        </div>
        <div class="modal-body">
          <div v-if="orderDetailsLoading" class="loading">
            <span class="spinner"></span> Загружаем детали...
          </div>

          <div v-else-if="orderDetails" class="details-layout">
            <div class="detail-block detail-block--hero">
              <div>
                <div class="detail-block__label">Текущий статус</div>
                <div class="detail-block__value detail-block__value--status">
                  {{ getStatusText(getCurrentStatus(orderDetails)) }}
                </div>
                <div class="detail-block__sub">
                  Код: {{ (getCurrentStatus(orderDetails) || '—').toString().toUpperCase() }}
                </div>
              </div>
              <div>
                <div class="detail-block__label">UUID</div>
                <div class="detail-block__value detail-block__value--mono">{{ selectedOrderUuid || '—' }}</div>
              </div>
            </div>

            <div class="detail-grid">
              <div class="detail-block">
                <div class="detail-block__label">Получатель</div>
                <div class="detail-block__value">{{ orderDetails?.entity?.recipient?.name || '—' }}</div>
                <div class="detail-block__sub">{{ orderDetails?.entity?.recipient?.phones?.[0]?.number || '—' }}</div>
                <div class="detail-block__sub">{{ orderDetails?.entity?.recipient?.email || '—' }}</div>
              </div>
              <div class="detail-block">
                <div class="detail-block__label">Доставка</div>
                <div class="detail-block__value">{{ orderDetails?.entity?.tariff_code || '—' }}</div>
                <div class="detail-block__sub">ПВЗ: {{ orderDetails?.entity?.delivery_point || '—' }}</div>
                <div class="detail-block__sub">Город код: {{ orderDetails?.entity?.to_location?.code || '—' }}</div>
              </div>
            </div>

            <div class="detail-block">
              <div class="detail-block__label">Посылки</div>
              <div v-if="orderDetails?.entity?.packages?.length" class="packages-list">
                <div v-for="pkg in orderDetails.entity.packages" :key="pkg.number || pkg.barcode" class="package-row">
                  <div>
                    <strong>{{ pkg.number || 'Без номера' }}</strong>
                    <div class="detail-block__sub">Вес: {{ pkg.weight || 0 }} г</div>
                  </div>
                  <div class="detail-block__sub">
                    Габариты: {{ pkg.length || 0 }}×{{ pkg.width || 0 }}×{{ pkg.height || 0 }}
                  </div>
                </div>
              </div>
              <div v-else class="detail-block__sub">Данные по посылкам отсутствуют</div>
            </div>

              <div class="detail-block">
              <div class="detail-block__label">История статусов</div>
              <div v-if="getSortedStatuses(orderDetails).length" class="timeline">
                <div v-for="(s, idx) in getSortedStatuses(orderDetails)" :key="`${s.code}-${idx}`" class="timeline-row">
                  <span class="timeline-dot"></span>
                  <div class="timeline-content">
                    <div class="timeline-top">
                      <strong>{{ getStatusText(s.code || s.name) }}</strong>
                      <span class="timeline-code">{{ (s.code || s.name || '—').toString().toUpperCase() }}</span>
                    </div>
                    <div class="timeline-date">{{ formatDateTime(s.date_time || s.date) }}</div>
                    <div v-if="s.city || s.office || s.reason" class="timeline-note">
                      {{ [s.city, s.office, s.reason].filter(Boolean).join(' • ') }}
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="detail-block__sub">История статусов пока не передана API СДЭК</div>
            </div>
          </div>

          <div v-else class="empty-state">
            <p>Не удалось загрузить детали заказа</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import axios from 'axios'
import deliveryApi from '../api/delivery'

// Global axios error handler - prevents crashes on API errors
axios.interceptors.response.use(
  response => response,
  error => {
    console.warn('API error:', error.response?.status, error.config?.url)
    return Promise.resolve({ data: null, error: true })
  }
)

const activeTab = ref('orders')

// Watch for tab changes
watch(activeTab, (newTab) => {
  if (newTab === 'tariffs' && tariffs.value.length === 0) {
    loadTariffs()
  }
})
const loading = ref(false)
const cityLoading = ref(false)
const pickupLoading = ref(false)
const tariffLoading = ref(false)
const creating = ref(false)
const syncingUuid = ref('')

// Data
const balance = ref(null)
const cdekOrders = ref([])
const cityResults = ref([])
const pickupPoints = ref([])
const tariffs = ref([])

// Search
const orderSearch = ref('')
const citySearch = ref('')
const foundCityName = ref('')
const foundCityCode = ref('')

// Modal
const showCreateOrderModal = ref(false)
const showOrderDetailsModal = ref(false)
const orderDetailsLoading = ref(false)
const selectedOrderUuid = ref('')
const orderDetails = ref(null)
const newOrder = ref({
  number: '',
  tariff_code: 136,
  to_code: '',
  recipient_name: '',
  recipient_phone: '',
  recipient_email: '',
  weight: 500,
  address: ''
})

const STATUS_LABELS = {
  PROCESSING: 'В обработке',
  CREATED: 'Создан',
  ACCEPTED: 'Принят',
  NEW: 'Новый',
  SHIPPED: 'В пути',
  IN_TRANSIT: 'В пути',
  ON_WAREHOUSE: 'На складе',
  AT_PICKUP: 'В пункте выдачи',
  READY_FOR_PICKUP: 'Готов к выдаче',
  DELIVERED: 'Доставлен',
  CANCELLED: 'Отменён',
  NOT_DELIVERED: 'Не доставлен',
  RETURNED: 'Возврат',
  INVALID: 'Ошибка данных'
}

// Load balance
async function loadBalance() {
  try {
    const res = await deliveryApi.get('/balance')
    if (res.data) {
      balance.value = res.data
    }
  } catch (e) {
    console.error('Balance error:', e)
  }
}

// Load orders
async function loadOrders() {
  loading.value = true
  try {
    const res = await deliveryApi.get('/orders')
    if (res.data) {
      cdekOrders.value = Array.isArray(res.data) ? res.data : (res.data.entity ? [res.data.entity] : [])
    }
  } catch (e) {
    console.error('Orders error:', e)
    cdekOrders.value = []
  } finally {
    loading.value = false
  }
}

// Search orders
async function searchOrders() {
  if (!orderSearch.value) {
    loadOrders()
    return
  }
  loading.value = true
  try {
    const { data } = await deliveryApi.get(`/orders?order_number=${orderSearch.value}`)
    cdekOrders.value = Array.isArray(data) ? data : (data.entity ? [data.entity] : [])
  } catch (e) {
    console.error('Search error:', e)
  } finally {
    loading.value = false
  }
}

// View order details
async function viewOrder(uuid) {
  selectedOrderUuid.value = uuid
  showOrderDetailsModal.value = true
  orderDetailsLoading.value = true
  orderDetails.value = null

  try {
    const { data } = await deliveryApi.get(`/orders/${uuid}`)
    orderDetails.value = data || null
  } catch (e) {
    console.error('View order error:', e)
    orderDetails.value = null
  } finally {
    orderDetailsLoading.value = false
  }
}

function closeOrderDetails() {
  showOrderDetailsModal.value = false
  orderDetails.value = null
  orderDetailsLoading.value = false
  selectedOrderUuid.value = ''
}

// Cancel order
async function cancelOrder(uuid) {
  if (!confirm('Отменить заказ?')) return
  try {
    const { data } = await deliveryApi.post(`/orders/${uuid}/cancel`)
    alert('Заказ отменён')
    loadOrders()
  } catch (e) {
    console.error('Cancel error:', e)
    alert('Ошибка при отмене заказа')
  }
}

// Sync local order status by CDEK uuid
async function syncOrderStatus(uuid) {
  if (!uuid) return
  syncingUuid.value = uuid
  try {
    const { data } = await deliveryApi.post(`/orders/${uuid}/sync-status`)
    if (data?.success) {
      const cdekInfo = data.cdekStatusCode ? ` (СДЭК: ${data.cdekStatusCode})` : ''
      const updatedInfo = data.updated ? 'обновлён' : 'уже актуален'
      alert(`Статус ${updatedInfo}: ${data.localStatus}${cdekInfo}`)
      await loadOrders()
    }
  } catch (e) {
    console.error('Sync order status error:', e)
    alert('Не удалось синхронизировать статус заказа')
  } finally {
    syncingUuid.value = ''
  }
}

// City search with debounce
let cityTimeout = null
function onCitySearch() {
  if (cityTimeout) clearTimeout(cityTimeout)
  if (citySearch.value.length < 4) {
    cityResults.value = []
    return
  }
  cityTimeout = setTimeout(async () => {
    cityLoading.value = true
    try {
      const { data } = await deliveryApi.post('/find-city', { name: citySearch.value })
      cityResults.value = Array.isArray(data) ? data : []
    } catch (e) {
      console.error('City search error:', e)
      cityResults.value = []
    } finally {
      cityLoading.value = false
    }
  }, 500)
}

// Load pickup points by city code
async function loadPickupPoints(cityCode) {
  pickupLoading.value = true
  try {
    const res = await deliveryApi.get(`/pickup-points?city_code=${cityCode}&limit=50`)
    if (res.data) {
      pickupPoints.value = Array.isArray(res.data) ? res.data : []
    }
  } catch (e) {
    console.error('Pickup points error:', e)
    pickupPoints.value = []
  } finally {
    pickupLoading.value = false
  }
}

// Search city and load pickup points
async function searchCityAndLoadPickup() {
  if (!citySearch.value || citySearch.value.length < 3) return
  pickupLoading.value = true
  pickupPoints.value = []
  foundCityName.value = ''
  foundCityCode.value = ''
  
  try {
    const res = await deliveryApi.post('/find-city', { name: citySearch.value })
    if (res.data && Array.isArray(res.data) && res.data.length > 0) {
      const city = res.data[0]
      foundCityName.value = city.city
      foundCityCode.value = city.code
      await loadPickupPoints(city.code)
    }
  } catch (e) {
    console.error('City search error:', e)
  } finally {
    pickupLoading.value = false
  }
}

// Load tariffs
async function loadTariffs() {
  tariffLoading.value = true
  try {
    const { data } = await deliveryApi.get('/tariffs')
    tariffs.value = Array.isArray(data) ? data : []
  } catch (e) {
    console.error('Tariffs error:', e)
  } finally {
    tariffLoading.value = false
  }
}

// Create order
async function createOrder() {
  creating.value = true
  try {
    const { data } = await deliveryApi.post('/orders', {
      number: newOrder.value.number,
      tariff_code: parseInt(newOrder.value.tariff_code),
      recipient_name: newOrder.value.recipient_name,
      recipient_phone: newOrder.value.recipient_phone,
      recipient_email: newOrder.value.recipient_email,
      packages: [{
        weight: parseInt(newOrder.value.weight)
      }],
      address: newOrder.value.address
    })
    alert('Заказ создан!')
    showCreateOrderModal.value = false
    loadOrders()
  } catch (e) {
    console.error('Create order error:', e)
    alert('Ошибка при создании заказа')
  } finally {
    creating.value = false
  }
}

// Status class helper
function getStatusClass(status) {
  const key = String(status || '').toUpperCase()
  if (['DELIVERED', 'READY_FOR_PICKUP', 'AT_PICKUP'].includes(key)) return 'success'
  if (['CANCELLED', 'NOT_DELIVERED', 'INVALID', 'RETURNED'].includes(key)) return 'danger'
  if (['CREATED', 'ACCEPTED', 'NEW', 'PROCESSING'].includes(key)) return 'info'
  if (['IN_TRANSIT', 'SHIPPED', 'ON_WAREHOUSE'].includes(key)) return 'warning'
  return 'default'
}

function getStatusText(status) {
  const key = String(status || '').toUpperCase()
  return STATUS_LABELS[key] || key || 'Неизвестно'
}

function formatOrderNumber(number) {
  if (!number) return 'Заказ без номера'
  return String(number).replace(/^order-?/i, 'Заказ №')
}

function getLatestStatusEntry(details) {
  const statuses = getSortedStatuses(details)
  if (!statuses.length) return null
  return statuses[statuses.length - 1]
}

function getCurrentStatus(details) {
  const latest = getLatestStatusEntry(details)
  return latest?.code || latest?.name || details?.entity?.status || details?.status || ''
}

function getSortedStatuses(details) {
  const statuses = details?.entity?.statuses
  if (!Array.isArray(statuses) || !statuses.length) return []
  return [...statuses].sort((a, b) => {
    const aTime = new Date(a?.date_time || a?.date || 0).getTime()
    const bTime = new Date(b?.date_time || b?.date || 0).getTime()
    return aTime - bTime
  })
}

function formatDateTime(dateValue) {
  if (!dateValue) return '—'
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Load data on mount
onMounted(() => {
  loadBalance()
  loadOrders()
})
</script>

<style scoped>
.cdek-page {
  max-width: 1200px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.page-header h1 {
  font-family: var(--font-display);
  font-size: 1.75rem;
  font-weight: 800;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  padding-bottom: 0;
}

.tab-content {
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}

.tab {
  padding: 0.75rem 1.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 10px;
  cursor: pointer;
  transition: var(--transition);
  min-width: 100px;
  text-align: center;
  position: relative;
  z-index: 10;
  pointer-events: auto;
}

.tab:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.tab.active {
  background: var(--accent);
  color: white;
  border-color: var(--accent);
}

.balance-card {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1.5rem;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 16px;
  margin-bottom: 2rem;
}

.balance-icon {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent-dim);
  color: var(--accent);
  border-radius: 50%;
}

.balance-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.balance-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-muted);
}

.balance-value {
  font-family: var(--font-mono);
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--accent);
}

.balance-orders {
  margin-left: auto;
  font-size: 0.875rem;
  color: var(--text-muted);
}

.search-bar {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.search-bar .input {
  flex: 1;
  max-width: 400px;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 3rem;
  color: var(--text-muted);
}

.orders-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.order-card {
  padding: 1.5rem;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 16px;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  gap: 1rem;
}

.order-number {
  font-family: var(--font-mono);
  font-weight: 700;
  font-size: 1.05rem;
}

.order-main {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.order-uuid {
  font-family: var(--font-mono);
  color: var(--text-muted);
  font-size: 0.78rem;
}

.status-badge {
  padding: 0.375rem 0.75rem;
  border-radius: 100px;
  font-size: 0.75rem;
  font-weight: 600;
}

.status-badge.success {
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
}

.status-badge.warning {
  background: rgba(234, 179, 8, 0.1);
  color: #eab308;
}

.status-badge.danger {
  background: rgba(255, 100, 100, 0.1);
  color: var(--danger);
}

.status-badge.info {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.order-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.detail {
  display: flex;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.detail .label {
  color: var(--text-muted);
}

.detail .value {
  font-family: var(--font-mono);
  color: var(--text-primary);
  word-break: break-word;
}

.detail .value--status {
  font-family: var(--font-body);
  font-weight: 600;
}

.status-badge.default {
  background: rgba(148, 163, 184, 0.12);
  color: var(--text-secondary);
}

.order-actions {
  display: flex;
  gap: 0.75rem;
}

.cities-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.city-card {
  padding: 1rem;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
}

.city-info strong {
  display: block;
  margin-bottom: 0.25rem;
}

.city-region {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.city-codes {
  margin-top: 0.75rem;
}

.code {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  background: var(--bg-secondary);
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
}

.pickup-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.found-count {
  font-size: 0.875rem;
  color: var(--text-muted);
  margin-bottom: 0.5rem;
}

.pickup-card {
  padding: 1rem;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
}

.pickup-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.point-code {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  color: var(--text-muted);
}

.pickup-address {
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
}

.pickup-time {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.tariffs-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.tariff-card {
  padding: 1rem;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
}

.tariff-header {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.tariff-header strong {
  font-family: var(--font-mono);
}

.mode-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
}

.mode-badge.pickup {
  background: var(--accent-dim);
  color: var(--accent);
}

.mode-badge.door {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: var(--text-muted);
}

.empty-state p {
  margin-bottom: 1.5rem;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 20px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border);
}

.modal-header h3 {
  font-family: var(--font-display);
  font-size: 1.25rem;
}

.close-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 1.5rem;
  color: var(--text-muted);
  cursor: pointer;
}

.close-btn:hover {
  background: var(--danger);
  color: white;
  border-color: var(--danger);
}

.modal-body {
  padding: 1.5rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid var(--border);
}

.details-modal {
  max-width: 860px;
}

.details-layout {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.detail-block {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 0.9rem 1rem;
}

.detail-block--hero {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 1rem;
  align-items: center;
}

.detail-block__label {
  font-size: 0.72rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: 0.4rem;
}

.detail-block__value {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
}

.detail-block__value--status {
  color: var(--accent);
}

.detail-block__value--mono {
  font-family: var(--font-mono);
  font-size: 0.9rem;
}

.detail-block__sub {
  margin-top: 0.35rem;
  color: var(--text-secondary);
  font-size: 0.84rem;
}

.packages-list {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.package-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.8rem;
  border: 1px dashed var(--border);
  border-radius: 10px;
  padding: 0.65rem 0.75rem;
}

.timeline {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.timeline-row {
  display: grid;
  grid-template-columns: 12px 1fr;
  align-items: flex-start;
  gap: 0.6rem;
}

.timeline-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  margin-top: 0.42rem;
  background: var(--accent);
  box-shadow: 0 0 0 4px rgba(166, 185, 248, 0.16);
}

.timeline-content {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 0.55rem 0.7rem;
}

.timeline-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.7rem;
}

.timeline-code {
  font-family: var(--font-mono);
  color: var(--text-muted);
  font-size: 0.74rem;
}

.timeline-date {
  font-size: 0.78rem;
  color: var(--text-secondary);
  margin-top: 0.25rem;
}

.timeline-note {
  font-size: 0.78rem;
  color: var(--text-muted);
  margin-top: 0.2rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  margin-bottom: 0.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

@media (max-width: 640px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .order-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .order-actions {
    flex-wrap: wrap;
  }

  .tabs {
    overflow-x: auto;
    flex-wrap: nowrap;
  }

  .tab {
    flex-shrink: 0;
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }

  .detail-block--hero {
    grid-template-columns: 1fr;
  }

  .package-row {
    flex-direction: column;
  }
}
</style>
