<template>
  <div class="orders-page">
    <div class="page-header">
      <div>
        <h1 class="page-title" style="font-size: 1.75rem; margin-bottom: 0.25rem;">Заказы</h1>
        <p class="page-subtitle">Управление заказами</p>
      </div>
      <div class="header-actions">
        <button type="button" class="btn btn-primary" @click="openManualOrder">+ Добавить заказ</button>
        <OrderReportExport :loading="exportLoading" button-text="Выгрузить все" title="Отчёт по всем заказам" description="Включая заказы без партнёра · по дате создания" menu-id="all-orders-report-period" @export="exportAllOrders" />
        <button
          type="button"
          :class="['favorite-filter', { active: filterFavorites }]"
          :aria-pressed="filterFavorites"
          title="Показать избранные заказы"
          @click="toggleFavoritesFilter"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3.8 2.53 5.13 5.66.82-4.1 4 0.97 5.64L12 16.73 6.94 19.4l.97-5.64-4.1-4 5.66-.82L12 3.8Z"/></svg>
          <span>Избранные</span>
        </button>
        <select v-model="filterStatus" @change="handleStatusFilterChange" class="input status-filter">
          <option value="">Все статусы</option>
          <option value="PENDING">Ожидает</option>
          <option value="PROCESSING">В обработке</option>
          <option value="SHIPPED">Отправлен</option>
          <option value="DELIVERED">Доставлен</option>
          <option value="RETURNED">Возврат</option>
          <option value="CANCELLED">Отменён</option>
        </select>
      </div>
    </div>

    <AdminSearchPanel
      v-model="search"
      :total="total"
      placeholder="Поиск по заказу, клиенту, телефону, email, адресу, ПВЗ, СДЭК или промокоду"
      total-label="заказов"
      found-label="заказов найдено"
    />

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
            <span class="stat-value">{{ stats.PENDING || 0 }}</span>
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
            <span class="stat-value">{{ stats.PROCESSING || 0 }}</span>
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
            <span class="stat-value">{{ stats.SHIPPED || 0 }}</span>
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
            <span class="stat-value">{{ stats.DELIVERED || 0 }}</span>
            <span class="stat-label">Доставлено</span>
          </div>
        </div>
      </div>

      <div class="orders-table-wrapper card">
        <table class="data-table orders-table">
          <colgroup>
            <col class="orders-table__favorite-col">
            <col class="orders-table__customer-col">
            <col class="orders-table__delivery-col">
            <col class="orders-table__amount-col">
            <col class="orders-table__status-col">
            <col class="orders-table__actions-col">
          </colgroup>
          <thead>
            <tr>
              <th class="favorite-column"><span class="sr-only">Избранное</span></th>
              <th>Заказ и клиент</th>
              <th>Доставка</th>
              <th>Сумма и начисления</th>
              <th>Статус и оплата</th>
              <th><span class="sr-only">Действия</span></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in orders" :key="order.id">
              <td class="favorite-cell">
                <button
                  type="button"
                  :class="['favorite-order-btn', { active: order.isFavorite }]"
                  :aria-label="order.isFavorite ? `Убрать заказ #${order.id} из избранного` : `Добавить заказ #${order.id} в избранное`"
                  :aria-pressed="Boolean(order.isFavorite)"
                  :disabled="favoriteSavingId === order.id"
                  @click="toggleOrderFavorite(order)"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3.8 2.53 5.13 5.66.82-4.1 4 .97 5.64L12 16.73 6.94 19.4l.97-5.64-4.1-4 5.66-.82L12 3.8Z"/></svg>
                </button>
              </td>
              <td class="order-summary-cell">
                <div class="order-summary-cell__meta">
                  <button type="button" class="order-number-link" @click="viewOrder(order)">#{{ order.id }}</button>
                  <span>{{ formatDate(order.createdAt) }}</span>
                </div>
                <div class="order-summary-cell__name">{{ order.customerName }}</div>
                <div class="order-summary-cell__phone">{{ order.customerPhone }}</div>
                <div v-if="order.promoCode?.code" class="order-summary-cell__promo">
                  <span class="promo-code-tag" :title="order.promoCode.code">{{ order.promoCode.code }}</span>
                  <router-link
                    v-if="order.promoCode.partner?.id"
                    :to="`/partners/${order.promoCode.partner.id}`"
                    class="promo-partner-link"
                    :title="order.promoCode.partner.user?.email || ''"
                  >{{ order.promoCode.partner.user?.name || `Партнёр #${order.promoCode.partner.id}` }}</router-link>
                </div>
              </td>
              <td class="order-delivery-cell">
                <div v-if="order.deliveryTariffName" class="delivery-badge" :title="order.deliveryTariffName">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
                  </svg>
                  <span>{{ order.deliveryTariffName }}</span>
                </div>
                <div v-else class="order-delivery-cell__type">Адресная доставка</div>
                <div v-if="order.deliveryCity" class="order-delivery-cell__city">{{ order.deliveryCity }}</div>
                <div v-if="order.deliveryPickupName || order.shippingAddress" class="order-delivery-cell__detail" :title="order.deliveryPickupName || order.shippingAddress">{{ order.deliveryPickupName || order.shippingAddress }}</div>
              </td>
              <td class="order-amount-cell">
                <div class="order-amount-cell__total">{{ formatPrice(order.total) }}</div>
                <div class="order-amount-cell__items">{{ order.items?.length || 0 }} позиций</div>
                <div v-if="order.commission || earnedCustomerPoints(order)" class="order-amount-cell__rewards">
                  <div v-if="order.commission">Партнёру <strong>+{{ formatPrice(order.commission.amount) }}</strong></div>
                  <div v-if="earnedCustomerPoints(order)">Клиенту <strong>+{{ earnedCustomerPoints(order).toLocaleString('ru-RU') }} баллов</strong></div>
                </div>
              </td>
              <td class="order-state-cell">
                <select :value="order.status" :aria-label="`Статус заказа #${order.id}`" @change="updateStatus(order.id, $event.target.value)" class="status-select">
                  <option value="PENDING">Ожидает</option>
                  <option value="PROCESSING">В обработке</option>
                  <option value="SHIPPED">Отправлен</option>
                  <option value="DELIVERED">Доставлен</option>
                  <option value="RETURNED">Возврат</option>
                  <option value="CANCELLED">Отменён</option>
                </select>
                <span :class="['payment-badge', getPaymentBadge(order.paymentStatus)]">
                  {{ getPaymentLabel(order.paymentStatus) }}
                </span>
                <PaymentMethodChip v-if="isOrderPaid(order.paymentStatus) && order.paymentType" :type="order.paymentType" class="order-payment-method" />
                <button
                  v-if="!isOrderPaid(order.paymentStatus)"
                  @click="markAsPaid(order)"
                  class="pay-now-btn"
                >
                  Отметить как оплаченный
                </button>
              </td>
              <td class="order-actions-cell">
                <div class="order-actions-cell__buttons">
                  <button @click="viewOrder(order)" class="order-open-btn" :aria-label="`Открыть заказ #${order.id}`">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                    </svg>
                    Подробнее
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
            <div class="order-card__title">
              <button
                type="button"
                :class="['favorite-order-btn', { active: order.isFavorite }]"
                :aria-label="order.isFavorite ? `Убрать заказ #${order.id} из избранного` : `Добавить заказ #${order.id} в избранное`"
                :aria-pressed="Boolean(order.isFavorite)"
                :disabled="favoriteSavingId === order.id"
                @click="toggleOrderFavorite(order)"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3.8 2.53 5.13 5.66.82-4.1 4 .97 5.64L12 16.73 6.94 19.4l.97-5.64-4.1-4 5.66-.82L12 3.8Z"/></svg>
              </button>
              <div class="order-card__id">Заказ #{{ order.id }}</div>
            </div>
            <div class="order-card__payment">
              <span :class="['payment-badge', getPaymentBadge(order.paymentStatus)]">
                {{ getPaymentLabel(order.paymentStatus) }}
              </span>
              <PaymentMethodChip v-if="isOrderPaid(order.paymentStatus) && order.paymentType" :type="order.paymentType" />
            </div>
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
            <div v-if="order.commission" class="order-card__row"><span class="order-card__label">Партнёру</span><span class="order-card__value">+{{ formatPrice(order.commission.amount) }}</span></div>
            <div v-if="earnedCustomerPoints(order)" class="order-card__row"><span class="order-card__label">Клиенту</span><span class="order-card__value">+{{ earnedCustomerPoints(order).toLocaleString('ru-RU') }} баллов</span></div>
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
              <option value="RETURNED">Возврат</option>
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

      <AdminPagination
        v-model:page="currentPage"
        :total="total"
        :per-page="ORDERS_PER_PAGE"
      />
    </div>

    <div v-if="showManualOrder" class="modal-overlay" @click.self="closeManualOrder">
      <div class="modal manual-order-modal card" role="dialog" aria-modal="true" aria-label="Добавить заказ">
        <div class="modal-header manual-order-header">
          <div>
            <span class="manual-order-kicker">Оформление в админке</span>
            <h3 class="modal-title">Новый заказ</h3>
            <p>Выберите клиента, товары и способ доставки.</p>
          </div>
          <button type="button" class="modal-close" aria-label="Закрыть" @click="closeManualOrder">×</button>
        </div>
        <form class="order-edit-form manual-order-form" @submit.prevent="createManualOrder">
          <section class="manual-order-section">
            <div class="manual-section-heading"><span>1</span><div><h4>Клиент</h4><p>Можно выбрать аккаунт или оформить без регистрации</p></div></div>
            <label class="manual-user-search">Поиск клиента
              <input v-model.trim="manualUserQuery" class="input" type="search" autocomplete="off" placeholder="Имя, телефон или email">
            </label>
            <div v-if="manualUsers.length && manualUserQuery && !manualDraft.userId" class="manual-user-results">
              <button v-for="user in manualUsers" :key="user.id" type="button" @click="selectManualUser(user)">
                {{ user.name || 'Без имени' }} · {{ user.email }} <small>#{{ user.id }}</small>
              </button>
            </div>
            <div v-if="manualDraft.userId" class="manual-selected-user">
              <span>Аккаунт #{{ manualDraft.userId }} выбран{{ manualBoundPartnerId ? ` · партнёр #${manualBoundPartnerId}` : '' }}</span>
              <button type="button" @click="clearManualUser">Сбросить</button>
            </div>
            <div class="edit-grid manual-customer-fields">
              <label>Имя<input v-model.trim="manualDraft.customerName" class="input" required placeholder="Имя получателя"></label>
              <label>Email<input v-model.trim="manualDraft.customerEmail" class="input" type="email" required placeholder="email@example.com"></label>
              <label>Телефон<input v-model.trim="manualDraft.customerPhone" class="input" type="tel" required placeholder="+7 999 999-99-99"></label>
            </div>
          </section>

          <section class="manual-order-section">
            <div class="manual-section-heading"><span>2</span><div><h4>Товары</h4><p>Цена за штуку подставляется из каталога, её можно изменить</p></div></div>
            <div v-for="(item, index) in manualDraft.items" :key="item.key" class="edit-item manual-item">
              <label>Товар<select v-model.number="item.productId" class="input" required @change="setManualProductPrice(item)"><option v-for="product in manualProducts" :key="product.id" :value="product.id">{{ product.title }}</option></select></label>
              <label>Дозировка<input v-model.trim="item.dosage" class="input" placeholder="Если есть"></label>
              <label>Кол-во<input v-model.number="item.quantity" class="input" type="number" min="1" step="1" required></label>
              <label>Цена, ₽<input v-model.number="item.price" class="input" type="number" min="0" step="0.01" required></label>
              <button type="button" class="edit-remove" :disabled="manualDraft.items.length === 1" :aria-label="`Удалить товар ${index + 1}`" @click="manualDraft.items.splice(index, 1)">×</button>
            </div>
            <button type="button" class="btn btn-secondary manual-add-item" :disabled="!manualProducts.length" @click="addManualItem">+ Добавить товар</button>
          </section>

          <section class="manual-order-section">
            <div class="manual-section-heading"><span>3</span><div><h4>Доставка</h4><p>Выберите способ, затем заполните только нужные поля</p></div></div>
            <div class="manual-delivery-choices" role="radiogroup" aria-label="Способ доставки">
              <label :class="['manual-delivery-choice', { selected: manualDeliveryMode === 'cdek' }]">
                <input type="radio" name="manual-delivery" value="cdek" :checked="manualDeliveryMode === 'cdek'" @change="setManualDeliveryMode('cdek')">
                <strong>ПВЗ СДЭК</strong><small>Найдите город и пункт выдачи</small>
              </label>
              <label :class="['manual-delivery-choice', { selected: manualDeliveryMode === 'address' }]">
                <input type="radio" name="manual-delivery" value="address" :checked="manualDeliveryMode === 'address'" @change="setManualDeliveryMode('address')">
                <strong>Доставка по адресу</strong><small>Курьер или другой способ</small>
              </label>
            </div>

            <div v-if="manualDeliveryMode === 'cdek'" class="manual-cdek-panel">
              <label class="manual-field">Город получателя
                <input v-model="manualCityQuery" class="input" type="search" autocomplete="off" placeholder="Начните вводить город, например Казань" @keydown.enter.prevent="searchManualCities">
              </label>
              <div v-if="manualCityLoading" class="manual-search-state">Ищем города СДЭК…</div>
              <div v-else-if="manualCityResults.length" class="manual-city-results">
                <button v-for="city in manualCityResults" :key="`${city.code}-${city.city}`" type="button" @click="selectManualCity(city)">
                  <strong>{{ city.city }}</strong><span>{{ [city.region, city.country].filter(Boolean).join(', ') }}</span>
                </button>
              </div>
              <p v-else-if="manualCityQuery.trim().length >= 3 && !manualSelectedCity && manualCitySearched" class="manual-search-state">Город не найден. Уточните название.</p>

              <div v-if="manualSelectedCity" class="manual-cdek-selected-city">Выбран город: <strong>{{ manualSelectedCity.city }}</strong><span v-if="manualPointsLoading"> · загружаем ПВЗ…</span></div>
              <template v-if="manualSelectedCity && !manualPointsLoading">
                <div v-if="manualSelectedPoint" class="manual-selected-point">
                  <div><strong>{{ manualSelectedPoint.name }}</strong><span>{{ manualSelectedPoint.address }}</span></div>
                  <button type="button" @click="clearManualPoint">Изменить ПВЗ</button>
                </div>
                <template v-else>
                  <label class="manual-field">Найти пункт выдачи
                    <input v-model="manualPointQuery" class="input" type="search" placeholder="Улица, дом, название или код ПВЗ">
                  </label>
                  <p class="manual-search-state">{{ manualPointMatchCount ? `Найдено ${manualPointMatchCount} ПВЗ. Выберите нужный.` : 'По запросу ПВЗ не найдены.' }}</p>
                  <div v-if="manualFilteredPoints.length" class="manual-point-list">
                    <button v-for="point in manualFilteredPoints" :key="point.code" type="button" @click="selectManualPoint(point)">
                      <strong>{{ point.name }}</strong><span>{{ point.address }}</span><small v-if="point.work_time">{{ point.work_time }}</small>
                    </button>
                  </div>
                  <p v-if="manualPointMatchCount > manualFilteredPoints.length" class="manual-search-state">Показаны первые {{ manualFilteredPoints.length }} — уточните улицу или дом в поиске.</p>
                </template>
              </template>
              <label class="manual-field">Стоимость доставки СДЭК, ₽
                <input v-model.number="manualDraft.deliveryPrice" class="input" type="number" min="0" step="0.01" @input="manualDeliveryPriceEdited = true">
              </label>
              <p class="manual-delivery-note">{{ manualCdekCalculating ? 'Рассчитываем доставку…' : 'Доставка оплачивается клиентом напрямую СДЭКу и не входит в сумму заказа.' }}</p>
              <button v-if="manualSelectedPoint" type="button" class="manual-recalculate" :disabled="manualCdekCalculating" @click="calculateManualCdekPrice">Пересчитать стоимость</button>
            </div>
            <div v-else class="edit-grid manual-address-fields">
              <label>Город<input v-model.trim="manualDraft.deliveryCity" class="input" required placeholder="Город доставки"></label>
              <label>Стоимость доставки, ₽<input v-model.number="manualDraft.deliveryPrice" class="input" type="number" min="0" step="0.01"></label>
              <label class="edit-wide">Адрес доставки<input v-model.trim="manualDraft.shippingAddress" class="input" required placeholder="Улица, дом, квартира"></label>
              <p class="manual-delivery-note edit-wide">Стоимость доставки по адресу включается в сумму заказа.</p>
            </div>
            <p v-if="manualCdekError" class="edit-error" role="status">{{ manualCdekError }}</p>
          </section>

          <section class="manual-order-section manual-final-section">
            <div class="manual-section-heading"><span>4</span><div><h4>Оплата и детали</h4><p>Выберите текущий статус; его можно изменить позже</p></div></div>
            <div class="edit-grid">
              <label class="edit-wide">Промокод
                <span class="manual-promo-row"><input v-model.trim="manualDraft.promoCode" class="input" type="text" maxlength="100" autocomplete="off" placeholder="Введите промокод"><button type="button" class="btn btn-secondary" :disabled="manualPromoLoading || !manualDraft.promoCode || !manualDraft.userId" @click="validateManualPromo">{{ manualPromoLoading ? 'Проверяем…' : 'Применить' }}</button></span>
              </label>
              <p v-if="manualDraft.promoCode && !manualDraft.userId" class="manual-delivery-note edit-wide">Для промокода выберите зарегистрированного клиента.</p>
              <p v-if="manualPromoError" class="edit-error edit-wide" role="alert">{{ manualPromoError }}</p>
              <p v-else-if="manualAppliedPromo" class="manual-promo-success edit-wide">Промокод {{ manualAppliedPromo.promoCode }} применён · скидка {{ formatPrice(manualAppliedPromo.discountAmount) }}<span v-if="manualAppliedPromo.partnerId"> · партнёр #{{ manualAppliedPromo.partnerId }}</span></p>
              <p v-else-if="manualDraft.promoCode" class="manual-delivery-note edit-wide">Проверьте промокод, чтобы увидеть итоговую сумму. При создании заказа он будет проверен ещё раз.</p>
              <label>Статус оплаты<select v-model="manualDraft.paymentStatus" class="input"><option value="PENDING">Не оплачен</option><option value="PAID">Оплачен</option><option value="FAILED">Ошибка оплаты</option><option value="CASH_ON_DELIVERY">Наличными курьеру</option></select></label>
              <label>Статус заказа<select v-model="manualDraft.status" class="input"><option value="PENDING">Ожидает</option><option value="PROCESSING">В обработке</option><option value="SHIPPED">Отправлен</option><option value="DELIVERED">Доставлен</option></select></label>
              <label v-if="manualDraft.userId && !manualBoundPartnerId">ID партнёра (необязательно)<input v-model.number="manualDraft.partnerId" class="input" type="number" min="1" placeholder="Если нужно начисление партнёру"></label>
              <label class="edit-wide">Комментарий к заказу<textarea v-model.trim="manualDraft.notes" class="input" rows="2" placeholder="Необязательно"></textarea></label>
            </div>
            <p class="edit-notice">Промокод даёт скидку. Комиссия партнёра начисляется после оплаты по сумме со скидкой. Клиентские баллы за ручной заказ не начисляются.</p>
          </section>

          <p v-if="manualError" class="edit-error" role="alert">{{ manualError }}</p>
          <div class="manual-order-footer">
            <div><small>Итого по заказу</small><strong>{{ formatPrice(manualDraftTotal) }}</strong><span v-if="manualDeliveryMode === 'cdek'">Без оплаты доставки СДЭК</span></div>
            <div class="manual-order-footer__actions"><button type="button" class="btn btn-secondary" @click="closeManualOrder">Отмена</button><button type="submit" class="btn btn-primary" :disabled="manualSaving || manualCdekCalculating || manualPointsLoading || !manualDraft.items.length">{{ manualSaving ? 'Создаём…' : 'Создать заказ' }}</button></div>
          </div>
        </form>
      </div>
    </div>

    <div v-if="selectedOrder" class="modal-overlay" @click.self="closeOrder">
      <div :class="['modal', 'card', { 'modal--editing': editingOrder }]">
        <div class="modal-header">
          <h3 class="modal-title">Заказ #{{ selectedOrder.id }}</h3>
          <button @click="closeOrder" class="modal-close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div class="order-edit-actions">
          <button v-if="!editingOrder" type="button" class="btn btn-secondary" @click="startEditingOrder">Редактировать заказ</button>
          <template v-if="!editingOrder">
            <button type="button" class="btn btn-secondary" :disabled="downloadingWaybill" @click="downloadWaybill('pdf')">Накладная PDF</button>
            <button type="button" class="btn btn-secondary" :disabled="downloadingWaybill" @click="downloadWaybill('docx')">Накладная Word</button>
          </template>
          <template v-else>
            <button type="button" class="btn btn-secondary" :disabled="savingOrder" @click="editingOrder = false">Отмена</button>
            <button type="submit" form="order-edit-form" class="btn btn-primary" :disabled="savingOrder">{{ savingOrder ? 'Сохраняем…' : 'Сохранить изменения' }}</button>
          </template>
        </div>

        <form v-if="editingOrder" id="order-edit-form" class="order-edit-form" @submit.prevent="saveOrder">
          <div class="edit-section-title">Клиент и доставка</div>
          <div class="edit-grid">
            <label>Имя<input v-model.trim="orderDraft.customerName" class="input" required maxlength="500" :disabled="Boolean(selectedOrder.cdekOrderUuid)"></label>
            <label>Email<input v-model.trim="orderDraft.customerEmail" class="input" type="email" required maxlength="500" :disabled="Boolean(selectedOrder.cdekOrderUuid)"></label>
            <label>Телефон<input v-model.trim="orderDraft.customerPhone" class="input" type="tel" required maxlength="500" :disabled="Boolean(selectedOrder.cdekOrderUuid)"></label>
            <label>Город<input v-model.trim="orderDraft.deliveryCity" class="input" maxlength="500" :disabled="Boolean(selectedOrder.cdekOrderUuid)"></label>
            <label>Тариф доставки<input v-model.trim="orderDraft.deliveryTariffName" class="input" maxlength="500" :disabled="!canEditOrderAmount"></label>
            <label>Код тарифа<input v-model.number="orderDraft.deliveryTariffCode" class="input" type="number" min="0" :disabled="!canEditOrderAmount"></label>
            <label>Стоимость доставки, ₽<input v-model.number="orderDraft.deliveryPrice" class="input" type="number" min="0" step="0.01" :disabled="!canEditOrderAmount"></label>
            <label>Код ПВЗ<input v-model.trim="orderDraft.deliveryPickupPoint" class="input" maxlength="500" :disabled="!canEditOrderAmount"></label>
            <label class="edit-wide">Название ПВЗ<input v-model.trim="orderDraft.deliveryPickupName" class="input" maxlength="500" :disabled="Boolean(selectedOrder.cdekOrderUuid)"></label>
            <label class="edit-wide">Адрес доставки<input v-model.trim="orderDraft.shippingAddress" class="input" maxlength="500" :disabled="Boolean(selectedOrder.cdekOrderUuid)"></label>
            <label class="edit-wide">Комментарий<textarea v-model.trim="orderDraft.notes" class="input" rows="3" maxlength="4000"></textarea></label>
          </div>
          <div class="edit-section-title">Состав заказа</div>
          <p v-if="hasFixedPayment" class="edit-notice">Сумма заказа пересчитается по новому составу. Выставленный счёт, платёж и чек не изменятся; разницу нужно урегулировать отдельно.</p>
          <p v-if="selectedOrder.cdekOrderUuid" class="edit-notice">Изменение состава здесь не обновит накладную СДЭК — проверьте отправку отдельно.</p>
          <p v-if="['SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED'].includes(selectedOrder.status)" class="edit-notice">Заказ уже завершён или отменён. Убедитесь, что изменение состава соответствует фактическому движению товара.</p>
          <div v-for="(item, index) in orderDraft.items" :key="item.key" class="edit-item">
            <label>Товар
              <select v-model.number="item.productId" class="input" required @change="setDraftProductPrice(item)">
                <option v-for="product in editProducts" :key="product.id" :value="product.id">{{ product.title }}</option>
              </select>
            </label>
            <label>Дозировка<input v-model.trim="item.dosage" class="input" maxlength="200"></label>
            <label>Кол-во<input v-model.number="item.quantity" class="input" type="number" min="1" step="1" required></label>
            <label>Цена, ₽<input v-model.number="item.price" class="input" type="number" min="0" step="0.01" required></label>
            <button type="button" class="edit-remove" :disabled="orderDraft.items.length === 1" :aria-label="`Удалить товар ${index + 1}`" @click="orderDraft.items.splice(index, 1)">×</button>
          </div>
          <button type="button" class="btn btn-secondary" @click="addOrderItem">+ Добавить товар</button>
          <div class="edit-summary">Новая сумма заказа после скидок: {{ formatPrice(draftTotal) }}</div>
          <p v-if="hasFixedPayment" class="edit-notice">Ранее выставлено к оплате: {{ formatPrice(getFixedPaymentAmount(selectedOrder)) }}. Новые товары будут отмечены в заказе как добавленные без изменения оплаты.</p>
          <p v-if="editError" class="edit-error" role="alert">{{ editError }}</p>
        </form>

        <div v-else class="order-details">
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
            <div v-if="isOrderPaid(selectedOrder.paymentStatus)" class="detail-row">
              <span class="detail-label">Способ оплаты</span>
              <PaymentMethodChip v-if="selectedOrder.paymentType" :type="selectedOrder.paymentType" />
              <span v-else class="detail-value">Неизвестен</span>
            </div>
            <div v-if="selectedOrder.status === 'CANCELLED'" class="detail-row">
              <span class="detail-label">Причина отмены</span>
              <span class="detail-value cancel-reason-value">{{ getCancelReasonLabel(selectedOrder.cancelReason) }}</span>
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
            <div v-if="getPartnerBonusAmount(selectedOrder) > 0" class="partner-bonus-card">
              <div class="partner-bonus-card__icon">₽</div>
              <div class="partner-bonus-card__content">
                <span>Списано партнёрских баллов</span>
                <strong>-{{ formatPrice(getPartnerBonusAmount(selectedOrder)) }}</strong>
                <small v-if="selectedOrder.partnerBonusInfo?.partnerName || selectedOrder.partnerBonusInfo?.partnerEmail">
                  {{ selectedOrder.partnerBonusInfo?.partnerName || selectedOrder.partnerBonusInfo?.partnerEmail }}
                </small>
              </div>
              <div class="partner-bonus-card__balance">
                <span>Баланс</span>
                <strong>{{ formatPrice(getPartnerAvailableBalance(selectedOrder)) }}</strong>
              </div>
            </div>
          </div>

          <div class="detail-section">
            <h4 class="section-title">Начисления после покупки</h4>
            <div class="detail-row"><span class="detail-label">Партнёру</span><span class="detail-value">{{ selectedOrder.commission ? `+${formatPrice(selectedOrder.commission.amount)} (${selectedOrder.commission.percentage}%)` : 'Нет начисления' }}</span></div>
            <div v-if="selectedOrder.commission?.partner" class="detail-row"><span class="detail-label">Партнёр</span><span class="detail-value">{{ selectedOrder.commission.partner.user?.name || selectedOrder.commission.partner.user?.email || `#${selectedOrder.commission.partner.id}` }}</span></div>
            <div class="detail-row"><span class="detail-label">Клиенту</span><span class="detail-value">{{ earnedCustomerPoints(selectedOrder) ? `+${earnedCustomerPoints(selectedOrder).toLocaleString('ru-RU')} баллов` : 'Нет начисления' }}</span></div>
            <p class="edit-notice">Клиентские баллы начисляются за завершённую консультацию после первой успешной покупки, а не за каждую покупку.</p>
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
                  <span v-if="isCdekDelivery(selectedOrder)">Оплачивается отдельно в СДЭК</span>
                  <span v-else>{{ selectedOrder.deliveryPrice ? formatPrice(selectedOrder.deliveryPrice) : 'Не рассчитана' }}</span>
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
                Проверить статус СДЭК
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

            <section v-if="cdekMessages.length" class="cdek-warning" role="alert">
              <div class="cdek-warning__heading">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M12 8v4.5M12 16.4h.01M10.3 3.4 2.8 17a2.25 2.25 0 0 0 1.97 3.34h14.46A2.25 2.25 0 0 0 21.2 17L13.7 3.4a1.95 1.95 0 0 0-3.4 0Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span>Сообщение СДЭК</span>
              </div>
              <p v-for="message in cdekMessages" :key="message">{{ message }}</p>
            </section>
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
                  <span v-if="item.adminAddedAt" class="admin-added-label">{{ item.adminUnbilled ? 'Добавлено администратором · без изменения оплаты' : 'Добавлено администратором' }}</span>
                  <span v-else-if="item.adminUnbilled" class="admin-added-label">Изменено в админке · без изменения оплаты</span>
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
            <div class="total-row" v-if="selectedOrder.deliveryPrice && !isCdekDelivery(selectedOrder)">
              <span>Доставка</span>
              <span>{{ formatPrice(selectedOrder.deliveryPrice) }}</span>
            </div>
            <div class="total-row" v-if="selectedOrder.discountAmount">
              <span>Скидка</span>
              <span class="discount">-{{ formatPrice(selectedOrder.discountAmount) }}</span>
            </div>
            <div class="total-row total-row--bonus" v-if="getPartnerBonusAmount(selectedOrder) > 0">
              <span>Из них списано баллов</span>
              <span class="discount">-{{ formatPrice(getPartnerBonusAmount(selectedOrder)) }}</span>
            </div>
            <div class="total-row final">
              <span>{{ isCdekDelivery(selectedOrder) ? 'Итого без доставки СДЭК' : 'Итого' }}</span>
              <span class="total-value">{{ formatPrice(getOrderDetailTotal(selectedOrder)) }}</span>
            </div>
            <div v-if="hasFixedPayment && Math.round(getFixedPaymentAmount(selectedOrder) * 100) !== Math.round(Number(selectedOrder.total || 0) * 100)" class="total-row">
              <span>Ранее выставлено к оплате</span>
              <span>{{ formatPrice(getFixedPaymentAmount(selectedOrder)) }}</span>
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
            <select :value="selectedOrder.status" @change="updateStatus(selectedOrder.id, $event.target.value)" class="status-select-full">
              <option value="PENDING">Ожидает</option>
              <option value="PROCESSING">В обработке</option>
              <option value="SHIPPED">Отправлен</option>
              <option value="DELIVERED">Доставлен</option>
              <option value="RETURNED">Возврат</option>
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
          <button @click="closeOrder" class="btn btn-secondary btn-full">Закрыть</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import axios from 'axios'
import deliveryApi from '../api/delivery'
import AdminSearchPanel from '../components/AdminSearchPanel.vue'
import AdminPagination from '../components/AdminPagination.vue'
import OrderReportExport from '../components/OrderReportExport.vue'
import PaymentMethodChip from '../components/PaymentMethodChip.vue'

const API_URL = '/api/admin'

const orders = ref([])
const total = ref(0)
const loading = ref(true)
const filterStatus = ref('')
const filterFavorites = ref(false)
const search = ref('')
const favoriteSavingId = ref(null)
const selectedOrder = ref(null)
const downloadingWaybill = ref(false)
const exportLoading = ref(false)
const showManualOrder = ref(false)
const manualSaving = ref(false)
const manualError = ref('')
const manualUserQuery = ref('')
const manualSelectedUserLabel = ref('')
const manualUsers = ref([])
const manualProducts = ref([])
const manualBoundPartnerId = ref(null)
const manualDeliveryMode = ref('cdek')
const manualCityQuery = ref('')
const manualCityResults = ref([])
const manualCityLoading = ref(false)
const manualCitySearched = ref(false)
const manualSelectedCity = ref(null)
const manualPoints = ref([])
const manualPointsLoading = ref(false)
const manualPointQuery = ref('')
const manualSelectedPoint = ref(null)
const manualCdekCalculating = ref(false)
const manualCdekError = ref('')
const manualCdekQuoteKey = ref('')
const manualDeliveryPriceEdited = ref(false)
const manualDraft = ref(emptyManualDraft())
const manualPromoPreview = ref(null)
const manualPromoLoading = ref(false)
const manualPromoError = ref('')
const manualMatchedPoints = computed(() => {
  const query = manualPointQuery.value.toLocaleLowerCase('ru-RU').replace(/ё/g, 'е').trim()
  if (!query) return manualPoints.value
  return manualPoints.value.filter(point => `${point.name || ''} ${point.address || ''} ${point.code || ''}`.toLocaleLowerCase('ru-RU').replace(/ё/g, 'е').includes(query))
})
const manualPointMatchCount = computed(() => manualMatchedPoints.value.length)
const manualFilteredPoints = computed(() => manualMatchedPoints.value.slice(0, manualPointQuery.value ? 60 : 12))
const manualDraftSubtotal = computed(() => manualDraft.value.items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.price) || 0), 0))
const manualPromoKey = computed(() => JSON.stringify([String(manualDraft.value.promoCode || '').trim().toUpperCase(), manualDraft.value.userId, manualDraft.value.partnerId || null, Math.round(manualDraftSubtotal.value * 100)]))
const manualAppliedPromo = computed(() => manualPromoPreview.value?.key === manualPromoKey.value ? manualPromoPreview.value : null)
const manualDraftTotal = computed(() => {
  const draft = manualDraft.value
  return Math.round((manualDraftSubtotal.value + (draft.deliveryTariffCode || draft.deliveryPickupPoint ? 0 : (Number(draft.deliveryPrice) || 0)) - Number(manualAppliedPromo.value?.discountAmount || 0)) * 100) / 100
})
const editingOrder = ref(false)
const savingOrder = ref(false)
const orderDraft = ref(null)
const editProducts = ref([])
const editError = ref('')
const hasFixedPayment = computed(() => Boolean(selectedOrder.value && (selectedOrder.value.paymentId || selectedOrder.value.paymentLinkId || selectedOrder.value.paymentUrl || isOrderPaid(selectedOrder.value.paymentStatus) || (selectedOrder.value.paymentStatus === 'CASH_ON_DELIVERY' && ['SHIPPED', 'DELIVERED', 'RETURNED'].includes(selectedOrder.value.status)))))
const canEditOrderAmount = computed(() => {
  const order = selectedOrder.value
  return Boolean(order && !hasFixedPayment.value && !order.cdekOrderUuid && !['CANCELLED', 'RETURNED', 'SHIPPED', 'DELIVERED'].includes(order.status))
})
const draftCompositionTotal = computed(() => orderDraft.value?.items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.price) || 0), 0) || 0)
const draftTotal = computed(() => {
  if (!orderDraft.value) return 0
  const subtotal = draftCompositionTotal.value
  const delivery = orderDraft.value.deliveryTariffCode || orderDraft.value.deliveryPickupPoint ? 0 : (Number(orderDraft.value.deliveryPrice) || 0)
  return Math.round(Math.max(0, subtotal + delivery - Number(selectedOrder.value?.discountAmount || 0)) * 100) / 100
})
const creatingCdek = ref(false)
const syncingCdek = ref(false)
const cdekStatus = ref(null)
const cdekMessages = ref([])
const cancelReasonOptions = [
  { value: 'high_price', label: 'Высокая цена' },
  { value: 'long_delivery', label: 'Долгая доставка' },
  { value: 'scheme_mismatch', label: 'Не подошел по схеме приема' },
  { value: 'changed_mind', label: 'Передумал принимать пептиды' },
  { value: 'other', label: 'Другое' }
]
const currentPage = ref(1)
const ORDERS_PER_PAGE = 10
const stats = ref({
  PENDING: 0,
  PROCESSING: 0,
  SHIPPED: 0,
  DELIVERED: 0
})

let searchTimer = null
let manualSearchTimer = null
let manualCitySearchTimer = null
let manualCityRequestId = 0
let manualQuoteRequestId = 0

function emptyManualDraft() {
  return { userId: null, partnerId: '', customerName: '', customerEmail: '', customerPhone: '', status: 'PENDING', paymentStatus: 'PENDING',
    promoCode: '', items: [], deliveryPrice: 0, deliveryTariffName: '', deliveryTariffCode: '', deliveryCity: '', deliveryPickupPoint: '', deliveryPickupName: '', shippingAddress: '', notes: '' }
}

function earnedCustomerPoints(order) {
  return (order?.pointTransactions || []).reduce((sum, transaction) => sum + Math.max(0, Number(transaction.amount) || 0), 0)
}

async function openManualOrder() {
  manualDraft.value = emptyManualDraft()
  manualPromoPreview.value = null
  manualPromoError.value = ''
  manualDraft.value.deliveryTariffCode = 136
  manualDraft.value.deliveryTariffName = 'ПВЗ СДЭК'
  manualDeliveryMode.value = 'cdek'
  manualCityQuery.value = ''
  manualCityResults.value = []
  manualCityLoading.value = false
  manualCitySearched.value = false
  manualSelectedCity.value = null
  manualPoints.value = []
  manualPointsLoading.value = false
  manualPointQuery.value = ''
  manualSelectedPoint.value = null
  manualCdekCalculating.value = false
  manualCdekError.value = ''
  manualCdekQuoteKey.value = ''
  manualDeliveryPriceEdited.value = false
  manualCityRequestId++
  manualQuoteRequestId++
  manualUserQuery.value = ''
  manualSelectedUserLabel.value = ''
  manualUsers.value = []
  manualProducts.value = []
  manualBoundPartnerId.value = null
  manualError.value = ''
  showManualOrder.value = true
  try {
    const { data } = await axios.get(`${API_URL}/products`, { params: { limit: 1000 } })
    manualProducts.value = data.products || []
    if (manualProducts.value.length) addManualItem()
  } catch {
    manualError.value = 'Не удалось загрузить товары'
  }
}

function closeManualOrder() {
  if (!manualSaving.value) {
    showManualOrder.value = false
    clearTimeout(manualCitySearchTimer)
    manualCityRequestId++
    manualQuoteRequestId++
  }
}

function clearManualCdekSelection() {
  manualQuoteRequestId++
  manualCdekCalculating.value = false
  manualSelectedPoint.value = null
  manualDraft.value.deliveryPickupPoint = ''
  manualDraft.value.deliveryPickupName = ''
  manualDraft.value.shippingAddress = ''
  manualDraft.value.deliveryPrice = 0
  manualCdekQuoteKey.value = ''
  manualDeliveryPriceEdited.value = false
}

function setManualDeliveryMode(mode) {
  if (manualDeliveryMode.value === mode) return
  manualDeliveryMode.value = mode
  manualCdekError.value = ''
  clearManualCdekSelection()
  if (mode === 'cdek') {
    manualDraft.value.deliveryTariffCode = 136
    manualDraft.value.deliveryTariffName = 'ПВЗ СДЭК'
    manualDraft.value.deliveryCity = ''
  } else {
    manualCityRequestId++
    clearTimeout(manualCitySearchTimer)
    manualCityQuery.value = ''
    manualCityResults.value = []
    manualSelectedCity.value = null
    manualPoints.value = []
    manualDraft.value.deliveryTariffCode = ''
    manualDraft.value.deliveryTariffName = 'Доставка по адресу'
    manualDraft.value.deliveryCity = ''
  }
}

async function searchManualCities() {
  const query = manualCityQuery.value.trim()
  if (!showManualOrder.value || manualDeliveryMode.value !== 'cdek' || query.length < 3) return
  const requestId = ++manualCityRequestId
  manualCityLoading.value = true
  manualCitySearched.value = false
  manualCdekError.value = ''
  try {
    const { data } = await deliveryApi.post('/find-city', { name: query })
    if (requestId !== manualCityRequestId) return
    manualCityResults.value = Array.isArray(data) ? data.slice(0, 20) : []
    manualCitySearched.value = true
  } catch (error) {
    if (requestId !== manualCityRequestId) return
    manualCityResults.value = []
    manualCdekError.value = error.response?.data?.error || 'Не удалось найти город СДЭК. Попробуйте ещё раз.'
  } finally {
    if (requestId === manualCityRequestId) manualCityLoading.value = false
  }
}

async function selectManualCity(city) {
  const requestId = ++manualCityRequestId
  manualSelectedCity.value = city
  manualCityQuery.value = city.city
  manualCityResults.value = []
  manualCitySearched.value = false
  manualPoints.value = []
  manualPointQuery.value = ''
  clearManualCdekSelection()
  manualDraft.value.deliveryCity = city.city
  manualDraft.value.deliveryTariffCode = 136
  manualDraft.value.deliveryTariffName = 'ПВЗ СДЭК'
  manualPointsLoading.value = true
  manualCdekError.value = ''
  try {
    const { data } = await deliveryApi.get('/pickup-points', { params: { city_code: city.code, limit: 1000 } })
    if (requestId !== manualCityRequestId) return
    manualPoints.value = Array.isArray(data) ? data : []
    if (!manualPoints.value.length) manualCdekError.value = 'В этом городе ПВЗ не найдены. Выберите другой город.'
  } catch (error) {
    if (requestId !== manualCityRequestId) return
    manualCdekError.value = error.response?.data?.error || 'Не удалось загрузить пункты выдачи СДЭК.'
  } finally {
    if (requestId === manualCityRequestId) manualPointsLoading.value = false
  }
}

function clearManualPoint() {
  clearManualCdekSelection()
  manualCdekError.value = ''
}

function manualCdekCurrentQuoteKey() {
  return JSON.stringify({
    city: manualSelectedCity.value?.code,
    point: manualSelectedPoint.value?.code,
    items: manualDraft.value.items.map(item => [item.productId, item.quantity, item.price])
  })
}

async function selectManualPoint(point) {
  manualSelectedPoint.value = point
  manualDraft.value.deliveryPickupPoint = point.code
  manualDraft.value.deliveryPickupName = point.name
  manualDraft.value.shippingAddress = point.address || ''
  manualCdekError.value = ''
  await calculateManualCdekPrice()
}

async function calculateManualCdekPrice() {
  if (!manualSelectedCity.value || !manualSelectedPoint.value) return false
  const requestId = ++manualQuoteRequestId
  const quoteKey = manualCdekCurrentQuoteKey()
  const weight = manualDraft.value.items.reduce((sum, item) => {
    const product = manualProducts.value.find(product => product.id === item.productId)
    return sum + Math.max(1, Number(item.quantity) || 0) * Math.max(0, Number.parseInt(product?.weight, 10) || 0)
  }, 0)
  const subtotal = manualDraft.value.items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.price) || 0), 0)
  manualCdekCalculating.value = true
  manualCdekError.value = ''
  try {
    const { data } = await deliveryApi.post('/calculate-by-tariff', {
      tariff_code: 136,
      from_code: 44,
      to_code: manualSelectedCity.value.code,
      to_location: {
        code: manualSelectedCity.value.code,
        city: manualSelectedCity.value.city,
        country: manualSelectedCity.value.country || manualSelectedCity.value.country_name || '',
        country_code: manualSelectedCity.value.country_code || manualSelectedCity.value.countryCode || ''
      },
      weight: Math.max(1, Math.round(weight)),
      declared_value: Math.max(0, subtotal)
    })
    if (requestId !== manualQuoteRequestId || quoteKey !== manualCdekCurrentQuoteKey()) return false
    const price = Number(data?.total_sum ?? data?.total_price ?? data?.delivery_sum)
    if (!Number.isFinite(price) || price < 0) throw new Error('СДЭК не вернул стоимость доставки')
    manualDraft.value.deliveryPrice = price
    manualDraft.value.deliveryTariffCode = Number(data?.selected_tariff_code || data?.tariff_code || 136)
    manualDraft.value.deliveryTariffName = data?.selected_tariff_name || data?.tariff_name || 'ПВЗ СДЭК'
    manualCdekQuoteKey.value = quoteKey
    manualDeliveryPriceEdited.value = false
    return true
  } catch (error) {
    if (requestId !== manualQuoteRequestId) return false
    manualCdekError.value = error.response?.data?.error || error.message || 'Не удалось рассчитать доставку. Укажите стоимость вручную.'
    return false
  } finally {
    if (requestId === manualQuoteRequestId) manualCdekCalculating.value = false
  }
}

async function selectManualUser(user) {
  manualDraft.value.userId = user.id
  manualDraft.value.customerName = user.name || ''
  manualDraft.value.customerEmail = user.email || ''
  manualDraft.value.customerPhone = user.phone || ''
  manualSelectedUserLabel.value = `${user.name} · ${user.email}`
  manualUserQuery.value = manualSelectedUserLabel.value
  manualUsers.value = []
  try {
    const { data } = await axios.get(`${API_URL}/orders/customer/${user.id}`)
    manualBoundPartnerId.value = data.user?.partnerUser?.partner?.id || null
    manualDraft.value.partnerId = manualBoundPartnerId.value || ''
    if (manualDeliveryMode.value === 'address') manualDraft.value.shippingAddress = data.user?.address || ''
  } catch {
    manualError.value = 'Не удалось проверить закрепление клиента за партнёром'
  }
}

function clearManualUser() {
  manualDraft.value.userId = null
  manualDraft.value.partnerId = ''
  manualBoundPartnerId.value = null
  manualSelectedUserLabel.value = ''
  manualUserQuery.value = ''
  manualUsers.value = []
}

function addManualItem() {
  const product = manualProducts.value[0]
  if (!product) return
  manualDraft.value.items.push({ key: `manual-${Date.now()}-${Math.random()}`, productId: product.id, dosage: '', quantity: 1, price: Number(product.price) || 0 })
}

function setManualProductPrice(item) {
  const product = manualProducts.value.find(product => product.id === item.productId)
  if (product) item.price = Number(product.price) || 0
}

async function validateManualPromo() {
  const key = manualPromoKey.value
  manualPromoPreview.value = null
  manualPromoError.value = ''
  if (!manualDraft.value.userId) {
    manualPromoError.value = 'Для промокода выберите зарегистрированного клиента'
    return
  }
  manualPromoLoading.value = true
  try {
    const { data } = await axios.post(`${API_URL}/orders/promo/validate`, {
      promoCode: manualDraft.value.promoCode,
      userId: manualDraft.value.userId,
      partnerId: manualDraft.value.partnerId || null,
      subtotal: manualDraftSubtotal.value
    })
    if (key === manualPromoKey.value) manualPromoPreview.value = { ...data, key }
  } catch (error) {
    if (key === manualPromoKey.value) manualPromoError.value = error.response?.data?.error || 'Не удалось проверить промокод'
  } finally {
    manualPromoLoading.value = false
  }
}

async function createManualOrder() {
  if (manualSaving.value) return
  manualError.value = ''
  if (manualDeliveryMode.value === 'cdek') {
    if (!manualSelectedCity.value || !manualSelectedPoint.value) {
      manualError.value = 'Выберите город и пункт выдачи СДЭК'
      return
    }
    if (!manualDeliveryPriceEdited.value && manualCdekQuoteKey.value !== manualCdekCurrentQuoteKey()) {
      const calculated = await calculateManualCdekPrice()
      if (!calculated) {
        manualError.value = 'Не удалось обновить стоимость доставки. Повторите расчёт или укажите цену вручную.'
        return
      }
    }
  }
  if (manualDraft.value.promoCode && !manualAppliedPromo.value) {
    await validateManualPromo()
    if (!manualAppliedPromo.value) {
      manualError.value = manualPromoError.value || 'Проверьте промокод перед созданием заказа'
      return
    }
  }
  manualSaving.value = true
  try {
    const payload = { ...manualDraft.value, items: manualDraft.value.items.map(({ productId, dosage, quantity, price }) => ({ productId, dosage, quantity, price })) }
    delete payload.partnerId
    if (manualDraft.value.partnerId) payload.partnerId = Number(manualDraft.value.partnerId)
    await axios.post(`${API_URL}/orders`, payload)
    showManualOrder.value = false
    if (currentPage.value !== 1) currentPage.value = 1
    else await fetchOrders()
  } catch (error) {
    manualError.value = error.response?.data?.error || 'Не удалось создать заказ'
  } finally {
    manualSaving.value = false
  }
}

async function fetchOrders() {
  loading.value = true
  try {
    const params = {
      ...(filterStatus.value ? { status: filterStatus.value } : {}),
      ...(filterFavorites.value ? { favorites: 'true' } : {}),
      ...(search.value.trim() ? { q: search.value.trim() } : {}),
      limit: ORDERS_PER_PAGE,
      offset: (currentPage.value - 1) * ORDERS_PER_PAGE
    }
    const { data } = await axios.get(`${API_URL}/orders`, { params })
    orders.value = data.orders
    total.value = data.total || 0
    stats.value = data.stats || {}
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function scheduleOrdersSearch() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    if (currentPage.value === 1) {
      fetchOrders()
    } else {
      currentPage.value = 1
    }
  }, 250)
}

function handleStatusFilterChange() {
  if (currentPage.value === 1) {
    fetchOrders()
  } else {
    currentPage.value = 1
  }
}

function toggleFavoritesFilter() {
  filterFavorites.value = !filterFavorites.value
  if (currentPage.value === 1) {
    fetchOrders()
  } else {
    currentPage.value = 1
  }
}

async function toggleOrderFavorite(order) {
  if (!order?.id || favoriteSavingId.value === order.id) return

  const nextValue = !Boolean(order.isFavorite)
  favoriteSavingId.value = order.id
  try {
    const { data } = await axios.put(`${API_URL}/orders/${order.id}/favorite`, { isFavorite: nextValue })
    order.isFavorite = Boolean(data.order?.isFavorite)
    if (selectedOrder.value?.id === order.id) selectedOrder.value.isFavorite = order.isFavorite
    if (filterFavorites.value && !order.isFavorite) await fetchOrders()
  } catch (e) {
    alert(e.response?.data?.error || 'Не удалось обновить избранное')
  } finally {
    favoriteSavingId.value = null
  }
}

async function updateStatus(id, status) {
  try {
    let cancelReason = null
    if (status === 'CANCELLED') {
      cancelReason = promptCancelReason()
      if (!cancelReason) {
        await fetchOrders()
        return
      }
    }

    await axios.put(`${API_URL}/orders/${id}/status`, { status, cancelReason })
    const order = orders.value.find(o => o.id === id)
    if (order) {
      order.status = status
      order.cancelReason = status === 'CANCELLED' ? cancelReason : null
    }
    if (selectedOrder.value?.id === id) {
      selectedOrder.value.status = status
      selectedOrder.value.cancelReason = status === 'CANCELLED' ? cancelReason : null
    }
  } catch (e) {
    alert('Ошибка обновления статуса')
  }
}

function promptCancelReason() {
  const message = [
    'Укажите причину отмены заказа:',
    ...cancelReasonOptions.map((item, index) => `${index + 1}. ${item.label}`)
  ].join('\n')
  const answer = window.prompt(message, '1')
  if (answer === null) return null
  const normalized = String(answer).trim().toLowerCase()
  const byIndex = cancelReasonOptions[Number.parseInt(normalized, 10) - 1]
  if (byIndex) return byIndex.value
  const byValue = cancelReasonOptions.find(item => item.value === normalized || item.label.toLowerCase() === normalized)
  return byValue?.value || 'other'
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
    const nextTotal = Math.max(0, total.value - 1)
    const nextLastPage = Math.max(1, Math.ceil(nextTotal / ORDERS_PER_PAGE))
    if (currentPage.value > nextLastPage) {
      currentPage.value = nextLastPage
    } else {
      await fetchOrders()
    }
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
    await fetchOrders()
    if (selectedOrder.value?.id === order.id) {
      selectedOrder.value = orders.value.find(item => item.id === order.id) || selectedOrder.value
    }
  } catch (e) {
    alert(e.response?.data?.error || 'Не удалось обновить статус оплаты')
  }
}

function viewOrder(order) {
  selectedOrder.value = order
  editingOrder.value = false
  cdekStatus.value = null
  cdekMessages.value = []

  if (order.cdekOrderUuid) void syncCdekStatus()
}

async function downloadWaybill(format) {
  if (!selectedOrder.value || downloadingWaybill.value) return
  downloadingWaybill.value = true
  try {
    const id = selectedOrder.value.id
    const { data } = await axios.get(`${API_URL}/orders/${id}/waybill`, {
      params: { format },
      responseType: 'blob'
    })
    const url = URL.createObjectURL(data)
    const link = document.createElement('a')
    link.href = url
    link.download = `Накладная-заказ-${id}.${format}`
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  } catch (error) {
    let message = 'Не удалось скачать накладную'
    if (error.response?.data instanceof Blob) {
      try { message = JSON.parse(await error.response.data.text()).error || message } catch { /* fallback */ }
    }
    alert(message)
  } finally {
    downloadingWaybill.value = false
  }
}

async function exportAllOrders(format, period = {}) {
  if (exportLoading.value) return
  exportLoading.value = true
  try {
    const { data } = await axios.get('/api/admin/partners/orders-export/all-orders', {
      params: { format, ...period },
      responseType: 'blob'
    })
    const url = URL.createObjectURL(data)
    const link = document.createElement('a')
    link.href = url
    link.download = `all-orders-${period.dateFrom ? `${period.dateFrom}-${period.dateTo}` : new Date().toISOString().slice(0, 10)}.${format}`
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  } catch (error) {
    let message = 'Не удалось выгрузить все заказы'
    if (error.response?.data instanceof Blob) {
      try { message = JSON.parse(await error.response.data.text()).error || message } catch { /* fallback */ }
    }
    alert(message)
  } finally {
    exportLoading.value = false
  }
}

function closeOrder() {
  if (savingOrder.value) return
  editingOrder.value = false
  selectedOrder.value = null
}

async function startEditingOrder() {
  if (!selectedOrder.value) return
  editError.value = ''
  const order = selectedOrder.value
  orderDraft.value = {
    customerName: order.customerName || '', customerEmail: order.customerEmail || '', customerPhone: order.customerPhone || '',
    shippingAddress: order.shippingAddress || '', notes: order.notes || '', deliveryTariffName: order.deliveryTariffName || '',
    deliveryTariffCode: order.deliveryTariffCode ?? '', deliveryPrice: order.deliveryPrice ?? 0,
    deliveryCity: order.deliveryCity || '', deliveryPickupPoint: order.deliveryPickupPoint || '', deliveryPickupName: order.deliveryPickupName || '',
    items: order.items.map((item, index) => ({ key: `existing-${index}`, id: item.id, productId: item.productId, dosage: item.dosage || '', quantity: item.quantity, price: item.price }))
  }
  editProducts.value = order.items.map(item => ({ id: item.productId, title: item.product?.title || `Товар #${item.productId}` }))
  editingOrder.value = true
  try {
    const { data } = await axios.get(`${API_URL}/products`, { params: { limit: 1000 } })
    editProducts.value = [...new Map([...editProducts.value, ...(data.products || [])].map(product => [product.id, product])).values()]
  } catch {
    editError.value = 'Не удалось загрузить каталог. Уже выбранные товары доступны для редактирования.'
  }
}

function addOrderItem() {
  if (!editProducts.value.length) return
  orderDraft.value.items.push({ key: `new-${Date.now()}-${Math.random()}`, id: null, productId: editProducts.value[0].id, dosage: '', quantity: 1, price: editProducts.value[0].price ?? 0 })
}

function setDraftProductPrice(item) {
  const product = editProducts.value.find(product => product.id === item.productId)
  if (product?.price != null) item.price = Number(product.price)
}

function orderItemsChanged() {
  const normalize = item => [item.id ?? null, Number(item.productId), String(item.dosage || '').trim(), Number(item.quantity), Number(item.price)]
  return JSON.stringify(orderDraft.value.items.map(normalize)) !== JSON.stringify((selectedOrder.value?.items || []).map(normalize))
}

async function saveOrder() {
  if (!orderDraft.value || savingOrder.value) return
  editError.value = ''
  const draft = orderDraft.value
  const payload = {
    customerName: draft.customerName, customerEmail: draft.customerEmail, customerPhone: draft.customerPhone,
    shippingAddress: draft.shippingAddress, notes: draft.notes, deliveryTariffName: draft.deliveryTariffName,
    deliveryCity: draft.deliveryCity, deliveryPickupPoint: draft.deliveryPickupPoint, deliveryPickupName: draft.deliveryPickupName,
    deliveryTariffCode: draft.deliveryTariffCode === '' ? null : draft.deliveryTariffCode
  }
  if (canEditOrderAmount.value) {
    payload.deliveryPrice = draft.deliveryPrice
  }
  if (orderItemsChanged()) {
    payload.expectedUpdatedAt = selectedOrder.value.updatedAt
    payload.expectedEditVersion = selectedOrder.value.editVersion
    payload.items = draft.items.map(({ id, productId, dosage, quantity, price }) => ({ id, productId, dosage, quantity, price }))
  }
  savingOrder.value = true
  try {
    const { data } = await axios.put(`${API_URL}/orders/${selectedOrder.value.id}`, payload)
    const updated = { ...selectedOrder.value, ...data.order }
    selectedOrder.value = updated
    const index = orders.value.findIndex(order => order.id === updated.id)
    if (index !== -1) orders.value[index] = updated
    editingOrder.value = false
  } catch (error) {
    editError.value = error.response?.data?.error || 'Не удалось сохранить заказ'
  } finally {
    savingOrder.value = false
  }
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

function getOrderDetailTotal(order) {
  if (!isCdekDelivery(order)) return Number(order?.total || 0)
  const itemsTotal = (order?.items || []).reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0)
  return Math.round(Math.max(0, itemsTotal - Number(order?.discountAmount || 0)) * 100) / 100
}

function getFixedPaymentAmount(order) {
  return Math.round((Number(order?.total || 0) - Number(order?.unbilledAdjustment || 0)) * 100) / 100
}

function getPartnerBonusAmount(order) {
  return Math.max(0, Number(order?.partnerBonusInfo?.amount ?? order?.partnerBonusAmount ?? 0))
}

function getPartnerAvailableBalance(order) {
  return Math.max(0, Number(order?.partnerBonusInfo?.balance?.availableBalance ?? 0))
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
    const { data } = await deliveryApi.post(`/orders/${selectedOrder.value.cdekOrderUuid}/sync-status`)

    cdekStatus.value = (data.cdekStatuses || []).map(status => ({
      name: status.name,
      date: status.dateTime ? new Date(status.dateTime).toLocaleString('ru-RU') : ''
    }))
    cdekMessages.value = data.cdekMessages || []
  } catch (e) {
    console.error('Sync error:', e)
    cdekMessages.value = [e.response?.data?.message || e.response?.data?.error || 'Не удалось получить статус СДЭК.']
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
    RETURNED: 'badge-danger',
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
    RETURNED: 'Возврат',
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

function getCancelReasonLabel(reason) {
  const option = cancelReasonOptions.find(item => item.value === reason)
  return option?.label || 'Причина не указана'
}

function isOrderPaid(status) {
  const key = String(status || '').trim().toUpperCase()
  return ['PAID', 'APPROVED', 'SUCCESS', 'SUCCEEDED', 'COMPLETED'].some(code => key.includes(code))
}

onMounted(fetchOrders)

watch(currentPage, fetchOrders)
watch(search, scheduleOrdersSearch)
watch(manualUserQuery, query => {
  clearTimeout(manualSearchTimer)
  if (manualDraft.value.userId && query !== manualSelectedUserLabel.value) {
    manualDraft.value.userId = null
    manualDraft.value.partnerId = ''
    manualBoundPartnerId.value = null
    manualSelectedUserLabel.value = ''
  }
  if (!showManualOrder.value || query.length < 2 || query.includes(' · ')) { manualUsers.value = []; return }
  manualSearchTimer = setTimeout(async () => {
    try {
      const { data } = await axios.get(`${API_URL}/users`, { params: { q: query, limit: 10 } })
      if (manualUserQuery.value === query) manualUsers.value = data.users || []
    } catch { manualUsers.value = [] }
  }, 250)
})
watch(manualCityQuery, query => {
  clearTimeout(manualCitySearchTimer)
  if (!showManualOrder.value || manualDeliveryMode.value !== 'cdek') return
  if (manualSelectedCity.value && query.trim() === manualSelectedCity.value.city) return
  manualCityRequestId++
  manualCityLoading.value = false
  manualCitySearched.value = false
  manualCityResults.value = []
  if (manualSelectedCity.value) {
    manualSelectedCity.value = null
    manualPoints.value = []
    manualPointsLoading.value = false
    manualPointQuery.value = ''
    clearManualCdekSelection()
    manualDraft.value.deliveryCity = ''
  }
  if (query.trim().length >= 3) manualCitySearchTimer = setTimeout(searchManualCities, 300)
})
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
  align-items: center;
  gap: .6rem;
  flex-shrink: 0;
}

.header-actions .btn {
  min-height: 40px;
  padding: .5rem .85rem;
  border-radius: 10px;
  font-size: .8rem;
  line-height: 1.2;
  letter-spacing: 0;
  white-space: nowrap;
}

.favorite-filter {
  display: inline-flex;
  min-height: 40px;
  align-items: center;
  gap: .4rem;
  padding: .5rem .75rem;
  border: 1px solid rgba(148, 163, 184, .28);
  border-radius: 10px;
  background: rgba(148, 163, 184, .06);
  color: var(--text-secondary);
  cursor: pointer;
  font: inherit;
  font-size: .82rem;
  font-weight: 650;
  white-space: nowrap;
  transition: border-color .22s ease, background .22s ease, color .22s ease, box-shadow .22s ease;
}

.favorite-filter svg,
.favorite-order-btn svg {
  width: 1.2rem;
  height: 1.2rem;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.8;
}

.favorite-filter:hover {
  border-color: rgba(250, 204, 21, .66);
  color: #fde68a;
}

.favorite-filter.active {
  border-color: rgba(250, 204, 21, .72);
  background: linear-gradient(135deg, rgba(250, 204, 21, .2), rgba(245, 158, 11, .07));
  box-shadow: inset 0 1px rgba(255, 241, 166, .25), 0 0 18px rgba(245, 158, 11, .16);
  color: #facc15;
}

.status-filter {
  width: 168px;
  min-width: 0;
  min-height: 40px;
  padding: .5rem .7rem;
  font-size: .82rem;
  line-height: 1.2;
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
  min-width: 1100px;
}

.orders-table {
  min-width: 920px;
  table-layout: fixed;
}

.orders-table__favorite-col { width: 5%; }
.orders-table__customer-col { width: 24%; }
.orders-table__delivery-col { width: 23%; }
.orders-table__amount-col { width: 20%; }
.orders-table__status-col { width: 17%; }
.orders-table__actions-col { width: 11%; }

.orders-table th,
.orders-table td {
  padding: 1.1rem .9rem;
  vertical-align: top;
}

.orders-table tbody tr {
  transition: background .2s ease;
}

.orders-table tbody tr:hover {
  background: rgba(166, 185, 248, .035);
}

.order-summary-cell,
.order-delivery-cell,
.order-amount-cell,
.order-state-cell {
  min-width: 0;
}

.order-summary-cell__meta {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: .35rem .7rem;
  color: var(--text-muted);
  font-size: .72rem;
  margin-bottom: .6rem;
}

.order-number-link {
  border: 0;
  padding: 0;
  background: transparent;
  color: var(--accent);
  font: 700 .86rem var(--font-mono);
  cursor: pointer;
}

.order-number-link:hover { text-decoration: underline; text-underline-offset: 3px; }

.order-summary-cell__name {
  font-size: .95rem;
  font-weight: 700;
  line-height: 1.3;
  overflow-wrap: anywhere;
}

.order-summary-cell__phone {
  margin-top: .2rem;
  font-size: .78rem;
  color: var(--text-secondary);
}

.order-summary-cell__promo {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: .35rem .55rem;
  margin-top: .8rem;
  min-width: 0;
}

.order-summary-cell__promo .promo-code-tag {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.order-summary-cell__promo .promo-partner-link {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.order-delivery-cell .delivery-badge {
  max-width: 100%;
  border-radius: 9px;
  margin: 0 0 .5rem;
  padding: .38rem .55rem;
  line-height: 1.3;
}

.order-delivery-cell .delivery-badge svg { flex: 0 0 14px; }
.order-delivery-cell .delivery-badge span {
  min-width: 0;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.order-delivery-cell__type,
.order-delivery-cell__city {
  font-size: .82rem;
  font-weight: 600;
  line-height: 1.35;
}

.order-delivery-cell__detail {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  margin-top: .3rem;
  color: var(--text-muted);
  font-size: .75rem;
  line-height: 1.45;
  overflow-wrap: anywhere;
}

.order-amount-cell__total {
  font: 700 1.05rem var(--font-mono);
  white-space: nowrap;
}

.order-amount-cell__items {
  margin-top: .22rem;
  color: var(--text-muted);
  font-size: .75rem;
}

.order-amount-cell__rewards {
  margin-top: .75rem;
  padding-top: .55rem;
  border-top: 1px solid var(--border);
  color: var(--text-secondary);
  font-size: .72rem;
  line-height: 1.6;
}

.order-amount-cell__rewards strong { color: var(--accent); font-weight: 700; }

.order-state-cell .status-select {
  display: block;
  width: 100%;
  max-width: 180px;
  min-height: 36px;
  margin: 0 0 .55rem;
  padding: .4rem .55rem;
}

.order-state-cell .payment-badge {
  min-width: 0;
  padding: .3rem .65rem;
}

.order-payment-method {
  margin-top: .45rem;
}

.order-state-cell .pay-now-btn {
  max-width: 180px;
  text-align: left;
  line-height: 1.3;
}

.order-actions-cell__buttons {
  display: flex;
  align-items: center;
  gap: .35rem;
}

.order-open-btn {
  display: inline-flex;
  align-items: center;
  gap: .4rem;
  min-height: 36px;
  padding: .4rem .55rem;
  border: 1px solid var(--border);
  border-radius: 9px;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  font-size: .75rem;
  font-weight: 700;
  cursor: pointer;
  transition: border-color .2s ease, color .2s ease, background .2s ease;
}

.order-open-btn:hover {
  border-color: var(--accent);
  background: var(--accent-dim);
  color: var(--accent);
}

.favorite-column,
.favorite-cell {
  width: 46px;
  padding-right: .3rem !important;
  padding-left: .8rem !important;
  text-align: center !important;
}

.favorite-order-btn {
  display: inline-grid;
  width: 2rem;
  height: 2rem;
  place-items: center;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 9px;
  background: transparent;
  color: rgba(148, 163, 184, .78);
  cursor: pointer;
  transition: color .2s ease, border-color .2s ease, background .2s ease, box-shadow .2s ease, transform .2s ease;
}

.favorite-order-btn:hover:not(:disabled) {
  border-color: rgba(250, 204, 21, .46);
  background: rgba(250, 204, 21, .08);
  color: #fde68a;
  transform: translateY(-1px);
}

.favorite-order-btn.active {
  border-color: rgba(250, 204, 21, .62);
  background: linear-gradient(135deg, rgba(250, 204, 21, .2), rgba(245, 158, 11, .1));
  box-shadow: 0 0 13px rgba(245, 158, 11, .2), inset 0 1px rgba(255, 244, 184, .22);
  color: #facc15;
}

.favorite-order-btn.active svg {
  fill: currentColor;
}

.favorite-order-btn:disabled {
  cursor: wait;
  opacity: .55;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
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
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.9rem;
}

.order-card__payment {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: .4rem;
  flex: none;
}

.order-card__title {
  display: inline-flex;
  align-items: center;
  gap: .35rem;
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

.modal--editing { max-width: 820px; }

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

.order-edit-actions {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: .65rem;
  margin-bottom: 1.25rem;
}

.order-edit-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.edit-section-title {
  padding-bottom: .55rem;
  border-bottom: 1px solid var(--border);
  color: var(--text-secondary);
  font-size: .8rem;
  font-weight: 700;
  letter-spacing: .08em;
  text-transform: uppercase;
}

.edit-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: .85rem;
}

.edit-grid label,
.edit-item label {
  display: flex;
  flex-direction: column;
  gap: .4rem;
  min-width: 0;
  color: var(--text-secondary);
  font-size: .8rem;
  font-weight: 600;
}

.edit-grid .input,
.edit-item .input {
  width: 100%;
  min-width: 0;
  color: var(--text-primary);
}

.edit-wide { grid-column: 1 / -1; }
.edit-grid textarea { resize: vertical; }
.edit-grid :disabled,
.edit-item :disabled { opacity: .55; cursor: not-allowed; }

.edit-item {
  display: grid;
  grid-template-columns: minmax(130px, 2fr) minmax(80px, 1fr) 75px 100px 30px;
  gap: .55rem;
  align-items: end;
}

.edit-remove {
  height: 40px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-secondary);
  color: var(--danger);
  font-size: 1.3rem;
}

.edit-summary {
  padding: .8rem 1rem;
  border: 1px solid var(--border);
  border-radius: 10px;
  text-align: right;
  font-weight: 700;
}

.edit-notice,
.edit-error { font-size: .85rem; line-height: 1.45; }
.edit-notice { color: var(--text-secondary); }
.edit-error { color: var(--danger); }

.manual-user-search {
  display: flex;
  flex-direction: column;
  gap: .4rem;
  color: var(--text-secondary);
  font-size: .8rem;
  font-weight: 600;
}

.manual-user-results {
  max-height: 180px;
  overflow-y: auto;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--bg-secondary);
}

.manual-user-results button {
  display: flex;
  align-items: center;
  width: 100%;
  justify-content: space-between;
  gap: 1rem;
  padding: .65rem .85rem;
  border-bottom: 1px solid var(--border);
  background: transparent;
  color: var(--text-primary);
  appearance: none;
  text-align: left;
  cursor: pointer;
  overflow-wrap: anywhere;
}

.manual-user-results button:last-child { border-bottom: 0; }
.manual-user-results button small { flex: 0 0 auto; color: var(--accent); }
.manual-user-results button:hover,
.manual-user-results button.active { background: var(--accent-dim); }

.manual-clear-user {
  margin-left: .4rem;
  color: var(--accent);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.manual-clear-user:hover { color: var(--text-primary); }

.manual-order-modal {
  max-width: 900px;
  max-height: 92vh;
  padding: 0;
  background: var(--bg-card);
  color-scheme: dark;
}

[data-theme="light"] .manual-order-modal { color-scheme: light; }

.manual-order-header {
  position: sticky;
  top: 0;
  z-index: 3;
  align-items: flex-start;
  margin: 0;
  padding: 1.3rem 1.65rem;
  border-bottom: 1px solid var(--border);
  background: var(--bg-card);
}

.manual-order-kicker {
  display: block;
  margin-bottom: .25rem;
  color: var(--accent);
  font-size: .68rem;
  font-weight: 800;
  letter-spacing: .12em;
  text-transform: uppercase;
}

.manual-order-header .modal-title { font-size: 1.5rem; }
.manual-order-header p { margin-top: .25rem; color: var(--text-secondary); font-size: .85rem; }
.manual-order-form { gap: 0; }

.manual-order-section {
  padding: 1.5rem 1.65rem;
  border-bottom: 1px solid var(--border);
}

.manual-section-heading {
  display: flex;
  align-items: flex-start;
  gap: .8rem;
  margin-bottom: 1.15rem;
}

.manual-section-heading > span {
  display: grid;
  flex: 0 0 28px;
  width: 28px;
  height: 28px;
  place-items: center;
  border: 1px solid rgba(163, 180, 255, .38);
  border-radius: 9px;
  background: var(--accent-dim);
  color: var(--accent);
  font-size: .75rem;
  font-weight: 800;
}

.manual-section-heading h4 { font-size: 1rem; line-height: 1.2; }
.manual-section-heading p { margin-top: .25rem; color: var(--text-muted); font-size: .78rem; }
.manual-customer-fields { margin-top: .9rem; }
.manual-customer-fields { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.manual-order-section .input { min-height: 42px; }
.manual-promo-row { display: flex; gap: .6rem; margin-top: .35rem; }
.manual-promo-row .input { min-width: 0; flex: 1; }
.manual-promo-row .btn { flex: 0 0 auto; }
.manual-promo-success { margin: 0; color: var(--accent); font-size: .82rem; }
.manual-order-section .edit-item { margin-bottom: .7rem; }
.manual-add-item { margin-top: .25rem; }

.manual-selected-user,
.manual-selected-point {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: .75rem;
  margin-top: .7rem;
  padding: .7rem .85rem;
  border: 1px solid rgba(163, 180, 255, .32);
  border-radius: 11px;
  background: var(--accent-dim);
  font-size: .82rem;
}

.manual-selected-user button,
.manual-selected-point button,
.manual-recalculate { flex: 0 0 auto; color: var(--accent); font-size: .78rem; font-weight: 700; cursor: pointer; }
.manual-selected-user button:hover,
.manual-selected-point button:hover,
.manual-recalculate:hover { text-decoration: underline; text-underline-offset: 3px; }
.manual-selected-point > div { display: flex; flex-direction: column; gap: .2rem; }
.manual-selected-point span { color: var(--text-secondary); }

.manual-delivery-choices { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .7rem; }
.manual-delivery-choice {
  display: grid;
  grid-template-columns: 18px 1fr;
  column-gap: .7rem;
  align-items: center;
  padding: .85rem 1rem;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--bg-secondary);
  cursor: pointer;
  transition: border-color .2s ease, background .2s ease;
}
.manual-delivery-choice:hover { border-color: rgba(163, 180, 255, .45); }
.manual-delivery-choice.selected { border-color: var(--accent); background: var(--accent-dim); }
.manual-delivery-choice input { grid-row: 1 / 3; accent-color: var(--accent); }
.manual-delivery-choice strong { font-size: .88rem; }
.manual-delivery-choice small { margin-top: .2rem; color: var(--text-secondary); font-size: .72rem; }

.manual-cdek-panel {
  display: flex;
  flex-direction: column;
  gap: .65rem;
  margin-top: 1rem;
  padding: 1rem;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: var(--bg-secondary);
}
.manual-field { display: flex; flex-direction: column; gap: .4rem; color: var(--text-secondary); font-size: .8rem; font-weight: 600; }
.manual-city-results,
.manual-point-list {
  max-height: 230px;
  overflow-y: auto;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--bg-card);
}
.manual-city-results button,
.manual-point-list button {
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: .15rem;
  padding: .6rem .8rem;
  border-bottom: 1px solid var(--border);
  background: transparent;
  color: var(--text-primary);
  appearance: none;
  text-align: left;
  cursor: pointer;
}
.manual-city-results button:last-child,
.manual-point-list button:last-child { border-bottom: 0; }
.manual-city-results button:hover,
.manual-point-list button:hover { background: var(--accent-dim); }
.manual-city-results button span,
.manual-point-list button span,
.manual-point-list button small { color: var(--text-secondary); font-size: .75rem; line-height: 1.35; }
.manual-search-state { color: var(--text-muted); font-size: .76rem; }
.manual-cdek-selected-city { color: var(--text-secondary); font-size: .8rem; }
.manual-cdek-selected-city strong { color: var(--text-primary); }
.manual-delivery-note { color: var(--text-muted); font-size: .77rem; line-height: 1.4; }
.manual-address-fields { margin-top: 1rem; }
.manual-order-section .edit-notice { margin-top: 1rem; }

.manual-order-footer {
  position: sticky;
  bottom: 0;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.65rem;
  border-top: 1px solid var(--border);
  background: var(--bg-card);
  box-shadow: 0 -10px 25px rgba(0, 0, 0, .12);
}
.manual-order-footer > div:first-child { display: flex; flex-direction: column; gap: .1rem; }
.manual-order-footer small,
.manual-order-footer span { color: var(--text-muted); font-size: .7rem; }
.manual-order-footer strong { color: var(--text-primary); font: 750 1.2rem var(--font-display); }
.manual-order-footer__actions { display: flex; gap: .6rem; }
.manual-order-footer__actions .btn { min-height: 42px; padding: .55rem 1rem; }

.cell-accruals { min-width: 145px; font-size: .78rem; line-height: 1.55; color: var(--text-secondary); }

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

.cancel-reason-value {
  display: inline-flex;
  padding: 0.25rem 0.6rem;
  border-radius: 999px;
  color: #ef4444;
  background: #ef444422;
  font-size: 0.82rem;
  font-weight: 700;
}

.partner-bonus-card {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 0.9rem;
  align-items: center;
  margin-top: 1rem;
  padding: 1rem;
  border: 1px solid rgba(163, 180, 255, 0.26);
  border-radius: 18px;
  background:
    radial-gradient(circle at 15% 20%, rgba(163, 180, 255, 0.18), transparent 32%),
    rgba(163, 180, 255, 0.08);
}

.partner-bonus-card__icon {
  width: 42px;
  height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  background: rgba(163, 180, 255, 0.18);
  color: var(--accent);
  font-weight: 800;
}

.partner-bonus-card__content,
.partner-bonus-card__balance {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.partner-bonus-card__content span,
.partner-bonus-card__balance span,
.partner-bonus-card__content small {
  color: var(--text-secondary);
  font-size: 0.82rem;
}

.partner-bonus-card__content strong {
  color: #22c55e;
  font-size: 1.05rem;
}

.partner-bonus-card__balance {
  align-items: flex-end;
}

.partner-bonus-card__balance strong {
  color: var(--text-primary);
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

.cdek-warning {
  margin-top: 1rem;
  padding: 1rem;
  border: 1px solid rgba(245, 158, 11, 0.38);
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.13), rgba(120, 70, 6, 0.08));
  color: var(--text-primary);
}

.cdek-warning__heading {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.55rem;
  color: #fbbf24;
  font-size: 0.84rem;
  font-weight: 700;
}

.cdek-warning p {
  margin: 0.45rem 0 0;
  color: var(--text-secondary);
  font-size: 0.84rem;
  line-height: 1.5;
}

.cdek-warning small {
  display: block;
  margin-top: 0.75rem;
  color: #fcd34d;
  font-size: 0.76rem;
  line-height: 1.4;
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

.admin-added-label {
  align-self: flex-start;
  margin: .2rem 0;
  padding: .18rem .5rem;
  border: 1px solid rgba(129, 166, 255, .45);
  border-radius: 999px;
  background: rgba(129, 166, 255, .13);
  color: var(--accent);
  font-size: .68rem;
  font-weight: 700;
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

.total-row--bonus {
  color: var(--text-secondary);
  font-size: 0.86rem;
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

@media (max-width: 1100px) {
  .orders-table-wrapper { display: none; }
  .orders-cards {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem;
  }
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 1rem;
  }

  .status-filter {
    width: 100%;
  }

  .header-actions {
    width: 100%;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: .55rem;
  }

  .header-actions .btn,
  .header-actions .favorite-filter {
    width: 100%;
    min-width: 0;
  }

  .header-actions .status-filter {
    grid-column: 1 / -1;
  }

  .favorite-filter {
    justify-content: center;
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

  .manual-order-modal {
    padding: 0;
    max-height: calc(100dvh - 1rem);
    margin: .5rem;
    overscroll-behavior: contain;
  }
  .manual-order-header { padding: 1rem; }
  .manual-order-section { padding: 1.2rem 1rem; }
  .manual-order-section .input { font-size: 1rem; }
  .manual-promo-row { flex-wrap: wrap; }
  .manual-promo-row .btn { width: 100%; }
  .manual-customer-fields { grid-template-columns: 1fr; }
  .manual-delivery-choices { grid-template-columns: 1fr; }
  .manual-order-footer {
    align-items: stretch;
    flex-direction: column;
    padding: .85rem 1rem calc(.85rem + env(safe-area-inset-bottom));
  }
  .manual-order-footer__actions { display: grid; grid-template-columns: 1fr 1fr; }
  .manual-order-footer__actions .btn { width: 100%; }

  .edit-grid { grid-template-columns: 1fr; }
  .edit-wide { grid-column: auto; }
  .edit-item { grid-template-columns: repeat(2, minmax(0, 1fr)) 30px; }
  .edit-item label:first-child { grid-column: 1 / -1; }
  .manual-item {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: .7rem;
    padding: .85rem;
    border: 1px solid var(--border);
    border-radius: 12px;
    background: var(--bg-secondary);
  }
  .manual-item label:nth-child(2) { grid-column: 1 / -1; }
  .manual-item .edit-remove {
    grid-column: 2;
    justify-self: end;
    width: 42px;
  }

  .order-item-card {
    grid-template-columns: 44px 1fr;
  }

  .order-item-card__sum {
    grid-column: 2;
    justify-self: end;
    margin-top: 0.35rem;
  }

  .partner-bonus-card {
    grid-template-columns: auto 1fr;
  }

  .partner-bonus-card__balance {
    grid-column: 2;
    align-items: flex-start;
  }
}
</style>
