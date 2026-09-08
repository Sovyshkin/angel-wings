<template>
  <div class="email-campaigns-page">
    <div class="page-header">
      <div>
        <h1>Рассылки</h1>
        <p>Отправка писем клиентам и партнёрам через корпоративную почту Angel Wings</p>
      </div>
    </div>

    <section class="recovery-console">
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
              <div><strong>{{ item.type === 'CART' ? 'Корзина' : 'Неоплаченный заказ' }}</strong><small>{{ item.recipient }}</small></div>
              <span :class="['activity-status', item.status.toLowerCase()]">{{ item.status === 'SENT' ? 'Отправлено' : item.status === 'FAILED' ? 'Ошибка' : 'В работе' }}</span>
            </div>
          </div>
        </article>
      </div>
      <div v-if="recoveryMessage" :class="['notice', recoveryMessageType]">{{ recoveryMessage }}</div>
    </section>

    <div class="campaign-layout">
      <section class="campaign-card">
        <div class="card-heading">
          <span class="card-kicker">Новое письмо</span>
          <h2>Создать рассылку</h2>
          <p>Можно использовать <code v-pre>{{name}}</code>, чтобы подставить имя получателя.</p>
        </div>

        <form class="campaign-form" @submit.prevent="sendCampaign">
          <label>
            <span>Аудитория</span>
            <select v-model="form.audience" class="input">
              <option value="all">Все подтверждённые пользователи</option>
              <option value="clients">Только клиенты</option>
              <option value="partners">Только партнёры</option>
            </select>
          </label>

          <label>
            <span>Тема письма</span>
            <input v-model="form.subject" class="input" type="text" placeholder="Например: Новые поступления Angel Wings" required>
          </label>

          <label>
            <span>Текст письма</span>
            <textarea
              v-model="form.body"
              class="input textarea"
              rows="9"
              placeholder="Здравствуйте, {{name}}!&#10;&#10;Расскажите здесь о новости, акции или важном уведомлении."
              required
            />
          </label>

          <div v-if="message" :class="['notice', messageType]">{{ message }}</div>

          <button class="btn btn-primary send-btn" type="submit" :disabled="loading">
            <span v-if="loading" class="spinner"></span>
            <span v-else>Отправить рассылку</span>
          </button>
        </form>
      </section>

      <section class="campaign-card history-card">
        <div class="card-heading">
          <span class="card-kicker">История</span>
          <h2>Последние рассылки</h2>
          <p>Здесь видно, сколько писем отправлено и были ли ошибки.</p>
        </div>

        <div v-if="historyLoading" class="empty-state">Загружаем историю...</div>
        <div v-else-if="!campaigns.length" class="empty-state">Рассылок пока нет</div>

        <div v-else class="campaign-list">
          <article v-for="campaign in campaigns" :key="campaign.id" class="campaign-item">
            <div class="campaign-item__top">
              <div>
                <h3>{{ campaign.subject }}</h3>
                <p>{{ getAudienceLabel(campaign.audience) }} · {{ formatDate(campaign.createdAt) }}</p>
              </div>
              <span :class="['status-pill', getStatusClass(campaign.status)]">
                {{ getStatusLabel(campaign.status) }}
              </span>
            </div>

            <div class="campaign-stats">
              <span>Всего: <strong>{{ campaign.total }}</strong></span>
              <span>Отправлено: <strong>{{ campaign.sent }}</strong></span>
              <span>Ошибок: <strong>{{ campaign.failed }}</strong></span>
            </div>

            <details v-if="campaign.errorLog" class="error-details">
              <summary>Показать ошибки</summary>
              <pre>{{ campaign.errorLog }}</pre>
            </details>
          </article>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import axios from 'axios'

const campaigns = ref([])
const loading = ref(false)
const historyLoading = ref(false)
const message = ref('')
const messageType = ref('success')
const recoverySaving = ref(false)
const recoveryRunning = ref(false)
const recoveryMessage = ref('')
const recoveryMessageType = ref('success')
const recoveryLogs = ref([])
const recoverySettings = ref({
  cartEnabled: true,
  cartDelayHours: 24,
  unpaidOrderEnabled: true,
  unpaidOrderDelayHours: 3
})

const form = ref({
  audience: 'all',
  subject: '',
  body: ''
})

async function loadCampaigns() {
  historyLoading.value = true
  try {
    const { data } = await axios.get('/api/admin/email-campaigns?limit=100')
    campaigns.value = data.campaigns || []
  } finally {
    historyLoading.value = false
  }
}

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

async function sendCampaign() {
  message.value = ''
  loading.value = true

  try {
    const { data } = await axios.post('/api/admin/email-campaigns', form.value)
    campaigns.value = [data.campaign, ...campaigns.value]
    form.value.subject = ''
    form.value.body = ''
    messageType.value = data.campaign.failed > 0 ? 'warning' : 'success'
    message.value = `Рассылка завершена: отправлено ${data.campaign.sent} из ${data.campaign.total}.`
  } catch (error) {
    messageType.value = 'error'
    message.value = error.response?.data?.error || 'Не удалось отправить рассылку'
  } finally {
    loading.value = false
  }
}

function getAudienceLabel(audience) {
  const labels = {
    all: 'Все пользователи',
    clients: 'Клиенты',
    partners: 'Партнёры'
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

onMounted(() => Promise.all([loadCampaigns(), loadRecoverySettings()]))
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

.campaign-layout {
  display: grid;
  grid-template-columns: minmax(0, 0.95fr) minmax(360px, 1.05fr);
  gap: 1.5rem;
  align-items: start;
}

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

.status-pill {
  flex: none;
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
}
</style>
