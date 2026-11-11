<template>
  <section class="gift-console">
    <header class="gift-header">
      <div><span class="gift-kicker">Подарочные баллы · сайт · email · Telegram</span><h2>Акционная рассылка</h2><p>Подготовьте аудиторию, проверьте каждый канал и запустите доставку. Баллы начислятся только после нажатия «Получить».</p></div>
      <button class="btn btn-secondary" type="button" @click="newCampaign">Новая кампания</button>
    </header>

    <div class="gift-layout">
      <div class="gift-main">
        <div class="gift-steps"><span :class="{ active: !current || current.status === 'DRAFT' }">01 · Настройка</span><span :class="{ active: current?.status === 'PREPARED' }">02 · Подготовлена</span><span :class="{ active: ['SENDING','PAUSED','FINISHED'].includes(current?.status) }">03 · Доставка</span></div>
        <div v-if="message" :class="['gift-notice', messageType]" role="status">{{ message }}</div>

        <fieldset class="gift-panel" :disabled="busy || locked">
          <legend>Аудитория и подарок</legend>
          <div class="gift-grid">
            <label class="gift-wide">Название кампании<input v-model.trim="form.title" class="input" maxlength="120" placeholder="Например: подарок после первой покупки"></label>
            <label>Баллов каждому<input v-model.number="form.amount" class="input" type="number" min="1" max="100000"></label>
            <label>Баллы действуют после получения, дней<input v-model.number="form.validityDays" class="input" type="number" min="1" max="365"></label>
            <label>Период покупок, дней<input v-model.number="form.lookbackDays" class="input" type="number" min="1" max="365"></label>
            <label>Не менее оплаченных заказов<input v-model.number="form.minPaidOrders" class="input" type="number" min="0" max="100"></label>
            <label>Не более оплаченных заказов<input v-model.number="form.maxPaidOrders" class="input" type="number" min="0" max="100"></label>
            <div class="gift-wide gift-recipients"><label for="gift-target-ids">Только выбранные пользователи (необязательно)</label><div class="gift-recipient-control"><input id="gift-target-ids" v-model.trim="form.targetUserIds" class="input" placeholder="Например: 14, 474, 686" inputmode="numeric"><button class="btn btn-secondary" type="button" @click="openUserPicker">Выбрать из списка</button></div><small>Можно указать ID вручную или найти пользователей по имени, email, телефону и ID. Если список заполнен, остальные аккаунты не попадут в аудиторию.</small></div>
            <label class="gift-wide">Получить до (необязательно)<input v-model="form.claimUntil" class="input" type="datetime-local"><small>После этой даты кнопка получения перестанет начислять баллы.</small></label>
          </div>
          <div class="gift-checks"><span>Кому показать предложение</span><label><input v-model="form.roles" type="checkbox" value="USER"> Обычные пользователи</label><label><input v-model="form.roles" type="checkbox" value="PARTNER"> Партнёры</label><label><input v-model="form.excludeClaimedAnyCampaign" type="checkbox"> Исключить тех, кто уже получал баллы по другим акциям</label></div>
          <p class="gift-hint">Учитываются только оплаченные заказы за выбранный период. Отменённые и возвращённые исключены; заказы без userId сопоставляются по email.</p>
        </fieldset>

        <fieldset class="gift-panel" :disabled="busy || locked">
          <legend>Каналы</legend>
          <div class="gift-channels">
            <label><input v-model="form.siteEnabled" type="checkbox"><span><strong>Окно на сайте и в мини-приложении</strong><small>Показывается подходящим аккаунтам при входе до получения подарка.</small></span></label>
            <label><input v-model="form.emailEnabled" type="checkbox"><span><strong>Email с основного сервера</strong><small>Только подтверждённые реальные адреса. Один адрес — одно письмо.</small></span></label>
            <label><input v-model="form.telegramEnabled" type="checkbox"><span><strong>Telegram через немецкий relay</strong><small>Один Telegram ID — одно сообщение.</small></span></label>
          </div>
          <div class="gift-options"><label><input v-model="form.requireEmailConsent" type="checkbox"> Только с согласием на рассылку по email</label><label><input v-model="form.respectTelegramUnsubscribe" type="checkbox"> Учитывать отписку в Telegram</label></div>
          <p v-if="form.emailEnabled && !form.requireEmailConsent" class="gift-hint">Как в акции 4000 баллов, подтверждённые адреса без согласия тоже войдут в email-аудиторию.</p>
        </fieldset>

        <fieldset class="gift-panel" :disabled="busy || locked">
          <legend>Оформление и тексты</legend>
          <div class="gift-grid">
            <div class="gift-wide gift-image-control"><div><strong>Изображение</strong><small>PNG, JPEG или WebP до 5 МБ. Одно изображение для письма, Telegram и окна получения.</small></div><label class="btn btn-secondary">Загрузить<input type="file" accept="image/png,image/jpeg,image/webp" hidden @change="uploadImage"></label><button v-if="form.imageUrl" class="btn btn-secondary" type="button" @click="form.imageUrl = ''">Убрать</button></div>
            <img v-if="form.imageUrl" class="gift-image-preview" :src="imagePreviewUrl" alt="Изображение кампании">
            <label class="gift-wide">Заголовок окна<input v-model.trim="form.claimTitle" class="input" maxlength="200"></label>
            <label class="gift-wide">Текст окна<textarea v-model.trim="form.claimBody" class="input" rows="2" maxlength="4000"></textarea></label>
            <label class="gift-wide">Текст кнопки<input v-model.trim="form.buttonText" class="input" maxlength="80"></label>
            <label v-if="form.emailEnabled" class="gift-wide">Тема письма<input v-model.trim="form.emailSubject" class="input" maxlength="200"></label>
            <label v-if="form.emailEnabled" class="gift-wide">Текст письма<textarea v-model.trim="form.emailBody" class="input" rows="5" maxlength="4000"></textarea></label>
            <label v-if="form.telegramEnabled" class="gift-wide">Сообщение Telegram<textarea v-model.trim="form.telegramBody" class="input" rows="4" maxlength="900"></textarea></label>
          </div>
          <p class="gift-hint">Переменные: <code v-pre>{{name}}</code> — имя, <code v-pre>{{points}}</code> — сумма баллов, <code v-pre>{{claim_url}}</code> — ссылка на сайт. Кнопка и ссылка Telegram ведут к конкретной кампании.</p>
        </fieldset>

        <div class="gift-action-row"><button class="btn btn-secondary" type="button" :disabled="busy || locked" @click="saveDraft">{{ current ? 'Сохранить черновик' : 'Создать черновик' }}</button><button class="btn btn-secondary" type="button" :disabled="busy || locked" @click="previewAudience">Посчитать аудиторию</button></div>
        <div v-if="preview" class="gift-preview"><div class="gift-preview-head"><strong>Предварительный подсчёт</strong><small>{{ formatDate(preview.periodEnd) }}</small></div><div class="gift-metrics"><div><b>{{ preview.eligible }}</b><span>предложений</span></div><div><b>{{ preview.email }}</b><span>email</span></div><div><b>{{ preview.telegram }}</b><span>Telegram</span></div><div><b>{{ preview.site }}</b><span>окно</span></div></div><p>Не подошли по числу покупок: {{ preview.excludedPurchases }} · уже получили подарок: {{ preview.excludedPriorClaim }} · без выбранного канала: {{ preview.excludedNoChannel }} · только окно, без внешнего канала: {{ preview.noExternalChannel }} · максимум при получении всеми: {{ formatNumber(preview.pointsIfAllClaim) }} баллов.</p><button v-if="current?.status === 'DRAFT'" class="btn btn-primary" type="button" :disabled="busy || dirty" @click="prepare">Подготовить {{ preview.eligible }} предложений</button><small v-if="dirty">Сначала сохраните изменённые настройки.</small></div>

        <div v-if="current && current.status !== 'DRAFT'" class="gift-run"><div><strong>{{ statusLabel(current.status) }}</strong><p>Предложений: {{ counts.offers }} · Получено: {{ counts.claimed }}</p><p>Email: {{ formatStatuses(counts.email) }}<br>Telegram: {{ formatStatuses(counts.telegram) }}</p></div><div class="gift-run-actions"><button v-if="!current.readOnly && (['PREPARED','PAUSED'].includes(current.status) || (current.status === 'FINISHED' && pendingCount))" class="btn btn-primary" type="button" :disabled="busy" @click="action('start')">{{ current.status === 'PAUSED' ? 'Продолжить' : 'Запустить отправку' }}</button><button v-if="!current.readOnly && current.status === 'SENDING'" class="btn btn-secondary" type="button" :disabled="busy" @click="action('pause')">Пауза</button><button v-if="!current.readOnly && uncertainCount && current.status === 'PAUSED'" class="btn btn-secondary" type="button" :disabled="busy" @click="resolveStuck">Отметить неопределённые ({{ uncertainCount }})</button><button v-if="!current.readOnly && failedCount && current.status !== 'SENDING'" class="btn btn-secondary" type="button" :disabled="busy" @click="retryFailures">Повторить ошибки ({{ failedCount }})</button><button class="btn btn-secondary" type="button" :disabled="busy" @click="loadCurrent">Обновить статус</button></div><p class="gift-hint">{{ current.readOnly ? 'Историческая кампания доступна только для просмотра. Повторная отправка — через серверный скрипт.' : 'Отправка идёт в фоне. Статус SENDING после сбоя требует ручной проверки: сообщение могло уйти до записи результата.' }}</p></div>
        <details v-if="errors.length" class="gift-errors"><summary>Ошибки и неопределённые отправки · {{ errors.length }}</summary><div v-for="row in errors" :key="row.userId">#{{ row.userId }} · email {{ row.emailStatus }} {{ row.emailError || '' }} · Telegram {{ row.telegramStatus }} {{ row.telegramError || '' }}</div></details>
      </div>

      <aside class="gift-history"><div class="gift-sample"><span class="gift-kicker">Так увидит получатель</span><h3>{{ sample(form.claimTitle) }}</h3><p>{{ sample(form.claimBody) }}</p><strong class="gift-sample-button">{{ sample(form.buttonText) }}</strong><details><summary>Письмо и Telegram</summary><div v-if="form.emailEnabled"><b>{{ sample(form.emailSubject) }}</b><p>{{ sample(form.emailBody) }}</p></div><div v-if="form.telegramEnabled"><b>Telegram</b><p>{{ sample(form.telegramBody) }}</p></div></details></div><h3>Кампании</h3><p>Черновики можно менять. Подготовленная аудитория и сумма фиксируются.</p><div v-if="!campaigns.length" class="gift-empty">Кампаний пока нет</div><button v-for="campaign in campaigns" :key="campaign.id" type="button" :class="['gift-history-item', { selected: current?.id === campaign.id }]" @click="selectCampaign(campaign)"><span><strong>{{ campaign.settings.title }}</strong><small>{{ formatDate(campaign.createdAt) }} · {{ formatNumber(campaign.settings.amount) }} баллов</small></span><em>{{ statusLabel(campaign.status) }}</em><span class="gift-history-count">{{ campaign.counts?.offers || 0 }} предложений · {{ campaign.counts?.claimed || 0 }} получено</span></button></aside>
    </div>
  </section>
  <div v-if="pickerOpen" class="gift-picker-backdrop" @click.self="closeUserPicker">
    <div class="gift-picker" role="dialog" aria-modal="true" aria-labelledby="gift-picker-title" @keydown.esc="closeUserPicker">
      <div class="gift-picker-head"><div><span class="gift-kicker">Адресная рассылка</span><h3 id="gift-picker-title">Выбрать пользователей</h3><p>Поиск по имени, email, телефону и ID. Роли, покупки и доступные каналы проверяются при подсчёте аудитории.</p></div><button class="gift-picker-close" type="button" aria-label="Закрыть" @click="closeUserPicker">×</button></div>
      <div class="gift-picker-search"><input v-model="pickerQuery" class="input" type="search" placeholder="Поиск пользователей" aria-label="Поиск пользователей" autofocus><span>{{ pickerSelected.length }} выбрано</span></div>
      <div v-if="pickerSelected.length" class="gift-picker-selected"><button v-for="id in pickerSelected" :key="id" type="button" :title="`Убрать пользователя #${id}`" @click="togglePickerUser(id)">{{ pickerKnown[id]?.name || pickerKnown[id]?.email || `#${id}` }} <span>×</span></button></div>
      <div class="gift-picker-list" aria-live="polite">
        <p v-if="pickerLoading" class="gift-picker-state">Загрузка пользователей…</p>
        <p v-else-if="pickerError" class="gift-picker-state gift-picker-error">{{ pickerError }}</p>
        <p v-else-if="!pickerUsers.length" class="gift-picker-state">Пользователи не найдены</p>
        <label v-for="user in pickerUsers" :key="user.id" class="gift-picker-user"><input type="checkbox" :checked="pickerSelected.includes(user.id)" @change="togglePickerUser(user.id)"><span class="gift-picker-person"><strong>{{ user.name || `Пользователь #${user.id}` }}</strong><small>{{ user.email || user.phone || 'Контакт не указан' }}<template v-if="user.email && user.phone"> · {{ user.phone }}</template></small></span><span class="gift-picker-meta">#{{ user.id }} · {{ user.role === 'PARTNER' ? 'Партнёр' : user.role === 'USER' ? 'Пользователь' : user.role }}</span></label>
      </div>
      <div class="gift-picker-bottom"><div class="gift-picker-pages"><button class="btn btn-secondary" type="button" :disabled="pickerLoading || pickerOffset === 0" @click="pickerOffset = Math.max(0, pickerOffset - pickerLimit)">Назад</button><span>{{ pickerTotal ? `${pickerOffset + 1}–${Math.min(pickerOffset + pickerLimit, pickerTotal)} из ${pickerTotal}` : '0 пользователей' }}</span><button class="btn btn-secondary" type="button" :disabled="pickerLoading || pickerOffset + pickerLimit >= pickerTotal" @click="pickerOffset += pickerLimit">Далее</button></div><div class="gift-picker-actions"><button class="btn btn-secondary" type="button" @click="closeUserPicker">Отмена</button><button class="btn btn-primary" type="button" @click="applyUserPicker">Применить выбор</button></div></div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import axios from 'axios'

const defaults = () => ({ title: 'Подарок Angel Wings', amount: 4000, lookbackDays: 45, minPaidOrders: 0, maxPaidOrders: 1, targetUserIds: '', excludeClaimedAnyCampaign: false, roles: ['USER', 'PARTNER'], emailEnabled: true, telegramEnabled: true, siteEnabled: true, requireEmailConsent: false, respectTelegramUnsubscribe: true, validityDays: 30, claimUntil: '', imageUrl: '', emailSubject: 'Вам доступны {{points}} баллов Angel Wings', emailBody: 'Здравствуйте, {{name}}!\n\nВам доступны {{points}} баллов. Войдите в аккаунт и нажмите «Получить».\n\n{{claim_url}}', telegramBody: '🎁 Вам доступны {{points}} баллов Angel Wings! Нажмите «Получить» в мини-приложении.', claimTitle: 'Ваши баллы ждут вас', claimBody: 'Нажмите «Получить», чтобы баллы появились на балансе.', buttonText: 'Получить {{points}} баллов' })
const form = ref(defaults())
const campaigns = ref([])
const current = ref(null)
const counts = ref({ offers: 0, claimed: 0, email: {}, telegram: {} })
const errors = ref([])
const preview = ref(null)
const saved = ref('')
const busy = ref(false)
const message = ref('')
const messageType = ref('success')
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
const locked = computed(() => current.value && current.value.status !== 'DRAFT')
const dirty = computed(() => current.value && saved.value !== JSON.stringify(form.value))
const failedCount = computed(() => (counts.value.email?.FAILED || 0) + (counts.value.telegram?.FAILED || 0))
const uncertainCount = computed(() => (counts.value.email?.SENDING || 0) + (counts.value.telegram?.SENDING || 0))
const pendingCount = computed(() => (counts.value.email?.PENDING || 0) + (counts.value.telegram?.PENDING || 0))
const imagePreviewUrl = computed(() => `${import.meta.env.DEV ? 'http://localhost:3000' : 'https://angel-wings.ru'}${form.value.imageUrl}`)
let timer
const say = (text, type = 'success') => { message.value = text; messageType.value = type }
const fail = error => say(error.response?.data?.error || error.message || 'Не удалось выполнить действие', 'error')
const formatNumber = value => Number(value || 0).toLocaleString('ru-RU')
const formatDate = value => value ? new Date(value).toLocaleString('ru-RU') : '—'
const statusLabel = value => ({ DRAFT: 'Черновик', PREPARED: 'Подготовлена', SENDING: 'Отправляется', PAUSED: 'Пауза', FINISHED: 'Завершена', LEGACY: 'Историческая' })[value] || value
const formatStatuses = statuses => Object.entries(statuses || {}).map(([key, value]) => `${({ PENDING: 'ожидает', SENDING: 'в работе', SENT: 'отправлено', SKIPPED: 'пропущено', FAILED: 'ошибки' })[key] || key}: ${value}`).join(' · ') || '—'
const sample = value => String(value || '').replace(/\{\{\s*(name|points|claim_url)\s*\}\}/gi, (_, key) => ({ name: 'Анна', points: formatNumber(form.value.amount), claim_url: 'https://angel-wings.ru/?claim=…' })[key.toLowerCase()])
const payload = () => ({ ...form.value, claimUntil: form.value.claimUntil ? new Date(form.value.claimUntil).toISOString() : '' })
const fromSettings = settings => ({ ...settings, claimUntil: settings.claimUntil ? new Date(new Date(settings.claimUntil).getTime() - new Date(settings.claimUntil).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '' })

watch(form, () => { preview.value = null }, { deep: true })
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
  const raw = form.value.targetUserIds.trim()
  if (raw && (!/^[\d,\s]+$/.test(raw) || raw.length > 3000)) {
    say('Сначала исправьте список ID: нужны положительные числа через запятую, не более 3000 символов.', 'error')
    return
  }
  const ids = raw ? raw.split(/[\s,]+/).filter(Boolean).map(Number) : []
  if (ids.some(id => !Number.isSafeInteger(id) || id < 1)) {
    say('Сначала исправьте список ID: нужны положительные числа через запятую.', 'error')
    return
  }
  pickerSelected.value = [...new Set(ids)]
  pickerQuery.value = ''
  pickerOffset.value = 0
  pickerOpen.value = true
  schedulePickerLoad(0)
  await nextTick()
  document.querySelector('.gift-picker-search input')?.focus()
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
  const ids = pickerSelected.value.join(', ')
  if (ids.length > 3000) {
    pickerError.value = 'Слишком много пользователей: список ID должен быть короче 3000 символов.'
    return
  }
  form.value.targetUserIds = ids
  closeUserPicker()
  say(ids ? `Выбрано ${pickerSelected.value.length} пользователей. Сохраните черновик и пересчитайте аудиторию.` : 'Выбор очищен. Кампания снова охватит всех подходящих пользователей.')
}

async function loadList() {
  const { data } = await axios.get('/api/admin/points-campaigns')
  campaigns.value = data.campaigns || []
}
async function loadCurrent() {
  if (!current.value) return
  try {
    const { data } = await axios.get(`/api/admin/points-campaigns/${current.value.id}`)
    current.value = data.campaign
    counts.value = data.counts
    errors.value = data.errors || []
    await loadList()
  } catch (error) { fail(error) }
}
function selectCampaign(campaign) {
  current.value = campaign
  form.value = fromSettings(campaign.settings)
  saved.value = JSON.stringify(form.value)
  counts.value = campaign.counts || { offers: 0, claimed: 0, email: {}, telegram: {} }
  errors.value = []
  preview.value = null
  message.value = ''
  loadCurrent()
}
function newCampaign() { current.value = null; form.value = defaults(); saved.value = ''; counts.value = { offers: 0, claimed: 0, email: {}, telegram: {} }; errors.value = []; preview.value = null; message.value = '' }
async function saveDraft() {
  busy.value = true
  try {
    const { data } = current.value ? await axios.put(`/api/admin/points-campaigns/${current.value.id}`, payload()) : await axios.post('/api/admin/points-campaigns', payload())
    current.value = data.campaign
    form.value = fromSettings(data.campaign.settings)
    saved.value = JSON.stringify(form.value)
    await loadList()
    say('Черновик сохранён. Теперь проверьте аудиторию и подготовьте предложения.')
  } catch (error) { fail(error) } finally { busy.value = false }
}
async function previewAudience() {
  busy.value = true
  try { const { data } = await axios.post('/api/admin/points-campaigns/preview', payload()); preview.value = data.counts; say(`Подходят ${data.counts.eligible} аккаунтов. Проверка ничего не отправила.`) }
  catch (error) { fail(error) } finally { busy.value = false }
}
async function uploadImage(event) {
  const file = event.target.files?.[0]
  if (!file) return
  if (form.value.telegramEnabled && file.type === 'image/webp') { say('Для Telegram выберите PNG или JPEG.', 'error'); event.target.value = ''; return }
  busy.value = true
  try { const body = new FormData(); body.append('image', file); const { data } = await axios.post('/api/admin/points-campaigns/image', body); form.value.imageUrl = data.imageUrl; say('Изображение загружено на основной сервер.') }
  catch (error) { fail(error) } finally { busy.value = false; event.target.value = '' }
}
async function prepare() {
  if (!current.value || !preview.value || dirty.value) return
  busy.value = true
  try { await axios.post(`/api/admin/points-campaigns/${current.value.id}/prepare`, { expected: preview.value }); await loadCurrent(); say('Предложения созданы. Баллы пока не начислены, сообщения не отправлены.') }
  catch (error) { fail(error) } finally { busy.value = false }
}
async function action(name) {
  if (!current.value) return
  busy.value = true
  try { await axios.post(`/api/admin/points-campaigns/${current.value.id}/${name}`); await loadCurrent(); say(name === 'start' ? 'Отправка запущена в фоне.' : 'Рассылка поставлена на паузу.') }
  catch (error) { fail(error) } finally { busy.value = false }
}
async function retryFailures() {
  busy.value = true
  try { const { data } = await axios.post(`/api/admin/points-campaigns/${current.value.id}/retry`); await loadCurrent(); say(`Повторно поставлено в очередь: email ${data.reset.email}, Telegram ${data.reset.telegram}. Нажмите «Запустить отправку».`) }
  catch (error) { fail(error) } finally { busy.value = false }
}
async function resolveStuck() {
  if (!window.confirm('Проверьте фактическую доставку. Эти сообщения могли уже уйти. Пометить неопределённые отправки как ошибки?')) return
  busy.value = true
  try { const { data } = await axios.post(`/api/admin/points-campaigns/${current.value.id}/resolve-stuck`); await loadCurrent(); say(`Помечено для ручной проверки: email ${data.reset.email}, Telegram ${data.reset.telegram}. Повторная отправка может создать дубли.`, 'warning') }
  catch (error) { fail(error) } finally { busy.value = false }
}
onMounted(async () => { try { await loadList() } catch (error) { fail(error) }; timer = setInterval(() => { if (current.value?.status === 'SENDING' && !busy.value) loadCurrent() }, 10000) })
onBeforeUnmount(() => { clearInterval(timer); clearTimeout(pickerTimer); pickerRequest++ })
</script>

<style scoped>
.gift-console{margin-bottom:1.5rem;border:1px solid var(--border);border-radius:28px;background:var(--bg-card);box-shadow:var(--shadow);overflow:hidden}
.gift-header{display:flex;justify-content:space-between;align-items:start;gap:1.5rem;padding:1.6rem 1.8rem;border-bottom:1px solid var(--border);background:linear-gradient(115deg,rgba(165,184,255,.12),transparent 55%)}
.gift-header h2{font-size:1.65rem;margin:.3rem 0 .4rem}.gift-header p,.gift-history>p{color:var(--text-secondary);margin:0;line-height:1.5}.gift-kicker{color:var(--accent);font-size:.75rem;font-weight:800;letter-spacing:.11em;text-transform:uppercase}
.gift-layout{display:grid;grid-template-columns:minmax(0,1.65fr) minmax(270px,.8fr)}.gift-main{min-width:0;padding:1.5rem 1.8rem}.gift-history{min-width:0;padding:1.5rem;border-left:1px solid var(--border);background:rgba(165,184,255,.035)}.gift-history h3{margin:0 0 .3rem}.gift-history>p{font-size:.82rem;margin-bottom:1rem}
.gift-steps{display:flex;gap:.5rem;flex-wrap:wrap;margin-bottom:1.25rem}.gift-steps span{padding:.45rem .7rem;border:1px solid var(--border);border-radius:999px;color:var(--text-secondary);font-size:.75rem;font-weight:800}.gift-steps .active{color:var(--accent);border-color:var(--accent)}
.gift-panel{min-width:0;margin:0 0 1rem;padding:1.2rem;border:1px solid var(--border);border-radius:18px}.gift-panel legend{padding:0 .4rem;color:var(--text-primary);font-size:1.05rem;font-weight:800}.gift-panel:disabled{opacity:.68}.gift-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.85rem}.gift-grid label{display:grid;gap:.35rem;min-width:0;color:var(--text-secondary);font-size:.84rem;font-weight:700}.gift-wide{grid-column:1/-1}.gift-grid small,.gift-image-control small{color:var(--text-secondary);font-size:.75rem;font-weight:400}.gift-grid .input{width:100%;min-width:0;min-height:43px;font:inherit;font-size:.95rem}.gift-grid textarea{resize:vertical;line-height:1.5}.gift-checks,.gift-options{display:flex;gap:.8rem 1.2rem;flex-wrap:wrap;margin-top:1rem;color:var(--text-secondary);font-size:.85rem}.gift-checks>span{font-weight:800}.gift-checks label,.gift-options label{display:flex;align-items:center;gap:.4rem}.gift-checks input,.gift-options input,.gift-channels input{accent-color:var(--accent);width:17px;height:17px;flex:none}.gift-hint{margin:.9rem 0 0;color:var(--text-secondary);font-size:.8rem;line-height:1.5}.gift-hint code{color:var(--accent)}
.gift-channels{display:grid;gap:.6rem}.gift-channels label{display:flex;align-items:flex-start;gap:.75rem;padding:.85rem;border:1px solid var(--border);border-radius:13px;cursor:pointer}.gift-channels span{display:grid;gap:.2rem}.gift-channels small{color:var(--text-secondary);line-height:1.4}.gift-image-control{display:flex;align-items:center;flex-wrap:wrap;gap:.65rem}.gift-image-control>div{display:grid;gap:.2rem;margin-right:auto}.gift-image-control .btn{cursor:pointer}.gift-image-preview{max-width:220px;max-height:150px;object-fit:contain;border:1px solid var(--border);border-radius:12px}.gift-action-row,.gift-run-actions{display:flex;gap:.65rem;flex-wrap:wrap}.gift-action-row{margin:1.2rem 0}.gift-action-row .btn,.gift-preview .btn,.gift-run-actions .btn{min-height:44px}.gift-notice{padding:.8rem 1rem;margin-bottom:1rem;border-radius:12px;background:rgba(107,215,176,.12);color:#6bd7b0}.gift-notice.error{background:rgba(255,99,99,.14);color:#ff8e8e}
.gift-preview,.gift-run{padding:1.1rem;border:1px solid var(--border);border-radius:16px;margin-top:1rem}.gift-preview-head{display:flex;justify-content:space-between;gap:1rem;flex-wrap:wrap}.gift-preview-head small,.gift-preview p,.gift-run p{color:var(--text-secondary)}.gift-metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:.5rem;margin:1rem 0}.gift-metrics div{display:grid;gap:.2rem;padding:.8rem;border-radius:12px;background:var(--bg-secondary)}.gift-metrics b{font-size:1.4rem;color:var(--accent)}.gift-metrics span{font-size:.75rem;color:var(--text-secondary)}.gift-preview p{line-height:1.5}.gift-preview>small{display:block;margin-top:.6rem;color:var(--text-secondary)}.gift-run{display:grid;gap:1rem}.gift-run p{margin:.5rem 0;line-height:1.5}.gift-errors{margin-top:1rem;color:var(--text-secondary);font-size:.8rem}.gift-errors div{padding:.5rem;border-bottom:1px solid var(--border);overflow-wrap:anywhere}
.gift-history-item{display:grid;gap:.5rem;width:100%;margin:.55rem 0;padding:.85rem;text-align:left;border:1px solid var(--border);border-radius:13px;background:var(--bg-secondary);color:var(--text-primary);cursor:pointer}.gift-history-item.selected{border-color:var(--accent)}.gift-history-item>span:first-child{display:grid;gap:.2rem;min-width:0}.gift-history-item strong{overflow-wrap:anywhere}.gift-history-item small,.gift-history-count{color:var(--text-secondary);font-size:.76rem}.gift-history-item em{font-size:.76rem;color:var(--accent);font-style:normal}.gift-empty{padding:1rem;color:var(--text-secondary);border:1px dashed var(--border);border-radius:12px}
.gift-sample{padding:1.2rem;margin-bottom:1.5rem;border:1px solid var(--border);border-radius:18px;background:radial-gradient(circle at top right,rgba(118,154,255,.2),transparent 55%),var(--bg-secondary)}.gift-sample h3{margin:.8rem 0 .5rem}.gift-sample p{color:var(--text-secondary);line-height:1.55;white-space:pre-wrap;overflow-wrap:anywhere}.gift-sample-button{display:block;margin:1rem 0;text-align:center;padding:.8rem;border-radius:12px;background:var(--accent);color:#111629}.gift-sample details{font-size:.82rem}.gift-sample summary{cursor:pointer;color:var(--accent)}.gift-sample details>div{padding:.75rem 0;border-top:1px solid var(--border);margin-top:.75rem}
.gift-notice.warning{background:rgba(255,193,7,.14);color:#ffd166}
.gift-recipients{display:grid;gap:.35rem;min-width:0;color:var(--text-secondary);font-size:.84rem;font-weight:700}.gift-recipients small{font-weight:400;line-height:1.45}.gift-recipient-control{display:flex;gap:.6rem}.gift-recipient-control .input{flex:1}.gift-recipient-control .btn{flex:none;min-height:43px}
.gift-picker-backdrop{position:fixed;inset:0;z-index:1000;display:grid;place-items:center;padding:1rem;background:rgba(3,5,16,.8);backdrop-filter:blur(8px)}.gift-picker{width:min(680px,100%);max-height:min(760px,calc(100vh - 2rem));display:flex;flex-direction:column;overflow:hidden;border:1px solid var(--border);border-radius:22px;background:var(--bg-card);box-shadow:0 28px 80px rgba(0,0,0,.45)}.gift-picker-head{display:flex;justify-content:space-between;gap:1rem;padding:1.4rem 1.5rem 1rem}.gift-picker-head h3{font-size:1.4rem;margin:.25rem 0}.gift-picker-head p{margin:0;color:var(--text-secondary);font-size:.85rem;line-height:1.45}.gift-picker-close{align-self:start;width:36px;height:36px;border:1px solid var(--border);border-radius:10px;background:var(--bg-secondary);color:var(--text-primary);font-size:1.5rem;cursor:pointer}.gift-picker-search{display:flex;align-items:center;gap:.8rem;padding:0 1.5rem 1rem}.gift-picker-search .input{flex:1;min-width:0;min-height:44px}.gift-picker-search span{flex:none;color:var(--accent);font-size:.8rem;font-weight:800}.gift-picker-selected{display:flex;gap:.4rem;overflow-x:auto;padding:0 1.5rem .8rem}.gift-picker-selected button{flex:none;max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:.35rem .6rem;border:1px solid var(--accent);border-radius:999px;background:rgba(165,184,255,.12);color:var(--text-primary);cursor:pointer}.gift-picker-selected span{color:var(--accent);font-weight:800}
.gift-picker-list{min-height:190px;overflow:auto;padding:.2rem 1.5rem;border-top:1px solid var(--border);border-bottom:1px solid var(--border)}.gift-picker-user{display:flex;align-items:center;gap:.8rem;padding:.75rem .35rem;border-bottom:1px solid var(--border);cursor:pointer}.gift-picker-user:last-child{border-bottom:0}.gift-picker-user:hover{background:rgba(165,184,255,.06)}.gift-picker-user input{width:18px;height:18px;flex:none;accent-color:var(--accent)}.gift-picker-person{display:grid;gap:.2rem;min-width:0;flex:1}.gift-picker-person strong,.gift-picker-person small{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.gift-picker-person small,.gift-picker-meta{color:var(--text-secondary);font-size:.77rem}.gift-picker-meta{flex:none}.gift-picker-state{padding:1.5rem 0;text-align:center;color:var(--text-secondary)}.gift-picker-error{color:#ff8e8e}.gift-picker-bottom{display:flex;justify-content:space-between;align-items:center;gap:1rem;flex-wrap:wrap;padding:1rem 1.5rem}.gift-picker-pages,.gift-picker-actions{display:flex;align-items:center;gap:.5rem}.gift-picker-pages span{min-width:105px;text-align:center;color:var(--text-secondary);font-size:.78rem}.gift-picker-bottom .btn{min-height:39px}
@media(max-width:1100px){.gift-layout{grid-template-columns:1fr}.gift-history{border-left:0;border-top:1px solid var(--border)}}
@media(max-width:600px){.gift-header{padding:1.15rem;flex-direction:column}.gift-main,.gift-history{padding:1rem}.gift-panel{padding:.9rem}.gift-grid{grid-template-columns:1fr}.gift-wide{grid-column:auto}.gift-metrics{grid-template-columns:repeat(2,1fr)}.gift-action-row .btn{width:100%}.gift-header .btn{width:100%}.gift-recipient-control{flex-direction:column}.gift-picker-head,.gift-picker-search,.gift-picker-bottom{padding-left:1rem;padding-right:1rem}.gift-picker-list{padding-left:1rem;padding-right:1rem}.gift-picker-selected{padding-left:1rem;padding-right:1rem}.gift-picker-bottom{align-items:stretch}.gift-picker-pages,.gift-picker-actions{justify-content:space-between}.gift-picker-actions .btn{flex:1}.gift-picker-meta{font-size:.69rem}}
</style>
