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
            <label class="gift-wide">Только ID пользователей (необязательно)<input v-model.trim="form.targetUserIds" class="input" placeholder="Например: 14, 474, 686"><small>Если заполнено, остальные аккаунты не попадут в аудиторию.</small></label>
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
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
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
onBeforeUnmount(() => clearInterval(timer))
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
@media(max-width:1100px){.gift-layout{grid-template-columns:1fr}.gift-history{border-left:0;border-top:1px solid var(--border)}}
@media(max-width:600px){.gift-header{padding:1.15rem;flex-direction:column}.gift-main,.gift-history{padding:1rem}.gift-panel{padding:.9rem}.gift-grid{grid-template-columns:1fr}.gift-wide{grid-column:auto}.gift-metrics{grid-template-columns:repeat(2,1fr)}.gift-action-row .btn{width:100%}.gift-header .btn{width:100%}}
</style>
