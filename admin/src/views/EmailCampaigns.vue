<template>
  <div class="email-campaigns-page">
    <div class="page-header">
      <div>
        <h1>Рассылки</h1>
        <p>Отправка писем клиентам и партнёрам через корпоративную почту Angel Wings</p>
      </div>
    </div>

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

onMounted(loadCampaigns)
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
}
</style>
