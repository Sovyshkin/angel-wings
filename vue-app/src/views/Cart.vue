<template>
  <div class="cart">
    <div class="cart__hero" data-aos="fade-up">
      <div class="container">
        <h1 class="page-title">{{ isOrderAdditionMode ? `Дозаказ к заказу #${additionOrder?.id || ''}` : 'Корзина' }}</h1>
        <p class="page-subtitle">
          {{ isOrderAdditionMode ? 'Добавьте новые товары к уже оформленному заказу' : 'Оформите заказ на выбранные товары' }}
        </p>
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
          <div v-if="lastOrderId" class="error-order-id">Заказ #{{ lastOrderId }}</div>
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
      <div v-if="cartStore.items.length === 0 && !isOrderAdditionMode && !isOrderAdditionRequested" class="empty" data-aos="fade-up">
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
          <div v-if="isOrderAdditionMode" class="addition-mode-card">
            <div class="addition-mode-card__head">
              <span class="addition-mode-card__badge">Дозаказ</span>
              <div>
                <h3>Текущий заказ #{{ additionOrder?.id }}</h3>
                <p>Эти товары уже оформлены и не входят в сумму доплаты.</p>
              </div>
            </div>

            <div v-if="loadingAdditionOrder" class="addition-loading">
              <span class="spinner"></span>
              Загружаем текущий заказ...
            </div>

            <div v-else class="existing-order-items">
              <article
                v-for="item in additionExistingItems"
                :key="`existing-${item.id}`"
                class="existing-order-item"
              >
                <div class="item-image">
                  <img :src="item.product?.image || '/logo.png'" :alt="item.product?.title || `Товар #${item.productId}`" @error="handleImageError">
                </div>
                <div class="existing-order-item__body">
                  <h4>{{ item.product?.title || `Товар #${item.productId}` }}</h4>
                  <span v-if="item.dosage" class="item-category">Дозировка: {{ item.dosage }}</span>
                  <span class="existing-order-item__note">Уже в заказе, не оплачивается повторно</span>
                </div>
                <div class="existing-order-item__meta">
                  <span>{{ item.quantity }} шт</span>
                  <strong>{{ ((item.price || 0) * (item.quantity || 0)).toLocaleString('ru-RU') }} ₽</strong>
                </div>
              </article>
            </div>

            <div class="addition-mode-actions">
              <router-link to="/catalog" class="btn btn-secondary">Добавить товары из каталога</router-link>
              <button class="btn-cancel-addition" @click="cancelOrderAddition">Отменить дозаказ</button>
            </div>
          </div>

          <div class="cart-section-title">
            <h3>{{ isOrderAdditionMode ? 'Новые товары для дозаказа' : 'Товары в корзине' }}</h3>
            <p v-if="isOrderAdditionMode">В доплату попадут только позиции из этого блока.</p>
          </div>

          <div v-if="cartStore.items.length === 0" class="addition-empty">
            <p>Новые товары ещё не добавлены. Перейдите в каталог и добавьте нужные позиции.</p>
            <router-link to="/catalog" class="btn btn-primary">Перейти в каталог</router-link>
          </div>

          <template v-else>
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
            <button class="btn-clear" @click="clearCartItems">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
              </svg>
              {{ isOrderAdditionMode ? 'Очистить новые товары' : 'Очистить корзину' }}
            </button>
          </div>
          </template>
        </div>
        
        <div class="cart__summary" data-aos="fade-left" data-aos-delay="200">
          <div class="summary-header">
            <h3>{{ isOrderAdditionMode ? 'Расчёт дозаказа' : 'Ваш заказ' }}</h3>
            <span class="item-count">{{ cartStore.count }} новых товаров</span>
          </div>
          
          <div class="summary-items">
            <div v-if="isOrderAdditionMode" class="summary-row summary-row-muted">
              <span>Уже в заказе</span>
              <span>{{ additionOldTotal.toLocaleString('ru-RU') }} ₽</span>
            </div>
            <div class="summary-row">
              <span>{{ isOrderAdditionMode ? 'Новые товары' : 'Товары' }}</span>
              <span>{{ cartStore.total.toLocaleString() }} ₽</span>
            </div>
            <div v-if="!isOrderAdditionMode" class="summary-row">
              <span>{{ deliverySummaryLabel }}</span>
              <div class="delivery-info">
                <span v-if="deliveryPrice > 0" class="delivery-price">{{ deliveryPrice.toLocaleString() }} ₽</span>
                <span v-else-if="isDeliverySelected" class="delivery-calc">Бесплатно</span>
                <span v-else class="delivery-calc">Не выбрана</span>
                <span v-if="deliveryInfo.period_min && deliveryInfo.period_max" class="delivery-period">
                  {{ deliveryInfo.period_min }}-{{ deliveryInfo.period_max }} дн.
                </span>
              </div>
            </div>
            <div v-if="isOrderAdditionMode" class="summary-row">
              <span>Доплата за доставку</span>
              <div class="delivery-info">
                <span class="delivery-price">{{ additionDeliveryAdjustment.toLocaleString('ru-RU') }} ₽</span>
                <span v-if="additionPreviewLoading" class="delivery-period">пересчитываем...</span>
              </div>
            </div>
            <div v-if="promoDiscountPreview > 0 && !isOrderAdditionMode" class="summary-row summary-row-discount">
              <span>Скидка по промокоду на товары</span>
              <span>-{{ promoDiscountPreview.toLocaleString() }} ₽</span>
            </div>
            <div v-if="partnerBonusToUse > 0 && !isOrderAdditionMode" class="summary-row summary-row-discount summary-row-discount--partner">
              <span>Оплата из прибыли партнёра</span>
              <span>-{{ partnerBonusToUse.toLocaleString() }} ₽</span>
            </div>
          </div>

          <!-- Delivery Details Card -->
          <div v-if="isOrderAdditionMode" class="delivery-details-card addition-delivery-card">
            <div class="delivery-detail-header">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="1" y="3" width="15" height="13"/>
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
                <circle cx="5.5" cy="18.5" r="2.5"/>
                <circle cx="18.5" cy="18.5" r="2.5"/>
              </svg>
              <span>Доставка текущего заказа</span>
            </div>
            <div class="delivery-detail-row">
              <span>Способ:</span>
              <span>{{ additionOrder?.deliveryTariffName || 'Доставка из заказа' }}</span>
            </div>
            <div class="delivery-detail-row">
              <span>Адрес:</span>
              <span>{{ additionOrder?.shippingAddress || additionOrder?.deliveryPickupName || additionOrder?.deliveryCity || '—' }}</span>
            </div>
            <div class="delivery-detail-row">
              <span>Текущая доставка:</span>
              <span>{{ additionCurrentDeliveryPrice.toLocaleString('ru-RU') }} ₽</span>
            </div>
            <div v-if="additionQuote?.warning" class="addition-warning">
              {{ additionQuote.warning }}
            </div>
          </div>

          <div v-else-if="isDeliverySelected" class="delivery-details-card">
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
              <span>{{ deliveryTariffLabel }}</span>
            </div>
          </div>
          
          <div class="summary-total">
            <span>{{ isOrderAdditionMode ? additionTotalLabel : 'Итого' }}</span>
            <span class="total-value">{{ visibleTotal.toLocaleString('ru-RU') }} ₽</span>
          </div>
          
          <!-- Delivery Type Selection -->
          <div v-if="!isOrderAdditionMode" ref="pickupSectionRef" class="pickup-section" :class="{ 'pickup-section--error': showValidationErrors && isDeliveryMissing }" tabindex="-1">
            <h4>Способ получения <span class="required-mark">*</span></h4>
            
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
                <div class="option-meta">
                  <span class="option-price">по тарифу</span>
                  <span class="option-check"></span>
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
                <div class="option-meta">
                  <span class="option-price">690 ₽</span>
                  <span class="option-check"></span>
                </div>
              </label>

              <label
                class="delivery-type-option"
                :class="{ selected: deliveryType === 'self_pickup' && SELF_PICKUP_AVAILABLE, 'delivery-type-option--disabled': !SELF_PICKUP_AVAILABLE }"
              >
                <input
                  type="radio"
                  value="self_pickup"
                  v-model="deliveryType"
                  :disabled="!SELF_PICKUP_AVAILABLE"
                  @change="onDeliveryTypeChange"
                >
                <div class="option-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 21h18"/>
                    <path d="M5 21V7l8-4 8 4v14"/>
                    <path d="M9 21v-8h6v8"/>
                    <path d="M9 9h.01M15 9h.01"/>
                  </svg>
                </div>
                <div class="option-content">
                  <strong>
                    Самовывоз
                    <span v-if="!SELF_PICKUP_AVAILABLE" class="option-unavailable-badge">Временно недоступен</span>
                  </strong>
                  <span>Москва, Чкаловский бульвар, 6</span>
                </div>
                <div class="option-meta">
                  <span v-if="SELF_PICKUP_AVAILABLE" class="option-price option-price--free">Бесплатно</span>
                  <span v-else class="option-unavailable-dot" aria-hidden="true"></span>
                  <span class="option-check"></span>
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
                  v-model="pickupCombinedSearch" 
                  type="text" 
                  class="input" 
                  placeholder="Город и улица, например: Москва, Тверская"
                  @keyup.enter="searchCityAndPickup"
                >
                <button class="btn btn-secondary" @click="searchCityAndPickup" :disabled="loadingPickup">
                  Найти
                </button>
              </div>
              <p class="pickup-search-hint">
                Можно указать только город или город и улицу через запятую.
              </p>
              
              <div v-if="foundCityName" class="found-info">
                ПВЗ в г. {{ foundCityName }}<span v-if="pickupFilter">, поиск: {{ pickupFilter }}</span>
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
                <label>Адрес доставки <span class="required-mark">*</span></label>
                <textarea 
                  ref="courierAddressInputRef"
                  v-model="addressInput" 
                  class="input"
                  :class="{ 'input--error': (showValidationErrors && isCourierAddressMissing) || Boolean(courierAddressError) }"
                  rows="3" 
                  placeholder="Например: Москва, Тверская улица, 7, кв. 15"
                ></textarea>
                <p v-if="courierAddressError" class="field-error">{{ courierAddressError }}</p>
                <p v-else-if="courierAddressHint" class="field-hint">{{ courierAddressHint }}</p>
              </div>
              
              <button 
                class="btn btn-primary" 
                style="width: 100%; margin-top: 1rem;"
                @click="selectCourierDelivery"
                :disabled="!addressInput || validatingCourierAddress"
              >
                {{ validatingCourierAddress ? 'Проверяем адрес...' : 'Подтвердить адрес' }}
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

            <!-- Selected Self Pickup -->
            <div v-if="!loadingDelivery && SELF_PICKUP_AVAILABLE && deliveryType === 'self_pickup'" class="selected-pickup">
              <div class="pickup-point selected">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                <div class="point-content">
                  <strong>Самовывоз</strong>
                  <span class="point-address">{{ SELF_PICKUP_CITY }}</span>
                  <span class="point-time">{{ SELF_PICKUP_ADDRESS }}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div v-if="!isOrderAdditionMode" class="checkout-form">
            <h4 v-if="authStore.isAuthenticated">Данные из профиля</h4>
            <h4 v-else>Контактные данные</h4>
            <p class="required-note">Поля со <span class="required-mark">*</span> обязательны</p>
            <div class="form-group">
              <label>Имя <span class="required-mark">*</span></label>
              <input
                ref="nameInputRef"
                v-model="customer.name"
                type="text"
                class="input"
                :class="{ 'input--error': showValidationErrors && isNameMissing }"
                placeholder="Иван Иванов"
                :disabled="authStore.isAuthenticated"
                required
              >
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Телефон <span class="required-mark">*</span></label>
                <input
                  ref="phoneInputRef"
                  v-model="customer.phone"
                  type="tel"
                  class="input"
                  :class="{ 'input--error': showValidationErrors && (isPhoneMissing || isPhoneInvalid) }"
                  placeholder="+7 995 901-64-88"
                  required
                >
                <p v-if="showValidationErrors && isPhoneInvalid" class="field-error">
                  Укажите телефон в формате +7 999 999-99-99
                </p>
              </div>
              <div class="form-group">
                <label>Email для чека <span class="required-mark">*</span></label>
                <input
                  ref="emailInputRef"
                  v-model="customer.email"
                  type="email"
                  class="input"
                  :class="{ 'input--error': showValidationErrors && isEmailMissing }"
                  placeholder="example@mail.ru"
                  required
                >
              </div>
            </div>
            <div class="form-group">
              <label>Комментарий к заказу <span class="optional-mark">(необязательно)</span></label>
              <textarea v-model="customer.comment" class="input" rows="2" placeholder="Дополнительные пожелания..."></textarea>
            </div>

            <div class="promo-code-card">
              <label class="promo-code-label" for="promo-code-input">Промокод <span class="optional-mark">(необязательно)</span></label>
              <div class="promo-code-controls">
                <input
                  id="promo-code-input"
                  v-model="promoCode"
                  type="text"
                  class="input promo-code-input"
                  placeholder="Введите промокод"
                  @input="normalizePromoCodeInput"
                >
                <button v-if="promoCode" type="button" class="promo-code-clear" @click="clearPromoCode">Сбросить</button>
              </div>
              <p v-if="promoFeedbackMessage" :class="['promo-code-status', `promo-code-status--${promoFeedbackType}`]">
                {{ promoFeedbackMessage }}
              </p>
              <p v-else class="promo-code-hint">Промокод применяется автоматически после ввода.</p>
            </div>

            <div v-if="authStore.isAuthenticated && hasPartnerBalanceAccess" class="promo-code-card partner-balance-card">
              <label class="promo-code-label" for="partner-bonus-input">Списать из партнёрской прибыли</label>
              <div class="promo-code-controls">
                <input
                  id="partner-bonus-input"
                  v-model="partnerBonusAmount"
                  type="number"
                  min="0"
                  step="1"
                  class="input promo-code-input"
                  placeholder="0"
                  @input="normalizePartnerBonusInput"
                >
                <button
                  v-if="partnerBonusToUse > 0"
                  type="button"
                  class="promo-code-clear"
                  @click="partnerBonusAmount = ''"
                >
                  Сбросить
                </button>
              </div>
              <p class="promo-code-hint">
                Доступно: <strong>{{ partnerBalanceAvailable.toLocaleString('ru-RU') }} ₽</strong>.
                Можно списать до 100% суммы заказа.
              </p>
              <p v-if="partnerBalanceError" class="promo-code-status promo-code-status--error">{{ partnerBalanceError }}</p>
            </div>

            <div v-if="deliveryType === 'courier'" class="payment-method-card">
              <div class="payment-method-header">
                <span class="payment-method-eyebrow">Оплата</span>
                <h4>Способ оплаты <span class="required-mark">*</span></h4>
              </div>

              <div class="payment-method-options">
                <label
                  class="payment-method-option"
                  :class="{ selected: paymentMethod === 'online' }"
                >
                  <input type="radio" value="online" v-model="paymentMethod">
                  <span class="payment-method-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="2" y="5" width="20" height="14" rx="2"/>
                      <path d="M2 10h20"/>
                    </svg>
                  </span>
                  <span class="payment-method-content">
                    <strong>Онлайн-оплата</strong>
                    <small>Картой или СБП через платёжную страницу</small>
                  </span>
                  <span class="payment-method-check"></span>
                </label>

                <label
                  class="payment-method-option"
                  :class="{ selected: paymentMethod === 'cash_on_delivery' }"
                >
                  <input type="radio" value="cash_on_delivery" v-model="paymentMethod">
                  <span class="payment-method-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M7 7h10a2 2 0 012 2v6a2 2 0 01-2 2H7a2 2 0 01-2-2V9a2 2 0 012-2z"/>
                      <circle cx="12" cy="12" r="2"/>
                      <path d="M5 10a3 3 0 003-3M16 17a3 3 0 003-3"/>
                    </svg>
                  </span>
                  <span class="payment-method-content">
                    <strong>Наличными курьеру</strong>
                    <small>Оплата при получении заказа в Москве</small>
                  </span>
                  <span class="payment-method-check"></span>
                </label>
              </div>
            </div>

            <div ref="consentsSectionRef" class="consents" :class="{ 'consents--error': showValidationErrors && hasConsentErrors }" tabindex="-1">
              <label class="consent-item">
                <input type="checkbox" v-model="consents.rememberContacts">
                <span>Запомнить контакты в браузере для повторной покупки</span>
              </label>
              <label class="consent-item" :class="{ 'consent-item--error': showValidationErrors && !consents.acceptOffer }">
                <input type="checkbox" v-model="consents.acceptOffer">
                <span>
                  <span class="required-mark">*</span>
                  Я согласен с условиями
                  <a href="/public-offer-2026.pdf" target="_blank" rel="noopener">Оферты</a>
                </span>
              </label>
              <label class="consent-item" :class="{ 'consent-item--error': showValidationErrors && !consents.acceptMarketing }">
                <input type="checkbox" v-model="consents.acceptMarketing">
                <span><span class="required-mark">*</span> Я согласен на получение информационных и рекламных сообщений</span>
              </label>
              <label class="consent-item" :class="{ 'consent-item--error': showValidationErrors && !consents.acceptPrivacy }">
                <input type="checkbox" v-model="consents.acceptPrivacy">
                <span>
                  <span class="required-mark">*</span>
                  Я согласен на обработку моих персональных данных для целей и на условиях, изложенных в
                  <a href="/policy.pdf" target="_blank" rel="noopener">Политике конфиденциальности</a>
                </span>
              </label>
              <label class="consent-item consent-item--full" :class="{ 'consent-item--error': showValidationErrors && !consents.acceptResearchTerms }">
                <input type="checkbox" v-model="consents.acceptResearchTerms">
                <span>
                  <span class="required-mark">*</span>
                  Мне уже есть полных 18 лет. Я квалифицированный специалист. Я согласен с тем, что материал,
                  представленный на этом сайте, для профессионального использования. Я согласен с тем, что Образцы,
                  приобретенные на этом сайте, для исследовательских целей, и не будут использоваться для человека
                  или животного и/или для приема внутрь. Образцы не будут использоваться в качестве лекарств,
                  биологически активных добавок, косметических средства или бытовой химии.
                </span>
              </label>
            </div>

            <div v-if="validationErrors.length" class="form-validation-card" role="alert" aria-live="polite">
              <div class="form-validation-card__title">Проверьте форму перед оформлением</div>
              <ul class="form-validation-card__list">
                <li v-for="(item, idx) in validationErrors" :key="`validation-${idx}`">{{ item }}</li>
              </ul>
            </div>

            <button class="btn btn-primary btn-submit" @click="placeOrder" :disabled="ordering">
              <svg v-if="!ordering" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              <span v-if="ordering" class="spinner"></span>
              {{ ordering ? 'Оформляем...' : 'Оформить заказ' }}
            </button>
          </div>

          <div v-else class="addition-checkout-card">
            <p>
              Старые позиции заказа отображаются слева для контроля состава, но в доплату попадут только новые товары.
            </p>

            <div v-if="validationErrors.length" class="form-validation-card" role="alert" aria-live="polite">
              <div class="form-validation-card__title">Проверьте дозаказ</div>
              <ul class="form-validation-card__list">
                <li v-for="(item, idx) in validationErrors" :key="`addition-validation-${idx}`">{{ item }}</li>
              </ul>
            </div>

            <button class="btn btn-primary btn-submit" @click="placeOrder" :disabled="ordering || loadingAdditionOrder || !cartStore.items.length">
              <svg v-if="!ordering" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              <span v-if="ordering" class="spinner"></span>
              {{ ordering ? 'Оформляем дозаказ...' : additionSubmitLabel }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useCartStore } from '../store/cart'
import { useProductStore } from '../store/products'
import { useAuthStore } from '../store/auth'
import axios from 'axios'
import deliveryApi from '../api/delivery'

const router = useRouter()
const route = useRoute()
const cartStore = useCartStore()
const productStore = useProductStore()
const authStore = useAuthStore()
const ENABLE_PVZ = true
const ENABLE_CDEK = true
const INTERNAL_COURIER_CITY = 'Москва'
const INTERNAL_COURIER_CITY_CODE = '44'
const INTERNAL_COURIER_PRICE = 690
const SELF_PICKUP_CITY = 'Москва'
const SELF_PICKUP_ADDRESS = 'г. Москва, Чкаловский бульвар, 6'
const SELF_PICKUP_PRICE = 0
const SELF_PICKUP_AVAILABLE = false
const CHECKOUT_REQUEST_KEY = 'peptidi_checkout_request_guard'
const ATTRIBUTION_STORAGE_KEY = 'angel_wings_attribution'
const ATTRIBUTION_KEYS = ['aw_m', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']

function captureAttributionFromUrl() {
  if (typeof window === 'undefined') return
  const params = new URLSearchParams(window.location.search)
  const attribution = {}

  ATTRIBUTION_KEYS.forEach(key => {
    const value = params.get(key)
    if (value) attribution[key] = value.slice(0, 160)
  })

  if (!Object.keys(attribution).length) return

  try {
    localStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify({
      ...attribution,
      capturedAt: new Date().toISOString()
    }))
  } catch {
    // UTM-метки не должны ломать оформление заказа.
  }
}

function getStoredAttribution() {
  if (typeof window === 'undefined') return {}
  try {
    const parsed = JSON.parse(localStorage.getItem(ATTRIBUTION_STORAGE_KEY) || '{}')
    return ATTRIBUTION_KEYS.reduce((result, key) => {
      if (parsed?.[key]) result[key] = parsed[key]
      return result
    }, {})
  } catch {
    return {}
  }
}

function normalizeRussianPhone(value) {
  const digits = String(value || '').replace(/\D/g, '')

  if (digits.length === 11 && digits.startsWith('8')) {
    return `+7${digits.slice(1)}`
  }

  if (digits.length === 11 && digits.startsWith('7')) {
    return `+${digits}`
  }

  if (digits.length === 10 && digits.startsWith('9')) {
    return `+7${digits}`
  }

  return null
}

const customer = ref({ name: '', phone: '', email: '', comment: '' })
const consents = ref({
  rememberContacts: true,
  acceptOffer: true,
  acceptMarketing: true,
  acceptPrivacy: true,
  acceptResearchTerms: true
})
const promoCode = ref('')
const promoDiscountPreview = ref(0)
const promoFeedbackType = ref('idle')
const promoFeedbackMessage = ref('')
const hasPartnerBalanceAccess = ref(false)
const partnerBalanceAvailable = ref(0)
const partnerBalanceLoading = ref(false)
const partnerBalanceError = ref('')
const partnerBonusAmount = ref('')
const validatingPromo = ref(false)
const ordering = ref(false)
const validationErrors = ref([])
const orderComplete = ref(false)
const orderError = ref(null)
const lastOrderId = ref(null)
const completedOrderAddition = ref(false)
const showLoginModal = ref(false)
const loginForm = ref({ email: '', password: '' })
const loginError = ref('')
const loggingIn = ref(false)

// Delivery state
const deliveryType = ref(ENABLE_PVZ ? 'pvz' : 'courier') // 'pvz', 'courier' or 'self_pickup'
const citySearch = ref('')
const pickupCombinedSearch = ref('')
const foundCityName = ref('')
const foundCityCode = ref('')
const pickupPoints = ref([])
const pickupFilter = ref('')
const selectedPickupPoint = ref(null)
const courierAddress = ref('')
const addressInput = ref('')
const courierAddressError = ref('')
const courierAddressHint = ref('')
const validatingCourierAddress = ref(false)
const loadingPickup = ref(false)
const loadingDelivery = ref(false)
const deliveryPrice = ref(0)
const deliveryInfo = ref({})
const paymentMethod = ref('online')
const additionOrder = ref(null)
const additionQuote = ref(null)
const loadingAdditionOrder = ref(false)
const additionPreviewLoading = ref(false)
let additionPreviewTimer = null
let promoValidateTimer = null
let promoValidateSeq = 0
const pickupSectionRef = ref(null)
const consentsSectionRef = ref(null)
const nameInputRef = ref(null)
const phoneInputRef = ref(null)
const emailInputRef = ref(null)
const courierAddressInputRef = ref(null)

const isNameMissing = computed(() => !String(customer.value.name || '').trim())
const isPhoneMissing = computed(() => !String(customer.value.phone || '').trim())
const normalizedCustomerPhone = computed(() => normalizeRussianPhone(customer.value.phone))
const isPhoneInvalid = computed(() => {
  return !isPhoneMissing.value && !normalizedCustomerPhone.value
})
const isEmailMissing = computed(() => !String(customer.value.email || '').trim())
const isCourierAddressMissing = computed(() => {
  return deliveryType.value === 'courier' && !String(courierAddress.value || '').trim()
})
const isDeliveryMissing = computed(() => {
  if (!ENABLE_CDEK) return false
  if (deliveryType.value === 'pvz') return !selectedPickupPoint.value
  if (deliveryType.value === 'courier') return isCourierAddressMissing.value
  return false
})
const hasConsentErrors = computed(() => {
  return !consents.value.acceptOffer ||
    !consents.value.acceptMarketing ||
    !consents.value.acceptPrivacy ||
    !consents.value.acceptResearchTerms
})
const showValidationErrors = computed(() => validationErrors.value.length > 0)

const isOrderAdditionMode = computed(() => Boolean(additionOrder.value?.id))
const isOrderAdditionRequested = computed(() => Boolean(getOrderAdditionId()))
const additionExistingItems = computed(() => additionOrder.value?.items || [])
const additionOldTotal = computed(() => Math.max(0, Number(additionOrder.value?.total || 0)))
const additionCurrentDeliveryPrice = computed(() => Math.max(0, Number(additionOrder.value?.deliveryPrice || 0)))
const additionDeliveryAdjustment = computed(() => Math.max(0, Number(additionQuote.value?.deliveryAdjustment || 0)))
const additionPaymentAmount = computed(() => {
  if (!isOrderAdditionMode.value) return 0
  return Math.max(0, Number(additionQuote.value?.paymentAmount ?? cartStore.total))
})
const additionTotalLabel = computed(() => {
  return additionQuote.value?.paymentMode === 'cash_on_delivery' ? 'Доплата курьеру' : 'К оплате сейчас'
})
const additionSubmitLabel = computed(() => {
  return additionQuote.value?.paymentMode === 'cash_on_delivery' ? 'Добавить к заказу' : 'Добавить и оплатить'
})
const visibleTotal = computed(() => {
  return isOrderAdditionMode.value ? additionPaymentAmount.value : totalAfterPartnerBonus.value
})

const filteredPickupPoints = computed(() => {
  const q = pickupFilter.value.trim().toLowerCase()
  if (!q) return pickupPoints.value
  return pickupPoints.value.filter(point => {
    const name = String(point?.name || '').toLowerCase()
    const address = String(point?.address || '').toLowerCase()
    return name.includes(q) || address.includes(q)
  })
})

const parsedPickupSearch = computed(() => {
  const raw = String(pickupCombinedSearch.value || '').trim()
  if (!raw) return { city: '', street: '' }

  const commaParts = raw.split(',').map(part => part.trim()).filter(Boolean)
  if (commaParts.length > 1) {
    return {
      city: commaParts[0],
      street: commaParts.slice(1).join(' ')
    }
  }

  const words = raw.split(/\s+/).filter(Boolean)
  if (words.length === 1) {
    return { city: raw, street: '' }
  }

  const first = words[0].toLowerCase()
  const second = words[1]?.toLowerCase() || ''
  const threeWordCityStarts = new Set(['ростов'])
  const twoWordCityStarts = new Set([
    'санкт',
    'нижний',
    'великий',
    'великие',
    'старый',
    'новый',
    'новая',
    'набережные',
    'минеральные',
    'сергиев'
  ])

  if (threeWordCityStarts.has(first) && second === 'на' && words.length >= 3) {
    return {
      city: words.slice(0, 3).join(' '),
      street: words.slice(3).join(' ')
    }
  }

  if (twoWordCityStarts.has(first) && words.length >= 2) {
    return {
      city: words.slice(0, 2).join(' '),
      street: words.slice(2).join(' ')
    }
  }

  return {
    city: words[0],
    street: words.slice(1).join(' ')
  }
})

const isDeliverySelected = computed(() => {
  if (deliveryType.value === 'pvz') return Boolean(selectedPickupPoint.value)
  if (deliveryType.value === 'courier') return Boolean(courierAddress.value) && !courierAddressError.value
  return deliveryType.value === 'self_pickup' && SELF_PICKUP_AVAILABLE
})

const deliverySummaryLabel = computed(() => {
  if (deliveryType.value === 'pvz') return 'Доставка СДЭК'
  if (deliveryType.value === 'courier') return 'Курьер по Москве'
  return 'Самовывоз'
})

const deliveryTariffLabel = computed(() => {
  if (deliveryType.value === 'pvz') return 'ПВЗ СДЭК'
  if (deliveryType.value === 'courier') return 'Курьер по Москве (внутренняя)'
  return 'Самовывоз'
})
const promoCodeNormalized = computed(() => String(promoCode.value || '').trim().toUpperCase())

function normalizePromoCodeInput() {
  promoCode.value = String(promoCode.value || '')
    .toUpperCase()
    .replace(/\s+/g, '')
}

function normalizePartnerBonusInput() {
  const raw = String(partnerBonusAmount.value || '')
  if (!raw.trim()) {
    partnerBonusAmount.value = ''
    return
  }
  const normalized = raw.replace(',', '.').replace(/[^\d.]/g, '')
  const numeric = Math.max(0, Number(normalized) || 0)
  const maxAllowed = Math.min(
    Math.max(0, Number(partnerBalanceAvailable.value || 0)),
    Math.max(0, Number(totalWithPromo.value || 0))
  )
  partnerBonusAmount.value = String(Math.min(numeric, maxAllowed))
}

function clearPromoCode() {
  promoCode.value = ''
  promoDiscountPreview.value = 0
  promoFeedbackType.value = 'idle'
  promoFeedbackMessage.value = ''
}

function setPromoFeedback(type, message) {
  promoFeedbackType.value = type
  promoFeedbackMessage.value = message
}

function schedulePromoValidation(delayMs = 450) {
  if (promoValidateTimer) clearTimeout(promoValidateTimer)
  promoValidateTimer = setTimeout(() => {
    validatePromoCode()
  }, delayMs)
}

async function validatePromoCode(options = {}) {
  const { silent = false } = options
  const code = promoCodeNormalized.value
  const currentAmount = Number(cartStore.total || 0)

  if (!code) {
    promoDiscountPreview.value = 0
    if (!silent) {
      setPromoFeedback('idle', '')
    }
    return { valid: false, reason: 'empty' }
  }

  if (!authStore.isAuthenticated) {
    promoDiscountPreview.value = 0
    setPromoFeedback('info', 'Войдите в аккаунт, чтобы применить промокод')
    return { valid: false, reason: 'auth_required', message: 'Войдите в аккаунт, чтобы применить промокод' }
  }

  const seq = ++promoValidateSeq
  validatingPromo.value = true
  if (!silent) {
    setPromoFeedback('info', 'Проверяем промокод...')
  }

  try {
    const { data } = await axios.post('/api/orders/promo/validate', {
      code,
      amount: currentAmount
    })

    if (seq !== promoValidateSeq) {
      return { valid: false, reason: 'stale' }
    }

    const discount = Math.max(0, Number(data?.discountAmount || 0))
    promoDiscountPreview.value = discount
    setPromoFeedback('success', `Промокод применён к товарам. Скидка: ${discount.toLocaleString('ru-RU')} ₽`)
    return { valid: true, data }
  } catch (e) {
    if (seq !== promoValidateSeq) {
      return { valid: false, reason: 'stale' }
    }

    const message = e.response?.data?.error || 'Промокод не применён'
    promoDiscountPreview.value = 0
    setPromoFeedback('error', message)
    return { valid: false, reason: 'invalid', message }
  } finally {
    if (seq === promoValidateSeq) {
      validatingPromo.value = false
    }
  }
}

async function fetchPartnerBalance() {
  if (!authStore.isAuthenticated) {
    hasPartnerBalanceAccess.value = false
    partnerBalanceAvailable.value = 0
    partnerBonusAmount.value = ''
    partnerBalanceError.value = ''
    return
  }

  partnerBalanceLoading.value = true
  partnerBalanceError.value = ''

  try {
    const { data } = await axios.get('/api/orders/partner-balance')
    const available = Math.max(0, Number(data?.availableBalance || 0))
    hasPartnerBalanceAccess.value = Boolean(data?.hasPartnerAccess)
    partnerBalanceAvailable.value = available
    if (!hasPartnerBalanceAccess.value) {
      partnerBonusAmount.value = ''
    } else {
      normalizePartnerBonusInput()
    }
  } catch (error) {
    hasPartnerBalanceAccess.value = false
    partnerBalanceAvailable.value = 0
    partnerBonusAmount.value = ''
    partnerBalanceError.value = error?.response?.data?.error || 'Не удалось получить партнёрский баланс'
  } finally {
    partnerBalanceLoading.value = false
  }
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

function getOrderAdditionId() {
  const fromQuery = route.query.addToOrder
  const queryValue = Array.isArray(fromQuery) ? fromQuery[0] : fromQuery
  return queryValue || localStorage.getItem('peptidi_order_addition_id') || ''
}

function getAdditionPayloadItems() {
  return cartStore.items.map(item => ({
    productId: item.id,
    quantity: item.quantity,
    selectedDosage: item.selectedDosage || null
  }))
}

async function loadOrderAdditionContext() {
  const orderId = getOrderAdditionId()
  if (!orderId) return

  loadingAdditionOrder.value = true
  orderError.value = null
  try {
    const { data } = await axios.get(`/api/orders/${orderId}`)
    additionOrder.value = data.order
    localStorage.setItem('peptidi_order_addition_id', String(data.order.id))
    prefillFromAdditionOrder(data.order)
    await previewOrderAddition()
  } catch (error) {
    additionOrder.value = null
    localStorage.removeItem('peptidi_order_addition_id')
    orderError.value = error.response?.data?.error || 'Не удалось загрузить заказ для дозаказа'
  } finally {
    loadingAdditionOrder.value = false
  }
}

function prefillFromAdditionOrder(order) {
  customer.value = {
    name: order.customerName || authStore.user?.name || '',
    phone: order.customerPhone || authStore.user?.phone || '',
    email: order.customerEmail || authStore.user?.email || '',
    comment: ''
  }

  deliveryPrice.value = Math.max(0, Number(order.deliveryPrice || 0))
  deliveryInfo.value = {}
}

async function previewOrderAddition() {
  if (!additionOrder.value?.id || !cartStore.items.length) {
    additionQuote.value = null
    return null
  }

  additionPreviewLoading.value = true
  try {
    const { data } = await axios.post(`/api/orders/${additionOrder.value.id}/add-items/preview`, {
      items: getAdditionPayloadItems()
    })
    additionQuote.value = data.quote
    return data.quote
  } catch (error) {
    additionQuote.value = null
    orderError.value = error.response?.data?.error || 'Не удалось пересчитать дозаказ'
    return null
  } finally {
    additionPreviewLoading.value = false
  }
}

function scheduleOrderAdditionPreview() {
  if (!isOrderAdditionMode.value) return
  if (additionPreviewTimer) clearTimeout(additionPreviewTimer)
  additionPreviewTimer = setTimeout(() => {
    previewOrderAddition()
  }, 350)
}

function clearOrderAdditionContext() {
  additionOrder.value = null
  additionQuote.value = null
  localStorage.removeItem('peptidi_order_addition_id')
}

function cancelOrderAddition() {
  cartStore.clear()
  clearOrderAdditionContext()
  router.push('/profile?tab=orders')
}

function clearCartItems() {
  cartStore.clear()
  if (isOrderAdditionMode.value) {
    additionQuote.value = null
  }
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
  router.push(completedOrderAddition.value ? '/profile?tab=orders' : '/catalog')
  completedOrderAddition.value = false
}

function retryOrder() {
  orderError.value = null
  // User can try again
}

function changeDelivery() {
  selectedPickupPoint.value = null
  pickupFilter.value = ''
  pickupCombinedSearch.value = ''
  citySearch.value = ''
  courierAddress.value = ''
  addressInput.value = ''
  courierAddressError.value = ''
  courierAddressHint.value = ''
  deliveryPrice.value = 0
  deliveryInfo.value = {}
  cartStore.setDeliveryPrice(0)
  cartStore.setDelivery({})
}

function onDeliveryTypeChange() {
  if (!ENABLE_PVZ && deliveryType.value === 'pvz') {
    deliveryType.value = 'courier'
  }
  if (!SELF_PICKUP_AVAILABLE && deliveryType.value === 'self_pickup') {
    deliveryType.value = ENABLE_PVZ ? 'pvz' : 'courier'
  }
  changeDelivery()
  if (deliveryType.value === 'self_pickup') {
    selectSelfPickup()
  }
}

async function searchCityAndPickup() {
  const { city, street } = parsedPickupSearch.value
  if (!city || city.length < 3) return
  citySearch.value = city
  
  loadingPickup.value = true
  pickupPoints.value = []
  pickupFilter.value = street
  foundCityName.value = ''
  foundCityCode.value = ''
  
  try {
    const res = await deliveryApi.post('/find-city', { name: city })
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

async function validateCourierAddress(address) {
  const normalizedAddress = String(address || '').trim()
  if (!normalizedAddress) {
    courierAddressError.value = 'Укажите адрес доставки'
    return null
  }

  courierAddressError.value = ''
  courierAddressHint.value = ''
  validatingCourierAddress.value = true

  try {
    const { data } = await deliveryApi.post('/validate-courier-address', {
      address: normalizedAddress
    })

    if (!data?.valid) {
      courierAddressError.value = data?.message || data?.error || 'Адрес не прошёл проверку'
      return null
    }

    return data
  } catch (error) {
    courierAddressError.value =
      error.response?.data?.message ||
      error.response?.data?.error ||
      'Не удалось проверить адрес через Яндекс. Попробуйте ещё раз.'
    return null
  } finally {
    validatingCourierAddress.value = false
  }
}

async function selectCourierDelivery() {
  const normalizedAddress = String(addressInput.value || '').trim()
  if (!normalizedAddress) return

  const validation = await validateCourierAddress(normalizedAddress)
  if (!validation) return

  foundCityName.value = INTERNAL_COURIER_CITY
  foundCityCode.value = INTERNAL_COURIER_CITY_CODE
  courierAddress.value = validation.normalizedAddress || normalizedAddress
  addressInput.value = courierAddress.value
  courierAddressHint.value = 'Адрес проверен через Яндекс'
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

function selectSelfPickup() {
  if (!SELF_PICKUP_AVAILABLE) return

  foundCityName.value = SELF_PICKUP_CITY
  foundCityCode.value = ''
  deliveryPrice.value = SELF_PICKUP_PRICE
  deliveryInfo.value = {
    period_min: 0,
    period_max: 0
  }
  cartStore.setDeliveryPrice(SELF_PICKUP_PRICE)
  cartStore.setDelivery({
    type: 'self_pickup',
    city: SELF_PICKUP_CITY,
    pickupPoint: null,
    pickupPointName: SELF_PICKUP_ADDRESS,
    deliveryPrice: SELF_PICKUP_PRICE,
    deliveryInfo: deliveryInfo.value
  })
}

function clearCheckoutRequestGuard() {
  try {
    sessionStorage.removeItem(CHECKOUT_REQUEST_KEY)
  } catch {
    // ignore storage errors
  }
}

function getOrCreateCheckoutRequestId(signature) {
  try {
    const stored = JSON.parse(sessionStorage.getItem(CHECKOUT_REQUEST_KEY) || 'null')
    if (stored && stored.signature === signature && stored.requestId) {
      return stored.requestId
    }
  } catch {
    // ignore broken storage payload
  }

  const requestId = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `req_${Date.now()}_${Math.random().toString(16).slice(2)}`

  try {
    sessionStorage.setItem(CHECKOUT_REQUEST_KEY, JSON.stringify({ signature, requestId }))
  } catch {
    // ignore storage errors
  }

  return requestId
}

function buildCheckoutSignature(orderData) {
  return JSON.stringify({
    items: orderData.items,
    customerName: orderData.customerName,
    customerEmail: orderData.customerEmail,
    customerPhone: orderData.customerPhone,
    shippingAddress: orderData.shippingAddress,
    notes: orderData.notes,
    paymentMethod: orderData.paymentMethod,
    delivery: orderData.delivery,
    promoCode: orderData.promoCode || '',
    partnerBonusAmount: orderData.partnerBonusAmount || 0,
    attribution: orderData.attribution || {}
  })
}

const totalWithDelivery = computed(() => {
  return cartStore.total + deliveryPrice.value
})

const totalWithPromo = computed(() => {
  const productsAfterPromo = Math.max(0, cartStore.total - promoDiscountPreview.value)
  return productsAfterPromo + deliveryPrice.value
})

const partnerBonusToUse = computed(() => {
  if (!hasPartnerBalanceAccess.value) return 0
  const requested = Math.max(0, Number(partnerBonusAmount.value) || 0)
  const maxAllowed = Math.min(
    Math.max(0, Number(partnerBalanceAvailable.value || 0)),
    Math.max(0, Number(totalWithPromo.value || 0))
  )
  return Math.min(requested, maxAllowed)
})

const totalAfterPartnerBonus = computed(() => {
  return Math.max(0, totalWithPromo.value - partnerBonusToUse.value)
})

const isFormValid = computed(() => {
  if (isOrderAdditionMode.value) {
    return Boolean(additionOrder.value?.id) && cartStore.items.length > 0
  }

  const hasContact = customer.value.name && normalizedCustomerPhone.value && customer.value.email
  const hasDelivery = ENABLE_CDEK
    ? (deliveryType.value === 'pvz' ? selectedPickupPoint.value : (deliveryType.value === 'courier' ? courierAddress.value : true))
    : true
  const hasAllConsents =
    consents.value.acceptOffer &&
    consents.value.acceptMarketing &&
    consents.value.acceptPrivacy &&
    consents.value.acceptResearchTerms
  return hasContact && hasDelivery && hasAllConsents
})

function getValidationErrors() {
  const errors = []

  if (isOrderAdditionMode.value) {
    if (!additionOrder.value?.id) {
      errors.push('Не удалось загрузить текущий заказ для дозаказа')
    }
    if (!cartStore.items.length) {
      errors.push('Добавьте хотя бы один новый товар для дозаказа')
    }
    return errors
  }

  if (!String(customer.value.name || '').trim()) {
    errors.push('Укажите имя')
  }
  if (!String(customer.value.phone || '').trim()) {
    errors.push('Укажите телефон')
  } else if (!normalizeRussianPhone(customer.value.phone)) {
    errors.push('Укажите телефон в формате +7 999 999-99-99')
  }
  if (!String(customer.value.email || '').trim()) {
    errors.push('Укажите email')
  }

  if (ENABLE_CDEK) {
    if (deliveryType.value === 'pvz' && !selectedPickupPoint.value) {
      errors.push('Выберите пункт выдачи СДЭК')
    }
    if (deliveryType.value === 'courier' && !String(courierAddress.value || '').trim()) {
      errors.push('Укажите адрес для курьерской доставки по Москве')
    }
  }

  if (!consents.value.acceptOffer) {
    errors.push('Подтвердите согласие с условиями Оферты')
  }
  if (!consents.value.acceptMarketing) {
    errors.push('Подтвердите согласие на получение информационных и рекламных сообщений')
  }
  if (!consents.value.acceptPrivacy) {
    errors.push('Подтвердите согласие с Политикой конфиденциальности')
  }
  if (!consents.value.acceptResearchTerms) {
    errors.push('Подтвердите согласие с условиями исследовательского использования')
  }

  return errors
}

function focusAndScrollToField(elementRef) {
  const el = elementRef?.value
  if (!el) return
  if (typeof el.scrollIntoView === 'function') {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
  setTimeout(() => {
    if (typeof el.focus === 'function') {
      el.focus()
    }
  }, 120)
}

function scrollToFirstInvalidField() {
  if (courierAddressError.value && courierAddressInputRef.value) {
    focusAndScrollToField(courierAddressInputRef)
    return
  }
  if (isNameMissing.value) {
    focusAndScrollToField(nameInputRef)
    return
  }
  if (isPhoneMissing.value || isPhoneInvalid.value) {
    focusAndScrollToField(phoneInputRef)
    return
  }
  if (isEmailMissing.value) {
    focusAndScrollToField(emailInputRef)
    return
  }
  if (isDeliveryMissing.value) {
    if (deliveryType.value === 'courier' && courierAddressInputRef.value) {
      focusAndScrollToField(courierAddressInputRef)
      return
    }
    focusAndScrollToField(pickupSectionRef)
    return
  }
  if (hasConsentErrors.value) {
    focusAndScrollToField(consentsSectionRef)
  }
}

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
    validationErrors.value = getValidationErrors()
    scrollToFirstInvalidField()
    return
  }
  validationErrors.value = []
  
  // Check if user is authenticated
  if (!authStore.isAuthenticated) {
    showLoginModal.value = true
    return
  }

  const orderPhone = normalizedCustomerPhone.value
  if (!orderPhone) {
    validationErrors.value = ['Укажите телефон в формате +7 999 999-99-99']
    scrollToFirstInvalidField()
    return
  }
  customer.value.phone = orderPhone
  
  ordering.value = true
  try {
    if (isOrderAdditionMode.value) {
      const quote = additionQuote.value || await previewOrderAddition()
      if (!quote) {
        ordering.value = false
        return
      }

      const { data } = await axios.post(`/api/orders/${additionOrder.value.id}/add-items`, {
        items: getAdditionPayloadItems()
      })

      lastOrderId.value = additionOrder.value.id
      const paymentAmount = Math.max(0, Number(data?.meta?.paymentAmount || 0))

      if (data?.meta?.requiresOnlinePayment && paymentAmount > 0) {
        const paymentResponse = await axios.post('/api/payment/create', {
          orderId: additionOrder.value.id,
          amount: paymentAmount,
          description: `Доплата по заказу #${additionOrder.value.id}`
        })

        if (paymentResponse.data.success && paymentResponse.data.paymentUrl) {
          clearCheckoutRequestGuard()
          cartStore.clear()
          clearOrderAdditionContext()
          window.location.href = paymentResponse.data.paymentUrl
          return
        }
      }

      clearCheckoutRequestGuard()
      cartStore.clear()
      clearOrderAdditionContext()
      completedOrderAddition.value = true
      orderComplete.value = true
      setTimeout(() => {
        orderComplete.value = false
      }, 10000)
      return
    }

    if (deliveryType.value === 'courier') {
      const validation = await validateCourierAddress(courierAddress.value || addressInput.value)
      if (!validation) {
        validationErrors.value = [courierAddressError.value || 'Проверьте адрес курьерской доставки']
        scrollToFirstInvalidField()
        ordering.value = false
        return
      }

      courierAddress.value = validation.normalizedAddress || courierAddress.value
      addressInput.value = courierAddress.value
    }

    if (promoCodeNormalized.value) {
      const promoValidation = await validatePromoCode({ silent: true })
      if (!promoValidation.valid) {
        orderError.value = promoValidation.message || 'Промокод не прошёл проверку'
        ordering.value = false
        return
      }
    }

    if (consents.value.rememberContacts) {
      localStorage.setItem('peptidi_guest_contacts', JSON.stringify({
        name: customer.value.name,
        phone: orderPhone,
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
    } else if (deliveryType.value === 'courier') {
      deliveryData.price = INTERNAL_COURIER_PRICE
      deliveryData.city = INTERNAL_COURIER_CITY
      deliveryData.type = 'courier_internal_moscow'
      deliveryData.tariff_name = 'Курьер по Москве (внутренняя доставка)'
      deliveryData.address = courierAddress.value
    } else {
      deliveryData.price = SELF_PICKUP_PRICE
      deliveryData.city = SELF_PICKUP_CITY
      deliveryData.type = 'self_pickup'
      deliveryData.tariff_name = 'Самовывоз'
      deliveryData.pickup_point = null
      deliveryData.pickup_point_name = SELF_PICKUP_ADDRESS
      deliveryData.address = SELF_PICKUP_ADDRESS
    }
    
    const orderData = {
      items: cartStore.items.map(item => ({
        productId: item.id,
        quantity: item.quantity,
        selectedDosage: item.selectedDosage || null
      })),
      customerName: customer.value.name,
      customerEmail: customer.value.email,
      customerPhone: orderPhone,
      shippingAddress: deliveryType.value === 'courier'
        ? courierAddress.value
        : (deliveryType.value === 'self_pickup' ? SELF_PICKUP_ADDRESS : (selectedPickupPoint.value?.address || null)),
      notes: customer.value.comment,
      paymentMethod: deliveryType.value === 'courier' ? paymentMethod.value : 'online',
      delivery: deliveryData,
      attribution: getStoredAttribution()
    }

    if (partnerBonusToUse.value > 0) {
      orderData.partnerBonusAmount = partnerBonusToUse.value
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
    const createdOrderTotal = Number(data?.order?.total ?? totalAfterPartnerBonus.value)
    const actualPartnerBonusUsed = Math.max(0, Number(data?.meta?.partnerBonusUsed || 0))
    if (actualPartnerBonusUsed > 0) {
      partnerBalanceAvailable.value = Math.max(0, partnerBalanceAvailable.value - actualPartnerBonusUsed)
      partnerBonusAmount.value = ''
    }
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
          recipient_phone: orderPhone,
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
    
    if (deliveryType.value === 'courier' && paymentMethod.value === 'cash_on_delivery') {
      clearCheckoutRequestGuard()
      cartStore.clear()
      orderComplete.value = true
      setTimeout(() => {
        orderComplete.value = false
      }, 10000)
      return
    }

    if (createdOrderTotal <= 0) {
      clearCheckoutRequestGuard()
      cartStore.clear()
      orderComplete.value = true
      setTimeout(() => {
        orderComplete.value = false
      }, 10000)
      return
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
        clearCheckoutRequestGuard()
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
    clearCheckoutRequestGuard()
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
  captureAttributionFromUrl()
  await productStore.fetchCategories()
  prefillFromProfile()
  await fetchPartnerBalance()
  await loadOrderAdditionContext()

  const savedDelivery = cartStore.delivery || {}
  if (savedDelivery.type) {
    if (savedDelivery.type === 'self_pickup' && !SELF_PICKUP_AVAILABLE) {
      deliveryType.value = ENABLE_PVZ ? 'pvz' : 'courier'
      cartStore.setDeliveryPrice(0)
      cartStore.setDelivery({})
    } else {
      deliveryType.value = !ENABLE_PVZ && savedDelivery.type === 'pvz' ? 'courier' : savedDelivery.type
    }
  }
  if (savedDelivery.city) {
    foundCityName.value = savedDelivery.city
    citySearch.value = savedDelivery.city
    pickupCombinedSearch.value = savedDelivery.city
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
  if (savedDelivery.type === 'self_pickup' && SELF_PICKUP_AVAILABLE) {
    foundCityName.value = SELF_PICKUP_CITY
    foundCityCode.value = ''
    deliveryPrice.value = SELF_PICKUP_PRICE
    deliveryInfo.value = savedDelivery.deliveryInfo || {}
    cartStore.setDeliveryPrice(SELF_PICKUP_PRICE)
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

watch(
  [
    () => customer.value.name,
    () => customer.value.phone,
    () => customer.value.email,
    () => consents.value.acceptOffer,
    () => consents.value.acceptMarketing,
    () => consents.value.acceptPrivacy,
    () => consents.value.acceptResearchTerms,
    () => deliveryType.value,
    () => selectedPickupPoint.value,
    () => courierAddress.value
  ],
  () => {
    if (!validationErrors.value.length) return
    validationErrors.value = getValidationErrors()
  }
)

watch(deliveryType, (nextType) => {
  if (nextType !== 'courier') {
    paymentMethod.value = 'online'
  }
})

watch(addressInput, (nextAddress) => {
  if (String(nextAddress || '').trim() !== String(courierAddress.value || '').trim()) {
    courierAddressError.value = ''
    courierAddressHint.value = ''
  }
})

watch(promoCodeNormalized, (nextCode) => {
  if (!nextCode) {
    promoDiscountPreview.value = 0
    setPromoFeedback('idle', '')
    return
  }
  schedulePromoValidation()
})

watch(totalWithDelivery, () => {
  if (!promoCodeNormalized.value || !authStore.isAuthenticated) return
  schedulePromoValidation(250)
})

watch(
  () => cartStore.items.map(item => `${item.id}:${item.selectedDosage || ''}:${item.quantity}`).join('|'),
  () => {
    scheduleOrderAdditionPreview()
  }
)

watch(totalWithPromo, () => {
  if (hasPartnerBalanceAccess.value) {
    normalizePartnerBonusInput()
  }
})

watch(() => authStore.isAuthenticated, (isAuthenticated) => {
  if (!isAuthenticated) {
    promoDiscountPreview.value = 0
    if (promoCodeNormalized.value) {
      setPromoFeedback('info', 'Войдите в аккаунт, чтобы применить промокод')
    }
    fetchPartnerBalance()
    return
  }
  if (promoCodeNormalized.value) {
    schedulePromoValidation(100)
  }
  fetchPartnerBalance()
})

onUnmounted(() => {
  if (promoValidateTimer) clearTimeout(promoValidateTimer)
  if (additionPreviewTimer) clearTimeout(additionPreviewTimer)
})
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

.addition-mode-card {
  padding: 1.25rem;
  border-bottom: 1px solid var(--border);
  background:
    radial-gradient(circle at 0 0, rgba(166, 185, 248, 0.14), transparent 35%),
    linear-gradient(135deg, rgba(166, 185, 248, 0.06), rgba(255, 255, 255, 0.02));
}

.addition-mode-card__head {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  margin-bottom: 1rem;
}

.addition-mode-card__badge {
  flex-shrink: 0;
  padding: 0.35rem 0.65rem;
  border-radius: 999px;
  background: var(--accent-dim);
  color: var(--accent);
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.addition-mode-card__head h3 {
  margin: 0 0 0.2rem;
  font-family: var(--font-display);
  font-size: 1rem;
}

.addition-mode-card__head p,
.cart-section-title p,
.addition-empty p {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.85rem;
}

.addition-loading {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.existing-order-items {
  display: grid;
  gap: 0.65rem;
}

.existing-order-item {
  display: grid;
  grid-template-columns: 58px minmax(0, 1fr) auto;
  gap: 0.8rem;
  align-items: center;
  padding: 0.7rem;
  border: 1px solid rgba(166, 185, 248, 0.14);
  border-radius: 13px;
  background: rgba(0, 0, 0, 0.12);
  opacity: 0.82;
}

.existing-order-item .item-image {
  width: 58px;
  height: 58px;
}

.existing-order-item__body {
  min-width: 0;
}

.existing-order-item__body h4 {
  margin: 0 0 0.25rem;
  color: var(--text-primary);
  font-size: 0.9rem;
}

.existing-order-item__note {
  display: inline-flex;
  margin-top: 0.25rem;
  color: var(--accent);
  font-size: 0.72rem;
}

.existing-order-item__meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.2rem;
  white-space: nowrap;
}

.existing-order-item__meta span {
  color: var(--text-muted);
  font-size: 0.75rem;
}

.existing-order-item__meta strong {
  color: var(--text-secondary);
  font-size: 0.85rem;
}

.addition-mode-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-top: 1rem;
}

.btn-cancel-addition {
  padding: 0.72rem 1rem;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: transparent;
  color: var(--text-secondary);
  font-weight: 700;
  cursor: pointer;
}

.cart-section-title {
  padding: 1.1rem 1.25rem 0.7rem;
}

.cart-section-title h3 {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1rem;
}

.cart-section-title p {
  margin-top: 0.25rem;
}

.addition-empty {
  padding: 1rem 1.25rem 1.35rem;
}

.addition-empty p {
  margin-bottom: 0.9rem;
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

.summary-row-muted {
  color: var(--text-muted);
}

.summary-row-muted span:last-child {
  color: var(--text-muted);
  text-decoration: line-through;
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

.addition-delivery-card {
  border: 1px solid rgba(166, 185, 248, 0.18);
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

.addition-warning {
  margin-top: 0.75rem;
  padding: 0.7rem;
  border-radius: 10px;
  background: rgba(245, 158, 11, 0.12);
  color: #ffd28a;
  font-size: 0.82rem;
  line-height: 1.4;
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

.partner-balance-card {
  border-color: rgba(34, 197, 94, 0.3);
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.08), rgba(34, 197, 94, 0.03));
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

.promo-code-status {
  margin: 0.45rem 0 0;
  font-size: 0.76rem;
  line-height: 1.35;
  font-weight: 600;
}

.promo-code-status--success {
  color: #22c55e;
}

.promo-code-status--error {
  color: #ef4444;
}

.promo-code-status--info {
  color: var(--accent);
}

.form-validation-card {
  margin: 0.5rem 0 1rem;
  padding: 0.9rem 1rem;
  border-radius: 12px;
  border: 1px solid rgba(239, 68, 68, 0.45);
  background: rgba(239, 68, 68, 0.1);
}

.form-validation-card__title {
  font-weight: 700;
  font-size: 0.9rem;
  color: #fecaca;
  margin-bottom: 0.45rem;
}

.form-validation-card__list {
  margin: 0;
  padding-left: 1.1rem;
  color: #fee2e2;
  font-size: 0.84rem;
  line-height: 1.45;
}

.required-note {
  margin: 0 0 0.75rem;
  font-size: 0.78rem;
  color: var(--text-muted);
}

.required-mark {
  color: #ef4444;
  font-weight: 700;
}

.optional-mark {
  color: var(--text-muted);
  font-weight: 500;
  text-transform: none;
  letter-spacing: 0;
}

.summary-total span:first-child {
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 700;
}

.summary-row-discount span:first-child {
  color: #22c55e;
}

.summary-row-discount span:last-child {
  color: #22c55e;
  font-weight: 700;
}

.summary-row-discount--partner span:first-child,
.summary-row-discount--partner span:last-child {
  color: #16a34a;
}

.total-value {
  font-family: var(--font-mono);
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--accent);
}

.addition-checkout-card {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1.25rem;
  padding: 1rem;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: var(--bg-secondary);
}

.addition-checkout-card p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.88rem;
  line-height: 1.5;
}

/* Pickup Section */
.pickup-section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: var(--bg-secondary);
  border-radius: 12px;
}

.pickup-section--error {
  border: 1px solid rgba(239, 68, 68, 0.45);
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
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.delivery-type-option {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.85rem;
  min-height: 74px;
  padding: 0.9rem;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease, transform 0.2s ease;
}

.delivery-type-option:hover {
  border-color: var(--accent);
  transform: translateY(-1px);
}

.delivery-type-option.selected {
  border-color: var(--accent);
  background: linear-gradient(135deg, var(--accent-dim), rgba(166, 185, 248, 0.04));
}

.delivery-type-option--disabled {
  cursor: not-allowed;
  position: relative;
  overflow: hidden;
  opacity: 0.78;
  border-color: rgba(245, 158, 11, 0.38);
  background:
    radial-gradient(circle at 100% 0, rgba(245, 158, 11, 0.16), transparent 36%),
    linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(166, 185, 248, 0.03)),
    var(--bg-card);
}

.delivery-type-option--disabled::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: repeating-linear-gradient(
    -45deg,
    transparent 0,
    transparent 9px,
    rgba(245, 158, 11, 0.055) 9px,
    rgba(245, 158, 11, 0.055) 10px
  );
}

.delivery-type-option--disabled:hover {
  border-color: rgba(245, 158, 11, 0.46);
  transform: none;
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
  gap: 0.25rem;
  min-width: 0;
}

.option-content strong {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.45rem;
  font-size: 0.875rem;
  line-height: 1.2;
}

.option-content span {
  font-size: 0.75rem;
  color: var(--text-muted);
  line-height: 1.35;
}

.option-meta {
  display: inline-flex;
  align-items: center;
  gap: 0.65rem;
  justify-self: end;
}

.option-price {
  white-space: nowrap;
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--text-secondary);
}

.option-price--free {
  color: var(--accent);
}

.option-unavailable-badge {
  display: inline-flex;
  align-items: center;
  min-height: 22px;
  padding: 0.25rem 0.55rem;
  border: 1px solid rgba(245, 158, 11, 0.34);
  border-radius: 999px;
  background: rgba(245, 158, 11, 0.14);
  color: #f59e0b;
  font-size: 0.64rem;
  font-weight: 900;
  letter-spacing: 0.02em;
  line-height: 1;
}

.option-unavailable-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #f59e0b;
  box-shadow: 0 0 0 6px rgba(245, 158, 11, 0.14);
}

.option-check {
  width: 18px;
  height: 18px;
  border: 1px solid var(--border);
  border-radius: 50%;
  background: var(--bg-secondary);
  position: relative;
  flex-shrink: 0;
}

.delivery-type-option.selected .option-check {
  border-color: var(--accent);
  background: var(--accent);
}

.delivery-type-option.selected .option-check::after {
  content: '';
  position: absolute;
  left: 5px;
  top: 3px;
  width: 5px;
  height: 9px;
  border: solid var(--bg-primary);
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.payment-method-card {
  margin: 1rem 0 1.25rem;
  padding: 1rem;
  border: 1px solid var(--border);
  border-radius: 14px;
  background:
    radial-gradient(circle at top right, rgba(166, 185, 248, 0.14), transparent 34%),
    var(--bg-secondary);
}

.payment-method-header {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  margin-bottom: 0.85rem;
}

.payment-method-header h4 {
  margin: 0;
  color: var(--text-primary);
  font-family: var(--font-display);
  font-size: 0.95rem;
}

.payment-method-eyebrow {
  color: var(--accent);
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.payment-method-options {
  display: grid;
  gap: 0.7rem;
}

.payment-method-option {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) 20px;
  align-items: center;
  gap: 0.8rem;
  padding: 0.85rem;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--bg-card);
  cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease, transform 0.2s ease;
}

.payment-method-option:hover {
  border-color: var(--accent);
  transform: translateY(-1px);
}

.payment-method-option.selected {
  border-color: var(--accent);
  background: linear-gradient(135deg, var(--accent-dim), rgba(166, 185, 248, 0.05));
}

.payment-method-option input {
  display: none;
}

.payment-method-icon {
  width: 44px;
  height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  color: var(--text-secondary);
  background: var(--bg-secondary);
}

.payment-method-option.selected .payment-method-icon {
  color: var(--bg-primary);
  background: var(--accent);
}

.payment-method-content {
  display: flex;
  flex-direction: column;
  gap: 0.22rem;
  min-width: 0;
}

.payment-method-content strong {
  color: var(--text-primary);
  font-size: 0.88rem;
  line-height: 1.2;
}

.payment-method-content small {
  color: var(--text-muted);
  font-size: 0.74rem;
  line-height: 1.35;
}

.payment-method-check {
  width: 18px;
  height: 18px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--bg-secondary);
  position: relative;
}

.payment-method-option.selected .payment-method-check {
  border-color: var(--accent);
  background: var(--accent);
}

.payment-method-option.selected .payment-method-check::after {
  content: '';
  position: absolute;
  left: 5px;
  top: 3px;
  width: 5px;
  height: 9px;
  border: solid var(--bg-primary);
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.pickup-search {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 0.4rem;
}

.pickup-search .input {
  flex: 1;
}

.pickup-search-hint {
  margin: 0 0 1rem;
  color: var(--text-muted);
  font-size: 0.78rem;
  line-height: 1.4;
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

.field-error,
.field-hint {
  margin: 0.45rem 0 0;
  font-size: 0.8rem;
  line-height: 1.35;
}

.field-error {
  color: #ef4444;
}

.field-hint {
  color: #22c55e;
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

.input--error {
  border-color: rgba(239, 68, 68, 0.8) !important;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.12);
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

.consents--error {
  padding: 0.6rem;
  border: 1px solid rgba(239, 68, 68, 0.35);
  border-radius: 10px;
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

.consent-item--error {
  color: #fecaca;
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
  .col-total {
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
    justify-self: end;
  }

  .item-remove.col-remove {
    width: 40px;
    height: 40px;
    min-width: 40px;
    padding: 0;
    display: inline-flex;
    justify-content: center;
  }

  .cart-actions {
    padding: 0.75rem 1rem;
  }

  .addition-mode-card {
    padding: 1rem;
  }

  .addition-mode-card__head {
    align-items: flex-start;
    flex-direction: column;
  }

  .existing-order-item {
    grid-template-columns: 52px minmax(0, 1fr);
    align-items: start;
  }

  .existing-order-item .item-image {
    width: 52px;
    height: 52px;
  }

  .existing-order-item__meta {
    grid-column: 2;
    align-items: flex-start;
  }

  .addition-mode-actions .btn,
  .btn-cancel-addition {
    width: 100%;
    justify-content: center;
  }

  .cart-section-title {
    padding: 1rem;
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
    gap: 0.6rem;
  }

  .delivery-type-option {
    grid-template-columns: 40px minmax(0, 1fr);
    align-items: start;
  }

  .delivery-type-option .option-icon {
    width: 40px;
    height: 40px;
  }

  .option-meta {
    grid-column: 2;
    justify-self: start;
    margin-top: 0.15rem;
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
