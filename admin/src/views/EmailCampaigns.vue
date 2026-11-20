<template>
  <div class="email-campaigns-page">
    <div class="page-header">
      <div>
        <h1>Рассылки</h1>
        <p>Подарочные баллы, письма клиентам и партнёрам, Telegram и автоматические напоминания</p>
      </div>
    </div>

    <nav class="campaign-tabs" aria-label="Разделы рассылок">
      <button type="button" :class="{ active: activeSection === 'compose' }" @click="activeSection = 'compose'">Создать рассылку</button>
      <button type="button" :class="{ active: activeSection === 'history' }" @click="openHistory">История рассылок</button>
    </nav>

    <div class="campaign-layout">
      <section v-if="activeSection === 'compose'" class="campaign-card">
        <div class="card-heading">
          <span class="card-kicker">Акции и новости · email · Telegram · сайт</span>
          <h2>Создать рассылку</h2>
          <p>Выберите сценарий, каналы и получателей. Проверьте аудиторию перед запуском. Имя получателя: <code v-pre>{{name}}</code>.</p>
        </div>

        <form class="campaign-form" @submit.prevent="sendCampaign">
          <div class="template-picker" role="group" aria-label="Шаблон письма">
            <button v-for="template in templates" :key="template.type" type="button" :class="['template-option', { selected: form.type === template.type }]" @click="applyTemplate(template.type)"><span>{{ template.label }}</span><small>{{ template.hint }}</small></button>
          </div>

          <label>
            <span>Аудитория</span>
            <select v-model="form.audience" class="input">
              <option value="all">Все пользователи</option>
              <option value="clients">Только клиенты</option>
              <option value="partners">Только партнёры</option>
              <option value="blog">Подписчики блога</option>
              <option value="selected">Выбранные пользователи</option>
            </select>
            <small>Согласие не требуется. Отписавшиеся исключены из всех каналов. Для email нужна подтверждённая почта, для Telegram — подключённый аккаунт.</small>
          </label>

          <div v-if="form.audience === 'selected'" class="selected-audience">
            <div><strong>Конкретные получатели</strong><small>Сообщения получат выбранные аккаунты с доступным каналом. Отписавшиеся исключены.</small></div>
            <button class="btn btn-secondary" type="button" @click="openUserPicker">Выбрать из списка</button>
            <div v-if="form.targetUserIds.length" class="selected-audience__chips"><button v-for="id in form.targetUserIds" :key="id" type="button" :title="`Убрать пользователя #${id}`" @click="removeSelectedUser(id)">{{ pickerKnown[id]?.name || pickerKnown[id]?.email || `#${id}` }} <span>×</span></button></div>
            <small v-else>Пользователи пока не выбраны.</small>
          </div>

          <div class="campaign-channels">
            <strong>Каналы рассылки</strong>
            <label><input v-model="form.emailEnabled" type="checkbox"><span><b>Email</b><small>Письмо на подтверждённый адрес.</small></span></label>
            <label v-if="form.audience !== 'blog'"><input v-model="form.telegramEnabled" type="checkbox"><span><b>Telegram</b><small>Сообщение пользователям с подключённым Telegram.</small></span></label>
            <label v-if="form.audience !== 'blog'"><input v-model="form.siteEnabled" type="checkbox"><span><b>Сайт и мини-приложение</b><small>Сообщение появится при входе в аккаунт.</small></span></label>
          </div>

          <div v-if="['NEW_PRODUCT', 'PRODUCT_DISCOUNT'].includes(form.type)" class="product-search">
            <label><span>Товар для рассылки</span><input v-model.trim="productQuery" class="input" type="search" placeholder="Найдите товар по названию или артикулу"></label>
            <div v-if="productLoading" class="product-search-state">Ищем товары…</div>
            <div v-else-if="productResults.length" class="product-results"><button v-for="product in productResults" :key="product.id" type="button" @click="selectProduct(product)"><strong>{{ product.title }}</strong><small>#{{ product.id }} · {{ product.price.toLocaleString('ru-RU') }} ₽</small></button></div>
            <p v-if="selectedProduct" class="selected-product">Выбран: {{ selectedProduct.title }} · ссылка и изображение подставлены в рассылку.</p>
          </div>

          <label>
            <span>{{ form.emailEnabled ? 'Тема письма' : 'Название рассылки' }}</span>
            <input v-model.trim="form.subject" class="input" type="text" maxlength="200" placeholder="Например: Новые поступления Angel Wings" required>
          </label>

          <label><span>Заголовок письма и сообщения на сайте</span><input v-model.trim="form.headline" class="input" type="text" maxlength="160" required></label>

          <label>
            <span>{{ form.emailEnabled ? 'Текст письма' : 'Основной текст рассылки' }}</span>
            <textarea
              v-model="form.body"
              class="input textarea"
              rows="9"
              maxlength="5000"
              placeholder="Здравствуйте, {{name}}!&#10;&#10;Расскажите здесь о новости, акции или важном уведомлении."
              required
            />
          </label>

          <label v-if="form.telegramEnabled"><span>Текст для Telegram</span><textarea v-model="form.telegramBody" class="input textarea" rows="4" maxlength="900" required></textarea><small>Имя получателя можно вставить через <code v-pre>{{name}}</code>.</small></label>
          <label v-if="form.siteEnabled"><span>Текст сообщения на сайте</span><textarea v-model="form.siteBody" class="input textarea" rows="4" maxlength="500" required></textarea></label>

          <div class="campaign-fields-two"><label><span>Текст кнопки (необязательно)</span><input v-model.trim="form.buttonText" class="input" type="text" maxlength="80" placeholder="Посмотреть товар"></label><label><span>Ссылка кнопки</span><input v-model.trim="form.buttonUrl" class="input" type="url" placeholder="https://angel-wings.ru/product/123"></label></div>
          <div class="campaign-image-field">
            <div><strong>Изображение для рассылки</strong><small>PNG, JPEG или WebP до 5 МБ. Для Telegram подойдут PNG и JPEG.</small></div>
            <div class="campaign-image-actions">
              <input id="campaign-image-file" class="campaign-image-file" type="file" :accept="form.telegramEnabled ? 'image/png,image/jpeg' : 'image/png,image/jpeg,image/webp'" :disabled="uploadingImage" @change="uploadCampaignImage">
              <label for="campaign-image-file" class="btn btn-secondary">{{ uploadingImage ? 'Загружаем…' : 'Загрузить изображение' }}</label>
              <button v-if="form.imageUrl" class="btn btn-secondary" type="button" :disabled="uploadingImage" @click="removeCampaignImage">Убрать</button>
            </div>
            <img v-if="form.imageUrl" class="campaign-image-preview" :src="imagePreviewUrl" alt="Изображение рассылки">
          </div>

          <div class="campaign-review"><button class="btn btn-secondary" type="button" :disabled="loading || previewLoading || uploadingImage" @click="previewCampaign">{{ previewLoading ? 'Проверяем…' : 'Проверить аудиторию' }}</button><span v-if="previewCount !== null"><template v-if="form.audience === 'selected'">Выбрано: <strong>{{ previewSelectedCount }}</strong> · </template>Получателей: <strong>{{ previewCount }}</strong> · email {{ previewChannels.email }} · Telegram {{ previewChannels.telegram }} · сайт {{ previewChannels.site }}. Проверка ничего не отправляет.</span></div>
          <div v-if="form.audience === 'selected' && previewExcluded.length" class="campaign-excluded"><strong>Не получат рассылку: {{ previewExcluded.length }}</strong><ul><li v-for="user in previewExcluded" :key="user.id"><span>{{ user.name || user.email || `Аккаунт #${user.id}` }} <small>#{{ user.id }}</small></span><span>{{ user.reason }}</span></li></ul></div>
          <div v-if="previewHtml && form.emailEnabled" class="mail-preview"><div><strong>Так выглядит письмо</strong><small>Пример для получателя по имени Анна</small></div><iframe title="Предпросмотр письма" :srcdoc="previewHtml" sandbox="" loading="lazy"></iframe></div>

          <div v-if="message" :class="['notice', messageType]">{{ message }}</div>

          <button class="btn btn-primary send-btn" type="submit" :disabled="loading || previewLoading || uploadingImage">
            <span v-if="loading" class="spinner"></span>
            <span v-if="loading">{{ previewCount === null ? 'Проверяем получателей…' : 'Запускаем рассылку…' }}</span>
            <span v-else>{{ previewCount > 0 ? `Отправить ${previewCount} получателям` : 'Отправить рассылку' }}</span>
          </button>
        </form>
      </section>

      <section v-else class="campaign-card history-card">
        <div class="card-heading">
          <span class="card-kicker">История</span>
          <h2>Последние рассылки</h2>
          <p>Статусы и счётчики обновляются автоматически во время отправки.</p>
        </div>

        <div class="history-live" role="status" aria-live="polite"><span :class="['history-live__dot', { 'history-live__dot--loading': historyLoading || historyRefreshing, 'history-live__dot--idle': !hasActiveCampaigns && !historyLoading && !historyRefreshing }]"></span><span>{{ historyError ? 'Не удалось обновить историю' : historyLoading ? 'Загружаем историю…' : historyRefreshing ? 'Обновляем данные…' : hasActiveCampaigns ? 'Обновление каждые 3 секунды' : 'Автообновление не требуется' }}</span><small v-if="historyUpdatedAt && !historyError">· {{ formatHistoryTime(historyUpdatedAt) }}</small><button type="button" :disabled="historyLoading || historyRefreshing" @click="loadCampaigns()">{{ historyError ? 'Повторить' : 'Обновить' }}</button></div>
        <div v-if="historyLoading && !campaigns.length" class="history-skeleton" aria-label="Загружаем историю рассылок"><div></div><div></div><div></div></div>
        <div v-else-if="!campaigns.length" class="empty-state">{{ historyError ? 'Историю пока не удалось загрузить' : 'Рассылок пока нет' }}</div>

        <div v-else class="campaign-list">
          <article v-for="campaign in campaigns" :key="campaign.id" class="campaign-item">
            <div class="campaign-item__top">
              <div>
                <h3>{{ campaign.subject }}</h3>
                <p>{{ getAudienceLabel(campaign.audience) }} · {{ formatDate(campaign.createdAt) }}</p>
              </div>
              <span :class="['status-pill', getStatusClass(campaign.status), { 'status-pill--active': isCampaignActive(campaign) }]">
                <span v-if="isCampaignActive(campaign)" class="status-pill__spinner" aria-hidden="true"></span>
                {{ getStatusLabel(campaign.status) }}
              </span>
            </div>

            <div v-if="isCampaignActive(campaign)" class="campaign-progress"><div class="campaign-progress__label"><span>Обработано {{ campaign.channels?.processed || 0 }} из {{ campaign.total }}</span><strong>{{ campaignProgress(campaign) }}%</strong></div><div class="campaign-progress__track" role="progressbar" :aria-valuenow="campaign.channels?.processed || 0" :aria-valuemax="campaign.total || 1" aria-valuemin="0" aria-label="Обработано получателей"><span :style="{ width: `${campaignProgress(campaign)}%` }"></span></div></div>

            <div class="campaign-stats">
              <span>Всего: <strong>{{ campaign.total }}</strong></span>
              <span>Email: <strong>{{ campaign.sent }}</strong></span>
              <span>Telegram: <strong>{{ campaign.channels?.telegramSent || 0 }}</strong></span>
              <span>На сайте: <strong>{{ campaign.channels?.site || 0 }}</strong></span>
              <span>Ошибок: <strong>{{ (campaign.failed || 0) + (campaign.channels?.telegramFailed || 0) }}</strong></span>
            </div>

            <details v-if="campaign.errorLog" class="error-details">
              <summary>Показать ошибки</summary>
              <pre>{{ campaign.errorLog }}</pre>
            </details>
          </article>
        </div>
      </section>
    </div>
    <section v-if="activeSection === 'compose'" class="recovery-console">
      <div class="recovery-console__heading">
        <div>
          <span class="card-kicker">Умные напоминания</span>
          <h2>Возвращение к покупке</h2>
          <p>Интервалы считаются от последнего изменения корзины или момента создания заказа.</p>
        </div>
        <div class="recovery-actions">
          <button class="btn btn-secondary" type="button" :disabled="recoveryRunning" @click="runRecoveryNow">
            {{ recoveryRunning ? 'Проверяем…' : 'Проверить сейчас' }}
          </button>
          <button class="btn btn-primary" type="button" :disabled="recoverySaving" @click="saveRecoverySettings">
            {{ recoverySaving ? 'Сохраняем…' : 'Сохранить настройки' }}
          </button>
        </div>
      </div>

      <div class="recovery-grid">
        <article class="recovery-rule recovery-rule--cart">
          <div class="rule-topline">
            <span class="rule-number">01</span>
            <label class="switch">
              <input v-model="recoverySettings.cartEnabled" type="checkbox">
              <span></span>
            </label>
          </div>
          <h3>Покинутая корзина</h3>
          <p>Пользователь добавил товары, но не создал заказ.</p>
          <label class="delay-control">
            <span>Отправить через</span>
            <div><input v-model.number="recoverySettings.cartDelayHours" type="number" min="1" max="720"><b>часов</b></div>
          </label>
        </article>

        <article class="recovery-rule recovery-rule--payment">
          <div class="rule-topline">
            <span class="rule-number">02</span>
            <label class="switch">
              <input v-model="recoverySettings.unpaidOrderEnabled" type="checkbox">
              <span></span>
            </label>
          </div>
          <h3>Заказ без оплаты</h3>
          <p>Заказ оформлен, но платёж всё ещё ожидается.</p>
          <label class="delay-control">
            <span>Отправить через</span>
            <div><input v-model.number="recoverySettings.unpaidOrderDelayHours" type="number" min="1" max="168"><b>часов</b></div>
          </label>
        </article>

        <article class="recovery-activity">
          <div class="activity-head">
            <div><span class="pulse-dot"></span> Последние отправки</div>
            <strong>{{ recoveryLogs.filter(item => item.status === 'SENT').length }}</strong>
          </div>
          <div v-if="!recoveryLogs.length" class="activity-empty">Писем пока не было</div>
          <div v-else class="activity-list">
            <div v-for="item in recoveryLogs.slice(0, 5)" :key="item.id" class="activity-row">
              <div><strong>{{ getRecoveryTypeLabel(item.type) }}</strong><small>{{ item.recipient }}</small></div>
              <span :class="['activity-status', item.status.toLowerCase()]">{{ item.status === 'SENT' ? 'Отправлено' : item.status === 'FAILED' ? 'Ошибка' : 'В работе' }}</span>
            </div>
          </div>
        </article>
      </div>
      <form class="test-email-bar" @submit.prevent="scheduleTestEmail">
        <div class="test-email-copy">
          <span class="test-email-icon">T+1</span>
          <div><strong>Тестовое персональное письмо</strong><small>Уйдёт только на указанный адрес через одну минуту и не изменит настоящую цепочку.</small></div>
        </div>
        <select v-model="testEmailSource" aria-label="Источник тестового письма">
          <option value="AUTO">Корзина или заказ автоматически</option>
          <option value="CART">Активная корзина</option>
          <option value="UNPAID_ORDER">Неоплаченный заказ</option>
        </select>
        <input v-model.trim="testEmail" type="email" placeholder="email@example.com" required>
        <button class="btn btn-secondary" type="submit" :disabled="testEmailScheduling">
          {{ testEmailScheduling ? 'Ставим в очередь…' : 'Отправить через 1 минуту' }}
        </button>
      </form>
      <div v-if="recoveryMessage" :class="['notice', recoveryMessageType]">{{ recoveryMessage }}</div>
    </section>

    <PointsCampaigns v-if="activeSection === 'compose'" />
    <div v-if="pickerOpen" class="recipient-picker-backdrop" @click.self="closeUserPicker">
      <div class="recipient-picker" role="dialog" aria-modal="true" aria-labelledby="recipient-picker-title" @keydown.esc="closeUserPicker">
        <div class="recipient-picker__head"><div><h3 id="recipient-picker-title">Выбрать пользователей</h3><p>Поиск по имени, email, телефону и ID. Выбранным аккаунтам согласие на общую рассылку не требуется.</p></div><button type="button" aria-label="Закрыть" @click="closeUserPicker">×</button></div>
        <div class="recipient-picker__search"><input v-model="pickerQuery" class="input" type="search" placeholder="Поиск пользователей" aria-label="Поиск пользователей"><strong>{{ pickerSelected.length }} выбрано</strong></div>
        <div v-if="pickerSelected.length" class="recipient-picker__selected"><button v-for="id in pickerSelected" :key="id" type="button" @click="togglePickerUser(id)">{{ pickerKnown[id]?.name || pickerKnown[id]?.email || `#${id}` }} <span>×</span></button></div>
        <div class="recipient-picker__list" aria-live="polite">
          <p v-if="pickerLoading">Загрузка пользователей…</p>
          <p v-else-if="pickerError" class="recipient-picker__error">{{ pickerError }}</p>
          <p v-else-if="!pickerUsers.length">Пользователи не найдены</p>
          <label v-for="user in pickerUsers" :key="user.id" class="recipient-picker__user"><input type="checkbox" :checked="pickerSelected.includes(user.id)" @change="togglePickerUser(user.id)"><span><strong>{{ user.name || `Пользователь #${user.id}` }}</strong><small>{{ user.email || user.phone || 'Контакт не указан' }}<template v-if="user.email && user.phone"> · {{ user.phone }}</template></small></span><small>#{{ user.id }} · {{ user.role === 'PARTNER' ? 'Партнёр' : user.role === 'USER' ? 'Клиент' : 'Администратор' }}</small></label>
        </div>
        <div class="recipient-picker__bottom"><div><button class="btn btn-secondary" type="button" :disabled="pickerLoading || pickerOffset === 0" @click="pickerOffset = Math.max(0, pickerOffset - pickerLimit)">Назад</button><span>{{ pickerTotal ? `${pickerOffset + 1}–${Math.min(pickerOffset + pickerLimit, pickerTotal)} из ${pickerTotal}` : '0 пользователей' }}</span><button class="btn btn-secondary" type="button" :disabled="pickerLoading || pickerOffset + pickerLimit >= pickerTotal" @click="pickerOffset += pickerLimit">Далее</button></div><div><button class="btn btn-secondary" type="button" @click="closeUserPicker">Отмена</button><button class="btn btn-primary" type="button" @click="applyUserPicker">Применить выбор</button></div></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import axios from 'axios'
import PointsCampaigns from '../components/PointsCampaigns.vue'

const campaigns = ref([])
const templates = [
  { type: 'NEW_PRODUCT', label: 'Новый товар', hint: 'Презентация новинки' },
  { type: 'PRODUCT_DISCOUNT', label: 'Скидка на товар', hint: 'Акцент на предложении' },
  { type: 'SALE', label: 'Общая акция', hint: 'Скидки в каталоге' },
  { type: 'NEWS', label: 'Новость', hint: 'Важное сообщение' },
  { type: 'CUSTOM', label: 'Своё письмо', hint: 'Текст с нуля' }
]
const loading = ref(false)
const activeSection = ref('compose')
const previewLoading = ref(false)
const previewCount = ref(null)
const previewSelectedCount = ref(null)
const previewExcluded = ref([])
const previewAudienceHash = ref('')
const previewChannels = ref({ email: 0, telegram: 0, site: 0 })
const previewHtml = ref('')
const productQuery = ref('')
const productResults = ref([])
const productLoading = ref(false)
const selectedProduct = ref(null)
const uploadingImage = ref(false)
const uploadedImageUrl = ref('')
const uploadedPreviewUrl = ref('')
const imagePreviewUrl = computed(() => form.value.imageUrl === uploadedImageUrl.value && uploadedPreviewUrl.value ? uploadedPreviewUrl.value : form.value.imageUrl)
let productTimer
let productRequest = 0
const pickerOpen = ref(false)
const pickerQuery = ref('')
const pickerUsers = ref([])
const pickerKnown = ref({})
const pickerSelected = ref([])
const pickerLoading = ref(false)
const pickerError = ref('')
const pickerTotal = ref(0)
const pickerOffset = ref(0)
const pickerLimit = 20
let pickerTimer
let pickerRequest = 0
const historyLoading = ref(false)
const historyRefreshing = ref(false)
const historyError = ref(false)
const historyUpdatedAt = ref(null)
let historyTimer
let historyFetching = false
const message = ref('')
const messageType = ref('success')
const recoverySaving = ref(false)
const recoveryRunning = ref(false)
const recoveryMessage = ref('')
const recoveryMessageType = ref('success')
const recoveryLogs = ref([])
const testEmail = ref('')
const testEmailSource = ref('AUTO')
const testEmailScheduling = ref(false)
const recoverySettings = ref({
  cartEnabled: true,
  cartDelayHours: 24,
  unpaidOrderEnabled: true,
  unpaidOrderDelayHours: 3
})

const form = ref({
  audience: 'all',
  targetUserIds: [],
  emailEnabled: true,
  telegramEnabled: false,
  siteEnabled: false,
  telegramBody: '',
  siteBody: '',
  type: 'NEW_PRODUCT',
  subject: '',
  headline: '',
  body: '',
  buttonText: '',
  buttonUrl: '',
  imageUrl: ''
})

function applyTemplate(type, product = selectedProduct.value) {
  const name = product?.title || 'новинка Angel Wings'
  const productUrl = product ? `https://angel-wings.ru/product/${product.id}` : 'https://angel-wings.ru/catalog'
  const presets = {
    NEW_PRODUCT: { subject: `Знакомьтесь: ${name}`, headline: 'Новая позиция в каталоге', body: `Здравствуйте, {{name}}!\n\nУ нас появился новый товар — ${name}. Узнайте о нём подробнее и выберите подходящий вариант в каталоге.`, buttonText: 'Посмотреть товар', buttonUrl: productUrl },
    PRODUCT_DISCOUNT: { subject: `Специальное предложение: ${name}`, headline: 'На выбранный товар действует скидка', body: `Здравствуйте, {{name}}!\n\nДля ${name} сейчас действует специальная цена. Актуальную стоимость и доступные варианты смотрите на странице товара.`, buttonText: 'Посмотреть предложение', buttonUrl: productUrl },
    SALE: { subject: 'Специальные предложения Angel Wings', headline: 'В каталоге действуют скидки', body: 'Здравствуйте, {{name}}!\n\nМы подготовили специальные предложения на товары Angel Wings. Посмотрите актуальные цены и выберите то, что вам подходит.', buttonText: 'Открыть каталог', buttonUrl: 'https://angel-wings.ru/catalog' },
    NEWS: { subject: 'Новости Angel Wings', headline: 'Есть новости для вас', body: 'Здравствуйте, {{name}}!\n\nРассказываем о важном обновлении Angel Wings. Подробности вы найдёте на нашем сайте.', buttonText: 'Перейти на сайт', buttonUrl: 'https://angel-wings.ru/' },
    CUSTOM: { subject: '', headline: '', body: 'Здравствуйте, {{name}}!\n\n', buttonText: '', buttonUrl: '' }
  }
  const preset = presets[type]
  const productImage = product && ['NEW_PRODUCT', 'PRODUCT_DISCOUNT'].includes(type) ? publicImage(product.image || product.images?.[0]) : ''
  form.value = { ...form.value, type, ...preset, telegramBody: `${preset.headline}\n\n${preset.body}`.slice(0, 900), siteBody: preset.body.slice(0, 500), imageUrl: productImage || uploadedImageUrl.value || '' }
}

function publicImage(value) {
  if (!value) return ''
  try {
    const url = new URL(value, 'https://angel-wings.ru')
    return url.origin === 'https://angel-wings.ru' && /\.(png|jpe?g|webp)$/i.test(url.pathname) ? url.href : ''
  } catch { return '' }
}

async function uploadCampaignImage(event) {
  const file = event.target.files?.[0]
  if (!file) return
  const allowed = form.value.telegramEnabled ? ['image/png', 'image/jpeg'] : ['image/png', 'image/jpeg', 'image/webp']
  if (!allowed.includes(file.type) || file.size > 5 * 1024 * 1024) {
    messageType.value = 'error'
    message.value = form.value.telegramEnabled ? 'Для Telegram выберите PNG или JPEG до 5 МБ.' : 'Выберите PNG, JPEG или WebP до 5 МБ.'
    event.target.value = ''
    return
  }
  uploadingImage.value = true
  message.value = ''
  try {
    const data = new FormData()
    data.append('image', file)
    const response = await axios.post('/api/admin/email-campaigns/image', data)
    uploadedImageUrl.value = response.data.imageUrl
    uploadedPreviewUrl.value = import.meta.env.DEV ? response.data.previewUrl : response.data.imageUrl
    form.value.imageUrl = response.data.imageUrl
  } catch (error) {
    messageType.value = 'error'
    message.value = error.response?.data?.error || 'Не удалось загрузить изображение.'
  } finally {
    uploadingImage.value = false
    event.target.value = ''
  }
}

function removeCampaignImage() {
  form.value.imageUrl = ''
  uploadedImageUrl.value = ''
  uploadedPreviewUrl.value = ''
}

watch(form, () => { previewCount.value = null; previewSelectedCount.value = null; previewExcluded.value = []; previewAudienceHash.value = ''; previewHtml.value = ''; previewChannels.value = { email: 0, telegram: 0, site: 0 } }, { deep: true })
watch(() => form.value.audience, audience => { if (audience === 'blog') { form.value.telegramEnabled = false; form.value.siteEnabled = false } })
watch(pickerQuery, () => {
  if (!pickerOpen.value) return
  pickerOffset.value = 0
  schedulePickerLoad()
})
watch(pickerOffset, () => { if (pickerOpen.value) schedulePickerLoad(0) })

function schedulePickerLoad(delay = 250) {
  clearTimeout(pickerTimer)
  const request = ++pickerRequest
  pickerLoading.value = true
  pickerError.value = ''
  pickerUsers.value = []
  pickerTimer = setTimeout(async () => {
    try {
      const { data } = await axios.get('/api/admin/users', { params: { q: pickerQuery.value.trim(), limit: pickerLimit, offset: pickerOffset.value } })
      if (request !== pickerRequest || !pickerOpen.value) return
      pickerUsers.value = data.users || []
      pickerTotal.value = data.total || 0
      for (const user of pickerUsers.value) pickerKnown.value[user.id] = user
    } catch (error) {
      if (request !== pickerRequest || !pickerOpen.value) return
      pickerError.value = error.response?.data?.error || 'Не удалось загрузить пользователей'
    } finally {
      if (request === pickerRequest) pickerLoading.value = false
    }
  }, delay)
}

async function openUserPicker() {
  pickerSelected.value = [...form.value.targetUserIds]
  pickerQuery.value = ''
  pickerOffset.value = 0
  pickerOpen.value = true
  schedulePickerLoad(0)
  await nextTick()
  document.querySelector('.recipient-picker__search input')?.focus()
}

function closeUserPicker() {
  pickerOpen.value = false
  clearTimeout(pickerTimer)
  pickerRequest++
}

function togglePickerUser(id) {
  pickerSelected.value = pickerSelected.value.includes(id)
    ? pickerSelected.value.filter(selected => selected !== id)
    : [...pickerSelected.value, id]
}

function applyUserPicker() {
  if (pickerSelected.value.length > 500) {
    pickerError.value = 'Можно выбрать не более 500 пользователей.'
    return
  }
  form.value.targetUserIds = [...pickerSelected.value]
  closeUserPicker()
}

function removeSelectedUser(id) {
  form.value.targetUserIds = form.value.targetUserIds.filter(selected => selected !== id)
}

watch(productQuery, query => {
  clearTimeout(productTimer)
  const request = ++productRequest
  productResults.value = []
  if (selectedProduct.value?.title === query) { productLoading.value = false; return }
  selectedProduct.value = null
  if (query.trim().length < 2) { productLoading.value = false; return }
  productLoading.value = true
  productTimer = setTimeout(async () => {
    try {
      const { data } = await axios.get('/api/admin/products', { params: { q: query.trim(), active: true, limit: 8 } })
      if (request === productRequest) productResults.value = data.products || []
    } catch { if (request === productRequest) productResults.value = [] }
    finally { if (request === productRequest) productLoading.value = false }
  }, 250)
})

function selectProduct(product) {
  selectedProduct.value = product
  productQuery.value = product.title
  productResults.value = []
  if (publicImage(product.image || product.images?.[0])) {
    uploadedImageUrl.value = ''
    uploadedPreviewUrl.value = ''
  }
  applyTemplate(form.value.type, product)
}

function applyCampaignPreview(data) {
  previewCount.value = data.count
  previewSelectedCount.value = data.selectedCount
  previewExcluded.value = data.excluded || []
  previewAudienceHash.value = data.audienceHash || ''
  previewChannels.value = data.channels || { email: data.count, telegram: 0, site: 0 }
  previewHtml.value = data.sample.html
}

async function previewCampaign() {
  previewLoading.value = true
  message.value = ''
  try {
    const { data } = await axios.post('/api/admin/email-campaigns/preview', form.value)
    applyCampaignPreview(data)
  } catch (error) {
    messageType.value = 'error'
    message.value = error.response?.data?.error || 'Не удалось проверить письмо'
  } finally { previewLoading.value = false }
}

applyTemplate('NEW_PRODUCT')

async function loadCampaigns({ background = false } = {}) {
  if (historyFetching) return
  historyFetching = true
  if (background) historyRefreshing.value = true
  else historyLoading.value = true
  try {
    const { data } = await axios.get('/api/admin/email-campaigns?limit=100')
    campaigns.value = data.campaigns || []
    historyUpdatedAt.value = new Date()
    historyError.value = false
  } catch {
    historyError.value = true
  } finally {
    historyLoading.value = false
    historyRefreshing.value = false
    historyFetching = false
  }
}

function openHistory() {
  activeSection.value = 'history'
  loadCampaigns({ background: campaigns.value.length > 0 })
}

function isCampaignActive(campaign) { return ['PENDING', 'SENDING'].includes(campaign.status) }
const hasActiveCampaigns = computed(() => campaigns.value.some(isCampaignActive))
function campaignProgress(campaign) { return campaign.total ? Math.min(100, Math.round(100 * (campaign.channels?.processed || 0) / campaign.total)) : 0 }
function formatHistoryTime(date) { return `Обновлено в ${date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` }
function refreshVisibleHistory() { if (activeSection.value === 'history' && hasActiveCampaigns.value && !document.hidden) loadCampaigns({ background: true }) }
function handleHistoryVisibility() { if (!document.hidden) refreshVisibleHistory() }
watch([activeSection, hasActiveCampaigns], ([section, hasActive]) => {
  clearInterval(historyTimer)
  if (section === 'history' && hasActive) historyTimer = setInterval(refreshVisibleHistory, 3000)
})

async function loadRecoverySettings() {
  const { data } = await axios.get('/api/admin/recovery/settings')
  recoverySettings.value = { ...recoverySettings.value, ...(data.settings || {}) }
  recoveryLogs.value = data.logs || []
}

async function saveRecoverySettings() {
  recoverySaving.value = true
  recoveryMessage.value = ''
  try {
    const { data } = await axios.put('/api/admin/recovery/settings', recoverySettings.value)
    recoverySettings.value = { ...recoverySettings.value, ...data.settings }
    recoveryMessageType.value = 'success'
    recoveryMessage.value = 'Интервалы автоматических напоминаний сохранены.'
  } catch (error) {
    recoveryMessageType.value = 'error'
    recoveryMessage.value = error.response?.data?.error || 'Не удалось сохранить настройки.'
  } finally {
    recoverySaving.value = false
  }
}

async function runRecoveryNow() {
  recoveryRunning.value = true
  recoveryMessage.value = ''
  try {
    const { data } = await axios.post('/api/admin/recovery/run')
    recoveryMessageType.value = 'success'
    recoveryMessage.value = `Проверка завершена: корзин — ${data.result?.carts || 0}, заказов — ${data.result?.orders || 0}.`
    await loadRecoverySettings()
  } catch (error) {
    recoveryMessageType.value = 'error'
    recoveryMessage.value = error.response?.data?.error || 'Не удалось запустить проверку.'
  } finally {
    recoveryRunning.value = false
  }
}

async function scheduleTestEmail() {
  testEmailScheduling.value = true
  recoveryMessage.value = ''
  try {
    const { data } = await axios.post('/api/admin/recovery/test-email', {
      email: testEmail.value,
      source: testEmailSource.value
    })
    const time = new Date(data.test.scheduledAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    recoveryMessageType.value = 'success'
    recoveryMessage.value = `Тест для ${data.test.recipient} сохранён в очереди на ${time}. Перезапуск основного backend не повлияет на отправку.`
    await loadRecoverySettings()
  } catch (error) {
    recoveryMessageType.value = 'error'
    recoveryMessage.value = error.response?.data?.error || 'Не удалось поставить тестовое письмо в очередь.'
  } finally {
    testEmailScheduling.value = false
  }
}

async function sendCampaign() {
  if (loading.value || previewLoading.value || uploadingImage.value) return
  message.value = ''
  loading.value = true

  try {
    if (previewCount.value === null) {
      const { data: preview } = await axios.post('/api/admin/email-campaigns/preview', form.value)
      applyCampaignPreview(preview)
    }
    if (previewCount.value === 0) {
      messageType.value = 'error'
      message.value = 'Для выбранной аудитории и каналов нет доступных получателей.'
      return
    }
    const { data } = await axios.post('/api/admin/email-campaigns', { ...form.value, expectedCount: previewCount.value, expectedAudienceHash: previewAudienceHash.value })
    campaigns.value = [data.campaign, ...campaigns.value]
    selectedProduct.value = null
    productQuery.value = ''
    uploadedImageUrl.value = ''
    uploadedPreviewUrl.value = ''
    applyTemplate(form.value.type, null)
    messageType.value = data.campaign.failed > 0 ? 'warning' : 'success'
    message.value = data.campaign.status === 'SENDING'
      ? `Рассылка запущена для ${data.campaign.total} получателей. Доставку по каналам смотрите в истории.`
      : `Рассылка завершена: отправлено ${data.campaign.sent} из ${data.campaign.total}.`
  } catch (error) {
    previewCount.value = null
    previewAudienceHash.value = ''
    previewHtml.value = ''
    messageType.value = 'error'
    message.value = error.response?.data?.error || 'Не удалось проверить получателей или отправить рассылку'
  } finally {
    loading.value = false
  }
}

function getAudienceLabel(audience) {
  const labels = {
    all: 'Все пользователи',
    clients: 'Клиенты',
    partners: 'Партнёры',
    blog: 'Подписчики блога',
    selected: 'Выбранные пользователи'
  }
  return labels[audience] || audience || 'Все пользователи'
}

function getStatusLabel(status) {
  const labels = {
    PENDING: 'Ожидает',
    SENDING: 'Отправляется',
    SENT: 'Отправлена',
    PARTIAL: 'Частично',
    FAILED: 'Ошибка'
  }
  return labels[status] || status
}

function getStatusClass(status) {
  if (status === 'SENT') return 'success'
  if (status === 'PARTIAL') return 'warning'
  if (status === 'FAILED') return 'danger'
  return 'neutral'
}

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getRecoveryTypeLabel(type) {
  const labels = {
    CART: 'Корзина',
    UNPAID_ORDER: 'Неоплаченный заказ',
    TEST_CART: 'Тест · корзина',
    TEST_UNPAID_ORDER: 'Тест · заказ'
  }
  return labels[type] || type
}

onMounted(() => { loadRecoverySettings(); document.addEventListener('visibilitychange', handleHistoryVisibility) })
onBeforeUnmount(() => { clearTimeout(productTimer); productRequest++; clearTimeout(pickerTimer); pickerRequest++; clearInterval(historyTimer); document.removeEventListener('visibilitychange', handleHistoryVisibility) })
</script>

<style scoped>
.email-campaigns-page {
  padding: 2rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 2rem;
}

.page-header h1 {
  margin: 0 0 0.5rem;
  font-size: clamp(2rem, 4vw, 3rem);
}

.page-header p,
.card-heading p {
  color: var(--text-secondary);
  margin: 0;
}

.campaign-tabs { display: flex; gap: .5rem; flex-wrap: wrap; margin-bottom: 1.2rem; }
.campaign-tabs button { padding: .75rem 1.1rem; border: 1px solid var(--border); border-radius: 12px; background: var(--bg-card); color: var(--text-secondary); font: inherit; font-weight: 700; cursor: pointer; }
.campaign-tabs button.active { border-color: var(--accent); color: var(--accent); background: rgba(165, 184, 255, .1); }

.campaign-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1.5rem;
  align-items: start;
  margin-bottom: 1.5rem;
}

.campaign-layout > .campaign-card:first-child:not(.history-card) { max-width: 980px; }

.recovery-console {
  position: relative;
  overflow: hidden;
  margin-bottom: 1.5rem;
  padding: 1.5rem;
  border: 1px solid var(--border);
  border-radius: 28px;
  background: linear-gradient(135deg, rgba(165, 184, 255, 0.1), transparent 42%), var(--bg-card);
  box-shadow: var(--shadow);
}

.recovery-console::after {
  content: '';
  position: absolute;
  width: 240px;
  height: 240px;
  right: -120px;
  top: -140px;
  border: 1px solid rgba(165, 184, 255, 0.2);
  border-radius: 50%;
  pointer-events: none;
}

.recovery-console__heading,
.recovery-actions,
.rule-topline,
.activity-head,
.activity-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.recovery-console__heading { margin-bottom: 1.25rem; }
.recovery-console__heading h2 { margin: .3rem 0 .35rem; font-size: 1.55rem; }
.recovery-console__heading p { margin: 0; color: var(--text-secondary); }
.recovery-actions { flex: none; }

.recovery-grid {
  display: grid;
  grid-template-columns: minmax(220px, .8fr) minmax(220px, .8fr) minmax(300px, 1.2fr);
  gap: 1rem;
}

.recovery-rule,
.recovery-activity {
  min-height: 220px;
  padding: 1.15rem;
  border: 1px solid var(--border);
  border-radius: 22px;
  background: rgba(8, 10, 16, .2);
}

.recovery-rule--cart { border-top-color: #9fb3ff; }
.recovery-rule--payment { border-top-color: #6bd7b0; }
.rule-number { font-family: var(--font-mono); color: var(--text-secondary); font-size: .78rem; }
.recovery-rule h3 { margin: 1.1rem 0 .35rem; font-size: 1.1rem; }
.recovery-rule p { min-height: 42px; margin: 0 0 1rem; color: var(--text-secondary); font-size: .9rem; line-height: 1.45; }

.switch { display: inline-flex; cursor: pointer; }
.switch input { position: absolute; opacity: 0; pointer-events: none; }
.switch span { position: relative; width: 45px; height: 25px; border-radius: 99px; background: var(--border); transition: .2s ease; }
.switch span::after { content: ''; position: absolute; width: 19px; height: 19px; left: 3px; top: 3px; border-radius: 50%; background: white; transition: .2s ease; box-shadow: 0 2px 8px rgba(0,0,0,.25); }
.switch input:checked + span { background: var(--accent); }
.switch input:checked + span::after { transform: translateX(20px); }

.delay-control { display: grid; gap: .45rem; color: var(--text-secondary); font-size: .82rem; font-weight: 700; }
.delay-control div { display: flex; align-items: center; gap: .6rem; }
.delay-control input { width: 86px; padding: .72rem; border: 1px solid var(--border); border-radius: 13px; background: var(--bg-input); color: var(--text-primary); font: 800 1.15rem var(--font-mono); }
.delay-control b { color: var(--text-primary); }

.activity-head { margin-bottom: .8rem; color: var(--text-secondary); font-size: .85rem; }
.activity-head strong { font: 800 1.5rem var(--font-mono); color: var(--text-primary); }
.pulse-dot { display: inline-block; width: 8px; height: 8px; margin-right: 6px; border-radius: 50%; background: #6bd7b0; box-shadow: 0 0 0 5px rgba(107,215,176,.12); }
.activity-list { display: grid; gap: .55rem; }
.activity-row { padding-top: .55rem; border-top: 1px solid var(--border); }
.activity-row div { min-width: 0; display: grid; gap: .18rem; }
.activity-row strong, .activity-row small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.activity-row strong { font-size: .82rem; }
.activity-row small { color: var(--text-secondary); }
.activity-status { flex: none; font-size: .7rem; font-weight: 800; color: var(--accent); }
.activity-status.sent { color: #6bd7b0; }
.activity-status.failed { color: #ff7d7d; }
.activity-empty { display: grid; place-items: center; height: 150px; color: var(--text-secondary); border: 1px dashed var(--border); border-radius: 15px; }
.recovery-console > .notice { margin-top: 1rem; }

.test-email-bar {
  display: grid;
  grid-template-columns: minmax(260px, 1fr) minmax(210px, .65fr) minmax(220px, .7fr) auto;
  gap: .75rem;
  align-items: center;
  margin-top: 1rem;
  padding: .85rem;
  border: 1px dashed rgba(165, 184, 255, .36);
  border-radius: 18px;
  background: rgba(165, 184, 255, .045);
}

.test-email-copy { display: flex; align-items: center; gap: .75rem; min-width: 0; }
.test-email-copy div { display: grid; gap: .2rem; }
.test-email-copy strong { font-size: .88rem; }
.test-email-copy small { color: var(--text-secondary); line-height: 1.35; }
.test-email-icon { display: grid; place-items: center; width: 44px; height: 44px; flex: none; border-radius: 13px; background: var(--accent); color: #11131a; font: 900 .76rem var(--font-mono); }
.test-email-bar input,
.test-email-bar select { min-width: 0; padding: .78rem .85rem; border: 1px solid var(--border); border-radius: 13px; background: var(--bg-input); color: var(--text-primary); font: inherit; }
.test-email-bar .btn { white-space: nowrap; }

.campaign-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 28px;
  padding: 1.5rem;
  box-shadow: var(--shadow);
}

.card-heading {
  margin-bottom: 1.25rem;
}

.card-heading h2 {
  margin: 0.35rem 0 0.45rem;
  font-size: 1.35rem;
}

.card-kicker {
  color: var(--accent);
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 0.76rem;
  font-weight: 800;
}

.campaign-form {
  display: grid;
  gap: 1rem;
}

.template-picker { display: grid; grid-template-columns: repeat(auto-fit, minmax(132px, 1fr)); gap: .55rem; }
.template-option { display: grid; gap: .25rem; min-height: 78px; padding: .8rem; text-align: left; color: var(--text-primary); background: var(--bg-input); border: 1px solid var(--border); border-radius: 15px; cursor: pointer; transition: border-color .15s, background .15s; }
.template-option:hover, .template-option.selected { border-color: var(--accent); background: rgba(165, 184, 255, .12); }
.template-option span { font-weight: 800; }
.template-option small { color: var(--text-secondary); line-height: 1.25; }
.campaign-fields-two { display: grid; grid-template-columns: 1fr 1.35fr; gap: .75rem; }
.campaign-form label small { color: var(--text-secondary); font-weight: 400; line-height: 1.4; }
.selected-audience { display: grid; gap: .75rem; padding: 1rem; border: 1px solid var(--border); border-radius: 16px; background: rgba(165, 184, 255, .05); }
.selected-audience > div:first-child { display: grid; gap: .3rem; }
.selected-audience small { color: var(--text-secondary); font-size: .84rem; line-height: 1.4; }
.selected-audience > .btn { justify-self: start; }
.selected-audience__chips, .recipient-picker__selected { display: flex; gap: .4rem; flex-wrap: wrap; }
.selected-audience__chips button, .recipient-picker__selected button { max-width: 220px; padding: .35rem .65rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; border: 1px solid var(--accent); border-radius: 999px; background: rgba(165, 184, 255, .12); color: var(--text-primary); cursor: pointer; }
.selected-audience__chips span, .recipient-picker__selected span { color: var(--accent); font-weight: 800; }
.campaign-excluded { padding: .9rem 1rem; border: 1px solid rgba(245, 158, 110, .4); border-radius: 14px; background: rgba(245, 158, 110, .07); }
.campaign-excluded > strong { color: var(--text-primary); }
.campaign-excluded ul { display: grid; gap: .55rem; margin: .7rem 0 0; padding: 0; list-style: none; }
.campaign-excluded li { display: flex; justify-content: space-between; gap: .5rem 1rem; color: var(--text-secondary); font-size: .88rem; }
.campaign-excluded li span:first-child { color: var(--text-primary); }
.campaign-excluded li small { color: var(--text-secondary); }
.campaign-channels { display: grid; gap: .6rem; padding: 1rem; border: 1px solid var(--border); border-radius: 16px; }
.campaign-channels > strong { color: var(--text-primary); }
.campaign-form .campaign-channels label { display: flex; align-items: flex-start; gap: .7rem; padding: .65rem; border: 1px solid var(--border); border-radius: 12px; cursor: pointer; }
.campaign-channels input { margin-top: .25rem; width: 18px; height: 18px; flex: none; accent-color: var(--accent); }
.campaign-channels label span { display: grid; gap: .15rem; }
.campaign-channels label small { color: var(--text-secondary); font-size: .82rem; font-weight: 400; }
.campaign-image-field { display: grid; gap: .75rem; padding: 1rem; border: 1px solid var(--border); border-radius: 16px; }
.campaign-image-field > div:first-child { display: grid; gap: .25rem; }
.campaign-image-field strong { color: var(--text-primary); }
.campaign-image-field small { color: var(--text-secondary); font-size: .84rem; }
.campaign-image-actions { display: flex; gap: .6rem; flex-wrap: wrap; }
.campaign-form .campaign-image-actions label { display: inline-flex; align-items: center; justify-content: center; color: var(--text-primary); cursor: pointer; }
.campaign-image-file { position: absolute; width: 1px; height: 1px; opacity: 0; overflow: hidden; }
.campaign-image-file:focus-visible + label { outline: 2px solid var(--accent); outline-offset: 3px; }
.campaign-image-preview { display: block; max-width: min(100%, 420px); max-height: 280px; object-fit: contain; border: 1px solid var(--border); border-radius: 14px; background: var(--bg-input); }
.recipient-picker-backdrop { position: fixed; inset: 0; z-index: 1000; display: grid; place-items: center; padding: 1rem; background: rgba(3, 5, 16, .8); backdrop-filter: blur(8px); }
.recipient-picker { width: min(680px, 100%); max-height: min(760px, calc(100dvh - 2rem)); display: flex; flex-direction: column; overflow: hidden; border: 1px solid var(--border); border-radius: 22px; background: var(--bg-card); box-shadow: 0 28px 80px rgba(0, 0, 0, .45); }
.recipient-picker__head, .recipient-picker__search, .recipient-picker__bottom { padding: 1rem 1.5rem; }
.recipient-picker__head, .recipient-picker__search, .recipient-picker__bottom, .recipient-picker__user { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
.recipient-picker__head h3 { margin: 0 0 .3rem; font-size: 1.35rem; }
.recipient-picker__head p { margin: 0; color: var(--text-secondary); font-size: .85rem; line-height: 1.45; }
.recipient-picker__head > button { align-self: flex-start; flex: none; width: 38px; height: 38px; border: 1px solid var(--border); border-radius: 10px; background: var(--bg-input); color: var(--text-primary); font-size: 1.5rem; cursor: pointer; }
.recipient-picker__search { padding-top: 0; }
.recipient-picker__search input { flex: 1; min-width: 0; }
.recipient-picker__search strong { flex: none; color: var(--accent); font-size: .85rem; }
.recipient-picker__selected { flex-wrap: nowrap; overflow-x: auto; padding: 0 1.5rem .8rem; }
.recipient-picker__selected button { flex: none; }
.recipient-picker__list { min-height: 180px; overflow: auto; padding: .2rem 1.5rem; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
.recipient-picker__list > p { padding: 1.4rem 0; text-align: center; color: var(--text-secondary); }
.recipient-picker__list .recipient-picker__error { color: #ff8e8e; }
.recipient-picker__user { justify-content: flex-start; padding: .75rem .35rem; border-bottom: 1px solid var(--border); cursor: pointer; }
.recipient-picker__user:last-child { border-bottom: 0; }
.recipient-picker__user:hover { background: rgba(165, 184, 255, .06); }
.recipient-picker__user input { width: 18px; height: 18px; flex: none; accent-color: var(--accent); }
.recipient-picker__user > span { display: grid; gap: .15rem; min-width: 0; flex: 1; }
.recipient-picker__user strong, .recipient-picker__user small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.recipient-picker__user small { color: var(--text-secondary); font-size: .77rem; }
@media (max-width: 600px) { .campaign-excluded li { flex-direction: column; } }
.recipient-picker__bottom { flex-wrap: wrap; }
.recipient-picker__bottom > div { display: flex; align-items: center; gap: .5rem; }
.recipient-picker__bottom span { color: var(--text-secondary); font-size: .8rem; white-space: nowrap; }
.product-search { position: relative; display: grid; gap: .5rem; }
.product-search-state, .selected-product { margin: 0; color: var(--text-secondary); font-size: .85rem; }
.product-results { display: grid; max-height: 210px; overflow: auto; background: var(--bg-card); border: 1px solid var(--border); border-radius: 14px; }
.product-results button { display: flex; align-items: center; justify-content: space-between; gap: .75rem; padding: .8rem 1rem; border: 0; border-bottom: 1px solid var(--border); color: var(--text-primary); background: transparent; text-align: left; cursor: pointer; }
.product-results button:hover { background: rgba(165, 184, 255, .12); }
.product-results small { white-space: nowrap; color: var(--text-secondary); }
.campaign-review { display: flex; align-items: center; flex-wrap: wrap; gap: .8rem; }
.campaign-review span { color: var(--text-secondary); font-size: .86rem; }
.mail-preview { display: grid; gap: .7rem; padding: .75rem; border: 1px solid var(--border); border-radius: 16px; }
.mail-preview > div { display: flex; align-items: baseline; justify-content: space-between; gap: 1rem; }
.mail-preview small { color: var(--text-secondary); }
.mail-preview iframe { width: 100%; height: 520px; border: 0; border-radius: 10px; background: white; }

.campaign-form label {
  display: grid;
  gap: 0.45rem;
  color: var(--text-secondary);
  font-weight: 700;
}

.input {
  width: 100%;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: var(--bg-input);
  color: var(--text-primary);
  padding: 0.95rem 1rem;
  font: inherit;
}

.textarea {
  resize: vertical;
  min-height: 220px;
  line-height: 1.5;
}

.send-btn {
  min-height: 54px;
}

.spinner {
  display: inline-block;
  width: 18px;
  height: 18px;
  border: 2px solid transparent;
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.notice {
  padding: 0.85rem 1rem;
  border-radius: 16px;
  font-weight: 700;
}

.notice.success {
  background: rgba(54, 211, 153, 0.12);
  color: #45d889;
}

.notice.warning {
  background: rgba(255, 193, 7, 0.14);
  color: #ffd166;
}

.notice.error {
  background: rgba(255, 99, 99, 0.14);
  color: #ff6b6b;
}

.campaign-list {
  display: grid;
  gap: 1rem;
  max-height: 660px;
  overflow: auto;
  padding-right: 0.25rem;
}

.campaign-item {
  background: rgba(255, 255, 255, 0.035);
  border: 1px solid var(--border);
  border-radius: 22px;
  padding: 1rem;
}

.campaign-item__top {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
}

.campaign-item h3 {
  margin: 0 0 0.35rem;
  font-size: 1.05rem;
}

.campaign-item p {
  margin: 0;
  color: var(--text-secondary);
}

.history-live { display: flex; align-items: center; flex-wrap: wrap; gap: .45rem; margin: -.25rem 0 1rem; color: var(--text-secondary); font-size: .82rem; }
.history-live__dot { width: 8px; height: 8px; flex: none; border-radius: 50%; background: #45d889; box-shadow: 0 0 0 4px rgba(69, 216, 137, .12); }
.history-live__dot--loading { background: var(--accent); animation: history-pulse 1.2s ease-in-out infinite; }
.history-live__dot--idle { background: var(--text-secondary); box-shadow: none; }
.history-live small { font-size: inherit; }
.history-live button { margin-left: .3rem; padding: 0; border: 0; background: none; color: var(--accent); text-decoration: underline; cursor: pointer; }
.history-live button:disabled { opacity: .5; cursor: default; }
.history-skeleton { display: grid; gap: .7rem; }
.history-skeleton div { height: 114px; border: 1px solid var(--border); border-radius: 18px; background: linear-gradient(100deg, rgba(165, 184, 255, .045) 25%, rgba(165, 184, 255, .12) 50%, rgba(165, 184, 255, .045) 75%); background-size: 200% 100%; animation: history-shimmer 1.6s ease-in-out infinite; }
.history-skeleton div:nth-child(2) { opacity: .7; animation-delay: .15s; }
.history-skeleton div:nth-child(3) { opacity: .4; animation-delay: .3s; }

.status-pill {
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: .45rem;
  padding: 0.4rem 0.75rem;
  border-radius: 999px;
  font-weight: 800;
  font-size: 0.78rem;
}

.status-pill.success {
  background: rgba(54, 211, 153, 0.14);
  color: #45d889;
}

.status-pill.warning {
  background: rgba(255, 193, 7, 0.14);
  color: #ffd166;
}

.status-pill.danger {
  background: rgba(255, 99, 99, 0.14);
  color: #ff6b6b;
}

.status-pill.neutral {
  background: rgba(165, 184, 255, 0.14);
  color: var(--accent);
}

.status-pill--active { border: 1px solid rgba(165, 184, 255, .25); }
.status-pill__spinner { width: 13px; height: 13px; border: 2px solid currentColor; border-right-color: transparent; border-radius: 50%; animation: spin .8s linear infinite; }
.campaign-progress { margin-top: 1rem; }
.campaign-progress__label { display: flex; justify-content: space-between; gap: .8rem; margin-bottom: .45rem; color: var(--text-secondary); font-size: .82rem; }
.campaign-progress__label strong { color: var(--accent); }
.campaign-progress__track { height: 7px; overflow: hidden; border-radius: 999px; background: rgba(165, 184, 255, .13); }
.campaign-progress__track > span { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, #7895ef, #a5b8ff); box-shadow: 0 0 12px rgba(165, 184, 255, .6); transition: width .45s ease; }
.campaign-progress__track::after { content: ''; display: block; width: 28%; height: 100%; margin-top: -7px; background: linear-gradient(90deg, transparent, rgba(255, 255, 255, .18), transparent); animation: history-scan 1.8s linear infinite; }

.campaign-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 0.7rem;
  margin-top: 1rem;
  color: var(--text-secondary);
}

.campaign-stats span {
  background: rgba(0, 0, 0, 0.16);
  border-radius: 999px;
  padding: 0.45rem 0.7rem;
}

.error-details {
  margin-top: 1rem;
  color: #ff8b8b;
}

.error-details pre {
  white-space: pre-wrap;
  background: rgba(255, 99, 99, 0.08);
  border-radius: 14px;
  padding: 0.8rem;
  overflow: auto;
}

.empty-state {
  color: var(--text-secondary);
  padding: 2rem;
  border: 1px dashed var(--border);
  border-radius: 20px;
  text-align: center;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
@keyframes history-pulse { 50% { opacity: .35; transform: scale(.75); } }
@keyframes history-shimmer { to { background-position-x: -200%; } }
@keyframes history-scan { from { transform: translateX(-100%); } to { transform: translateX(400%); } }
@media (prefers-reduced-motion: reduce) { .history-live__dot--loading, .history-skeleton div, .status-pill__spinner, .campaign-progress__track::after { animation: none; } .campaign-progress__track > span { transition: none; } }

@media (max-width: 980px) {
  .email-campaigns-page {
    padding: 1rem;
  }

  .campaign-layout {
    grid-template-columns: 1fr;
  }

  .recovery-console__heading { align-items: flex-start; flex-direction: column; }
  .recovery-grid { grid-template-columns: 1fr; }
  .recovery-actions { width: 100%; flex-wrap: wrap; }
  .test-email-bar { grid-template-columns: 1fr; }
  .campaign-fields-two { grid-template-columns: 1fr; }
  .mail-preview > div { display: grid; }
}

@media (max-width: 600px) {
  .recipient-picker__head, .recipient-picker__search, .recipient-picker__bottom { padding-left: 1rem; padding-right: 1rem; }
  .recipient-picker__list { padding-left: 1rem; padding-right: 1rem; }
  .recipient-picker__selected { padding-left: 1rem; padding-right: 1rem; }
  .recipient-picker__bottom { align-items: stretch; }
  .recipient-picker__bottom > div { justify-content: space-between; width: 100%; }
  .recipient-picker__bottom > div:last-child .btn { flex: 1; }
  .recipient-picker__user > small { max-width: 85px; }
}
</style>
