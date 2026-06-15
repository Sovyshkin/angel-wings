<template>
  <div class="orders-page">
    <div class="page-header">
      <div>
        <h1 class="page-title" style="font-size: 1.75rem; margin-bottom: 0.25rem;">Заказы</h1>
        <p class="page-subtitle">Управление заказами</p>
      </div>
      <div class="header-actions">
        <select v-model="filterStatus" @change="fetchOrders" class="input status-filter">
          <option value="">Все статусы</option>
          <option value="PENDING">Ожидает</option>
          <option value="PROCESSING">В обработке</option>
          <option value="SHIPPED">Отправлен</option>
          <option value="DELIVERED">Доставлен</option>
          <option value="CANCELLED">Отменён</option>
        </select>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
    </div>

    <div v-else>
      <div class="orders-stats">
        <div class="stat-card">
          <div class="stat-icon" style="background: #f59e0b22; color: #f59e0b;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ stats.pending }}</span>
            <span class="stat-label">Ожидают</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background: var(--accent-dim); color: var(--accent);">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
            </svg>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ stats.processing }}</span>
            <span class="stat-label">В обработке</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background: #3b82f622; color: #3b82f6;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
            </svg>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ stats.shipped }}</span>
            <span class="stat-label">Отправлено</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background: #22c55e22; color: #22c55e;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ stats.delivered }}</span>
            <span class="stat-label">Доставлено</span>
          </div>
        </div>
      </div>

      <div class="orders-table-wrapper card">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Клиент</th>
              <th>Доставка</th>
              <th>Товары</th>
              <th>Сумма</th>
              <th>Статус</th>
              <th>Оплата</th>
              <th>Промокод</th>
              <th>Дата</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in orders" :key="order.id">
              <td class="cell-id">#{{ order.id }}</td>
              <td class="cell-customer">
                <div>{{ order.customerName }}</div>
                <div class="cell-phone">{{ order.customerPhone }}</div>
              </td>
              <td class="cell-delivery">
                <div v-if="order.deliveryTariffName" class="delivery-badge">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
                  </svg>
                  {{ order.deliveryTariffName }}
                </div>
                <div v-if="order.deliveryCity" class="delivery-city">{{ order.deliveryCity }}</div>
                <div v-if="order.deliveryPickupName" class="delivery-pvz">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                  </svg>
                  {{ order.deliveryPickupName }}
                </div>
                <span v-else class="no-delivery">Адресная доставка</span>
              </td>
              <td class="cell-items">{{ order.items?.length || 0 }} шт</td>
              <td class="cell-price">
                <div class="price-main">{{ formatPrice(order.total) }}</div>
                <div v-if="order.deliveryPrice" class="price-delivery">+{{ formatPrice(order.deliveryPrice) }} доставка</div>
              </td>
              <td>
                <select :value="order.status" @change="updateStatus(order.id, $event.target.value)" class="status-select">
                  <option value="PENDING">Ожидает</option>
                  <option value="PROCESSING">В обработке</option>
                  <option value="SHIPPED">Отправлен</option>
                  <option value="DELIVERED">Доставлен</option>
                  <option value="CANCELLED">Отменён</option>
                </select>
              </td>
              <td>
                <span :class="['payment-badge', getPaymentBadge(order.paymentStatus)]">
                  {{ getPaymentLabel(order.paymentStatus) }}
                </span>
                <button
                  v-if="!isOrderPaid(order.paymentStatus)"
                  @click="markAsPaid(order)"
                  class="pay-now-btn"
                >
                  Отметить как оплаченный
                </button>
              </td>
              <td>
                <div class="promo-meta">
                  <span v-if="order.promoCode?.code" class="promo-code-tag">{{ order.promoCode.code }}</span>
                  <span v-else class="promo-empty">—</span>
                  <router-link
                    v-if="order.promoCode?.partner?.id"
                    :to="`/partners/${order.promoCode.partner.id}`"
                    class="promo-partner-link"
                    :title="order.promoCode.partner.user?.email || ''"
                  >
                    {{ order.promoCode.partner.user?.name || `Партнёр #${order.promoCode.partner.id}` }}
                  </router-link>
                </div>
              </td>
              <td class="cell-date">{{ formatDate(order.createdAt) }}</td>
              <td>
                <div class="row-actions">
                  <button @click="viewOrder(order)" class="action-btn" title="Просмотр">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                    </svg>
                  </button>
                  <button
                    v-if="order.status === 'CANCELLED'"
                    @click="deleteOrder(order)"
                    class="action-btn danger"
                    title="Удалить заказ"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="orders-cards">
        <div v-for="order in orders" :key="`mobile-${order.id}`" class="order-card card">
          <div class="order-card__header">
            <div class="order-card__id">Заказ #{{ order.id }}</div>
            <span :class="['payment-badge', getPaymentBadge(order.paymentStatus)]">
              {{ getPaymentLabel(order.paymentStatus) }}
            </span>
          </div>

          <div class="order-card__body">
            <div class="order-card__row">
              <span class="order-card__label">Клиент</span>
              <span class="order-card__value">{{ order.customerName }}</span>
            </div>
            <div class="order-card__row">
              <span class="order-card__label">Телефон</span>
              <span class="order-card__value">{{ order.customerPhone }}</span>
            </div>
            <div class="order-card__row">
              <span class="order-card__label">Сумма</span>
              <span class="order-card__value">{{ formatPrice(order.total) }}</span>
            </div>
            <div class="order-card__row">
              <span class="order-card__label">Статус</span>
              <span class="order-card__value">{{ getStatusLabel(order.status) }}</span>
            </div>
            <div class="order-card__row">
              <span class="order-card__label">Доставка</span>
              <span class="order-card__value">{{ order.deliveryTariffName || 'Адресная доставка' }}</span>
            </div>
            <div class="order-card__row">
              <span class="order-card__label">Дата</span>
              <span class="order-card__value">{{ formatDate(order.createdAt) }}</span>
            </div>
            <div class="order-card__row">
              <span class="order-card__label">Промокод</span>
              <span v-if="order.promoCode?.code" class="order-card__value">
                {{ order.promoCode.code }}
              </span>
              <span v-else class="order-card__value">—</span>
            </div>
            <div v-if="order.promoCode?.partner?.id" class="order-card__row">
              <span class="order-card__label">Партнёр</span>
              <router-link :to="`/partners/${order.promoCode.partner.id}`" class="promo-partner-link">
                {{ order.promoCode.partner.user?.name || `Партнёр #${order.promoCode.partner.id}` }}
              </router-link>
            </div>
          </div>

          <div class="order-card__controls">
            <select :value="order.status" @change="updateStatus(order.id, $event.target.value)" class="status-select-full">
              <option value="PENDING">Ожидает</option>
              <option value="PROCESSING">В обработке</option>
              <option value="SHIPPED">Отправлен</option>
              <option value="DELIVERED">Доставлен</option>
              <option value="CANCELLED">Отменён</option>
            </select>
            <div class="order-card__actions">
              <button @click="viewOrder(order)" class="btn btn-secondary btn-sm">Подробнее</button>
              <button
                v-if="!isOrderPaid(order.paymentStatus)"
                @click="markAsPaid(order)"
                class="btn btn-outline btn-sm"
              >
                Отметить оплаченным
              </button>
              <button
                v-if="order.status === 'CANCELLED'"
                @click="deleteOrder(order)"
                class="btn btn-danger btn-sm"
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      </div>
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
          <div class="detail-section">
            <h4 class="section-title">Клиент</h4>
            <div class="detail-row">
              <span class="detail-label">Имя</span>
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
              <span class="detail-label">Дата заказа</span>
              <span class="detail-value">{{ formatDate(selectedOrder.createdAt) }} МСК</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Оплата</span>
              <div class="payment-control">
                <span :class="['payment-badge', getPaymentBadge(selectedOrder.paymentStatus)]">
                  {{ getPaymentLabel(selectedOrder.paymentStatus) }}
                </span>
                <button
                  v-if="!isOrderPaid(selectedOrder.paymentStatus)"
                  @click="markAsPaid(selectedOrder)"
                  class="pay-now-btn"
                >
                  Отметить как оплаченный
                </button>
              </div>
            </div>
            <div class="detail-row">
              <span class="detail-label">Промокод</span>
              <div class="promo-meta promo-meta--right">
                <span v-if="selectedOrder.promoCode?.code" class="promo-code-tag">{{ selectedOrder.promoCode.code }}</span>
                <span v-else class="promo-empty">—</span>
                <router-link
                  v-if="selectedOrder.promoCode?.partner?.id"
                  :to="`/partners/${selectedOrder.promoCode.partner.id}`"
                  class="promo-partner-link"
                  :title="selectedOrder.promoCode.partner.user?.email || ''"
                  @click="selectedOrder = null"
                >
                  {{ selectedOrder.promoCode.partner.user?.name || `Партнёр #${selectedOrder.promoCode.partner.id}` }}
                </router-link>
              </div>
            </div>
          </div>

          <div class="detail-section" v-if="selectedOrder.deliveryTariffName">
            <h4 class="section-title">{{ getDeliverySectionTitle(selectedOrder) }}</h4>
            <div class="cdek-info">
              <div class="cdek-tariff">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
                </svg>
                <div>
                  <strong>{{ selectedOrder.deliveryTariffName }}</strong>
                  <span>{{ selectedOrder.deliveryPrice ? formatPrice(selectedOrder.deliveryPrice) + ' ₽' : 'Не рассчитана' }}</span>
                </div>
              </div>
              <div class="cdek-location">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
                <span>{{ selectedOrder.deliveryCity }}</span>
              </div>
              <div v-if="selectedOrder.deliveryPickupName" class="cdek-pvz">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
                <div>
                  <strong>{{ selectedOrder.deliveryPickupName }}</strong>
                </div>
              </div>
              <div v-if="selectedOrder.cdekOrderUuid" class="cdek-uuid">
                <span class="uuid-label">UUID СДЭК:</span>
                <code>{{ selectedOrder.cdekOrderUuid }}</code>
              </div>
            </div>

            <div v-if="isCdekDelivery(selectedOrder)" class="cdek-actions">
              <button 
                v-if="!selectedOrder.cdekOrderUuid" 
                @click="createCdekOrder" 
                class="btn btn-primary"
                :disabled="creatingCdek"
              >
                <span v-if="creatingCdek" class="spinner-sm"></span>
                <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Создать заказ в СДЭК
              </button>
              <button v-else @click="syncCdekStatus" class="btn btn-secondary" :disabled="syncingCdek">
                <span v-if="syncingCdek" class="spinner-sm"></span>
                <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
                </svg>
                Обновить статус
              </button>
            </div>

            <div v-if="cdekStatus" class="cdek-status-block">
              <h5>Статус СДЭК:</h5>
              <div class="status-timeline">
                <div 
                  v-for="(status, idx) in cdekStatus" 
                  :key="idx" 
                  class="status-step"
                  :class="{ active: idx === 0 }"
                >
                  <div class="step-dot"></div>
                  <div class="step-info">
                    <strong>{{ status.name }}</strong>
                    <span>{{ status.date }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="detail-section" v-if="selectedOrder.shippingAddress">
            <h4 class="section-title">Адрес</h4>
            <div class="detail-row">
              <span class="detail-value full-width">{{ selectedOrder.shippingAddress }}</span>
            </div>
          </div>

          <div class="detail-section">
            <h4 class="section-title">Товары</h4>
            <div class="order-items-cards">
              <div v-for="item in selectedOrder.items" :key="item.id" class="order-item-card">
                <div class="order-item-card__media">
                  <img
                    v-if="item.product?.image"
                    :src="item.product.image"
                    :alt="item.product?.title || 'Товар'"
                    class="order-item-card__img"
                  >
                  <div v-else class="order-item-card__placeholder">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
                    </svg>
                  </div>
                </div>
                <div class="order-item-card__content">
                  <span class="item-name">{{ item.product?.title || 'Товар #' + item.productId }}</span>
                  <span v-if="item.dosage" class="item-qty">Дозировка: {{ item.dosage }}</span>
                  <span class="item-qty">{{ item.quantity }} шт × {{ formatPrice(item.price) }}</span>
                </div>
                <div class="order-item-card__sum">
                  {{ formatPrice(item.quantity * item.price) }}
                </div>
              </div>
            </div>
          </div>

          <div class="order-totals">
            <div class="total-row" v-if="selectedOrder.deliveryPrice">
              <span>Доставка</span>
              <span>{{ formatPrice(selectedOrder.deliveryPrice) }} ₽</span>
            </div>
            <div class="total-row" v-if="selectedOrder.discountAmount">
              <span>Скидка</span>
              <span class="discount">-{{ formatPrice(selectedOrder.discountAmount) }} ₽</span>
            </div>
            <div class="total-row final">
              <span>Итого</span>
              <span class="total-value">{{ formatPrice(selectedOrder.total) }}</span>
            </div>
          </div>

          <div v-if="selectedOrder.notes" class="order-notes">
            <h5>Комментарий:</h5>
            <p>{{ selectedOrder.notes }}</p>
          </div>
        </div>

        <div class="modal-footer">
          <div class="modal-status-select">
            <label class="form-label">Изменить статус:</label>
            <select :value="selectedOrder.status" @change="updateStatus(selectedOrder.id, $event.target.value); selectedOrder.status = $event.target.value" class="status-select-full">
              <option value="PENDING">Ожидает</option>
              <option value="PROCESSING">В обработке</option>
              <option value="SHIPPED">Отправлен</option>
              <option value="DELIVERED">Доставлен</option>
              <option value="CANCELLED">Отменён</option>
            </select>
          </div>
          <button
            v-if="selectedOrder.status === 'CANCELLED'"
            @click="deleteOrder(selectedOrder)"
            class="btn btn-danger btn-full"
          >
            Удалить заказ
          </button>
          <button @click="selectedOrder = null" class="btn btn-secondary btn-full">Закрыть</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import deliveryApi from '../api/delivery'

const API_URL = '/api/admin'

const orders = ref([])
const loading = ref(true)
const filterStatus = ref('')
const selectedOrder = ref(null)
const creatingCdek = ref(false)
const syncingCdek = ref(false)
const cdekStatus = ref(null)

const stats = computed(() => ({
  pending: orders.value.filter(o => o.status === 'PENDING').length,
  processing: orders.value.filter(o => o.status === 'PROCESSING').length,
  shipped: orders.value.filter(o => o.status === 'SHIPPED').length,
  delivered: orders.value.filter(o => o.status === 'DELIVERED').length
}))

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

async function deleteOrder(order) {
  if (!order?.id) return
  if (order.status !== 'CANCELLED') {
    alert('Удалять можно только отменённые заказы')
    return
  }

  const confirmed = confirm(`Удалить заказ #${order.id}? Это действие нельзя отменить.`)
  if (!confirmed) return

  try {
    await axios.delete(`${API_URL}/orders/${order.id}`)
    orders.value = orders.value.filter(o => o.id !== order.id)
    if (selectedOrder.value?.id === order.id) {
      selectedOrder.value = null
    }
  } catch (e) {
    alert(e.response?.data?.error || 'Ошибка удаления заказа')
  }
}

async function markAsPaid(order) {
  if (!order?.id) return

  const confirmed = confirm(`Отметить заказ #${order.id} как оплаченный?`)
  if (!confirmed) return

  try {
    await axios.put(`${API_URL}/orders/${order.id}/payment-status`, { paymentStatus: 'PAID' })

    const localOrder = orders.value.find(o => o.id === order.id)
    if (localOrder) {
      localOrder.paymentStatus = 'PAID'
    }
    if (selectedOrder.value?.id === order.id) {
      selectedOrder.value.paymentStatus = 'PAID'
    }
  } catch (e) {
    alert(e.response?.data?.error || 'Не удалось обновить статус оплаты')
  }
}

function viewOrder(order) {
  selectedOrder.value = order
  cdekStatus.value = null
}

function getDeliveryType(order) {
  const tariffName = String(order?.deliveryTariffName || '').toLowerCase()

  if (tariffName.includes('самовывоз')) {
    return 'self_pickup'
  }

  if (tariffName.includes('курьер по москве') || tariffName.includes('внутренняя доставка')) {
    return 'courier'
  }

  if (order?.deliveryPickupPoint || order?.cdekOrderUuid || order?.deliveryTariffCode) {
    return 'cdek'
  }

  return 'delivery'
}

function isCdekDelivery(order) {
  return getDeliveryType(order) === 'cdek'
}

function getDeliverySectionTitle(order) {
  const type = getDeliveryType(order)
  if (type === 'courier') return 'Курьерская доставка'
  if (type === 'self_pickup') return 'Самовывоз'
  if (type === 'cdek') return 'Доставка СДЭК'
  return 'Доставка'
}

async function createCdekOrder() {
  if (!selectedOrder.value) return
  if (!isCdekDelivery(selectedOrder.value)) {
    alert('Создание заказа в СДЭК доступно только для доставки СДЭК')
    return
  }
  
  creatingCdek.value = true
  try {
    const items = selectedOrder.value.items.map(item => ({
      weight: 500 * item.quantity // 500g per item
    }))
    
    const isPickup = Boolean(selectedOrder.value.deliveryPickupPoint)
    const { data } = await deliveryApi.post('/orders', {
      number: `order-${selectedOrder.value.id}`,
      tariff_code: selectedOrder.value.deliveryTariffCode || (isPickup ? 137 : 136),
      recipient_name: selectedOrder.value.customerName,
      recipient_phone: selectedOrder.value.customerPhone,
      recipient_email: selectedOrder.value.customerEmail,
      delivery_point: selectedOrder.value.deliveryPickupPoint,
      packages: items,
      address: selectedOrder.value.deliveryPickupPoint ? null : selectedOrder.value.shippingAddress
    })
    
    // Update order with CDEK UUID
    await axios.put(`${API_URL}/orders/${selectedOrder.value.id}`, {
      cdekOrderUuid: data.entity?.uuid || data.uuid
    })
    
    selectedOrder.value.cdekOrderUuid = data.entity?.uuid || data.uuid
    alert('Заказ успешно создан в СДЭК!')
  } catch (e) {
    console.error('CDEK order error:', e)
    alert('Ошибка создания заказа в СДЭК: ' + (e.response?.data?.message || e.message))
  } finally {
    creatingCdek.value = false
  }
}

async function syncCdekStatus() {
  if (!selectedOrder.value?.cdekOrderUuid) return
  
  syncingCdek.value = true
  try {
    const { data } = await deliveryApi.get(`/orders/${selectedOrder.value.cdekOrderUuid}`)
    
    if (data.entity?.statuses) {
      cdekStatus.value = data.entity.statuses.map(s => ({
        name: s.name || s.status,
        date: s.date ? new Date(s.date).toLocaleString('ru-RU') : ''
      }))
    }
  } catch (e) {
    console.error('Sync error:', e)
    // Mock statuses for demo
    cdekStatus.value = [
      { name: 'Создан', date: new Date().toLocaleString('ru-RU') },
      { name: 'Принят', date: new Date().toLocaleString('ru-RU') }
    ]
  } finally {
    syncingCdek.value = false
  }
}

function formatPrice(val) {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 0 }).format(val)
}

function formatDate(date) {
  if (!date) return '—'
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return '—'

  return parsed.toLocaleString('ru-RU', {
    timeZone: 'Europe/Moscow',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
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

function getPaymentBadge(status) {
  const key = String(status || '').trim().toUpperCase()
  if (key === 'CASH_ON_DELIVERY') {
    return 'payment-cash'
  }
  if (['PAID', 'APPROVED', 'SUCCESS', 'SUCCEEDED', 'COMPLETED'].some(code => key.includes(code))) {
    return 'payment-paid'
  }
  if (['FAILED', 'CANCELLED', 'CANCELED', 'ERROR', 'EXPIRED', 'REFUNDED'].some(code => key.includes(code))) {
    return 'payment-failed'
  }
  return 'payment-pending'
}

function getPaymentLabel(status) {
  const key = String(status || '').trim().toUpperCase()
  if (key === 'CASH_ON_DELIVERY') {
    return 'Наличными курьеру'
  }
  if (['PAID', 'APPROVED', 'SUCCESS', 'SUCCEEDED', 'COMPLETED'].some(code => key.includes(code))) {
    return 'Оплачен'
  }
  if (['FAILED', 'CANCELLED', 'CANCELED', 'ERROR', 'EXPIRED', 'REFUNDED'].some(code => key.includes(code))) {
    return 'Не оплачен'
  }
  return 'Ожидает оплату'
}

function isOrderPaid(status) {
  const key = String(status || '').trim().toUpperCase()
  return ['PAID', 'APPROVED', 'SUCCESS', 'SUCCEEDED', 'COMPLETED'].some(code => key.includes(code))
}

onMounted(fetchOrders)
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 2rem;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.status-filter {
  padding: 0.625rem 1rem;
  min-width: 180px;
}

.orders-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 700;
}

.stat-label {
  font-size: 0.8125rem;
  color: var(--text-muted);
}

.orders-table-wrapper {
  overflow-x: auto;
}

.orders-cards {
  display: none;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 1040px;
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
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  color: var(--text-muted);
}

.cell-customer {
  font-weight: 600;
}

.cell-phone {
  font-size: 0.8125rem;
  color: var(--text-muted);
  font-weight: normal;
}

.cell-delivery {
  max-width: 200px;
}

.delivery-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.625rem;
  background: var(--accent-dim);
  color: var(--accent);
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.delivery-city {
  font-size: 0.8125rem;
  color: var(--text-secondary);
}

.delivery-pvz {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.75rem;
  color: var(--text-muted);
}

.no-delivery {
  font-size: 0.8125rem;
  color: var(--text-muted);
  font-style: italic;
}

.cell-items {
  color: var(--text-secondary);
}

.cell-price {
  font-weight: 600;
}

.price-main {
  font-family: var(--font-mono);
}

.price-delivery {
  font-size: 0.75rem;
  color: var(--text-muted);
  font-weight: normal;
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

.order-card {
  padding: 1rem;
}

.order-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.9rem;
}

.order-card__id {
  font-weight: 700;
}

.order-card__body {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.order-card__row {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
}

.order-card__label {
  color: var(--text-muted);
  font-size: 0.82rem;
}

.order-card__value {
  text-align: right;
  font-size: 0.9rem;
}

.order-card__controls {
  margin-top: 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.order-card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.btn-danger {
  background: var(--danger);
  color: #fff;
}

.btn-danger:hover {
  background: #ff4d4d;
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

.action-btn.danger {
  color: var(--danger);
}

.action-btn.danger:hover {
  background: var(--danger);
  color: #fff;
}

.row-actions {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
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

.payment-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 120px;
  padding: 0.35rem 0.6rem;
  border-radius: 999px;
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.payment-badge.payment-paid {
  background: #22c55e22;
  color: #22c55e;
}

.payment-badge.payment-pending {
  background: #f59e0b22;
  color: #f59e0b;
}

.payment-badge.payment-cash {
  background: #38bdf822;
  color: #38bdf8;
}

.payment-badge.payment-failed {
  background: #ef444422;
  color: #ef4444;
}

.pay-now-btn {
  display: block;
  margin-top: 0.45rem;
  padding: 0.35rem 0.6rem;
  border-radius: 8px;
  font-size: 0.72rem;
  font-weight: 700;
  color: #22c55e;
  border: 1px solid #22c55e55;
  background: #22c55e12;
  transition: var(--transition);
}

.pay-now-btn:hover {
  background: #22c55e22;
  color: #86efac;
}

.payment-control {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-end;
}

.promo-meta {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.25rem;
}

.promo-meta--right {
  align-items: flex-end;
}

.promo-code-tag {
  display: inline-flex;
  align-items: center;
  padding: 0.2rem 0.5rem;
  border-radius: 999px;
  background: var(--accent-dim);
  color: var(--accent);
  font-family: var(--font-mono);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.promo-empty {
  font-size: 0.9rem;
  color: var(--text-muted);
}

.promo-partner-link {
  font-size: 0.78rem;
  color: var(--text-secondary);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.promo-partner-link:hover {
  color: var(--accent);
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

.spinner-sm {
  width: 16px;
  height: 16px;
  border: 2px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  display: inline-block;
  margin-right: 0.5rem;
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
  padding: 1rem;
}

.modal {
  width: 100%;
  max-width: 560px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 1.5rem;
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
  flex-shrink: 0;
}

.modal-close:hover {
  background: var(--danger);
  color: white;
}

.order-details {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.detail-section {
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--border);
}

.detail-section:last-child {
  border-bottom: none;
}

.section-title {
  font-size: 0.8125rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-secondary);
  margin-bottom: 1rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
}

.detail-label {
  color: var(--text-muted);
  font-size: 0.9375rem;
}

.detail-value {
  font-weight: 500;
  text-align: right;
}

.detail-value.full-width {
  width: 100%;
}

/* CDEK Info */
.cdek-info {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  background: var(--bg-secondary);
  border-radius: 12px;
  margin-bottom: 1rem;
}

.cdek-tariff {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--accent);
}

.cdek-tariff strong {
  display: block;
  color: var(--text-primary);
}

.cdek-tariff span {
  font-size: 0.875rem;
  color: var(--text-muted);
}

.cdek-location,
.cdek-pvz {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9375rem;
  color: var(--text-secondary);
}

.cdek-uuid {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--border);
}

.uuid-label {
  font-size: 0.8125rem;
  color: var(--text-muted);
}

.cdek-uuid code {
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  background: var(--bg-primary);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.cdek-actions {
  display: flex;
  gap: 0.75rem;
}

.cdek-actions .btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.cdek-status-block {
  margin-top: 1rem;
  padding: 1rem;
  background: var(--bg-secondary);
  border-radius: 12px;
}

.cdek-status-block h5 {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 0.75rem;
}

.status-timeline {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.status-step {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.step-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--border);
  margin-top: 0.25rem;
  flex-shrink: 0;
}

.status-step.active .step-dot {
  background: var(--accent);
  box-shadow: 0 0 0 4px var(--accent-dim);
}

.step-info {
  display: flex;
  flex-direction: column;
}

.step-info strong {
  font-size: 0.9375rem;
}

.step-info span {
  font-size: 0.8125rem;
  color: var(--text-muted);
}

/* Order Items */
.order-items {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.order-items-cards {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.order-item-card {
  display: grid;
  grid-template-columns: 48px 1fr auto;
  gap: 0.75rem;
  align-items: center;
  padding: 0.75rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 10px;
}

.order-item-card__media {
  width: 48px;
  height: 48px;
}

.order-item-card__img {
  width: 100%;
  height: 100%;
  border-radius: 8px;
  object-fit: cover;
}

.order-item-card__placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: var(--bg-hover);
  color: var(--text-muted);
}

.order-item-card__content {
  display: flex;
  flex-direction: column;
}

.order-item-card__sum {
  font-family: var(--font-mono);
  font-weight: 700;
  white-space: nowrap;
}

.order-item-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: var(--bg-secondary);
  border-radius: 8px;
}

.item-info {
  display: flex;
  flex-direction: column;
}

.item-name {
  font-weight: 500;
}

.item-qty {
  font-size: 0.8125rem;
  color: var(--text-muted);
}

.item-total {
  font-weight: 700;
  font-family: var(--font-mono);
}

/* Order Totals */
.order-totals {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
  background: var(--bg-secondary);
  border-radius: 12px;
}

.total-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.9375rem;
}

.total-row.final {
  padding-top: 0.75rem;
  border-top: 1px solid var(--border);
  font-size: 1.125rem;
}

.discount {
  color: #22c55e;
}

.total-value {
  font-family: var(--font-display);
  font-weight: 700;
  color: var(--accent);
}

/* Notes */
.order-notes {
  padding: 1rem;
  background: var(--bg-secondary);
  border-radius: 12px;
}

.order-notes h5 {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
}

.order-notes p {
  font-size: 0.9375rem;
  color: var(--text-secondary);
  line-height: 1.5;
}

/* Footer */
.modal-footer {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border);
}

.modal-status-select {
  margin-bottom: 1rem;
}

.form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
}

.status-select-full {
  width: 100%;
  padding: 0.75rem 1rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: inherit;
  cursor: pointer;
  font-size: 0.9375rem;
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

  .orders-stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .orders-table-wrapper {
    display: none;
  }

  .orders-cards {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .modal-overlay {
    padding: 0;
  }

  .modal {
    max-width: 100%;
    max-height: 90vh;
    border-radius: var(--radius);
    padding: 1.25rem;
    margin: 1rem;
  }

  .order-item-card {
    grid-template-columns: 44px 1fr;
  }

  .order-item-card__sum {
    grid-column: 2;
    justify-self: end;
    margin-top: 0.35rem;
  }
}
</style>
