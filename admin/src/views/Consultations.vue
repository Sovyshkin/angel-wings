<template>
  <div class="consultations-page">
    <div class="page-header">
      <div>
        <p class="eyebrow">EXPRESS CONSULTATION</p>
        <h1 class="page-title">Консультации</h1>
        <p class="page-subtitle">Заявки на консультацию. Оплату клиент и специалист согласуют напрямую.</p>
      </div>
      <select v-model="statusFilter" class="input" @change="loadConsultations">
        <option value="">Все заявки</option>
        <option value="NEW">Новые</option>
        <option value="IN_PROGRESS">В работе</option>
        <option value="DONE">Завершены</option>
        <option value="CANCELLED">Отменены</option>
      </select>
    </div>

    <div class="summary-card card">
      <span>Новых заявок</span>
      <strong>{{ newCount }}</strong>
      <span class="summary-card__note">Оплата консультации проходит напрямую специалисту</span>
    </div>

    <div v-if="loading" class="loading-state"><div class="spinner"></div></div>
    <div v-else-if="!consultations.length" class="empty-state card">Заявок пока нет.</div>
    <div v-else class="consultation-list">
      <article v-for="item in consultations" :key="item.id" class="consultation-card card">
        <header>
          <div>
            <span class="request-id">Заявка #{{ item.id }}</span>
            <h2>{{ specialistLabel(item.specialist) }}</h2>
          </div>
          <div class="badges">
            <span :class="['badge', paymentClass(item.paymentStatus)]">{{ paymentLabel(item.paymentStatus) }}</span>
            <span :class="['badge', statusClass(item.status)]">{{ statusLabel(item.status) }}</span>
          </div>
        </header>

        <div class="consultation-card__grid">
          <div><span>Клиент</span><strong>{{ item.customerName }}</strong><a :href="`mailto:${item.customerEmail}`">{{ item.customerEmail }}</a><a :href="`tel:${item.customerPhone}`">{{ item.customerPhone }}</a></div>
          <div><span>Формат</span><strong>{{ formatLabel(item.contactFormat) }}</strong><small>{{ formatDate(item.createdAt) }}</small></div>
          <div><span>Стоимость</span><strong>{{ Number(item.amount).toLocaleString('ru-RU') }} ₽</strong><small>Оплата напрямую специалисту</small></div>
        </div>

        <div class="question"><span>Запрос клиента</span><p>{{ item.question }}</p></div>
        <textarea v-model="drafts[item.id]" class="input note" rows="3" placeholder="Внутренняя заметка для специалиста"></textarea>
        <footer>
          <select v-model="statuses[item.id]" class="input">
            <option value="NEW">Новая</option>
            <option value="IN_PROGRESS">В работе</option>
            <option value="DONE">Завершена</option>
            <option value="CANCELLED">Отменена</option>
          </select>
          <button class="btn btn-primary" :disabled="savingId === item.id" @click="save(item)">{{ savingId === item.id ? 'Сохранение…' : 'Сохранить' }}</button>
        </footer>
      </article>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import axios from 'axios'

const consultations = ref([])
const loading = ref(true)
const newCount = ref(0)
const statusFilter = ref('')
const drafts = ref({})
const statuses = ref({})
const savingId = ref(null)

const specialistLabel = value => {
  if (value === 'MARINA_SHESTAKOVA') return 'Шестакова Марина'
  if (value === 'OLESYA_TERENKO') return 'Теренько Олеся'
  return 'Специалист будет назначен'
}
const formatLabel = value => value === 'CALL' ? 'Созвон по договорённости' : 'Текстовые сообщения'
const paymentLabel = value => ({ EXTERNAL: 'Оплата напрямую', PAID: 'Оплачено', FAILED: 'Оплата не прошла', PENDING: 'Ожидает оплаты' }[value] || value)
const statusLabel = value => ({ PENDING_PAYMENT: 'Ожидает оплаты', NEW: 'Новая', IN_PROGRESS: 'В работе', DONE: 'Завершена', CANCELLED: 'Отменена' }[value] || value)
const paymentClass = value => value === 'EXTERNAL' ? 'badge--external' : value === 'PAID' ? 'badge--paid' : value === 'FAILED' ? 'badge--failed' : 'badge--pending'
const statusClass = value => `badge--${String(value || '').toLowerCase()}`
const formatDate = value => new Date(value).toLocaleString('ru-RU')

async function loadConsultations() {
  loading.value = true
  try {
    const { data } = await axios.get('/api/admin/consultations', { params: statusFilter.value ? { status: statusFilter.value } : {} })
    consultations.value = data.consultations || []
    newCount.value = data.newCount || 0
    drafts.value = Object.fromEntries(consultations.value.map(item => [item.id, item.adminNote || '']))
    statuses.value = Object.fromEntries(consultations.value.map(item => [item.id, item.status]))
  } finally {
    loading.value = false
  }
}

async function save(item) {
  savingId.value = item.id
  try {
    const { data } = await axios.patch(`/api/admin/consultations/${item.id}`, { status: statuses.value[item.id], adminNote: drafts.value[item.id] })
    Object.assign(item, data.request)
  } finally {
    savingId.value = null
  }
}

onMounted(loadConsultations)
</script>

<style scoped>
.consultations-page { max-width: 1180px; margin: 0 auto; padding: 1.5rem; }
.page-header { display:flex; justify-content:space-between; align-items:end; gap:1rem; margin-bottom:1.5rem; }
.eyebrow { margin:0 0 .35rem; color:var(--accent); font:700 .7rem/1 var(--font-mono); letter-spacing:.16em; }
.page-title { margin:0; }.page-subtitle { margin:.35rem 0 0; color:var(--text-muted); }
.summary-card { display:flex; align-items:center; gap:1rem; margin-bottom:1.25rem; padding:1rem 1.25rem; }.summary-card strong { font-size:1.65rem; color:var(--accent); }.summary-card__note { color:var(--text-muted); margin-left:auto; }
.consultation-list { display:grid; gap:1rem; }.consultation-card { padding:1.25rem; }.consultation-card header,.consultation-card footer { display:flex; justify-content:space-between; align-items:center; gap:1rem; }.consultation-card h2 { margin:.2rem 0 0; font-size:1.1rem; }.request-id,.consultation-card__grid span,.question span { color:var(--text-muted); font-size:.76rem; }.badges { display:flex; gap:.45rem; flex-wrap:wrap; }.badge { border-radius:999px; padding:.35rem .55rem; font-size:.73rem; font-weight:700; background:var(--bg-secondary); }.badge--paid,.badge--done { color:#48d597; background:#123b2b; }.badge--failed,.badge--cancelled { color:#ff9494; background:#471f29; }.badge--pending,.badge--pending_payment { color:#ffc86a; background:#443319; }.badge--external { color:#b9ccff; background:#24345e; }.badge--new { color:#aabfff; background:#252d57; }.badge--in_progress { color:#7fc4ff; background:#173b57; }
.consultation-card__grid { display:grid; grid-template-columns:1.4fr 1fr .75fr; gap:1rem; padding:1rem 0; }.consultation-card__grid div { display:flex; flex-direction:column; gap:.25rem; }.consultation-card a { color:var(--accent); text-decoration:none; font-size:.86rem; }.consultation-card small { color:var(--text-muted); overflow-wrap:anywhere; }.question { padding:1rem; background:var(--bg-secondary); border-radius:10px; }.question p { margin:.35rem 0 0; white-space:pre-wrap; line-height:1.5; }.note { width:100%; box-sizing:border-box; resize:vertical; margin:1rem 0; }.consultation-card footer .input { min-width:12rem; }.empty-state { padding:2rem; text-align:center; color:var(--text-muted); }
@media (max-width:700px) { .consultations-page{padding:1rem}.page-header{align-items:stretch;flex-direction:column}.summary-card{flex-wrap:wrap}.summary-card__note{margin-left:0;width:100%}.consultation-card__grid{grid-template-columns:1fr}.consultation-card header,.consultation-card footer{align-items:stretch;flex-direction:column}.consultation-card footer .input,.consultation-card footer .btn{width:100%;box-sizing:border-box} }
</style>
