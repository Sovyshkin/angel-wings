<template>
  <div class="dealers-admin-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Дилеры</h1>
        <p class="page-subtitle">Карточки представителей, которые показываются на публичной странице сайта</p>
      </div>
      <button class="btn btn-primary" @click="openModal()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        <span class="btn-text">Добавить дилера</span>
      </button>
    </div>

    <div class="filters-bar card">
      <AdminSearchPanel
        v-model="search"
        :total="filteredDealers.length"
        placeholder="Поиск по городу, телефону, адресу или соцсетям"
        total-label="дилеров"
        found-label="дилеров найдено"
      />
      <div class="filter-group">
        <label class="form-label">Статус</label>
        <select v-model="statusFilter" class="input">
          <option value="all">Все</option>
          <option value="active">Активные</option>
          <option value="hidden">Скрытые</option>
        </select>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
    </div>

    <div v-else-if="filteredDealers.length" class="dealers-admin-grid">
      <article v-for="dealer in filteredDealers" :key="dealer.id" class="dealer-admin-card card">
        <div class="dealer-admin-card__head">
          <div>
            <span class="dealer-admin-card__eyebrow">Город</span>
            <h2>{{ dealer.city }}</h2>
          </div>
          <label class="toggle">
            <input type="checkbox" :checked="dealer.isActive" @change="toggleActive(dealer, $event.target.checked)">
            <span class="toggle-slider"></span>
          </label>
        </div>

        <div class="dealer-admin-card__rows">
          <div v-if="dealer.phone"><span>Телефон</span><strong>{{ dealer.phone }}</strong></div>
          <div v-if="dealer.address"><span>Адрес</span><strong>{{ dealer.address }}</strong></div>
          <div v-if="dealer.telegram"><span>Telegram</span><strong>{{ dealer.telegram }}</strong></div>
          <div v-if="dealer.instagram"><span>Instagram</span><strong>{{ dealer.instagram }}</strong></div>
          <div v-if="dealer.max"><span>MAX</span><strong>{{ dealer.max }}</strong></div>
          <div v-if="!hasContacts(dealer)" class="dealer-admin-card__empty">
            Заполнен только город. Добавьте контакты, чтобы карточка была полезной.
          </div>
        </div>

        <div class="dealer-admin-card__actions">
          <button class="btn btn-secondary btn-sm" @click="openModal(dealer)">Изменить</button>
          <button class="btn btn-danger btn-sm" @click="deleteDealer(dealer)">Удалить</button>
        </div>
      </article>
    </div>

    <div v-else class="empty-state card">
      <h3>Дилеры не найдены</h3>
      <p>Добавьте первую карточку или измените фильтр поиска.</p>
    </div>

    <div v-if="showModal" class="modal-overlay">
      <div class="modal card dealer-modal">
        <div class="modal-header">
          <h3 class="modal-title">{{ editingId ? 'Редактировать дилера' : 'Новый дилер' }}</h3>
          <button class="modal-close" @click="closeModal">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form class="modal-form" @submit.prevent="handleSubmit">
          <div class="form-group">
            <label class="form-label">Город *</label>
            <input v-model="form.city" class="input" type="text" required placeholder="Москва">
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Номер</label>
              <input v-model="form.phone" class="input" type="tel" placeholder="+7 999 000-00-00">
            </div>
            <div class="form-group">
              <label class="form-label">Telegram</label>
              <input v-model="form.telegram" class="input" type="text" placeholder="@username или ссылка">
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Instagram</label>
              <input v-model="form.instagram" class="input" type="text" placeholder="@username или ссылка">
            </div>
            <div class="form-group">
              <label class="form-label">MAX</label>
              <input v-model="form.max" class="input" type="text" placeholder="канал, имя или ссылка">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Адрес</label>
            <textarea v-model="form.address" class="input textarea" rows="3" placeholder="Адрес дилера"></textarea>
          </div>

          <label class="checkbox-label">
            <input v-model="form.isActive" type="checkbox">
            <span>Показывать на сайте</span>
          </label>

          <div v-if="error" class="error-message">{{ error }}</div>

          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" @click="closeModal">Отмена</button>
            <button type="submit" class="btn btn-primary" :disabled="saving">
              {{ saving ? 'Сохраняем...' : 'Сохранить' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import axios from 'axios'
import AdminSearchPanel from '../components/AdminSearchPanel.vue'

const dealers = ref([])
const loading = ref(true)
const saving = ref(false)
const showModal = ref(false)
const editingId = ref(null)
const error = ref('')
const search = ref('')
const statusFilter = ref('all')

const emptyForm = {
  city: '',
  phone: '',
  address: '',
  telegram: '',
  instagram: '',
  max: '',
  isActive: true
}

const form = ref({ ...emptyForm })

const filteredDealers = computed(() => {
  const query = search.value.trim().toLowerCase()

  return dealers.value.filter((dealer) => {
    if (statusFilter.value === 'active' && !dealer.isActive) return false
    if (statusFilter.value === 'hidden' && dealer.isActive) return false

    if (!query) return true

    return [
      dealer.city,
      dealer.phone,
      dealer.address,
      dealer.telegram,
      dealer.instagram,
      dealer.max
    ].filter(Boolean).join(' ').toLowerCase().includes(query)
  })
})

function hasContacts(dealer) {
  return Boolean(dealer.phone || dealer.address || dealer.telegram || dealer.instagram || dealer.max)
}

async function fetchDealers() {
  loading.value = true
  try {
    const { data } = await axios.get('/api/admin/dealers')
    dealers.value = data.dealers || []
  } catch (requestError) {
    console.error(requestError)
  } finally {
    loading.value = false
  }
}

function openModal(dealer = null) {
  error.value = ''
  editingId.value = dealer?.id || null
  form.value = dealer
    ? {
        city: dealer.city || '',
        phone: dealer.phone || '',
        address: dealer.address || '',
        telegram: dealer.telegram || '',
        instagram: dealer.instagram || '',
        max: dealer.max || '',
        isActive: dealer.isActive
      }
    : { ...emptyForm }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingId.value = null
  error.value = ''
}

async function handleSubmit() {
  error.value = ''
  saving.value = true

  try {
    const payload = { ...form.value }
    if (editingId.value) {
      await axios.put(`/api/admin/dealers/${editingId.value}`, payload)
    } else {
      await axios.post('/api/admin/dealers', payload)
    }
    closeModal()
    await fetchDealers()
  } catch (requestError) {
    error.value = requestError.response?.data?.error || 'Не удалось сохранить дилера'
  } finally {
    saving.value = false
  }
}

async function toggleActive(dealer, isActive) {
  try {
    await axios.put(`/api/admin/dealers/${dealer.id}`, { isActive })
    dealer.isActive = isActive
  } catch (requestError) {
    console.error(requestError)
    await fetchDealers()
  }
}

async function deleteDealer(dealer) {
  if (!confirm(`Удалить дилера в городе ${dealer.city}?`)) return

  try {
    await axios.delete(`/api/admin/dealers/${dealer.id}`)
    dealers.value = dealers.value.filter((item) => item.id !== dealer.id)
  } catch (requestError) {
    alert(requestError.response?.data?.error || 'Не удалось удалить дилера')
  }
}

onMounted(fetchDealers)
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 2rem;
}

.page-title {
  font-size: 1.75rem;
  margin-bottom: 0.25rem;
}

.filters-bar {
  display: flex;
  gap: 1rem;
  align-items: stretch;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.filters-bar .admin-search-panel {
  flex: 1;
  margin-bottom: 0;
  padding: 0;
  background: transparent;
  border: 0;
  box-shadow: none;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 180px;
}

.dealers-admin-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}

.dealer-admin-card {
  padding: 1.25rem;
  overflow: visible;
}

.dealer-admin-card:hover {
  transform: none;
}

.dealer-admin-card__head {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border);
}

.dealer-admin-card__eyebrow {
  color: var(--text-muted);
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.dealer-admin-card h2 {
  margin-top: 0.25rem;
  font-size: 1.35rem;
  line-height: 1.15;
}

.dealer-admin-card__rows {
  display: grid;
  gap: 0.7rem;
  margin-top: 1rem;
}

.dealer-admin-card__rows div {
  display: grid;
  gap: 0.2rem;
  padding: 0.75rem;
  border-radius: var(--radius-sm);
  background: var(--bg-secondary);
}

.dealer-admin-card__rows span {
  color: var(--text-muted);
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.dealer-admin-card__rows strong {
  color: var(--text-primary);
  font-size: 0.92rem;
  overflow-wrap: anywhere;
}

.dealer-admin-card__empty {
  color: var(--text-secondary);
}

.dealer-admin-card__actions {
  display: flex;
  gap: 0.7rem;
  margin-top: 1rem;
}

.btn-danger {
  background: rgba(239, 68, 68, 0.15);
  color: var(--danger);
  border: 1px solid rgba(239, 68, 68, 0.25);
}

.btn-danger:hover {
  background: var(--danger);
  color: #fff;
}

.toggle {
  position: relative;
  display: inline-flex;
  align-items: center;
  width: 48px;
  height: 28px;
  flex: 0 0 auto;
}

.toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  inset: 0;
  border-radius: 999px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  transition: var(--transition);
}

.toggle-slider::before {
  content: '';
  position: absolute;
  width: 20px;
  height: 20px;
  left: 3px;
  top: 3px;
  border-radius: 50%;
  background: var(--text-muted);
  transition: var(--transition);
}

.toggle input:checked + .toggle-slider {
  background: var(--accent);
  border-color: var(--accent);
}

.toggle input:checked + .toggle-slider::before {
  transform: translateX(20px);
  background: #fff;
}

.dealer-modal {
  max-width: 760px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.textarea {
  resize: vertical;
}

.empty-state {
  padding: 2rem;
  text-align: center;
}

.empty-state h3 {
  margin-bottom: 0.4rem;
}

.empty-state p {
  color: var(--text-secondary);
}

.loading-state {
  min-height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background: rgba(0, 0, 0, 0.72);
  backdrop-filter: blur(12px);
}

.modal {
  width: 100%;
  max-height: 90vh;
  padding: 1.5rem;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.modal-title {
  font-size: 1.25rem;
}

.modal-close {
  width: 40px;
  height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  background: var(--bg-secondary);
  border: 1px solid var(--border);
}

.modal-form {
  display: grid;
  gap: 1rem;
}

.form-group {
  display: grid;
  gap: 0.5rem;
}

.form-label {
  color: var(--text-secondary);
  font-size: 0.875rem;
  font-weight: 600;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  color: var(--text-secondary);
  cursor: pointer;
}

.checkbox-label input {
  width: 18px;
  height: 18px;
  accent-color: var(--accent);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.error-message {
  padding: 0.85rem 1rem;
  border-radius: var(--radius-sm);
  background: rgba(239, 68, 68, 0.12);
  color: var(--danger);
}

@media (max-width: 1100px) {
  .dealers-admin-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .page-header,
  .filters-bar,
  .dealer-admin-card__actions,
  .form-row {
    grid-template-columns: 1fr;
    flex-direction: column;
  }

  .dealers-admin-grid {
    grid-template-columns: 1fr;
  }

  .filter-group {
    min-width: 0;
  }

  .modal-overlay {
    align-items: flex-start;
    padding: 1rem;
  }

  .modal-actions {
    flex-direction: column;
  }
}
</style>
