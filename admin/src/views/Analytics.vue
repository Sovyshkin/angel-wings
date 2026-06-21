<template>
  <div class="analytics-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Аналитика препаратов</h1>
        <p class="page-subtitle">Продажи, скорость расхода склада, воронка и LTV по каждому пептиду</p>
      </div>
      <div class="period-switcher">
        <button
          v-for="option in periodOptions"
          :key="option.value"
          type="button"
          :class="['period-btn', { active: days === option.value }]"
          @click="setPeriod(option.value)"
        >
          {{ option.label }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
    </div>

    <template v-else>
      <nav class="analytics-tabs" aria-label="Разделы аналитики">
        <button
          v-for="tab in analyticsTabs"
          :key="tab.key"
          type="button"
          :class="['analytics-tab', { active: activeTab === tab.key }]"
          @click="activeTab = tab.key"
        >
          <span>{{ tab.label }}</span>
          <small>{{ tab.hint }}</small>
        </button>
      </nav>

      <section v-if="activeTab === 'actions'" class="action-analytics">
        <div class="morning-hero">
          <div class="morning-hero__content">
            <span class="section-kicker">Главный экран утра</span>
            <h2>Что требует внимания сегодня</h2>
            <p>Сводка продаж, складских рисков и клиентов, которым пора сделать следующий шаг.</p>
          </div>
          <div class="morning-sales-card" :class="morningDashboard.revenueDelta >= 0 ? 'positive' : 'negative'">
            <span>Вчера</span>
            <strong>{{ formatCurrency(morningDashboard.yesterday?.revenue) }}</strong>
            <small>
              {{ morningDashboard.revenueDelta >= 0 ? '+' : '' }}{{ morningDashboard.revenueDelta || 0 }}%
              к позавчера · {{ formatCurrency(morningDashboard.lastMonthSameDay?.revenue) }} в аналогичный день прошлого месяца
            </small>
          </div>
        </div>

        <div class="morning-grid">
          <article class="morning-panel morning-panel--top">
            <div class="insight-head">
              <div>
                <h3>Топ-5 пептидов по выручке</h3>
                <p>Что сейчас реально двигает кассу</p>
              </div>
            </div>
            <div class="morning-list">
              <div v-for="item in morningDashboard.topProducts" :key="item.productId" class="morning-row">
                <div>
                  <strong>{{ item.title }}</strong>
                  <span>{{ item.units }} уп. · остаток {{ item.stock }} шт.</span>
                </div>
                <b>{{ formatCurrency(item.revenue) }}</b>
              </div>
              <div v-if="!morningDashboard.topProducts?.length" class="empty-mini">Продаж за период пока нет.</div>
            </div>
          </article>

          <article class="morning-panel morning-panel--danger">
            <div class="insight-head">
              <div>
                <h3>Критические остатки</h3>
                <p>Позиции, где осталось меньше 20 упаковок</p>
              </div>
              <span class="pill danger">{{ morningDashboard.criticalStock?.length || 0 }}</span>
            </div>
            <div class="morning-list">
              <div v-for="item in morningDashboard.criticalStock" :key="item.productId" class="morning-row">
                <div>
                  <strong>{{ item.title }}</strong>
                  <span>{{ item.units14 }} уп. за 14 дней</span>
                </div>
                <b>{{ item.stock }} шт.</b>
              </div>
              <div v-if="!morningDashboard.criticalStock?.length" class="empty-mini">Критических остатков нет.</div>
            </div>
          </article>

          <article class="morning-panel morning-panel--repeat">
            <div class="insight-head">
              <div>
                <h3>Высокая вероятность повтора</h3>
                <p>Купили курс недавно, давно не возвращались или имели высокий чек</p>
              </div>
              <span class="pill warning">{{ morningDashboard.repeatCandidates?.length || 0 }}</span>
            </div>
            <div class="repeat-candidate-list">
              <div v-for="client in morningDashboard.repeatCandidates?.slice(0, 6)" :key="client.customerKey" class="repeat-candidate">
                <div>
                  <strong>{{ client.name }}</strong>
                  <span>{{ client.product?.title }} · {{ client.daysSinceLastOrder }} дней без заказа · цикл {{ client.repeatCycleDays }} дней</span>
                </div>
                <em>{{ client.probability }}%</em>
              </div>
              <div v-if="!morningDashboard.repeatCandidates?.length" class="empty-mini">Повторных кандидатов пока нет.</div>
            </div>
          </article>
        </div>

        <article class="action-generator-card">
          <div class="insight-head">
            <div>
              <h3>Генератор действий</h3>
              <p>Каждый сигнал заканчивается конкретной кнопкой: закупка, персональная скидка, отзыв или гипотеза курса.</p>
            </div>
            <span class="pill">{{ actionRecommendations.length }}</span>
          </div>

          <div v-if="actionFeedback" class="action-feedback">
            <strong>{{ actionFeedback.message }}</strong>
            <pre v-if="actionFeedback.draft">{{ actionFeedback.draft }}</pre>
          </div>

          <div class="action-list">
            <div v-for="action in actionRecommendations" :key="action.id" class="action-card" :class="`action-card--${action.priority}`">
              <div class="action-priority">{{ getActionPriorityLabel(action.priority) }}</div>
              <div class="action-card__body">
                <strong>{{ action.title }}</strong>
                <p>{{ action.description }}</p>
              </div>
              <button type="button" @click="runAnalyticsAction(action)" :disabled="runningActionId === action.id">
                {{ runningActionId === action.id ? 'Выполняю...' : action.buttonLabel }}
              </button>
            </div>
            <div v-if="!actionRecommendations.length" class="empty-mini">Пока нет срочных действий. Можно спокойно допить кофе.</div>
          </div>
        </article>
      </section>

      <section v-if="activeTab === 'products'" class="product-analytics">
        <div class="summary-grid">
        <article class="summary-card summary-card--accent">
          <span class="summary-label">LTV препаратов</span>
          <strong>{{ formatCurrency(summary.ltv) }}</strong>
          <small>Выручка по препаратам за всё время в выборке</small>
        </article>
        <article class="summary-card">
          <span class="summary-label">Успешных заказов</span>
          <strong>{{ formatNumber(summary.orders) }}</strong>
          <small>Оплаченные и наличные при получении</small>
        </article>
        <article class="summary-card">
          <span class="summary-label">Продано упаковок</span>
          <strong>{{ formatNumber(summary.units) }}</strong>
          <small>Без отменённых заказов</small>
        </article>
        <article class="summary-card" :class="{ warning: summary.reorderSignals > 0 }">
          <span class="summary-label">Сигналы закупки</span>
          <strong>{{ formatNumber(summary.reorderSignals) }}</strong>
          <small>Остатков меньше чем на 14 дней</small>
        </article>
      </div>

      <div class="toolbar card">
        <div class="search-box">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input v-model="search" type="text" placeholder="Поиск по препарату или SKU">
        </div>
        <label class="toggle-alerts">
          <input v-model="onlySignals" type="checkbox">
          <span>Только сигналы закупки</span>
        </label>
      </div>

      <div class="analytics-table card">
        <div class="table-head">
          <span>Препарат</span>
          <span>Скорость</span>
          <span>Воронка</span>
          <span>Средний чек</span>
          <span>LTV</span>
          <span>Склад</span>
        </div>

        <article v-for="item in filteredProducts" :key="item.productId" class="product-row">
          <div class="product-cell">
            <div class="product-icon">{{ getInitials(item.title) }}</div>
            <div>
              <h3>{{ item.title }}</h3>
              <p>{{ item.sku || 'Без SKU' }}</p>
              <div class="combo-list" v-if="item.topCombos?.length">
                <span>Чаще покупают с:</span>
                <strong v-for="combo in item.topCombos" :key="combo.title">{{ combo.title }} · {{ combo.count }}</strong>
              </div>
            </div>
          </div>

          <div class="metric-cell">
            <strong>{{ item.velocityPerDay }}</strong>
            <span>уп./день</span>
            <small>{{ item.velocityPerWeek }} уп./нед.</small>
            <em :class="['delta', item.velocityDelta >= 0 ? 'positive' : 'negative']">
              {{ item.velocityDelta >= 0 ? '+' : '' }}{{ item.velocityDelta }}%
            </em>
          </div>

          <div class="funnel-cell">
            <div class="funnel-line"><span>Просмотры</span><strong>{{ item.funnel.views }}</strong></div>
            <div class="funnel-line"><span>В корзину</span><strong>{{ item.funnel.cartAdds }}</strong></div>
            <div class="funnel-line"><span>Успешные</span><strong>{{ item.funnel.successfulOrders }}</strong></div>
            <div class="funnel-line danger"><span>Отмены</span><strong>{{ item.funnel.cancelledOrders }}</strong></div>
          </div>

          <div class="metric-cell">
            <strong>{{ formatCurrency(item.avgCheck) }}</strong>
            <span>{{ item.ordersCount }} заказов</span>
          </div>

          <div class="metric-cell ltv-cell">
            <strong>{{ formatCurrency(item.ltv) }}</strong>
            <span>{{ item.successfulUnits }} уп.</span>
          </div>

          <div class="stock-cell" :class="{ warning: item.reorderSignal }">
            <strong>{{ item.stock }} шт.</strong>
            <span v-if="item.daysLeft !== null">хватит на {{ item.daysLeft }} дн.</span>
            <span v-else>скорость пока 0</span>
            <small v-if="item.reorderSignal">Закупить заранее</small>
          </div>
        </article>

        <div v-if="!filteredProducts.length" class="empty-state">
          Ничего не найдено по текущим фильтрам.
        </div>
      </div>
      </section>

      <section v-if="activeTab === 'stock'" class="stock-analytics">
        <div class="section-heading">
          <div>
            <span class="section-kicker">Склад и остатки</span>
            <h2>Проактивная отчетность по закупкам</h2>
          </div>
          <p>Золотая полка, ABC/XYZ-классы, прогноз дней до нуля и dead stock с быстрым снижением цены.</p>
        </div>

        <div class="stock-summary-grid">
          <article class="stock-summary-card stock-summary-card--gold">
            <span>Золотая полка</span>
            <strong>{{ formatNumber(stockSummary.goldenShelf) }}</strong>
            <small>Самые важные позиции по выручке и скорости</small>
          </article>
          <article class="stock-summary-card">
            <span>Остаток упаковок</span>
            <strong>{{ formatNumber(stockSummary.stockUnits) }}</strong>
            <small>Суммарно по всем товарам</small>
          </article>
          <article class="stock-summary-card" :class="{ warning: stockSummary.reorderSignals > 0 }">
            <span>Дней до 0</span>
            <strong>{{ formatNumber(stockSummary.reorderSignals) }}</strong>
            <small>Позиции с остатком меньше 14 дней</small>
          </article>
          <article class="stock-summary-card" :class="{ danger: stockSummary.deadStock > 0 }">
            <span>Dead stock</span>
            <strong>{{ formatNumber(stockSummary.deadStock) }}</strong>
            <small>Не продавались 90+ дней</small>
          </article>
        </div>

        <div class="stock-grid">
          <article class="stock-panel stock-panel--gold">
            <div class="insight-head">
              <div>
                <h3>Золотая полка</h3>
                <p>Остатки бестселлеров и прогноз, когда товар закончится</p>
              </div>
            </div>
            <div class="golden-list">
              <div v-for="item in goldenShelf" :key="item.productId" class="golden-row">
                <div>
                  <strong>{{ item.title }}</strong>
                  <span>{{ item.abcXyz }} · {{ item.recommendation }}</span>
                </div>
                <div class="stock-forecast" :class="{ warning: item.reorderSignal }">
                  <b>{{ item.stock }} шт.</b>
                  <small v-if="item.daysLeft !== null">{{ item.daysLeft }} дн. до 0</small>
                  <small v-else>нет скорости</small>
                </div>
              </div>
              <div v-if="!goldenShelf.length" class="empty-mini">Пока нет продаж для золотой полки.</div>
            </div>
          </article>

          <article class="stock-panel">
            <div class="insight-head">
              <div>
                <h3>ABC/XYZ-анализ</h3>
                <p>A/B/C по деньгам, X/Y/Z по стабильности спроса</p>
              </div>
            </div>
            <div class="abc-list">
              <div v-for="item in abcXyzProducts" :key="item.productId" class="abc-row">
                <div class="abc-badge" :class="[`abc-${item.abcClass.toLowerCase()}`, `xyz-${item.xyzClass.toLowerCase()}`]">
                  {{ item.abcXyz }}
                </div>
                <div>
                  <strong>{{ item.title }}</strong>
                  <span>{{ item.xyzMeaning }}</span>
                </div>
                <small>{{ formatCurrency(item.revenue) }}</small>
              </div>
              <div v-if="!abcXyzProducts.length" class="empty-mini">Нет данных для ABC/XYZ.</div>
            </div>
          </article>
        </div>

        <article class="dead-stock-card">
          <div class="insight-head">
            <div>
              <h3>Dead stock</h3>
              <p>Товары без продаж 90+ дней. Можно быстро снизить цену прямо здесь.</p>
            </div>
            <span class="pill danger">{{ deadStock.length }}</span>
          </div>
          <div class="dead-stock-list">
            <div v-for="item in deadStock" :key="item.productId" class="dead-stock-row">
              <div class="dead-product">
                <strong>{{ item.title }}</strong>
                <span v-if="item.daysSinceLastSale !== null">Последняя продажа {{ item.daysSinceLastSale }} дней назад</span>
                <span v-else>Продаж еще не было</span>
                <small>{{ item.abcXyz }} · остаток {{ item.stock }} шт.</small>
              </div>
              <div class="dead-price">
                <span>Текущая цена</span>
                <strong>{{ formatCurrency(item.price) }}</strong>
              </div>
              <form class="discount-form" @submit.prevent="applyDeadStockPrice(item)">
                <input
                  v-model="priceDrafts[item.productId]"
                  type="number"
                  min="1"
                  step="1"
                  :placeholder="String(Math.max(1, Math.round(item.price * 0.9)))"
                >
                <button type="submit" :disabled="savingPriceId === item.productId">
                  {{ savingPriceId === item.productId ? 'Сохраняю...' : 'Снизить цену' }}
                </button>
              </form>
            </div>
            <div v-if="!deadStock.length" class="empty-mini">Dead stock не найден. Склад живой, дышит, прекрасен.</div>
          </div>
        </article>
      </section>

      <section v-if="activeTab === 'cancellations'" class="cancellation-analytics">
        <div class="section-heading">
          <div>
            <span class="section-kicker">Отказы и возвраты</span>
            <h2>Витрина причин отказов</h2>
          </div>
          <p>Показывает, почему клиенты отменяют заказы, сколько денег теряется и какое действие стоит сделать.</p>
        </div>

        <div class="cancellation-hero">
          <article class="cancel-total-card">
            <span>Отменено за {{ cancellationSummary.days }} дней</span>
            <strong>{{ formatNumber(cancellationSummary.cancelledOrders) }}</strong>
            <small>Потенциально потеряно: {{ formatCurrency(cancellationSummary.lostRevenue) }}</small>
          </article>
          <article class="cancel-total-card cancel-total-card--reason">
            <span>Главная причина</span>
            <strong>{{ cancellationSummary.topReason?.label || 'Пока нет данных' }}</strong>
            <small>{{ cancellationSummary.topReason?.action || 'Причины начнут появляться после отмен заказов.' }}</small>
          </article>
        </div>

        <div class="reason-grid">
          <article v-for="reason in cancellationReasons" :key="reason.key" class="reason-card" :class="`reason-card--${reason.key}`">
            <div class="reason-card__top">
              <div>
                <h3>{{ reason.label }}</h3>
                <p>{{ reason.action }}</p>
              </div>
              <span>{{ reason.share }}%</span>
            </div>
            <div class="reason-card__metrics">
              <strong>{{ formatNumber(reason.orders) }} заказов</strong>
              <small>{{ formatCurrency(reason.lostRevenue) }} потерь</small>
            </div>
            <div v-if="reason.topProducts?.length" class="reason-products">
              <span>Чаще затронуты:</span>
              <b v-for="product in reason.topProducts" :key="product.title">{{ product.title }} · {{ product.count }}</b>
            </div>
          </article>
        </div>

        <article class="recent-cancellations-card">
          <div class="insight-head">
            <div>
              <h3>Последние отмены</h3>
              <p>Быстрый список для ручного разбора и обратной связи клиенту</p>
            </div>
          </div>
          <div class="recent-cancel-list">
            <div v-for="order in recentCancellations" :key="order.id" class="recent-cancel-row">
              <div>
                <strong>Заказ #{{ order.id }} · {{ order.customerName }}</strong>
                <span>{{ order.cancelReasonLabel }} · {{ formatCurrency(order.total) }}</span>
                <small>{{ order.items.map(item => `${item.title} × ${item.quantity}`).join(', ') }}</small>
              </div>
              <em>{{ formatShortDate(order.updatedAt) }}</em>
            </div>
            <div v-if="!recentCancellations.length" class="empty-mini">Отмен за выбранный период нет.</div>
          </div>
        </article>
      </section>

      <section v-if="activeTab === 'trends'" class="trend-analytics">
        <div class="section-heading">
          <div>
            <span class="section-kicker">Тренды и сезонность</span>
            <h2>Спрос по месяцам и влияние маркетинга</h2>
          </div>
          <p>Сравнение с прошлым годом, прогноз на следующие месяцы и ручная привязка рекламных активностей к продажам.</p>
        </div>

        <div class="trend-summary-grid">
          <article class="trend-summary-card">
            <span>Текущий месяц</span>
            <strong>{{ formatCurrency(trendSummary.currentMonthRevenue) }}</strong>
            <small>Успешные заказы за текущий месяц</small>
          </article>
          <article class="trend-summary-card trend-summary-card--forecast">
            <span>Прогноз на следующий</span>
            <strong>{{ formatCurrency(trendSummary.forecastNextMonth) }}</strong>
            <small>На основе последних периодов</small>
          </article>
          <article class="trend-summary-card" :class="{ warning: trendSummary.seasonalSignals > 0 }">
            <span>Сезонные сигналы</span>
            <strong>{{ formatNumber(trendSummary.seasonalSignals) }}</strong>
            <small>Категории с историческим всплеском</small>
          </article>
          <article class="trend-summary-card">
            <span>Маркетинг-событий</span>
            <strong>{{ formatNumber(trendSummary.marketingEvents) }}</strong>
            <small>Реклама, рассылки, акции</small>
          </article>
        </div>

        <div class="trend-grid">
          <article class="trend-panel trend-panel--wide">
            <div class="insight-head">
              <div>
                <h3>Месяц к месяцу с прошлым годом</h3>
                <p>Сравнение выручки по каждому месяцу текущего года с тем же месяцем прошлого года</p>
              </div>
            </div>
            <div class="month-compare-list">
              <div v-for="item in monthComparison" :key="item.month" class="month-compare-row">
                <div>
                  <strong>{{ item.label }}</strong>
                  <span>{{ item.currentOrders }} заказов сейчас · {{ item.previousOrders }} год назад</span>
                </div>
                <div class="month-bars">
                  <span class="month-bars__current" :style="{ width: getMonthBarWidth(item.currentRevenue) }"></span>
                  <span class="month-bars__previous" :style="{ width: getMonthBarWidth(item.previousRevenue) }"></span>
                </div>
                <div class="month-money">
                  <strong>{{ formatCurrency(item.currentRevenue) }}</strong>
                  <em :class="item.yoy >= 0 ? 'positive' : 'negative'">{{ item.yoy >= 0 ? '+' : '' }}{{ item.yoy }}%</em>
                </div>
              </div>
            </div>
          </article>

          <article class="trend-panel">
            <div class="insight-head">
              <div>
                <h3>Прогноз продаж</h3>
                <p>Оценка на 3 месяца вперед</p>
              </div>
            </div>
            <div class="forecast-list">
              <div v-for="item in forecast" :key="item.key" class="forecast-row">
                <div>
                  <strong>{{ item.label }}</strong>
                  <span>{{ item.predictedOrders }} заказов</span>
                </div>
                <b>{{ formatCurrency(item.predictedRevenue) }}</b>
              </div>
            </div>
          </article>

          <article class="trend-panel">
            <div class="insight-head">
              <div>
                <h3>Сезонные подсветки</h3>
                <p>Где спрос исторически выше среднего</p>
              </div>
            </div>
            <div class="season-list">
              <div v-for="item in seasonalHighlights" :key="`${item.categoryId}-${item.month}`" class="season-row" :class="{ upcoming: item.upcoming }">
                <div>
                  <strong>{{ item.categoryName }}</strong>
                  <span>{{ item.monthName }} · {{ item.units }} уп.</span>
                </div>
                <em>+{{ item.lift }}%</em>
              </div>
              <div v-if="!seasonalHighlights.length" class="empty-mini">Сезонных всплесков пока не найдено.</div>
            </div>
          </article>
        </div>

        <article class="marketing-card">
          <div class="insight-head">
            <div>
              <h3>Влияние рекламы и рассылок</h3>
              <p>Для каждого события создаётся отдельная зашифрованная ссылка. Продажи считаются только по заказам, пришедшим по ней.</p>
            </div>
          </div>

          <form class="marketing-form" @submit.prevent="createMarketingEvent">
            <input v-model="marketingForm.title" type="text" placeholder="Название: Telegram-пост, рассылка, акция">
            <select v-model="marketingForm.type">
              <option value="campaign">Реклама</option>
              <option value="email">Рассылка</option>
              <option value="promo">Акция</option>
              <option value="content">Контент</option>
            </select>
            <input v-model="marketingForm.channel" type="text" placeholder="Канал: Telegram, VK, блогер">
            <input v-model.number="marketingForm.cost" type="number" min="0" step="1" placeholder="Затраты, ₽">
            <input v-model="marketingForm.eventDate" type="date">
            <button type="submit" :disabled="savingMarketingEvent">
              {{ savingMarketingEvent ? 'Добавляю...' : 'Добавить событие' }}
            </button>
          </form>

          <div class="marketing-list">
            <div v-for="event in marketingEvents" :key="event.id" class="marketing-row">
              <div>
                <strong>{{ event.title }}</strong>
                <span>{{ getMarketingTypeLabel(event.type) }} · {{ event.channel || 'канал не указан' }} · {{ formatShortDate(event.eventDate) }}</span>
                <small>Затраты: {{ formatCurrency(event.cost) }} · по ссылке: {{ formatCurrency(event.revenue) }} · {{ event.orders }} заказов</small>
                <div v-if="event.link" class="marketing-link">
                  <code>{{ event.link }}</code>
                  <button type="button" @click="copyMarketingLink(event)">
                    {{ copiedMarketingEventId === event.id ? 'Скопировано' : 'Копировать ссылку' }}
                  </button>
                </div>
              </div>
              <div class="marketing-impact">
                <b :class="event.uplift >= 0 ? 'positive' : 'negative'">{{ event.uplift >= 0 ? '+' : '' }}{{ event.uplift }}%</b>
                <button type="button" @click="deleteMarketingEvent(event.id)">Удалить</button>
              </div>
            </div>
            <div v-if="!marketingEvents.length" class="empty-mini">Пока нет добавленных маркетинговых событий.</div>
          </div>
        </article>
      </section>

      <section v-if="activeTab === 'margin'" class="margin-analytics">
        <div class="section-heading">
          <div>
            <span class="section-kicker">Маржинальность</span>
            <h2>Прозрачная прибыль по заказам, каналам и препаратам</h2>
          </div>
          <p>Чистая прибыль считается как выручка минус себестоимость, эквайринг, доставка продавца, партнерские бонусы и комиссии.</p>
        </div>

        <div class="margin-summary-grid">
          <article class="margin-summary-card margin-summary-card--profit">
            <span>Чистая прибыль</span>
            <strong>{{ formatCurrency(marginSummary.netProfit) }}</strong>
            <small>{{ marginSummary.marginRate }}% маржинальность</small>
          </article>
          <article class="margin-summary-card">
            <span>Выручка</span>
            <strong>{{ formatCurrency(marginSummary.revenue) }}</strong>
            <small>{{ formatNumber(marginSummary.orders) }} успешных заказов</small>
          </article>
          <article class="margin-summary-card">
            <span>Себестоимость</span>
            <strong>{{ formatCurrency(marginSummary.productCost) }}</strong>
            <small>По полю себестоимости в карточках товаров</small>
          </article>
          <article class="margin-summary-card">
            <span>Эквайринг и бонусы</span>
            <strong>{{ formatCurrency((marginSummary.acquiringFees || 0) + (marginSummary.bonuses || 0)) }}</strong>
            <small>{{ formatCurrency(marginSummary.acquiringFees) }} эквайринг · {{ formatCurrency(marginSummary.bonuses) }} бонусы</small>
          </article>
        </div>

        <div class="margin-grid">
          <article class="margin-panel margin-panel--wide">
            <div class="insight-head">
              <div>
                <h3>ROMI по каналам</h3>
                <p>Если в заказ передалась UTM-метка, канал связывается с рекламными затратами из событий.</p>
              </div>
              <span class="pill">{{ marginChannels.length }}</span>
            </div>
            <div class="margin-table">
              <div class="margin-table-head">
                <span>Канал</span>
                <span>Прибыль</span>
                <span>Затраты</span>
                <span>ROMI</span>
                <span>CAC</span>
              </div>
              <div v-for="channel in marginChannels" :key="channel.channel" class="margin-table-row">
                <strong>{{ channel.channel }}</strong>
                <span>{{ formatCurrency(channel.netProfit) }}</span>
                <span>{{ formatCurrency(channel.adSpend) }}</span>
                <b :class="getRomiClass(channel.romi)">{{ channel.romi === null ? '—' : `${channel.romi}x` }}</b>
                <span>{{ channel.cac === null ? '—' : formatCurrency(channel.cac) }}</span>
              </div>
              <div v-if="!marginChannels.length" class="empty-mini">Каналов пока нет. Добавьте UTM и маркетинговые события.</div>
            </div>
          </article>

          <article class="margin-panel">
            <div class="insight-head">
              <div>
                <h3>CAC по препаратам</h3>
                <p>Рекламные затраты распределяются пропорционально выручке препарата.</p>
              </div>
            </div>
            <div class="compact-list">
              <div v-for="product in marginProducts.slice(0, 8)" :key="product.productId" class="compact-row">
                <div>
                  <strong>{{ product.title }}</strong>
                  <span>{{ product.units }} уп. · маржа {{ product.grossMargin }}%</span>
                </div>
                <small>{{ product.cac === null ? 'CAC —' : formatCurrency(product.cac) }}</small>
              </div>
              <div v-if="!marginProducts.length" class="empty-mini">Нет данных по препаратам за период.</div>
            </div>
          </article>
        </div>

        <article class="margin-orders-card">
          <div class="insight-head">
            <div>
              <h3>Чистая прибыль по заказам</h3>
              <p>Последние 100 успешных заказов с полной расшифровкой затрат.</p>
            </div>
            <span class="pill">{{ marginOrders.length }}</span>
          </div>
          <div class="margin-order-list">
            <div v-for="order in marginOrders" :key="order.id" class="margin-order-row">
              <div class="margin-order-main">
                <strong>Заказ #{{ order.id }} · {{ order.customerName }}</strong>
                <span>{{ formatShortDate(order.createdAt) }} · {{ order.channel }} · {{ order.deliveryName || 'доставка не указана' }}</span>
                <small>{{ order.items.map(item => `${item.title} × ${item.quantity}`).join(', ') }}</small>
              </div>
              <div class="margin-breakdown">
                <span>Выручка <b>{{ formatCurrency(order.revenue) }}</b></span>
                <span>Себестоимость <b>-{{ formatCurrency(order.productCost) }}</b></span>
                <span>Эквайринг <b>-{{ formatCurrency(order.acquiringFee) }}</b></span>
                <span>Доставка <b>-{{ formatCurrency(order.deliveryCost) }}</b></span>
                <span>Бонусы <b>-{{ formatCurrency(order.bonuses) }}</b></span>
                <strong :class="order.netProfit >= 0 ? 'positive' : 'negative'">{{ formatCurrency(order.netProfit) }}</strong>
              </div>
            </div>
            <div v-if="!marginOrders.length" class="empty-mini">За выбранный период успешных заказов нет.</div>
          </div>
        </article>
      </section>

      <section v-if="activeTab === 'customers'" class="customer-analytics">
        <div class="section-heading">
          <div>
            <span class="section-kicker">Клиентская аналитика</span>
            <h2>Повторные продажи и ядро аудитории</h2>
          </div>
          <p>Отчет показывает топ клиентов, признаки оттока, повторные курсы и retention по препаратам.</p>
        </div>

        <div class="customer-summary-grid">
          <article class="customer-summary-card">
            <span>Клиентов с покупками</span>
            <strong>{{ formatNumber(customerSummary.customers) }}</strong>
            <small>Только успешные оплаты и наличные</small>
          </article>
          <article class="customer-summary-card customer-summary-card--core">
            <span>Ядро 20%</span>
            <strong>{{ formatCurrency(customerSummary.coreRevenue) }}</strong>
            <small>{{ customerSummary.coreRevenueShare }}% от всей выручки</small>
          </article>
          <article class="customer-summary-card" :class="{ danger: customerSummary.churnedCustomers > 0 }">
            <span>Ушедшие клиенты</span>
            <strong>{{ formatNumber(customerSummary.churnedCustomers) }}</strong>
            <small>Не покупали 60+ дней после регулярных покупок</small>
          </article>
          <article class="customer-summary-card" :class="{ warning: customerSummary.repeatDue > 0 }">
            <span>Пора повторить курс</span>
            <strong>{{ formatNumber(customerSummary.repeatDue) }}</strong>
            <small>По индивидуальному циклу товара</small>
          </article>
        </div>

        <div class="customer-grid">
          <article class="insight-card insight-card--wide">
            <div class="insight-head">
              <div>
                <h3>Топ-100 клиентов</h3>
                <p>Кто приносит больше всего выручки</p>
              </div>
              <span class="pill">{{ topCustomers.length }}</span>
            </div>
            <div class="client-list">
              <div v-for="client in topCustomers" :key="client.key" class="client-row">
                <div class="client-rank" :class="{ core: client.isCoreAudience }">
                  {{ client.isCoreAudience ? '20%' : '#' }}
                </div>
                <div class="client-main">
                  <strong>{{ client.name }}</strong>
                  <span>{{ getClientContact(client) }}</span>
                  <small v-if="client.topProducts?.length">Чаще берет: {{ client.topProducts.map(product => product.title).join(', ') }}</small>
                </div>
                <div class="client-money">
                  <strong>{{ formatCurrency(client.totalRevenue) }}</strong>
                  <span>{{ client.ordersCount }} заказов</span>
                </div>
              </div>
              <div v-if="!topCustomers.length" class="empty-mini">Пока нет успешных заказов.</div>
            </div>
          </article>

          <article class="insight-card">
            <div class="insight-head">
              <div>
                <h3>Ушедшие клиенты</h3>
                <p>Раньше покупали регулярно, но молчат 60+ дней</p>
              </div>
              <span class="pill danger">{{ churnedCustomers.length }}</span>
            </div>
            <div class="compact-list">
              <div v-for="client in churnedCustomers" :key="client.key" class="compact-row">
                <div>
                  <strong>{{ client.name }}</strong>
                  <span>{{ client.daysSinceLastOrder }} дней без заказа</span>
                </div>
                <small>{{ formatCurrency(client.totalRevenue) }}</small>
              </div>
              <div v-if="!churnedCustomers.length" class="empty-mini">Критичного оттока не найдено.</div>
            </div>
          </article>

          <article class="insight-card">
            <div class="insight-head">
              <div>
                <h3>Кому пора повторить</h3>
                <p>Автоматический список по циклу из карточки товара</p>
              </div>
              <span class="pill warning">{{ repeatDue.length }}</span>
            </div>
            <div class="compact-list">
              <div v-for="item in repeatDue" :key="`${item.customerKey}-${item.productId}`" class="compact-row repeat-row">
                <div>
                  <strong>{{ item.customerName }}</strong>
                  <span>{{ item.productTitle }}</span>
                  <small>{{ item.daysSinceLastPurchase }} дней после покупки · цикл {{ item.repeatCycleDays }} дней</small>
                </div>
                <em>+{{ item.overdueDays }} дн.</em>
              </div>
              <div v-if="!repeatDue.length" class="empty-mini">Пока нет клиентов для повторного заказа.</div>
            </div>
          </article>
        </div>

        <article class="retention-card">
          <div class="insight-head">
            <div>
              <h3>Retention Rate по препаратам</h3>
              <p>Сколько клиентов вернулись за тем же препаратом повторно</p>
            </div>
          </div>
          <div class="retention-list">
            <div v-for="item in retentionProducts" :key="item.productId" class="retention-row">
              <div>
                <strong>{{ item.title }}</strong>
                <span>{{ item.buyers }} покупателей · {{ item.repeatBuyers }} повторных</span>
              </div>
              <div class="retention-bar">
                <span :style="{ width: `${Math.min(100, item.retentionRate)}%` }"></span>
              </div>
              <b>{{ item.retentionRate }}%</b>
            </div>
            <div v-if="!retentionProducts.length" class="empty-mini">Данных для retention пока нет.</div>
          </div>
        </article>
      </section>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import axios from 'axios'

const loading = ref(true)
const products = ref([])
const summary = ref({ ltv: 0, orders: 0, units: 0, reorderSignals: 0 })
const customerSummary = ref({ customers: 0, revenue: 0, coreCustomers: 0, coreRevenue: 0, coreRevenueShare: 0, churnedCustomers: 0, repeatDue: 0 })
const stockSummary = ref({ totalProducts: 0, stockUnits: 0, goldenShelf: 0, deadStock: 0, reorderSignals: 0, aProducts: 0, xProducts: 0 })
const topCustomers = ref([])
const churnedCustomers = ref([])
const repeatDue = ref([])
const retentionProducts = ref([])
const goldenShelf = ref([])
const abcXyzProducts = ref([])
const deadStock = ref([])
const cancellationSummary = ref({ days: 90, cancelledOrders: 0, lostRevenue: 0, topReason: null })
const cancellationReasons = ref([])
const recentCancellations = ref([])
const trendSummary = ref({ currentMonthRevenue: 0, forecastNextMonth: 0, seasonalSignals: 0, marketingEvents: 0 })
const monthComparison = ref([])
const forecast = ref([])
const seasonalHighlights = ref([])
const marketingEvents = ref([])
const copiedMarketingEventId = ref(null)
const marketingForm = ref({
  title: '',
  type: 'campaign',
  channel: '',
  cost: 0,
  eventDate: new Date().toISOString().slice(0, 10)
})
const savingMarketingEvent = ref(false)
const marginSummary = ref({ revenue: 0, netProfit: 0, productCost: 0, acquiringFees: 0, deliveryCost: 0, bonuses: 0, orders: 0, adSpend: 0, marginRate: 0, avgProfitPerOrder: 0 })
const marginChannels = ref([])
const marginProducts = ref([])
const marginOrders = ref([])
const marginAssumptions = ref({ acquiringFeePercent: 2.7, sellerPaysDelivery: false })
const morningDashboard = ref({
  yesterday: { revenue: 0, orders: 0 },
  dayBefore: { revenue: 0, orders: 0 },
  lastMonthSameDay: { revenue: 0, orders: 0 },
  revenueDelta: 0,
  topProducts: [],
  criticalStock: [],
  repeatCandidates: []
})
const actionRecommendations = ref([])
const runningActionId = ref(null)
const actionFeedback = ref(null)
const priceDrafts = ref({})
const savingPriceId = ref(null)
const activeTab = ref('actions')
const days = ref(30)
const search = ref('')
const onlySignals = ref(false)
const analyticsTabs = [
  { key: 'actions', label: 'Действия', hint: 'Главный экран утра' },
  { key: 'products', label: 'Препараты', hint: 'Velocity и LTV' },
  { key: 'stock', label: 'Склад', hint: 'ABC/XYZ и остатки' },
  { key: 'cancellations', label: 'Отказы', hint: 'Причины отмен' },
  { key: 'trends', label: 'Тренды', hint: 'Сезонность' },
  { key: 'customers', label: 'Клиенты', hint: 'Retention' },
  { key: 'margin', label: 'Маржа', hint: 'ROMI и CAC' }
]
const periodOptions = [
  { label: '7 дней', value: 7 },
  { label: '30 дней', value: 30 },
  { label: '90 дней', value: 90 }
]

const filteredProducts = computed(() => {
  const term = search.value.trim().toLowerCase()
  return products.value.filter(item => {
    if (onlySignals.value && !item.reorderSignal) return false
    if (!term) return true
    return String(item.title || '').toLowerCase().includes(term) || String(item.sku || '').toLowerCase().includes(term)
  })
})

const maxMonthRevenue = computed(() => {
  return Math.max(1, ...monthComparison.value.flatMap(item => [Number(item.currentRevenue || 0), Number(item.previousRevenue || 0)]))
})

function formatCurrency(value) {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0
  }).format(Number(value || 0))
}

function formatNumber(value) {
  return new Intl.NumberFormat('ru-RU').format(Number(value || 0))
}

function getInitials(title) {
  return String(title || 'П').trim().slice(0, 2).toUpperCase()
}

function getClientContact(client) {
  return client.phone || client.email || 'Контакты не указаны'
}

function formatShortDate(date) {
  if (!date) return '—'
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return '—'
  return parsed.toLocaleDateString('ru-RU', {
    timeZone: 'Europe/Moscow',
    day: '2-digit',
    month: '2-digit'
  })
}

function getMonthBarWidth(value) {
  return `${Math.max(4, Math.min(100, (Number(value || 0) / maxMonthRevenue.value) * 100))}%`
}

function getMarketingTypeLabel(type) {
  const labels = {
    campaign: 'Реклама',
    email: 'Рассылка',
    promo: 'Акция',
    content: 'Контент'
  }
  return labels[type] || 'Событие'
}

function getRomiClass(value) {
  if (value === null || value === undefined) return ''
  return Number(value) >= 1 ? 'positive' : 'negative'
}

function getActionPriorityLabel(priority) {
  const labels = {
    critical: 'Критично',
    high: 'Важно',
    medium: 'Идея',
    low: 'Низкий'
  }
  return labels[priority] || 'Действие'
}

async function fetchCustomerAnalytics() {
  const { data } = await axios.get('/api/admin/analytics/customers')
  customerSummary.value = data.summary || customerSummary.value
  topCustomers.value = data.topCustomers || []
  churnedCustomers.value = data.churnedCustomers || []
  repeatDue.value = data.repeatDue || []
  retentionProducts.value = data.retentionProducts || []
}

async function fetchStockAnalytics() {
  const { data } = await axios.get('/api/admin/analytics/stock')
  stockSummary.value = data.summary || stockSummary.value
  goldenShelf.value = data.goldenShelf || []
  abcXyzProducts.value = data.abcXyz || []
  deadStock.value = data.deadStock || []
}

async function fetchCancellationAnalytics() {
  const { data } = await axios.get('/api/admin/analytics/cancellations')
  cancellationSummary.value = data.summary || cancellationSummary.value
  cancellationReasons.value = data.reasons || []
  recentCancellations.value = data.recentOrders || []
}

async function fetchTrendAnalytics() {
  const { data } = await axios.get('/api/admin/analytics/trends')
  trendSummary.value = data.summary || trendSummary.value
  monthComparison.value = data.monthComparison || []
  forecast.value = data.forecast || []
  seasonalHighlights.value = data.seasonalHighlights || []
  marketingEvents.value = data.marketingEvents || []
}

async function fetchMarginAnalytics() {
  const { data } = await axios.get('/api/admin/analytics/margin', { params: { days: days.value } })
  marginSummary.value = data.summary || marginSummary.value
  marginChannels.value = data.channels || []
  marginProducts.value = data.products || []
  marginOrders.value = data.orders || []
  marginAssumptions.value = data.assumptions || marginAssumptions.value
}

async function fetchActionAnalytics() {
  const { data } = await axios.get('/api/admin/analytics/actions')
  morningDashboard.value = data.morning || morningDashboard.value
  actionRecommendations.value = data.actions || []
}

async function fetchAnalytics() {
  loading.value = true
  try {
    const [{ data }] = await Promise.all([
      axios.get('/api/admin/analytics/products', { params: { days: days.value } }),
      fetchCustomerAnalytics(),
      fetchStockAnalytics(),
      fetchCancellationAnalytics(),
      fetchTrendAnalytics(),
      fetchMarginAnalytics(),
      fetchActionAnalytics()
    ])
    products.value = data.products || []
    summary.value = data.summary || { ltv: 0, orders: 0, units: 0, reorderSignals: 0 }
  } finally {
    loading.value = false
  }
}

async function runAnalyticsAction(action) {
  if (!action?.type) return
  runningActionId.value = action.id
  actionFeedback.value = null
  try {
    const { data } = await axios.post(`/api/admin/analytics/actions/${action.type}`, {
      payload: action.payload || {}
    })
    actionFeedback.value = data
    if (action.type === 'personal_discount') {
      await fetchActionAnalytics()
    }
  } catch (error) {
    actionFeedback.value = {
      message: error.response?.data?.error || 'Не удалось выполнить действие'
    }
  } finally {
    runningActionId.value = null
  }
}

function setPeriod(nextDays) {
  if (days.value === nextDays) return
  days.value = nextDays
  fetchAnalytics()
}

async function createMarketingEvent() {
  if (!marketingForm.value.title || !marketingForm.value.eventDate) return
  savingMarketingEvent.value = true
  try {
    await axios.post('/api/admin/analytics/marketing-events', marketingForm.value)
    marketingForm.value.title = ''
    marketingForm.value.type = 'campaign'
    marketingForm.value.channel = ''
    marketingForm.value.cost = 0
    marketingForm.value.eventDate = new Date().toISOString().slice(0, 10)
    await fetchTrendAnalytics()
    await fetchMarginAnalytics()
  } finally {
    savingMarketingEvent.value = false
  }
}

async function copyMarketingLink(event) {
  if (!event?.link) return

  try {
    await navigator.clipboard.writeText(event.link)
  } catch {
    const input = document.createElement('input')
    input.value = event.link
    document.body.appendChild(input)
    input.select()
    document.execCommand('copy')
    document.body.removeChild(input)
  }

  copiedMarketingEventId.value = event.id
  window.setTimeout(() => {
    if (copiedMarketingEventId.value === event.id) {
      copiedMarketingEventId.value = null
    }
  }, 1800)
}

async function deleteMarketingEvent(id) {
  if (!id) return
  await axios.delete(`/api/admin/analytics/marketing-events/${id}`)
  await fetchTrendAnalytics()
  await fetchMarginAnalytics()
}

async function applyDeadStockPrice(item) {
  const nextPrice = Number(priceDrafts.value[item.productId] || Math.round(item.price * 0.9))
  if (!Number.isFinite(nextPrice) || nextPrice <= 0) return

  savingPriceId.value = item.productId
  try {
    await axios.patch(`/api/admin/analytics/products/${item.productId}/price`, { price: nextPrice })
    priceDrafts.value[item.productId] = ''
    await fetchStockAnalytics()
  } finally {
    savingPriceId.value = null
  }
}

onMounted(fetchAnalytics)
</script>

<style scoped>
.analytics-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
}

.page-title {
  font-size: 1.75rem;
  margin-bottom: 0.25rem;
}

.period-switcher {
  display: inline-flex;
  gap: 0.35rem;
  padding: 0.35rem;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--bg-card);
}

.period-btn {
  border: 0;
  border-radius: 999px;
  padding: 0.65rem 1rem;
  color: var(--text-secondary);
  background: transparent;
  cursor: pointer;
  transition: var(--transition);
}

.period-btn.active {
  background: var(--accent);
  color: #0b0b10;
}

.analytics-tabs {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 0.75rem;
  padding: 0.65rem;
  border: 1px solid var(--border);
  border-radius: 26px;
  background:
    radial-gradient(circle at 12% 20%, rgba(159, 181, 255, 0.12), transparent 34%),
    var(--bg-card);
}

.analytics-tab {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-height: 70px;
  padding: 0.9rem 1rem;
  border: 1px solid transparent;
  border-radius: 20px;
  color: var(--text-secondary);
  background: transparent;
  text-align: left;
  cursor: pointer;
  transition: var(--transition);
}

.analytics-tab span {
  color: var(--text-primary);
  font-size: 0.98rem;
  font-weight: 800;
}

.analytics-tab small {
  color: var(--text-muted);
  font-size: 0.76rem;
}

.analytics-tab:hover {
  border-color: rgba(159, 181, 255, 0.28);
  background: rgba(159, 181, 255, 0.08);
}

.analytics-tab.active {
  border-color: rgba(159, 181, 255, 0.5);
  background:
    linear-gradient(135deg, rgba(159, 181, 255, 0.26), rgba(159, 181, 255, 0.08)),
    var(--bg-secondary);
  box-shadow: 0 18px 45px rgba(0, 0, 0, 0.14);
}

.product-analytics {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.action-analytics {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.morning-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(280px, 0.42fr);
  gap: 1rem;
  padding: 1.35rem;
  border: 1px solid rgba(159, 181, 255, 0.28);
  border-radius: 30px;
  background:
    radial-gradient(circle at 18% 18%, rgba(159, 181, 255, 0.2), transparent 34%),
    radial-gradient(circle at 84% 20%, rgba(34, 197, 94, 0.12), transparent 30%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.04), transparent),
    var(--bg-card);
  overflow: hidden;
}

.morning-hero__content h2 {
  margin: 0.35rem 0 0.45rem;
  color: var(--text-primary);
  font-size: clamp(1.55rem, 4vw, 3rem);
  line-height: 1.05;
}

.morning-hero__content p {
  max-width: 620px;
  color: var(--text-secondary);
  font-size: 1rem;
  line-height: 1.55;
}

.morning-sales-card {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 180px;
  padding: 1.2rem;
  border: 1px solid var(--border);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.045);
}

.morning-sales-card.positive {
  border-color: rgba(34, 197, 94, 0.36);
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.14), rgba(255, 255, 255, 0.035));
}

.morning-sales-card.negative {
  border-color: rgba(239, 68, 68, 0.36);
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.12), rgba(255, 255, 255, 0.035));
}

.morning-sales-card span,
.action-priority {
  color: var(--text-muted);
  font-size: 0.76rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.morning-sales-card strong {
  display: block;
  margin-top: 0.45rem;
  color: var(--text-primary);
  font-size: clamp(1.8rem, 4vw, 2.7rem);
}

.morning-sales-card small {
  display: block;
  margin-top: 0.45rem;
  color: var(--text-secondary);
  line-height: 1.45;
}

.morning-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1.05fr;
  gap: 1rem;
}

.morning-panel,
.action-generator-card {
  padding: 1.15rem;
  border: 1px solid var(--border);
  border-radius: 24px;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.035), transparent),
    var(--bg-card);
}

.morning-panel--danger {
  border-color: rgba(239, 68, 68, 0.2);
}

.morning-list,
.repeat-candidate-list,
.action-list {
  display: grid;
  gap: 0.65rem;
}

.morning-row,
.repeat-candidate,
.action-card {
  border: 1px solid var(--border);
  border-radius: 18px;
  background: var(--bg-secondary);
}

.morning-row,
.repeat-candidate {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: center;
  padding: 0.85rem;
}

.morning-row strong,
.repeat-candidate strong,
.action-card strong {
  display: block;
  color: var(--text-primary);
}

.morning-row span,
.repeat-candidate span,
.action-card p {
  display: block;
  margin-top: 0.22rem;
  color: var(--text-secondary);
  font-size: 0.86rem;
  line-height: 1.45;
}

.morning-row b {
  color: var(--text-primary);
  white-space: nowrap;
}

.repeat-candidate em {
  flex-shrink: 0;
  padding: 0.25rem 0.55rem;
  border-radius: 999px;
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.14);
  font-size: 0.78rem;
  font-style: normal;
  font-weight: 900;
}

.action-feedback {
  margin-bottom: 1rem;
  padding: 1rem;
  border: 1px solid rgba(34, 197, 94, 0.32);
  border-radius: 18px;
  color: var(--text-primary);
  background: rgba(34, 197, 94, 0.09);
}

.action-feedback pre {
  margin: 0.75rem 0 0;
  white-space: pre-wrap;
  color: var(--text-secondary);
  font: inherit;
  line-height: 1.45;
}

.action-card {
  display: grid;
  grid-template-columns: 92px minmax(0, 1fr) auto;
  gap: 0.85rem;
  align-items: center;
  padding: 0.9rem;
}

.action-card--critical {
  border-color: rgba(239, 68, 68, 0.45);
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.12), var(--bg-secondary));
}

.action-card--high {
  border-color: rgba(245, 158, 11, 0.38);
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), var(--bg-secondary));
}

.action-card--medium {
  border-color: rgba(159, 181, 255, 0.26);
}

.action-card button {
  border: 0;
  border-radius: 14px;
  padding: 0.78rem 1rem;
  color: #0b0b10;
  background: var(--accent);
  font-weight: 900;
  white-space: nowrap;
  cursor: pointer;
}

.action-card button:disabled {
  opacity: 0.65;
  cursor: wait;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
}

.summary-card {
  padding: 1.25rem;
  border: 1px solid var(--border);
  border-radius: 24px;
  background:
    radial-gradient(circle at 85% 15%, rgba(159, 181, 255, 0.14), transparent 34%),
    var(--bg-card);
}

.summary-card--accent {
  border-color: rgba(159, 181, 255, 0.4);
}

.summary-card.warning {
  border-color: rgba(239, 68, 68, 0.45);
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.12), var(--bg-card));
}

.summary-label {
  display: block;
  margin-bottom: 0.7rem;
  color: var(--text-muted);
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.summary-card strong {
  display: block;
  font-size: clamp(1.5rem, 3vw, 2.2rem);
  color: var(--text-primary);
}

.summary-card small {
  display: block;
  margin-top: 0.55rem;
  color: var(--text-secondary);
  line-height: 1.45;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem;
}

.search-box {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.85rem 1rem;
  border: 1px solid var(--border);
  border-radius: 16px;
  color: var(--text-muted);
  background: var(--bg-secondary);
}

.search-box input {
  width: 100%;
  border: 0;
  outline: 0;
  color: var(--text-primary);
  background: transparent;
}

.toggle-alerts {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  color: var(--text-secondary);
  white-space: nowrap;
}

.analytics-table {
  overflow: hidden;
}

.table-head,
.product-row {
  display: grid;
  grid-template-columns: minmax(260px, 1.5fr) 0.8fr 1fr 0.8fr 0.8fr 0.8fr;
  gap: 1rem;
  align-items: center;
}

.table-head {
  padding: 1rem 1.25rem;
  background: var(--bg-secondary);
  color: var(--text-muted);
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.product-row {
  padding: 1.2rem 1.25rem;
  border-top: 1px solid var(--border);
}

.product-cell {
  display: flex;
  align-items: center;
  gap: 1rem;
  min-width: 0;
}

.product-icon {
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  border-radius: 16px;
  background: var(--accent-dim);
  color: var(--accent);
  font-weight: 800;
}

.product-cell h3 {
  margin: 0 0 0.25rem;
  font-size: 1rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.product-cell p,
.metric-cell span,
.stock-cell span,
.combo-list span {
  color: var(--text-muted);
  font-size: 0.82rem;
}

.combo-list {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem;
  margin-top: 0.5rem;
}

.combo-list strong {
  padding: 0.2rem 0.45rem;
  border-radius: 999px;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  font-size: 0.72rem;
}

.metric-cell,
.stock-cell {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.metric-cell strong,
.stock-cell strong {
  color: var(--text-primary);
  font-size: 1rem;
}

.metric-cell small,
.stock-cell small {
  color: var(--text-secondary);
  font-size: 0.78rem;
}

.delta {
  width: fit-content;
  padding: 0.18rem 0.45rem;
  border-radius: 999px;
  font-style: normal;
  font-size: 0.72rem;
}

.delta.positive {
  color: #22c55e;
  background: rgba(34, 197, 94, 0.12);
}

.delta.negative {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.12);
}

.funnel-cell {
  display: grid;
  gap: 0.35rem;
}

.funnel-line {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  color: var(--text-secondary);
  font-size: 0.82rem;
}

.funnel-line strong {
  color: var(--text-primary);
}

.funnel-line.danger strong {
  color: #ef4444;
}

.stock-cell.warning {
  padding: 0.75rem;
  border: 1px solid rgba(239, 68, 68, 0.35);
  border-radius: 16px;
  background: rgba(239, 68, 68, 0.08);
}

.stock-analytics {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.stock-summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
}

.stock-summary-card {
  padding: 1.15rem;
  border: 1px solid var(--border);
  border-radius: 24px;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.035), transparent),
    var(--bg-card);
}

.stock-summary-card--gold {
  border-color: rgba(245, 158, 11, 0.45);
  background:
    radial-gradient(circle at 85% 15%, rgba(245, 158, 11, 0.18), transparent 38%),
    var(--bg-card);
}

.stock-summary-card.warning {
  border-color: rgba(245, 158, 11, 0.42);
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.12), var(--bg-card));
}

.stock-summary-card.danger {
  border-color: rgba(239, 68, 68, 0.42);
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.12), var(--bg-card));
}

.stock-summary-card span {
  color: var(--text-muted);
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.stock-summary-card strong {
  display: block;
  margin-top: 0.55rem;
  color: var(--text-primary);
  font-size: clamp(1.35rem, 2.6vw, 2rem);
}

.stock-summary-card small {
  display: block;
  margin-top: 0.45rem;
  color: var(--text-secondary);
  line-height: 1.4;
}

.stock-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.stock-panel,
.dead-stock-card {
  padding: 1.15rem;
  border: 1px solid var(--border);
  border-radius: 24px;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.035), transparent),
    var(--bg-card);
}

.stock-panel--gold {
  border-color: rgba(245, 158, 11, 0.28);
}

.golden-list,
.abc-list,
.dead-stock-list {
  display: grid;
  gap: 0.65rem;
}

.golden-row,
.abc-row,
.dead-stock-row {
  border: 1px solid var(--border);
  border-radius: 18px;
  background: var(--bg-secondary);
}

.golden-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 1rem;
  align-items: center;
  padding: 0.9rem;
}

.golden-row strong,
.abc-row strong,
.dead-product strong,
.dead-price strong {
  display: block;
  color: var(--text-primary);
}

.golden-row span,
.abc-row span,
.dead-product span,
.dead-product small,
.dead-price span {
  display: block;
  margin-top: 0.25rem;
  color: var(--text-muted);
  font-size: 0.82rem;
}

.stock-forecast {
  min-width: 110px;
  padding: 0.65rem;
  border-radius: 16px;
  text-align: right;
  background: var(--bg-card);
}

.stock-forecast.warning {
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.14);
}

.stock-forecast b {
  display: block;
}

.stock-forecast small {
  color: currentColor;
  opacity: 0.82;
}

.abc-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 0.85rem;
  align-items: center;
  padding: 0.85rem;
}

.abc-badge {
  width: 58px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 14px;
  color: var(--text-primary);
  background: var(--bg-card);
  font-weight: 900;
}

.abc-badge.abc-a {
  color: #0b0b10;
  background: linear-gradient(135deg, #fbbf24, #fde68a);
}

.abc-badge.abc-b {
  color: #0b0b10;
  background: linear-gradient(135deg, #9fb5ff, #dbe4ff);
}

.abc-badge.abc-c {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.14);
}

.abc-row small {
  color: var(--text-primary);
  font-weight: 800;
  white-space: nowrap;
}

.dead-stock-card {
  overflow: hidden;
}

.dead-stock-row {
  display: grid;
  grid-template-columns: minmax(220px, 1fr) auto minmax(260px, auto);
  gap: 1rem;
  align-items: center;
  padding: 0.9rem;
}

.dead-price {
  text-align: right;
  white-space: nowrap;
}

.discount-form {
  display: flex;
  gap: 0.55rem;
}

.discount-form input {
  width: 110px;
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 0.7rem 0.8rem;
  color: var(--text-primary);
  background: var(--bg-card);
  outline: 0;
}

.discount-form button {
  border: 0;
  border-radius: 14px;
  padding: 0.7rem 0.95rem;
  color: #0b0b10;
  background: var(--accent);
  font-weight: 800;
  cursor: pointer;
  transition: var(--transition);
}

.discount-form button:disabled {
  cursor: wait;
  opacity: 0.65;
}

.cancellation-analytics {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.cancellation-hero {
  display: grid;
  grid-template-columns: 0.75fr 1.25fr;
  gap: 1rem;
}

.cancel-total-card {
  padding: 1.25rem;
  border: 1px solid rgba(239, 68, 68, 0.32);
  border-radius: 24px;
  background:
    radial-gradient(circle at 90% 10%, rgba(239, 68, 68, 0.16), transparent 36%),
    var(--bg-card);
}

.cancel-total-card--reason {
  border-color: rgba(245, 158, 11, 0.32);
  background:
    radial-gradient(circle at 90% 10%, rgba(245, 158, 11, 0.16), transparent 36%),
    var(--bg-card);
}

.cancel-total-card span {
  color: var(--text-muted);
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.cancel-total-card strong {
  display: block;
  margin-top: 0.55rem;
  color: var(--text-primary);
  font-size: clamp(1.45rem, 3vw, 2.1rem);
}

.cancel-total-card small {
  display: block;
  margin-top: 0.5rem;
  color: var(--text-secondary);
  line-height: 1.45;
}

.reason-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}

.reason-card,
.recent-cancellations-card {
  padding: 1rem;
  border: 1px solid var(--border);
  border-radius: 22px;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.035), transparent),
    var(--bg-card);
}

.reason-card--high_price {
  border-color: rgba(245, 158, 11, 0.38);
}

.reason-card--long_delivery {
  border-color: rgba(56, 189, 248, 0.32);
}

.reason-card--scheme_mismatch {
  border-color: rgba(159, 181, 255, 0.38);
}

.reason-card--changed_mind {
  border-color: rgba(236, 72, 153, 0.32);
}

.reason-card__top {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
}

.reason-card__top h3 {
  margin: 0 0 0.35rem;
  color: var(--text-primary);
  font-size: 1rem;
}

.reason-card__top p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.84rem;
  line-height: 1.45;
}

.reason-card__top span {
  flex-shrink: 0;
  padding: 0.32rem 0.58rem;
  border-radius: 999px;
  color: #ef4444;
  background: rgba(239, 68, 68, 0.12);
  font-weight: 900;
}

.reason-card__metrics {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 1rem;
  padding-top: 0.8rem;
  border-top: 1px solid var(--border);
}

.reason-card__metrics strong {
  color: var(--text-primary);
}

.reason-card__metrics small {
  color: var(--text-muted);
}

.reason-products {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-top: 0.8rem;
}

.reason-products span {
  width: 100%;
  color: var(--text-muted);
  font-size: 0.78rem;
}

.reason-products b {
  padding: 0.22rem 0.5rem;
  border-radius: 999px;
  color: var(--text-secondary);
  background: var(--bg-secondary);
  font-size: 0.72rem;
}

.recent-cancel-list {
  display: grid;
  gap: 0.65rem;
}

.recent-cancel-row {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.85rem;
  border: 1px solid var(--border);
  border-radius: 18px;
  background: var(--bg-secondary);
}

.recent-cancel-row strong,
.recent-cancel-row span,
.recent-cancel-row small {
  display: block;
}

.recent-cancel-row strong {
  color: var(--text-primary);
}

.recent-cancel-row span {
  margin-top: 0.25rem;
  color: #ef4444;
  font-size: 0.84rem;
}

.recent-cancel-row small {
  margin-top: 0.25rem;
  color: var(--text-muted);
  font-size: 0.78rem;
}

.recent-cancel-row em {
  flex-shrink: 0;
  color: var(--text-muted);
  font-style: normal;
}

.trend-analytics {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.trend-summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
}

.trend-summary-card {
  padding: 1.15rem;
  border: 1px solid var(--border);
  border-radius: 24px;
  background:
    radial-gradient(circle at 85% 15%, rgba(56, 189, 248, 0.12), transparent 36%),
    var(--bg-card);
}

.trend-summary-card--forecast {
  border-color: rgba(56, 189, 248, 0.38);
}

.trend-summary-card.warning {
  border-color: rgba(245, 158, 11, 0.42);
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.12), var(--bg-card));
}

.trend-summary-card span {
  color: var(--text-muted);
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.trend-summary-card strong {
  display: block;
  margin-top: 0.55rem;
  color: var(--text-primary);
  font-size: clamp(1.35rem, 2.6vw, 2rem);
}

.trend-summary-card small {
  display: block;
  margin-top: 0.45rem;
  color: var(--text-secondary);
  line-height: 1.4;
}

.trend-grid {
  display: grid;
  grid-template-columns: 1.25fr 1fr;
  gap: 1rem;
}

.trend-panel,
.marketing-card {
  padding: 1.15rem;
  border: 1px solid var(--border);
  border-radius: 24px;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.035), transparent),
    var(--bg-card);
}

.trend-panel--wide {
  grid-row: span 2;
}

.month-compare-list,
.forecast-list,
.season-list,
.marketing-list {
  display: grid;
  gap: 0.65rem;
}

.month-compare-row,
.forecast-row,
.season-row,
.marketing-row {
  border: 1px solid var(--border);
  border-radius: 18px;
  background: var(--bg-secondary);
}

.month-compare-row {
  display: grid;
  grid-template-columns: minmax(150px, 0.85fr) minmax(160px, 1fr) auto;
  gap: 1rem;
  align-items: center;
  padding: 0.85rem;
}

.month-compare-row strong,
.forecast-row strong,
.season-row strong,
.marketing-row strong {
  display: block;
  color: var(--text-primary);
}

.month-compare-row span,
.forecast-row span,
.season-row span,
.marketing-row span,
.marketing-row small {
  display: block;
  margin-top: 0.22rem;
  color: var(--text-muted);
  font-size: 0.82rem;
}

.marketing-link {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  max-width: 100%;
  margin-top: 0.65rem;
  padding: 0.55rem;
  border: 1px solid rgba(159, 181, 255, 0.18);
  border-radius: 14px;
  background: rgba(159, 181, 255, 0.075);
}

.marketing-link code {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  color: var(--accent);
  font-size: 0.78rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.marketing-link button {
  flex-shrink: 0;
  border: 0;
  border-radius: 12px;
  padding: 0.48rem 0.7rem;
  color: #0b0b10;
  background: var(--accent);
  cursor: pointer;
  font-size: 0.76rem;
  font-weight: 900;
}

.month-bars {
  display: grid;
  gap: 0.35rem;
}

.month-bars span {
  height: 8px;
  margin: 0;
  border-radius: 999px;
}

.month-bars__current {
  background: linear-gradient(90deg, var(--accent), #22c55e);
}

.month-bars__previous {
  background: rgba(255, 255, 255, 0.16);
}

.month-money {
  text-align: right;
  white-space: nowrap;
}

.month-money em,
.marketing-impact b {
  display: inline-flex;
  margin-top: 0.25rem;
  padding: 0.2rem 0.48rem;
  border-radius: 999px;
  font-size: 0.76rem;
  font-style: normal;
  font-weight: 900;
}

.month-money em.positive,
.marketing-impact b.positive {
  color: #22c55e;
  background: rgba(34, 197, 94, 0.12);
}

.month-money em.negative,
.marketing-impact b.negative {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.12);
}

.forecast-row,
.season-row {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: center;
  padding: 0.85rem;
}

.forecast-row b {
  color: var(--text-primary);
  white-space: nowrap;
}

.season-row.upcoming {
  border-color: rgba(245, 158, 11, 0.42);
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), var(--bg-secondary));
}

.season-row em {
  flex-shrink: 0;
  padding: 0.25rem 0.55rem;
  border-radius: 999px;
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.14);
  font-size: 0.78rem;
  font-style: normal;
  font-weight: 900;
}

.marketing-form {
  display: grid;
  grid-template-columns: minmax(220px, 1fr) 140px minmax(150px, 0.75fr) 130px 150px auto;
  gap: 0.65rem;
  margin-bottom: 1rem;
}

.marketing-form input,
.marketing-form select {
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 0.78rem 0.9rem;
  color: var(--text-primary);
  background: var(--bg-secondary);
  outline: 0;
}

.marketing-form button {
  border: 0;
  border-radius: 14px;
  padding: 0.78rem 1rem;
  color: #0b0b10;
  background: var(--accent);
  font-weight: 900;
  cursor: pointer;
}

.marketing-form button:disabled {
  opacity: 0.65;
  cursor: wait;
}

.marketing-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 1rem;
  align-items: center;
  padding: 0.85rem;
}

.marketing-impact {
  display: flex;
  align-items: center;
  gap: 0.55rem;
}

.margin-analytics {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.margin-summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
}

.margin-summary-card {
  padding: 1.15rem;
  border: 1px solid var(--border);
  border-radius: 24px;
  background:
    radial-gradient(circle at 90% 12%, rgba(34, 197, 94, 0.12), transparent 36%),
    var(--bg-card);
}

.margin-summary-card--profit {
  border-color: rgba(34, 197, 94, 0.42);
  background:
    radial-gradient(circle at 82% 12%, rgba(34, 197, 94, 0.18), transparent 34%),
    linear-gradient(135deg, rgba(159, 181, 255, 0.1), transparent),
    var(--bg-card);
}

.margin-summary-card span {
  color: var(--text-muted);
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.margin-summary-card strong {
  display: block;
  margin-top: 0.55rem;
  color: var(--text-primary);
  font-size: clamp(1.35rem, 2.6vw, 2rem);
}

.margin-summary-card small {
  display: block;
  margin-top: 0.45rem;
  color: var(--text-secondary);
  line-height: 1.4;
}

.margin-grid {
  display: grid;
  grid-template-columns: 1.3fr 0.9fr;
  gap: 1rem;
}

.margin-panel,
.margin-orders-card {
  padding: 1.15rem;
  border: 1px solid var(--border);
  border-radius: 24px;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.035), transparent),
    var(--bg-card);
}

.margin-table {
  display: grid;
  gap: 0.55rem;
}

.margin-table-head,
.margin-table-row {
  display: grid;
  grid-template-columns: minmax(180px, 1fr) repeat(4, minmax(90px, auto));
  gap: 0.75rem;
  align-items: center;
}

.margin-table-head {
  padding: 0 0.85rem;
  color: var(--text-muted);
  font-size: 0.74rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.margin-table-row,
.margin-order-row {
  border: 1px solid var(--border);
  border-radius: 18px;
  background: var(--bg-secondary);
}

.margin-table-row {
  padding: 0.85rem;
}

.margin-table-row strong,
.margin-table-row b {
  color: var(--text-primary);
}

.margin-table-row span {
  color: var(--text-secondary);
}

.margin-table-row b.positive,
.margin-table-row b.negative,
.margin-breakdown strong.positive,
.margin-breakdown strong.negative {
  display: inline-flex;
  justify-content: center;
  padding: 0.22rem 0.55rem;
  border-radius: 999px;
  font-weight: 900;
}

.margin-table-row b.positive,
.margin-breakdown strong.positive {
  color: #22c55e;
  background: rgba(34, 197, 94, 0.12);
}

.margin-table-row b.negative,
.margin-breakdown strong.negative {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.12);
}

.margin-order-list {
  display: grid;
  gap: 0.65rem;
  max-height: 680px;
  overflow: auto;
}

.margin-order-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(280px, 0.9fr);
  gap: 1rem;
  padding: 0.9rem;
}

.margin-order-main strong {
  display: block;
  color: var(--text-primary);
}

.margin-order-main span,
.margin-order-main small {
  display: block;
  margin-top: 0.25rem;
  color: var(--text-secondary);
  line-height: 1.4;
}

.margin-breakdown {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.45rem;
}

.margin-breakdown span {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  color: var(--text-muted);
  font-size: 0.82rem;
}

.margin-breakdown b {
  color: var(--text-primary);
  white-space: nowrap;
}

.marketing-impact button {
  border: 1px solid rgba(239, 68, 68, 0.32);
  border-radius: 12px;
  padding: 0.5rem 0.7rem;
  color: #ef4444;
  background: rgba(239, 68, 68, 0.08);
  cursor: pointer;
}

.customer-analytics {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.section-heading {
  display: flex;
  justify-content: space-between;
  gap: 1.5rem;
  align-items: flex-end;
  padding-top: 0.75rem;
}

.section-heading h2 {
  margin: 0.25rem 0 0;
  font-size: clamp(1.4rem, 3vw, 2rem);
}

.section-heading p {
  max-width: 520px;
  margin: 0;
  color: var(--text-secondary);
  line-height: 1.5;
}

.section-kicker {
  color: var(--accent);
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.customer-summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
}

.customer-summary-card,
.insight-card,
.retention-card {
  border: 1px solid var(--border);
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.035), transparent),
    var(--bg-card);
  border-radius: 24px;
}

.customer-summary-card {
  padding: 1.15rem;
  position: relative;
  overflow: hidden;
}

.customer-summary-card::after {
  content: '';
  position: absolute;
  inset: auto -20% -45% 35%;
  height: 90px;
  background: radial-gradient(circle, rgba(159, 181, 255, 0.2), transparent 68%);
  pointer-events: none;
}

.customer-summary-card span,
.client-main span,
.client-money span,
.compact-row span,
.retention-row span {
  color: var(--text-muted);
}

.customer-summary-card strong {
  display: block;
  margin-top: 0.55rem;
  color: var(--text-primary);
  font-size: clamp(1.35rem, 2.6vw, 2rem);
}

.customer-summary-card small {
  display: block;
  margin-top: 0.45rem;
  color: var(--text-secondary);
  line-height: 1.4;
}

.customer-summary-card--core {
  border-color: rgba(159, 181, 255, 0.42);
}

.customer-summary-card.warning {
  border-color: rgba(245, 158, 11, 0.42);
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.12), var(--bg-card));
}

.customer-summary-card.danger {
  border-color: rgba(239, 68, 68, 0.42);
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.12), var(--bg-card));
}

.customer-grid {
  display: grid;
  grid-template-columns: 1.25fr 1fr;
  gap: 1rem;
}

.insight-card,
.retention-card {
  padding: 1.15rem;
}

.insight-card--wide {
  grid-row: span 2;
  align-self: start;
}

.insight-head {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.insight-head h3 {
  margin: 0 0 0.25rem;
  font-size: 1.05rem;
}

.insight-head p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.88rem;
  line-height: 1.4;
}

.pill {
  min-width: 2.35rem;
  padding: 0.35rem 0.65rem;
  border-radius: 999px;
  text-align: center;
  color: var(--accent);
  background: var(--accent-dim);
  font-weight: 800;
}

.pill.warning {
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.14);
}

.pill.danger {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.14);
}

.client-list,
.compact-list,
.retention-list {
  display: grid;
  gap: 0.65rem;
  max-height: 560px;
  overflow: auto;
  padding-right: 0.15rem;
}

.client-row,
.compact-row,
.retention-row {
  border: 1px solid var(--border);
  border-radius: 18px;
  background: var(--bg-secondary);
}

.client-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 0.85rem;
  align-items: center;
  padding: 0.85rem;
}

.client-rank {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 14px;
  color: var(--text-muted);
  background: var(--bg-card);
  font-weight: 800;
}

.client-rank.core {
  color: #0b0b10;
  background: var(--accent);
}

.client-main {
  min-width: 0;
}

.client-main strong,
.compact-row strong,
.retention-row strong {
  display: block;
  color: var(--text-primary);
}

.client-main span,
.client-main small,
.compact-row span,
.compact-row small {
  display: block;
  margin-top: 0.2rem;
  font-size: 0.82rem;
}

.client-main small {
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.client-money {
  text-align: right;
  white-space: nowrap;
}

.client-money strong {
  display: block;
  color: var(--text-primary);
}

.compact-row {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.85rem;
}

.compact-row > div {
  min-width: 0;
}

.compact-row em {
  align-self: flex-start;
  flex-shrink: 0;
  padding: 0.25rem 0.5rem;
  border-radius: 999px;
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.14);
  font-size: 0.78rem;
  font-style: normal;
  font-weight: 800;
}

.repeat-row span {
  color: var(--text-primary);
}

.retention-card {
  overflow: hidden;
}

.retention-row {
  display: grid;
  grid-template-columns: minmax(180px, 1fr) minmax(160px, 0.9fr) auto;
  gap: 1rem;
  align-items: center;
  padding: 0.85rem;
}

.retention-bar {
  height: 10px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--bg-secondary);
  box-shadow: inset 0 0 0 1px var(--border);
}

.retention-bar span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--accent), #22c55e);
}

.retention-row b {
  color: var(--text-primary);
}

.empty-mini {
  padding: 1.25rem;
  color: var(--text-muted);
  text-align: center;
}

.empty-state,
.loading-state {
  padding: 3rem;
  text-align: center;
  color: var(--text-muted);
}

.spinner {
  width: 32px;
  height: 32px;
  margin: 0 auto;
  border: 3px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 1180px) {
  .analytics-tabs {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .summary-grid,
  .stock-summary-grid,
  .trend-summary-grid,
  .customer-summary-grid,
  .margin-summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .table-head {
    display: none;
  }

  .product-row {
    grid-template-columns: 1fr 1fr;
    align-items: stretch;
  }

  .product-cell {
    grid-column: 1 / -1;
  }

  .customer-grid {
    grid-template-columns: 1fr;
  }

  .stock-grid {
    grid-template-columns: 1fr;
  }

  .trend-grid {
    grid-template-columns: 1fr;
  }

  .morning-hero,
  .morning-grid,
  .action-card {
    grid-template-columns: 1fr;
  }

  .margin-grid,
  .margin-order-row {
    grid-template-columns: 1fr;
  }

  .trend-panel--wide {
    grid-row: auto;
  }

  .marketing-form {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .reason-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .insight-card--wide {
    grid-row: auto;
  }
}

@media (max-width: 720px) {
  .page-header,
  .toolbar,
  .section-heading {
    flex-direction: column;
    align-items: stretch;
  }

  .period-switcher,
  .toggle-alerts {
    width: 100%;
  }

  .period-btn {
    flex: 1;
  }

  .analytics-tabs {
    grid-template-columns: 1fr;
    border-radius: 22px;
  }

  .analytics-tab {
    min-height: auto;
  }

  .summary-grid,
  .morning-hero,
  .morning-grid,
  .action-card,
  .stock-summary-grid,
  .trend-summary-grid,
  .customer-summary-grid,
  .margin-summary-grid,
  .cancellation-hero,
  .reason-grid,
  .product-row,
  .golden-row,
  .abc-row,
  .dead-stock-row,
  .month-compare-row,
  .marketing-form,
  .marketing-row,
  .margin-table-head,
  .margin-table-row,
  .margin-breakdown,
  .client-row,
  .retention-row {
    grid-template-columns: 1fr;
  }

  .margin-table-head {
    display: none;
  }

  .client-money,
  .dead-price,
  .month-money,
  .stock-forecast {
    text-align: left;
  }

  .marketing-impact {
    justify-content: space-between;
  }

  .marketing-link {
    align-items: stretch;
    flex-direction: column;
  }

  .marketing-link code {
    white-space: normal;
    word-break: break-all;
  }

  .discount-form {
    flex-direction: column;
  }

  .discount-form input {
    width: 100%;
  }
}
</style>
