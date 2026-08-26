<template>
  <div class="partner-applications-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Заявки партнёров</h1>
        <p class="page-subtitle">Проверка кандидатов и назначение партнёрского доступа</p>
      </div>
      <div class="status-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          type="button"
          :class="{ active: status === tab.value }"
          @click="setStatus(tab.value)"
        >
          {{ tab.label }}
          <span v-if="tab.value === 'PENDING' && pendingCount">{{ pendingCount }}</span>
        </button>
      </div>
    </div>

    <div class="logic-panel card">
      <div>
        <span class="logic-panel__eyebrow">Логика назначения</span>
        <h2>Что происходит при принятии заявки</h2>
      </div>
      <div class="logic-panel__steps">
        <div>Если email уже есть в системе, пользователь переводится в роль партнёра.</div>
        <div>Если email новый, создаётся партнёрский аккаунт и отправляется письмо с доступом.</div>
        <div>Партнёрский профиль активируется, появляется реферальный код, кабинет и выплаты.</div>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
    </div>

    <div v-else-if="!applications.length" class="empty-state card">
      <h3>Заявок нет</h3>
      <p>В выбранном статусе пока нет заявок на партнёрство.</p>
    </div>

    <div v-else class="applications-list">
      <article v-for="application in applications" :key="application.id" class="application-card card">
        <div class="application-card__head">
          <div>
            <div class="application-id">Заявка #{{ application.id }}</div>
            <h3>{{ application.name }}</h3>
            <p>{{ application.email }}</p>
          </div>
          <span class="application-status" :class="`application-status--${application.status.toLowerCase()}`">
            {{ getStatusLabel(application.status) }}
          </span>
        </div>

        <div class="application-meta">
          <div v-if="application.phone">
            <span>Телефон</span>
            <a :href="`tel:${application.phone}`">{{ application.phone }}</a>
          </div>
          <div v-if="application.telegram">
            <span>Telegram</span>
            <a :href="getTelegramUrl(application.telegram)" target="_blank" rel="noopener noreferrer">{{ application.telegram }}</a>
          </div>
          <div v-if="application.city">
            <span>Город</span>
            <strong>{{ application.city }}</strong>
          </div>
          <div>
            <span>Дата заявки</span>
            <strong>{{ formatDate(application.createdAt) }}</strong>
          </div>
        </div>

        <div class="application-details">
          <div v-if="application.audience">
            <span>Канал / аудитория</span>
            <p>{{ application.audience }}</p>
          </div>
          <div v-if="application.experience">
            <span>Опыт и формат</span>
            <p>{{ application.experience }}</p>
          </div>
          <div v-if="application.message">
            <span>Комментарий</span>
            <p>{{ application.message }}</p>
          </div>
        </div>

        <div v-if="application.user || application.partner || application.reviewedBy" class="application-result">
          <div v-if="application.user">
            Пользователь:
            <router-link :to="`/users/${application.user.id}`">{{ application.user.name || application.user.email }}</router-link>
            <small>{{ application.user.role }}</small>
          </div>
          <div v-if="application.partner">
            Партнёр:
            <router-link :to="`/partners/${application.partner.id}`">#{{ application.partner.id }}</router-link>
            <small>{{ application.partner.referralCode }}</small>
          </div>
          <div v-if="application.reviewedBy">
            Обработал:
            <strong>{{ application.reviewedBy.name || application.reviewedBy.email }}</strong>
            <small>{{ formatDate(application.reviewedAt) }}</small>
          </div>
        </div>

        <div v-if="application.adminNote" class="admin-note">
          <span>Комментарий администратора</span>
          <p>{{ application.adminNote }}</p>
        </div>

        <div v-if="application.status === 'PENDING'" class="application-actions">
          <textarea
            v-model="adminNotes[application.id]"
            rows="2"
            placeholder="Комментарий администратора: условия, причина отклонения или заметка"
          ></textarea>
          <div>
            <button
              type="button"
              class="btn btn-secondary"
              :disabled="processingId === application.id"
              @click="rejectApplication(application)"
            >
              Отклонить
            </button>
            <button
              type="button"
              class="btn btn-primary"
              :disabled="processingId === application.id"
              @click="approveApplication(application)"
            >
              {{ processingId === application.id ? 'Обработка...' : 'Принять и назначить партнёром' }}
            </button>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import axios from 'axios'

const tabs = [
  { label: 'На рассмотрении', value: 'PENDING' },
  { label: 'Принятые', value: 'APPROVED' },
  { label: 'Отклонённые', value: 'REJECTED' },
  { label: 'Все', value: 'ALL' }
]

const applications = ref([])
const loading = ref(true)
const status = ref('PENDING')
const pendingCount = ref(0)
const processingId = ref(null)
const adminNotes = reactive({})

async function fetchApplications() {
  loading.value = true
  try {
    const { data } = await axios.get('/api/admin/partner-applications', {
      params: { status: status.value, limit: 100 }
    })
    applications.value = data.applications || []
    pendingCount.value = data.pendingCount || 0
    window.dispatchEvent(new CustomEvent('partner-applications-count', {
      detail: { pendingCount: pendingCount.value }
    }))
  } catch (e) {
    alert(e.response?.data?.error || 'Не удалось загрузить заявки')
  } finally {
    loading.value = false
  }
}

function setStatus(nextStatus) {
  status.value = nextStatus
  fetchApplications()
}

async function approveApplication(application) {
  processingId.value = application.id
  try {
    const { data } = await axios.post(`/api/admin/partner-applications/${application.id}/approve`, {
      adminNote: adminNotes[application.id] || ''
    })
    const note = data.createdUser
      ? data.welcomeEmailSent
        ? 'Партнёр создан, письмо с доступом отправлено.'
        : 'Партнёр создан, но письмо с доступом не отправилось. Проверьте настройки почты.'
      : data.welcomeEmailSent
        ? 'Пользователь назначен партнёром, письмо об одобрении отправлено.'
        : 'Пользователь назначен партнёром, но письмо об одобрении не отправилось.'
    alert(note)
    await fetchApplications()
  } catch (e) {
    alert(e.response?.data?.error || 'Не удалось принять заявку')
  } finally {
    processingId.value = null
  }
}

async function rejectApplication(application) {
  const adminNote = String(adminNotes[application.id] || '').trim()
  if (!adminNote) {
    alert('Для отклонения укажите комментарий')
    return
  }

  processingId.value = application.id
  try {
    const { data } = await axios.post(`/api/admin/partner-applications/${application.id}/reject`, { adminNote })
    if (!data.rejectionEmailSent) {
      alert('Заявка отклонена, но письмо об отклонении не отправилось. Проверьте настройки почты.')
    }
    await fetchApplications()
  } catch (e) {
    alert(e.response?.data?.error || 'Не удалось отклонить заявку')
  } finally {
    processingId.value = null
  }
}

function getStatusLabel(value) {
  const labels = {
    PENDING: 'На рассмотрении',
    APPROVED: 'Принята',
    REJECTED: 'Отклонена'
  }
  return labels[value] || value
}

function formatDate(value) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value))
}

function getTelegramUrl(value) {
  const normalized = String(value || '').trim()
  if (normalized.startsWith('http')) return normalized
  return `https://t.me/${normalized.replace(/^@/, '')}`
}

onMounted(fetchApplications)
</script>

<style scoped>
.partner-applications-page {
  display: grid;
  gap: 1.5rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.page-title {
  font-size: 1.75rem;
  margin-bottom: 0.25rem;
}

.status-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.status-tabs button {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.72rem 0.9rem;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--bg-card);
  color: var(--text-secondary);
  font-weight: 700;
  transition: var(--transition);
}

.status-tabs button.active {
  color: var(--bg-primary);
  background: var(--accent);
  border-color: var(--accent);
}

.status-tabs span {
  min-width: 22px;
  padding: 0.1rem 0.4rem;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.18);
  font-size: 0.78rem;
}

.logic-panel {
  display: grid;
  grid-template-columns: 0.42fr 1fr;
  gap: 1.25rem;
  padding: 1.25rem;
}

.logic-panel__eyebrow {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--accent);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.logic-panel h2 {
  font-size: 1.2rem;
}

.logic-panel__steps {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
}

.logic-panel__steps div {
  padding: 1rem;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  line-height: 1.5;
}

.applications-list {
  display: grid;
  gap: 1rem;
}

.application-card {
  padding: 1.25rem;
  overflow: visible;
}

.application-card:hover {
  transform: none;
}

.application-card__head {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.application-id {
  margin-bottom: 0.35rem;
  color: var(--text-muted);
  font-size: 0.8rem;
}

.application-card h3 {
  margin-bottom: 0.2rem;
  font-size: 1.25rem;
}

.application-card__head p {
  color: var(--text-secondary);
}

.application-status {
  align-self: flex-start;
  padding: 0.35rem 0.65rem;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 800;
}

.application-status--pending {
  color: #f7c948;
  background: rgba(247, 201, 72, 0.14);
}

.application-status--approved {
  color: #22c55e;
  background: rgba(34, 197, 94, 0.14);
}

.application-status--rejected {
  color: var(--danger);
  background: rgba(255, 100, 100, 0.12);
}

.application-meta,
.application-result {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.application-meta div,
.application-result div,
.admin-note,
.application-details div {
  padding: 0.9rem;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: var(--bg-secondary);
}

.application-meta span,
.application-details span,
.admin-note span {
  display: block;
  margin-bottom: 0.35rem;
  color: var(--text-muted);
  font-size: 0.76rem;
  font-weight: 800;
  text-transform: uppercase;
}

.application-meta a,
.application-meta strong,
.application-result a,
.application-result strong {
  color: var(--text-primary);
  font-weight: 800;
}

.application-details {
  display: grid;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.application-details p,
.admin-note p {
  color: var(--text-secondary);
  line-height: 1.6;
  white-space: pre-line;
}

.application-result {
  color: var(--text-secondary);
}

.application-result small {
  display: block;
  margin-top: 0.25rem;
  color: var(--accent);
}

.admin-note {
  margin-bottom: 1rem;
}

.application-actions {
  display: grid;
  gap: 0.75rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border);
}

.application-actions textarea {
  width: 100%;
  min-height: 72px;
  padding: 0.85rem 1rem;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  resize: vertical;
}

.application-actions div {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.empty-state {
  padding: 2rem;
  text-align: center;
}

.empty-state h3 {
  margin-bottom: 0.45rem;
}

.empty-state p {
  color: var(--text-secondary);
}

@media (max-width: 900px) {
  .page-header,
  .application-card__head {
    flex-direction: column;
  }

  .logic-panel,
  .logic-panel__steps {
    grid-template-columns: 1fr;
  }

  .application-actions div {
    flex-direction: column-reverse;
  }

  .application-actions .btn {
    width: 100%;
  }
}
</style>
