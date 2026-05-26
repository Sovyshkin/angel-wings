<template>
  <div class="cart">
    <div class="cart__hero" data-aos="fade-up">
      <div class="container">
        <h1 class="page-title">Корзина</h1>
        <p class="page-subtitle">Оформите заказ на выбранные товары</p>
      </div>
    </div>

    <Transition name="modal">
      <div v-if="orderComplete" class="order-success-overlay">
        <div class="order-success-card">
          <div class="success-checkmark">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <h3>Заказ оформлен!</h3>
          <p>Мы свяжемся с вами в ближайшее время для подтверждения заказа</p>
          <div class="success-order-id">Заказ #{{ lastOrderId }}</div>
          <button class="btn btn-primary" @click="continueShopping">Продолжить покупки</button>
        </div>
      </div>
    </Transition>

    <Transition name="modal">
      <div v-if="orderError" class="order-success-overlay">
        <div class="order-error-card">
          <div class="error-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          </div>
          <h3>Что-то пошло не так</h3>
          <p>{{ orderError }}</p>
          <div class="error-order-id">Заказ #{{ lastOrderId }}</div>
          <div class="error-actions">
            <button class="btn btn-secondary" @click="orderError = null">Закрыть</button>
            <button class="btn btn-primary" @click="retryOrder">Попробовать снова</button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Login Required Modal -->
    <Transition name="modal">
      <div v-if="showLoginModal" class="login-modal-overlay" @click.self="showLoginModal = false">
        <div class="login-modal-card">
          <button class="login-modal-close" @click="showLoginModal = false">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
          
          <div class="login-modal-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          
          <h3 class="login-modal-title">Вход в аккаунт</h3>
          <p class="login-modal-subtitle">Войдите, чтобы оформить заказ</p>
          
          <div class="login-form">
            <div class="login-input-group">
              <label>Email</label>
              <input v-model="loginForm.email" type="email" class="login-input" placeholder="your@email.com">
            </div>
            <div class="login-input-group">
              <label>Пароль</label>
              <input v-model="loginForm.password" type="password" class="login-input" placeholder="Введите пароль">
            </div>
            
            <div v-if="loginError" class="login-error">{{ loginError }}</div>
            
            <button class="login-btn login-btn-primary" @click="handleLogin" :disabled="loggingIn">
              <span v-if="loggingIn" class="spinner"></span>
              {{ loggingIn ? 'Вход...' : 'Войти' }}
            </button>
            
            <div class="login-or">
              <span>Нет аккаунта?</span>
              <router-link to="/auth" class="login-link" @click="showLoginModal = false">
                Зарегистрироваться
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <div class="container">
      <div v-if="cartStore.items.length === 0" class="empty" data-aos="fade-up">
        <div class="empty-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
        </div>
        <h3>Корзина пуста</h3>
        <p>Добавьте товары из каталога для оформления заказа</p>
        <router-link to="/catalog" class="btn btn-primary">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
          В каталог
        </router-link>
      </div>
      
      <div v-else class="cart__layout">
        <div class="cart__items" data-aos="fade-right" data-aos-delay="100">
          <div class="cart-header">
            <span class="col-product">Товар</span>
            <span class="col-price">Цена</span>
            <span class="col-quantity">Количество</span>
            <span class="col-total">Сумма</span>
            <span class="col-remove"></span>
          </div>
          
          <div class="cart-item" v-for="item in cartStore.items" :key="item.cartKey || `${item.id}::${item.selectedDosage || ''}`">
            <div class="col-product">
              <div class="item-image">
                <img v-if="item.image" :src="item.image" :alt="item.title" @error="handleImageError">
                <div v-else class="item-placeholder">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
              </div>
              <div class="item-info">
                <h4>{{ item.title }}</h4>
                <span v-if="item.selectedDosage" class="item-category">Дозировка: {{ item.selectedDosage }}</span>
                <span class="item-category">{{ getCategoryName(item.categories?.[0]?.slug) }}</span>
              </div>
            </div>
            <div class="col-price">{{ item.price.toLocaleString() }} ₽</div>
            <div class="col-quantity">
              <div class="quantity-selector">
                <button @click="decreaseQty(item)" :disabled="item.quantity <= 1">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                </button>
                <span>{{ item.quantity }}</span>
                <button @click="increaseQty(item)">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                </button>
              </div>
            </div>
            <div class="col-total">{{ (item.price * item.quantity).toLocaleString() }} ₽</div>
            <button class="col-remove item-remove" @click="cartStore.removeItem(item.id, item.selectedDosage)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
              </svg>
            </button>
          </div>
          
          <div class="cart-actions">
            <button class="btn-clear" @click="cartStore.clear()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
              </svg>
              Очистить корзину
            </button>
          </div>
        </div>
        
        <div class="cart__summary" data-aos="fade-left" data-aos-delay="200">
          <div class="summary-header">
            <h3>Ваш заказ</h3>
            <span class="item-count">{{ cartStore.count }} товаров</span>
          </div>
          
          <div class="summary-items">
            <div class="summary-row">
              <span>Товары</span>
              <span>{{ cartStore.total.toLocaleString() }} ₽</span>
            </div>
            <div class="summary-row">
              <span>{{ deliveryType === 'pvz' ? 'Доставка СДЭК' : 'Курьер по Москве' }}</span>
              <div class="delivery-info">
                <span v-if="deliveryPrice > 0" class="delivery-price">{{ deliveryPrice.toLocaleString() }} ₽</span>
                <span v-else-if="isDeliverySelected" class="delivery-calc">Бесплатно</span>
                <span v-else class="delivery-calc">Не выбрана</span>
                <span v-if="deliveryInfo.period_min && deliveryInfo.period_max" class="delivery-period">
                  {{ deliveryInfo.period_min }}-{{ deliveryInfo.period_max }} дн.
                </span>
              </div>
            </div>
          </div>

          <!-- Delivery Details Card -->
          <div v-if="isDeliverySelected" class="delivery-details-card">
            <div class="delivery-detail-header">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="1" y="3" width="15" height="13"/>
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
                <circle cx="5.5" cy="18.5" r="2.5"/>
                <circle cx="18.5" cy="18.5" r="2.5"/>
              </svg>
              <span>Информация о доставке</span>
            </div>
            <div class="delivery-detail-row">
              <span>Срок доставки:</span>
              <span>
                {{ deliveryInfo.period_min && deliveryInfo.period_max
                  ? `${deliveryInfo.period_min}-${deliveryInfo.period_max} рабочих дней`
                  : 'Уточняется менеджером'
                }}
              </span>
            </div>
            <div v-if="deliveryInfo.delivery_date_min" class="delivery-detail-row">
              <span>Дата прибытия:</span>
              <span>{{ formatDate(deliveryInfo.delivery_date_min) }} — {{ formatDate(deliveryInfo.delivery_date_max) }}</span>
            </div>
            <div class="delivery-detail-row">
              <span>Вес посылки:</span>
              <span>{{ (cartStore.totalWeight / 1000).toFixed(2) }} кг</span>
            </div>
            <div class="delivery-detail-row">
              <span>Тариф:</span>
              <span>{{ deliveryType === 'pvz' ? 'ПВЗ СДЭК' : 'Курьер по Москве (внутренняя)' }}</span>
            </div>
          </div>
          
          <div class="summary-total">
            <span>Итого</span>
            <span class="total-value">{{ totalWithDelivery.toLocaleString() }} ₽</span>
          </div>
          
          <!-- Delivery Type Selection -->
          <div class="pickup-section">
            <h4>Способ получения</h4>
            
            <div class="delivery-type-options">
              <label
                v-if="ENABLE_PVZ"
                class="delivery-type-option"
                :class="{ selected: deliveryType === 'pvz' }"
              >
                <input 
                  type="radio" 
                  value="pvz" 
                  v-model="deliveryType"
                  @change="onDeliveryTypeChange"
                >
                <div class="option-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                </div>
                <div class="option-content">
                  <strong>Пункт выдачи</strong>
                  <span>Забрать в ПВЗ СДЭК</span>
                </div>
              </label>
              
              <label 
                class="delivery-type-option"
                :class="{ selected: deliveryType === 'courier' }"
              >
                <input 
                  type="radio" 
                  value="courier" 
                  v-model="deliveryType"
                  @change="onDeliveryTypeChange"
                >
                <div class="option-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="1" y="3" width="15" height="13"/>
                    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
                    <circle cx="5.5" cy="18.5" r="2.5"/>
                    <circle cx="18.5" cy="18.5" r="2.5"/>
                  </svg>
                </div>
                <div class="option-content">
                  <strong>Курьер</strong>
                  <span>Только по Москве, в пределах МКАД</span>
                </div>
              </label>
            </div>

            <div v-if="loadingDelivery" class="loading-pickup">
              <span class="spinner"></span>
              Расчёт стоимости...
            </div>

            <!-- PVZ Selection -->
            <div v-if="ENABLE_PVZ && !loadingDelivery && deliveryType === 'pvz' && !selectedPickupPoint" class="pvz-section">
              <div class="pickup-search">
                <input 
                  v-model="citySearch" 
                  type="text" 
                  class="input" 
                  placeholder="Введите название города..."
                  @keyup.enter="searchCityAndPickup"
                >
                <button class="btn btn-secondary" @click="searchCityAndPickup" :disabled="loadingPickup">
                  Найти
                </button>
              </div>
              
              <div v-if="foundCityName" class="found-info">
                ПВЗ в г. {{ foundCityName }}:
              </div>

              <div v-if="pickupPoints.length" class="pickup-filter">
                <input
                  v-model="pickupFilter"
                  type="text"
                  class="input"
                  placeholder="Поиск ПВЗ по улице или адресу..."
                >
              </div>
              
              <div class="pickup-list">
                <label 
                  v-for="point in filteredPickupPoints" 
                  :key="point.code" 
                  class="pickup-point"
                  :class="{ selected: selectedPickupPoint?.code === point.code }"
                >
                  <input 
                    type="radio" 
                    :value="point" 
                    v-model="selectedPickupPoint"
                    @change="onPickupSelect"
                  >
                  <div class="point-content">
                    <strong>{{ point.name }}</strong>
                    <span class="point-address">{{ point.address }}</span>
                    <span v-if="point.work_time" class="point-time">{{ point.work_time }}</span>
                  </div>
                </label>
                <div v-if="pickupPoints.length && !filteredPickupPoints.length" class="no-points-found">
                  По вашему запросу ПВЗ не найдено
                </div>
              </div>
            </div>

            <!-- Selected PVZ -->
            <div v-if="ENABLE_PVZ && !loadingDelivery && selectedPickupPoint && deliveryType === 'pvz'" class="selected-pickup">
              <div class="pickup-point selected">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                <div class="point-content">
                  <strong>{{ selectedPickupPoint.name }}</strong>
                  <span class="point-address">{{ selectedPickupPoint.address }}</span>
                  <span v-if="selectedPickupPoint.work_time" class="point-time">{{ selectedPickupPoint.work_time }}</span>
                </div>
              </div>
              <button class="btn-change-pickup" @click="changeDelivery">Изменить</button>
            </div>

            <!-- Courier Address -->
            <div v-if="!loadingDelivery && deliveryType === 'courier' && !courierAddress" class="courier-section">
              <div class="found-info">
                Курьерская доставка работает только в пределах Москвы.
              </div>

              <div class="form-group" style="margin-top: 1rem;">
                <label>Адрес доставки</label>
                <textarea 
                  v-model="addressInput" 
                  class="input" 
                  rows="3" 
                  placeholder="Улица, дом, квартира..."
                ></textarea>
              </div>
              
              <button 
                class="btn btn-primary" 
                style="width: 100%; margin-top: 1rem;"
                @click="selectCourierDelivery"
                :disabled="!addressInput"
              >
                Подтвердить адрес
              </button>
            </div>

            <!-- Selected Courier -->
            <div v-if="!loadingDelivery && courierAddress && deliveryType === 'courier'" class="selected-pickup">
              <div class="pickup-point selected">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                <div class="point-content">
                  <strong>Доставка курьером</strong>
                  <span class="point-address">{{ INTERNAL_COURIER_CITY }}</span>
                  <span class="point-time">{{ courierAddress }}</span>
                </div>
              </div>
              <button class="btn-change-pickup" @click="changeDelivery">Изменить</button>
            </div>
          </div>
          
          <div class="checkout-form">
            <h4 v-if="authStore.isAuthenticated">Данные из профиля</h4>
            <h4 v-else>Контактные данные</h4>
            <div class="form-group">
              <label>Имя</label>
              <input v-model="customer.name" type="text" class="input" placeholder="Иван Иванов" :disabled="authStore.isAuthenticated" required>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Телефон</label>
                <input v-model="customer.phone" type="tel" class="input" placeholder="+7 (999) 999-99-99" :disabled="authStore.isAuthenticated" required>
              </div>
              <div class="form-group">
                <label>Email</label>
                <input v-model="customer.email" type="email" class="input" placeholder="example@mail.ru" :disabled="authStore.isAuthenticated" required>
              </div>
            </div>
            <div class="form-group">
              <label>Комментарий к заказу</label>
              <textarea v-model="customer.comment" class="input" rows="2" placeholder="Дополнительные пожелания..."></textarea>
            </div>

            <div class="promo-code-card">
              <label class="promo-code-label" for="promo-code-input">Промокод</label>
              <div class="promo-code-controls">
                <input
                  id="promo-code-input"
                  v-model="promoCode"
                  type="text"
                  class="input promo-code-input"
                  placeholder="Введите промокод"
                  @input="normalizePromoCodeInput"
                >
                <button v-if="promoCode" type="button" class="promo-code-clear" @click="promoCode = ''">Сбросить</button>
              </div>
              <p class="promo-code-hint">Скидка будет применена после проверки промокода при оформлении заказа.</p>
            </div>

            <div class="consents">
              <label class="consent-item">
                <input type="checkbox" v-model="consents.rememberContacts">
                <span>Запомнить контакты в браузере для повторной покупки</span>
              </label>
              <label class="consent-item">
                <input type="checkbox" v-model="consents.acceptOffer">
                <span>
                  Я согласен с условиями
                  <a href="/public-offer-2026.pdf" target="_blank" rel="noopener">Оферты</a>
                </span>
              </label>
              <label class="consent-item">
                <input type="checkbox" v-model="consents.acceptMarketing">
                <span>Я согласен на получение информационных и рекламных сообщений</span>
              </label>
              <label class="consent-item">
                <input type="checkbox" v-model="consents.acceptPrivacy">
                <span>
                  Я согласен на обработку моих персональных данных для целей и на условиях, изложенных в
                  <a href="/policy.pdf" target="_blank" rel="noopener">Политике конфиденциальности</a>
                </span>
              </label>
              <label class="consent-item consent-item--full">
                <input type="checkbox" v-model="consents.acceptResearchTerms">
                <span>
                  Мне уже есть полных 18 лет. Я квалифицированный специалист. Я согласен с тем, что материал,
                  представленный на этом сайте, для профессионального использования. Я согласен с тем, что Образцы,
                  приобретенные на этом сайте, для исследовательских целей, и не будут использоваться для человека
                  или животного и/или для приема внутрь. Образцы не будут использоваться в качестве лекарств,
                  биологически активных добавок, косметических средства или бытовой химии.
                </span>
              </label>
            </div>

            <button class="btn btn-primary btn-submit" @click="placeOrder" :disabled="!isFormValid || ordering">
              <svg v-if="!ordering" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              <span v-if="ordering" class="spinner"></span>
              {{ ordering ? 'Оформляем...' : 'Оформить заказ' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '../store/cart'
import { useProductStore } from '../store/products'
import { useAuthStore } from '../store/auth'
import axios from 'axios'
import deliveryApi from '../api/delivery'

const router = useRouter()
const cartStore = useCartStore()
const productStore = useProductStore()
const authStore = useAuthStore()
const ENABLE_PVZ = true
const ENABLE_CDEK = true
const INTERNAL_COURIER_CITY = 'Москва'
const INTERNAL_COURIER_CITY_CODE = '44'
const INTERNAL_COURIER_PRICE = 690

const customer = ref({ name: '', phone: '', email: '', comment: '' })
const consents = ref({
  rememberContacts: true,
  acceptOffer: true,
  acceptMarketing: true,
  acceptPrivacy: true,
  acceptResearchTerms: true
})
const promoCode = ref('')
const ordering = ref(false)
const orderComplete = ref(false)
const orderError = ref(null)
const lastOrderId = ref(null)
const showLoginModal = ref(false)
const loginForm = ref({ email: '', password: '' })
const loginError = ref('')
const loggingIn = ref(false)

// Delivery state
const deliveryType = ref(ENABLE_PVZ ? 'pvz' : 'courier') // 'pvz' or 'courier'
const citySearch = ref('')
const foundCityName = ref('')
const foundCityCode = ref('')
const pickupPoints = ref([])
const pickupFilter = ref('')
const selectedPickupPoint = ref(null)
const courierAddress = ref('')
const addressInput = ref('')
const loadingPickup = ref(false)
const loadingDelivery = ref(false)
const deliveryPrice = ref(0)
const deliveryInfo = ref({})

const filteredPickupPoints = computed(() => {
  const q = pickupFilter.value.trim().toLowerCase()
  if (!q) return pickupPoints.value
  return pickupPoints.value.filter(point => {
    const name = String(point?.name || '').toLowerCase()
    const address = String(point?.address || '').toLowerCase()
    return name.includes(q) || address.includes(q)
  })
})

const isDeliverySelected = computed(() => {
  if (deliveryType.value === 'pvz') return Boolean(selectedPickupPoint.value)
  return Boolean(courierAddress.value)
})

function normalizePromoCodeInput() {
  promoCode.value = String(promoCode.value || '')
    .toUpperCase()
    .replace(/\s+/g, '')
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

function getCategoryName(slug) {
  if (!slug) return ''
  const cat = productStore.categories.find(c => c.slug === slug)
  return cat ? cat.name : slug
}

function increaseQty(item) {
  cartStore.updateQuantity(item.id, item.quantity + 1, item.selectedDosage)
}

function decreaseQty(item) {
  if (item.quantity > 1) {
    cartStore.updateQuantity(item.id, item.quantity - 1, item.selectedDosage)
  }
}

function handleImageError(e) {
  const img = e.target
  if (img.dataset.fallbackApplied === 'true') return
  img.dataset.fallbackApplied = 'true'
  img.src = '/logo.png'
}

function prefillFromProfile() {
  if (authStore.isAuthenticated && authStore.user) {
    customer.value = {
      name: authStore.user.name || '',
      phone: authStore.user.phone || '',
      email: authStore.user.email || '',
      comment: ''
    }
    return
  }

  const savedContacts = JSON.parse(localStorage.getItem('peptidi_guest_contacts') || 'null')
  if (savedContacts) {
    customer.value = {
      name: savedContacts.name || '',
      phone: savedContacts.phone || '',
      email: savedContacts.email || '',
      comment: customer.value.comment || ''
    }
  }
}

function continueShopping() {
  orderComplete.value = false
  router.push('/catalog')
}

function retryOrder() {
  orderError.value = null
  // User can try again
}

function changeDelivery() {
  selectedPickupPoint.value = null
  pickupFilter.value = ''
  courierAddress.value = ''
  addressInput.value = ''
  deliveryPrice.value = 0
  deliveryInfo.value = {}
  cartStore.setDeliveryPrice(0)
  cartStore.setDelivery({})
}

function onDeliveryTypeChange() {
  if (!ENABLE_PVZ && deliveryType.value === 'pvz') {
    deliveryType.value = 'courier'
  }
  changeDelivery()
}

async function searchCityAndPickup() {
  if (!citySearch.value || citySearch.value.length < 3) return
  
  loadingPickup.value = true
  pickupPoints.value = []
  pickupFilter.value = ''
  foundCityName.value = ''
  foundCityCode.value = ''
  
  try {
    const res = await deliveryApi.post('/find-city', { name: citySearch.value })
    if (res.data && Array.isArray(res.data) && res.data.length > 0) {
      const city = res.data[0]
      foundCityName.value = city.city
      foundCityCode.value = city.code
      
      // Load pickup points
      const pointsRes = await deliveryApi.get(`/pickup-points?city_code=${city.code}&limit=50`)
      pickupPoints.value = pointsRes.data || []
    }
  } catch (e) {
    console.error('City search error:', e)
  } finally {
    loadingPickup.value = false
  }
}

async function onPickupSelect() {
  if (!selectedPickupPoint.value) return
  
  loadingDelivery.value = true
  try {
    const safeWeight = Math.max(1, parseInt(cartStore.totalWeight) || 0)
    const res = await deliveryApi.post('/calculate-by-tariff', {
      tariff_code: 136, // PVZ tariff
      from_code: 44,
      to_code: foundCityCode.value,
      weight: safeWeight
    })
    
    console.log('CDEK Response:', res.data)
    
    // Handle both response formats (total_sum or total_price)
    const price = res.data?.total_sum || res.data?.total_price || res.data?.delivery_sum
    if (price) {
      deliveryPrice.value = price
      deliveryInfo.value = {
        period_min: res.data.period_min,
        period_max: res.data.period_max,
        delivery_date_min: res.data.delivery_date_range?.min,
        delivery_date_max: res.data.delivery_date_range?.max
      }
      cartStore.setDeliveryPrice(price)
      cartStore.setDelivery({
        type: 'pvz',
        city: foundCityName.value,
        cityCode: foundCityCode.value,
        pickupPoint: selectedPickupPoint.value,
        deliveryPrice: price,
        deliveryInfo: deliveryInfo.value
      })
    }
  } catch (e) {
    console.error('Delivery calculation error:', e)
    deliveryPrice.value = 0
    deliveryInfo.value = {}
    cartStore.setDeliveryPrice(0)
  } finally {
    loadingDelivery.value = false
  }
}

function selectCourierDelivery() {
  const normalizedAddress = String(addressInput.value || '').trim()
  if (!normalizedAddress) return

  foundCityName.value = INTERNAL_COURIER_CITY
  foundCityCode.value = INTERNAL_COURIER_CITY_CODE
  courierAddress.value = normalizedAddress
  deliveryPrice.value = INTERNAL_COURIER_PRICE
  deliveryInfo.value = {
    period_min: 1,
    period_max: 2
  }
  cartStore.setDeliveryPrice(INTERNAL_COURIER_PRICE)
  cartStore.setDelivery({
    type: 'courier',
    city: INTERNAL_COURIER_CITY,
    cityCode: INTERNAL_COURIER_CITY_CODE,
    courierAddress: courierAddress.value,
    deliveryPrice: INTERNAL_COURIER_PRICE,
    deliveryInfo: deliveryInfo.value
  })
}

const totalWithDelivery = computed(() => {
  return cartStore.total + deliveryPrice.value
})

const isFormValid = computed(() => {
  const hasContact = customer.value.name && customer.value.phone && customer.value.email
  const hasDelivery = ENABLE_CDEK
    ? (deliveryType.value === 'pvz' ? selectedPickupPoint.value : courierAddress.value)
    : true
  const hasAllConsents =
    consents.value.acceptOffer &&
    consents.value.acceptMarketing &&
    consents.value.acceptPrivacy &&
    consents.value.acceptResearchTerms
  return hasContact && hasDelivery && hasAllConsents
})

async function handleLogin() {
  loginError.value = ''
  loggingIn.value = true
  
  try {
    const { data } = await axios.post('/api/auth/login', {
      email: loginForm.value.email,
      password: loginForm.value.password
    })
    
    authStore.setAuth(data.token, data.user)
    showLoginModal.value = false
    loginForm.value = { email: '', password: '' }
    prefillFromProfile()
  } catch (e) {
    loginError.value = e.response?.data?.message || 'Неверный email или пароль'
  } finally {
    loggingIn.value = false
  }
}

async function placeOrder() {
  if (!isFormValid.value) {
    alert('Пожалуйста, заполните обязательные поля и подтвердите согласия')
    return
  }
  
  // Check if user is authenticated
  if (!authStore.isAuthenticated) {
    showLoginModal.value = true
    return
  }
  
  ordering.value = true
  try {
    if (consents.value.rememberContacts) {
      localStorage.setItem('peptidi_guest_contacts', JSON.stringify({
        name: customer.value.name,
        phone: customer.value.phone,
        email: customer.value.email
      }))
    } else {
      localStorage.removeItem('peptidi_guest_contacts')
    }

    const deliveryData = { price: 0, city: '' }
    if (deliveryType.value === 'pvz') {
      deliveryData.price = deliveryPrice.value
      deliveryData.city = foundCityName.value
      deliveryData.type = 'pvz_cdek'
      deliveryData.tariff_code = 136
      deliveryData.tariff_name = 'Экспресс лайт склад-склад'
      deliveryData.pickup_point = selectedPickupPoint.value.code
      deliveryData.pickup_point_name = selectedPickupPoint.value.name
      deliveryData.address = selectedPickupPoint.value.address
    } else {
      deliveryData.price = INTERNAL_COURIER_PRICE
      deliveryData.city = INTERNAL_COURIER_CITY
      deliveryData.type = 'courier_internal_moscow'
      deliveryData.tariff_name = 'Курьер по Москве (внутренняя доставка)'
      deliveryData.address = courierAddress.value
    }
    
    const orderData = {
      items: cartStore.items.map(item => ({
        productId: item.id,
        quantity: item.quantity,
        selectedDosage: item.selectedDosage || null
      })),
      customerName: customer.value.name,
      customerEmail: customer.value.email,
      customerPhone: customer.value.phone,
      shippingAddress: deliveryType.value === 'courier' ? courierAddress.value : (selectedPickupPoint.value?.address || null),
      notes: customer.value.comment,
      delivery: deliveryData
    }

    const normalizedPromoCode = String(promoCode.value || '').trim().toUpperCase()
    if (normalizedPromoCode) {
      orderData.promoCode = normalizedPromoCode
    }
    
    if (authStore.isAuthenticated && authStore.user?.id) {
      orderData.userId = authStore.user.id
    }
    
    const { data } = await axios.post('/api/orders', orderData)
    lastOrderId.value = data.order?.id
    const createdOrderTotal = Number(data?.order?.total || totalWithDelivery.value)
    if (data?.meta?.partnerNotice) {
      alert(data.meta.partnerNotice)
    }
    
    if (ENABLE_CDEK && deliveryType.value === 'pvz') {
      // Create CDEK order - critical error if fails
      try {
        const safeWeight = Math.max(1, parseInt(cartStore.totalWeight) || 0)
        const cdekPayload = {
          number: `order-${lastOrderId.value}`,
          tariff_code: deliveryData.tariff_code,
          recipient_name: customer.value.name,
          recipient_phone: customer.value.phone,
          recipient_email: customer.value.email,
          packages: [{
            weight: safeWeight,
            name: 'Товар',
            cost: cartStore.total,
            amount: cartStore.count
          }]
        }

        cdekPayload.delivery_point = deliveryData.pickup_point

        const cdekResponse = await deliveryApi.post('/orders', {
          ...cdekPayload
        })

        const cdekOrderUuid = cdekResponse?.data?.entity?.uuid || cdekResponse?.data?.uuid
        if (cdekOrderUuid && lastOrderId.value) {
          await axios.put(`/api/orders/${lastOrderId.value}/cdek-link`, {
            cdekOrderUuid
          })
        }
      } catch (e) {
        console.error('CDEK order creation error:', e)
        orderError.value = 'Ошибка создания заказа в системе доставки СДЭК. Пожалуйста, попробуйте позже или выберите другой способ доставки.'
        ordering.value = false
        return
      }
    }
    
    // Create Tochka payment link
    try {
      const paymentResponse = await axios.post('/api/payment/create', {
        orderId: lastOrderId.value,
        amount: createdOrderTotal,
        description: `Оплата заказа #${lastOrderId.value}`
      })

      if (paymentResponse.data.success && paymentResponse.data.paymentUrl) {
        // Redirect to Tochka payment page
        window.location.href = paymentResponse.data.paymentUrl
        return // Don't clear cart - user will return from payment
      }
    } catch (e) {
      console.error('Payment creation error:', e)
      // Payment failed but order was created - show warning
      orderError.value = 'Заказ создан, но не удалось создать ссылку для оплаты. Свяжитесь с нами для оплаты.'
      ordering.value = false
      return
    }
    
    // If we get here without redirect, something unexpected happened
    cartStore.clear()
    orderComplete.value = true
    setTimeout(() => {
      orderComplete.value = false
    }, 10000)
  } catch (e) {
    orderError.value = e.response?.data?.error || e.response?.data?.message || e.message || 'Ошибка оформления заказа'
  } finally {
    ordering.value = false
  }
}

onMounted(async () => {
  await productStore.fetchCategories()
  prefillFromProfile()

  const savedDelivery = cartStore.delivery || {}
  if (savedDelivery.type) {
    deliveryType.value = !ENABLE_PVZ && savedDelivery.type === 'pvz' ? 'courier' : savedDelivery.type
  }
  if (savedDelivery.city) {
    foundCityName.value = savedDelivery.city
    citySearch.value = savedDelivery.city
  }
  if (savedDelivery.cityCode) {
    foundCityCode.value = savedDelivery.cityCode
  }
  if (ENABLE_PVZ && savedDelivery.type === 'pvz' && savedDelivery.pickupPoint) {
    selectedPickupPoint.value = savedDelivery.pickupPoint
  }
  if (savedDelivery.type === 'courier' && savedDelivery.courierAddress) {
    courierAddress.value = savedDelivery.courierAddress
    addressInput.value = savedDelivery.courierAddress
    foundCityName.value = INTERNAL_COURIER_CITY
    foundCityCode.value = INTERNAL_COURIER_CITY_CODE
  }
  if (savedDelivery.deliveryPrice) {
    deliveryPrice.value = savedDelivery.deliveryPrice
    cartStore.setDeliveryPrice(savedDelivery.deliveryPrice)
  }
  if (savedDelivery.deliveryInfo) {
    deliveryInfo.value = savedDelivery.deliveryInfo
  }
})

watch(() => authStore.user, () => {
  prefillFromProfile()
}, { deep: true })
</script>

<style scoped>
.cart {
  padding-bottom: 6rem;
}

.cart__hero {
  padding: 4rem 0;
  background: linear-gradient(180deg, var(--bg-secondary) 0%, var(--bg-primary) 100%);
  border-bottom: 1px solid var(--border);
  margin-bottom: 3rem;
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
  font-size: 1.5rem;
  margin-bottom: 0.75rem;
}

.empty p {
  color: var(--text-muted);
  margin-bottom: 2rem;
}

.cart__layout {
  display: grid;
  grid-template-columns: 1fr 480px;
  gap: 3rem;
  align-items: start;
}

.cart__items {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 20px;
  overflow: hidden;
}

.cart-header {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 50px;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  background: var(--bg-secondary);
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-muted);
}

.cart-item {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 50px;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid var(--border);
  align-items: center;
}

.col-product {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.item-image {
  width: 80px;
  height: 80px;
  border-radius: 12px;
  overflow: hidden;
  background: var(--bg-secondary);
  flex-shrink: 0;
}

.item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.item-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
}

.item-info h4 {
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.item-category {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.col-price,
.col-total {
  font-family: var(--font-mono);
  font-weight: 700;
}

.col-total {
  color: var(--accent);
}

.quantity-selector {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  background: var(--bg-secondary);
  border-radius: 10px;
  padding: 0.25rem;
}

.quantity-selector button {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  color: var(--text-secondary);
  border-radius: 8px;
  transition: all 0.2s ease;
}

.quantity-selector button:hover:not(:disabled) {
  background: var(--accent);
  color: var(--bg-primary);
}

.quantity-selector button:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.quantity-selector span {
  min-width: 32px;
  text-align: center;
  font-weight: 700;
}

.item-remove {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 10px;
  color: var(--text-muted);
  transition: all 0.3s ease;
}

.item-remove:hover {
  border-color: var(--danger);
  color: var(--danger);
  background: rgba(255, 100, 100, 0.1);
}

.cart-actions {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--border);
}

.btn-clear {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 10px;
  color: var(--text-muted);
  font-size: 0.85rem;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-clear:hover {
  border-color: var(--danger);
  color: var(--danger);
}

.cart__summary {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 2rem;
  position: sticky;
  top: 100px;
}

.summary-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--border);
}

.summary-header h3 {
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 700;
}

.item-count {
  font-size: 0.8rem;
  color: var(--text-muted);
  background: var(--bg-secondary);
  padding: 0.35rem 0.75rem;
  border-radius: 100px;
}

.summary-items {
  margin-bottom: 1rem;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 0.875rem 0;
  font-size: 0.9375rem;
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border);
}

.delivery-price {
  color: var(--accent);
  font-weight: 700;
}

.delivery-calc {
  color: var(--text-muted);
  font-style: italic;
}

.delivery-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.125rem;
}

.delivery-period {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.delivery-details-card {
  background: var(--bg-secondary);
  border-radius: 10px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.delivery-detail-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--border);
  font-weight: 700;
  font-size: 0.875rem;
}

.delivery-detail-row {
  display: flex;
  justify-content: space-between;
  padding: 0.375rem 0;
  font-size: 0.8125rem;
}

.delivery-detail-row span:first-child {
  color: var(--text-muted);
}

.delivery-detail-row span:last-child {
  font-weight: 600;
}

.summary-total {
  display: flex;
  justify-content: space-between;
  padding: 1.25rem 0;
  margin-bottom: 2rem;
}

.promo-code-card {
  margin-bottom: 1rem;
  padding: 0.9rem;
  border: 1px solid var(--border);
  background: var(--bg-secondary);
  border-radius: 10px;
}

.promo-code-label {
  display: block;
  margin-bottom: 0.45rem;
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-secondary);
}

.promo-code-controls {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.promo-code-input {
  flex: 1;
}

.promo-code-clear {
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-secondary);
  border-radius: 8px;
  padding: 0.55rem 0.7rem;
  font-size: 0.78rem;
  cursor: pointer;
}

.promo-code-clear:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.promo-code-hint {
  margin: 0.45rem 0 0;
  font-size: 0.75rem;
  color: var(--text-muted);
  line-height: 1.35;
}

.summary-total span:first-child {
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 700;
}

.total-value {
  font-family: var(--font-mono);
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--accent);
}

/* Pickup Section */
.pickup-section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: var(--bg-secondary);
  border-radius: 12px;
}

.pickup-section h4 {
  font-family: var(--font-display);
  font-size: 0.9rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: var(--text-secondary);
}

/* Delivery Type Options */
.delivery-type-options {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: stretch;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.delivery-type-option {
  display: flex;
  flex-direction: column;
  align-items: start;
  gap: 0.75rem;
  min-height: 88px;
  padding: 0.95rem 1rem;
  background: var(--bg-card);
  border: 2px solid var(--border);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.delivery-type-option:hover {
  border-color: var(--accent);
}

.delivery-type-option.selected {
  border-color: var(--accent);
  background: var(--accent-dim);
}

.delivery-type-option input {
  display: none;
}

.option-icon {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  border-radius: 8px;
  color: var(--text-secondary);
}

.option-icon svg {
  display: block;
}

.delivery-type-option.selected .option-icon {
  background: var(--accent);
  color: var(--bg-primary);
}

.option-content {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
}

.option-content strong {
  font-size: 0.875rem;
  line-height: 1.2;
}

.option-content span {
  font-size: 0.75rem;
  color: var(--text-muted);
  line-height: 1.35;
}

.pickup-search {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.pickup-search .input {
  flex: 1;
}

.pickup-filter {
  margin-bottom: 0.75rem;
}

.loading-pickup {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.found-info {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-bottom: 0.75rem;
}

.pickup-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 200px;
  overflow-y: auto;
}

.no-points-found {
  color: var(--text-muted);
  font-size: 0.9rem;
  padding: 0.5rem 0.25rem;
}

.pickup-point {
  display: flex;
  padding: 0.75rem;
  background: var(--bg-card);
  border: 2px solid var(--border);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.pickup-point:hover {
  border-color: var(--accent);
}

.pickup-point.selected {
  border-color: var(--accent);
  background: var(--accent-dim);
}

.pickup-point input {
  margin-right: 0.75rem;
  margin-top: 0.25rem;
}

.point-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.point-content strong {
  font-size: 0.9rem;
}

.point-address,
.point-time {
  font-size: 0.8rem;
  color: var(--text-muted);
}

/* Selected Pickup */
.selected-pickup {
  margin-top: 1rem;
}

.selected-pickup .pickup-point {
  flex: 1;
}

.btn-change-pickup {
  margin-top: 0.75rem;
  padding: 0.5rem 1rem;
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text-muted);
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-change-pickup:hover {
  border-color: var(--accent);
  color: var(--accent);
}

/* Form */
.checkout-form h4 {
  font-family: var(--font-display);
  font-size: 0.9rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: var(--text-secondary);
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

.btn-submit {
  width: 100%;
  margin-top: 1rem;
  padding: 1rem;
}

.consents {
  margin-top: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.consent-item {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  font-size: 0.8rem;
  color: var(--text-secondary);
  line-height: 1.45;
}

.consent-item input[type="checkbox"] {
  margin-top: 0.15rem;
  width: 16px;
  height: 16px;
  accent-color: var(--accent);
  flex-shrink: 0;
}

.consent-item a {
  color: var(--accent);
  text-decoration: underline;
}

.consent-item--full {
  padding-top: 0.25rem;
}

/* Modal Overlay */
.order-success-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.order-success-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 2.5rem;
  max-width: 420px;
  width: 100%;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.order-success-card .success-checkmark {
  color: var(--accent);
  margin-bottom: 1.5rem;
}

.order-success-card h3 {
  font-family: var(--font-display);
  font-size: 1.5rem;
  margin-bottom: 0.75rem;
}

.order-success-card p {
  color: var(--text-muted);
  margin-bottom: 1.5rem;
}

.success-order-id {
  display: inline-block;
  background: var(--accent-dim);
  color: var(--accent);
  font-weight: 700;
  padding: 0.5rem 1rem;
  border-radius: 10px;
  margin-bottom: 1.5rem;
}

/* Error Card */
.order-error-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 2.5rem;
  max-width: 420px;
  width: 100%;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.order-error-card .error-icon {
  color: var(--danger);
  margin-bottom: 1.5rem;
}

.order-error-card h3 {
  font-family: var(--font-display);
  font-size: 1.5rem;
  margin-bottom: 0.75rem;
}

.order-error-card p {
  color: var(--text-muted);
  margin-bottom: 1.5rem;
}

.error-order-id {
  display: inline-block;
  background: rgba(255, 100, 100, 0.1);
  color: var(--danger);
  font-weight: 700;
  padding: 0.5rem 1rem;
  border-radius: 10px;
  margin-bottom: 1.5rem;
}

.error-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
}

.error-actions .btn {
  min-width: 120px;
}

/* Login Modal */
.login-modal {
  position: relative;
  padding: 0;
}

.login-icon {
  color: var(--accent);
  margin-bottom: 1rem;
}

.login-modal p {
  color: var(--text-muted);
  margin-bottom: 1.5rem;
}

.login-form {
  width: 100%;
}

.login-error {
  color: var(--danger);
  font-size: 0.85rem;
  margin-bottom: 0.5rem;
  padding: 0.5rem;
  background: rgba(255, 100, 100, 0.1);
  border-radius: 8px;
  text-align: center;
}

.login-divider {
  text-align: center;
  color: var(--text-muted);
  margin: 1rem 0;
  font-size: 0.85rem;
}

.login-modal .btn-secondary {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  color: var(--text);
}

.login-modal .btn-secondary:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.btn-close-modal {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 8px;
  transition: all 0.2s;
}

.btn-close-modal:hover {
  background: var(--bg-secondary);
  color: var(--text);
}

@media (max-width: 768px) {
  .cart__layout {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .cart-header {
    display: none;
  }

  .cart-item {
    grid-template-columns: 1fr;
    gap: 0.75rem;
    padding: 1rem;
  }

  .col-product {
    align-items: flex-start;
  }

  .item-image {
    width: 64px;
    height: 64px;
  }

  .item-info h4 {
    font-size: 0.9rem;
    line-height: 1.35;
  }

  .col-qty,
  .col-price,
  .col-total,
  .col-remove {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    width: 100%;
  }

  .col-qty::before {
    content: 'Количество';
    color: var(--text-muted);
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .col-price::before {
    content: 'Цена';
    color: var(--text-muted);
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .col-total::before {
    content: 'Сумма';
    color: var(--text-muted);
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .col-remove {
    justify-content: flex-end;
  }

  .cart-actions {
    padding: 0.75rem 1rem;
  }

  .checkout-card {
    position: static;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .delivery-price {
    font-size: 0.95rem;
  }

  .checkout-total {
    font-size: 1.5rem;
  }

  .order-summary-row {
    font-size: 0.875rem;
  }

  .delivery-type-options {
    grid-template-columns: 1fr;
  }
}

/* New Login Modal Styles */
.login-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.login-modal-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 24px;
  padding: 2.5rem;
  max-width: 380px;
  width: 100%;
  text-align: center;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.4);
  position: relative;
}

.login-modal-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: var(--bg-secondary);
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 10px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-modal-close:hover {
  background: var(--bg-hover);
  color: var(--text);
}

.login-modal-icon {
  width: 72px;
  height: 72px;
  margin: 0 auto 1.5rem;
  background: var(--accent-dim);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent);
}

.login-modal-title {
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 800;
  margin-bottom: 0.5rem;
  color: var(--text-primary);
}

.login-modal-subtitle {
  font-size: 0.9rem;
  color: var(--text-muted);
  margin-bottom: 1.75rem;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.login-input-group {
  text-align: left;
}

.login-input-group label {
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  margin-bottom: 0.5rem;
}

.login-input {
  width: 100%;
  padding: 0.875rem 1rem;
  background: var(--bg-secondary);
  border: 2px solid var(--border);
  border-radius: 12px;
  font-size: 0.9375rem;
  color: var(--text-primary);
  transition: all 0.2s;
}

.login-input:focus {
  outline: none;
  border-color: var(--accent);
  background: var(--bg-primary);
}

.login-input::placeholder {
  color: var(--text-muted);
}

.login-error {
  color: var(--danger);
  font-size: 0.8125rem;
  margin-top: 0.5rem;
  padding: 0.75rem;
  background: rgba(255, 100, 100, 0.1);
  border-radius: 10px;
  text-align: center;
}

.login-btn {
  width: 100%;
  padding: 1rem;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.login-btn-primary {
  background: var(--accent);
  border: none;
  color: var(--bg-primary);
}

.login-btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(163, 255, 18, 0.3);
}

.login-btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.login-or {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: var(--text-muted);
  font-size: 0.875rem;
}

.login-link {
  color: var(--accent);
  font-weight: 600;
  text-decoration: none;
  transition: color 0.2s;
}

.login-link:hover {
  color: var(--accent-hover);
  text-decoration: underline;
}
</style>
