<template>
  <div class="points-admin-page">
    <div class="page-header">
      <div>
        <h1 class="page-title" style="font-size: 1.75rem; margin-bottom: 0.25rem;">Баллы</h1>
        <p class="page-subtitle">Начисление бонусных баллов пользователям</p>
      </div>
    </div>

    <div class="points-admin-grid">
      <section class="card points-form-card">
        <div class="points-card-head">
          <span class="points-card-head__label">Мастер начисления</span>
          <h2>Кому начисляем баллы?</h2>
          <p>Выберите одного пользователя, готовый сегмент или всю базу. Для массовых операций сначала появится предпросмотр.</p>
        </div>

        <div class="points-mode" role="tablist" aria-label="Кому начислить баллы">
          <button :class="{ active: form.scope === 'user' }" type="button" @click="setScope('user')">
            <span>01</span>
            <strong>Одному</strong>
            <small>Точный поиск по аккаунту</small>
          </button>
          <button :class="{ active: form.scope === 'segment' }" type="button" @click="setScope('segment')">
            <span>02</span>
            <strong>По фильтру</strong>
            <small>Группа по покупкам и датам</small>
          </button>
          <button :class="{ active: form.scope === 'all' }" type="button" @click="setScope('all')">
            <span>03</span>
            <strong>Всем</strong>
            <small>Вся пользовательская база</small>
          </button>
        </div>

        <div v-if="form.scope === 'user'" class="form-group recipient-card">
          <div class="section-title">
            <span>Получатель</span>
            <strong>Найдите аккаунт</strong>
          </div>
          <div class="user-search">
            <input
              v-model="search"
              type="search"
              class="input"
              placeholder="Имя, email, телефон или ID"
            >
            <div v-if="searching" class="mini-spinner"></div>
          </div>
          <div v-if="users.length" class="user-results">
            <button
              v-for="user in users"
              :key="user.id"
              type="button"
              :class="{ selected: form.userId === user.id }"
              @click="selectUser(user)"
            >
              <span>
                <strong>{{ displayUserName(user) }}</strong>
                <small>{{ user.email || user.phone || `ID ${user.id}` }}</small>
              </span>
              <b>{{ formatNumber(user.pointsBalance || 0) }}</b>
            </button>
          </div>
        </div>

        <div v-if="selectedUser && form.scope === 'user'" class="selected-user">
          <span>Выбран пользователь</span>
          <strong>{{ displayUserName(selectedUser) }} · {{ selectedUser.email || selectedUser.phone || `ID ${selectedUser.id}` }}</strong>
        </div>

        <div v-if="form.scope !== 'user'" class="segment-workspace">
          <div class="segment-header">
            <div>
              <span class="segment-kicker">{{ form.scope === 'all' ? 'Общий фильтр' : 'Группа пользователей' }}</span>
              <h2>{{ form.scope === 'all' ? 'Все пользователи' : selectedSegment.label }}</h2>
            </div>
            <span class="segment-chip">{{ form.scope === 'all' ? 'USER + PARTNER' : selectedSegment.badge }}</span>
          </div>

          <div v-if="form.scope === 'segment'" class="segment-list">
            <button
              v-for="segment in segments"
              :key="segment.key"
              type="button"
              class="segment-option"
              :class="{ active: form.segment.type === segment.key }"
              @click="selectSegment(segment.key)"
            >
              <strong>{{ segment.label }}</strong>
              <span>{{ segment.description }}</span>
            </button>
          </div>

          <div v-if="form.scope === 'segment'" class="segment-params">
            <div v-if="needsPeriod" class="params-row">
              <label class="form-group">
                <span class="form-label">Дата от</span>
                <input v-model="form.segment.params.from" type="date" class="input">
              </label>
              <label class="form-group">
                <span class="form-label">Дата до</span>
                <input v-model="form.segment.params.to" type="date" class="input">
              </label>
            </div>

            <div v-if="form.segment.type === 'spent_period'" class="params-row">
              <label class="form-group">
                <span class="form-label">Сумма от, ₽</span>
                <input v-model="form.segment.params.minAmount" type="number" min="0" step="1" class="input" placeholder="100000">
              </label>
              <label class="form-group">
                <span class="form-label">Сумма до, ₽</span>
                <input v-model="form.segment.params.maxAmount" type="number" min="0" step="1" class="input" placeholder="Без лимита">
              </label>
            </div>

            <div v-if="form.segment.type === 'orders_count_period'" class="params-row">
              <label class="form-group">
                <span class="form-label">Заказов от</span>
                <input v-model="form.segment.params.minCount" type="number" min="0" step="1" class="input" placeholder="2">
              </label>
              <label class="form-group">
                <span class="form-label">Заказов до</span>
                <input v-model="form.segment.params.maxCount" type="number" min="0" step="1" class="input" placeholder="Без лимита">
              </label>
            </div>

            <div v-if="form.segment.type === 'vip_lifetime'" class="params-row">
              <label class="form-group">
                <span class="form-label">Сумма покупок от, ₽</span>
                <input v-model="form.segment.params.minAmount" type="number" min="0" step="1" class="input" placeholder="100000">
              </label>
              <label class="form-group">
                <span class="form-label">Сумма покупок до, ₽</span>
                <input v-model="form.segment.params.maxAmount" type="number" min="0" step="1" class="input" placeholder="Без лимита">
              </label>
            </div>

            <div v-if="form.segment.type === 'points_balance_range'" class="params-row">
              <label class="form-group">
                <span class="form-label">Баланс от</span>
                <input v-model="form.segment.params.min" type="number" min="0" step="1" class="input" placeholder="0">
              </label>
              <label class="form-group">
                <span class="form-label">Баланс до</span>
                <input v-model="form.segment.params.max" type="number" min="0" step="1" class="input" placeholder="5000">
              </label>
            </div>

            <div v-if="form.segment.type === 'bought_product'" class="lookup-field">
              <label class="form-group">
                <span class="form-label">Найти товар</span>
                <input v-model="productSearch" type="search" class="input" placeholder="Название или ID товара">
              </label>
              <label class="form-group">
                <span class="form-label">Товар</span>
                <select v-model="form.segment.params.productId" class="input">
                  <option value="">Выберите товар</option>
                  <option v-for="product in products" :key="product.id" :value="product.id">
                    #{{ product.id }} · {{ product.title }}
                  </option>
                </select>
              </label>
            </div>

            <label v-if="form.segment.type === 'bought_category'" class="form-group">
              <span class="form-label">Категория</span>
              <select v-model="form.segment.params.categoryId" class="input">
                <option value="">Выберите категорию</option>
                <option v-for="category in categories" :key="category.term_id" :value="category.term_id">
                  {{ category.name }}
                </option>
              </select>
            </label>

            <label v-if="form.segment.type === 'bound_partner'" class="form-group">
              <span class="form-label">Партнёр</span>
              <select v-model="form.segment.params.partnerId" class="input">
                <option value="">Любой партнёр</option>
                <option v-for="partner in partners" :key="partner.id" :value="partner.id">
                  #{{ partner.id }} · {{ partner.user?.name || partner.user?.email || 'Партнёр' }}
                </option>
              </select>
            </label>

            <p v-if="segmentHint" class="segment-hint">{{ segmentHint }}</p>
          </div>

          <div class="preview-card" :class="{ muted: !previewReady }">
            <div class="preview-main">
              <span>{{ previewTitle }}</span>
              <strong v-if="preview.total !== null">{{ formatNumber(preview.total) }}</strong>
              <strong v-else>—</strong>
            </div>
            <div v-if="previewLoading" class="preview-status">
              <span class="mini-spinner"></span>
              Считаем пользователей
            </div>
            <p v-else-if="previewError" class="preview-error">{{ previewError }}</p>
            <p v-else-if="!segmentReady" class="preview-muted">Заполните параметры фильтра, чтобы увидеть точное количество.</p>
            <div v-else-if="preview.sample.length" class="preview-users">
              <span v-for="user in preview.sample" :key="user.id">
                {{ displayUserName(user) }}
                <small>{{ user.email || user.phone || `ID ${user.id}` }}</small>
              </span>
            </div>
            <p v-else class="preview-muted">Пользователи не найдены.</p>
          </div>
        </div>

        <div class="credit-panel">
          <div class="section-title">
            <span>Начисление</span>
            <strong>Баллы и сообщение</strong>
          </div>

          <div class="credit-grid">
            <label class="form-group points-amount-field">
              <span class="form-label">Количество баллов</span>
              <input
                v-model="form.amount"
                type="number"
                min="1"
                max="1000000"
                step="1"
                class="input"
                placeholder="500"
              >
            </label>

            <label class="form-group">
              <span class="form-label">Сообщение для пользователя</span>
              <textarea
                v-model="form.message"
                class="input"
                rows="4"
                maxlength="500"
                placeholder="Например: Благодарим за заказ, начислили бонусные баллы."
              ></textarea>
            </label>
          </div>

          <div v-if="error" class="error-message">{{ error }}</div>
          <div v-if="success" class="success-message">{{ success }}</div>

          <button class="btn btn-primary points-submit" :disabled="submitting || !canSubmit" @click="submitCredit">
            <span v-if="submitting" class="mini-spinner"></span>
            {{ submitting ? 'Начисляем...' : submitLabel }}
          </button>
        </div>
      </section>

      <aside class="card points-info-card">
        <span class="points-info-card__eyebrow">Контроль</span>
        <h2>Безопасное начисление</h2>
        <p>Перед массовым начислением админка показывает точное количество пользователей и примеры аккаунтов, которые попадут под фильтр.</p>
        <ul>
          <li>Администраторы и удалённые аккаунты не входят в массовые начисления.</li>
          <li>Покупки считаются только по оплаченным заказам и заказам с оплатой при получении.</li>
          <li>Если под фильтр попал 0 пользователей, сервер не даст провести начисление.</li>
        </ul>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import axios from 'axios'

const segments = [
  { key: 'all', label: 'Все пользователи', badge: 'Все', description: 'Все обычные пользователи и партнёры.' },
  { key: 'no_orders', label: 'Без заказов', badge: 'Заказы', description: 'Аккаунты, у которых ещё нет заказов.' },
  { key: 'purchased_period', label: 'Покупали за период', badge: 'Период', description: 'Есть хотя бы один успешный заказ в выбранные даты.' },
  { key: 'not_purchased_period', label: 'Не покупали за период', badge: 'Период', description: 'Нет успешных заказов в выбранные даты.' },
  { key: 'spent_period', label: 'Сумма покупок за период', badge: 'Сумма', description: 'Суммарные покупки за период попадают в диапазон.' },
  { key: 'orders_count_period', label: 'Количество заказов за период', badge: 'Кол-во', description: 'Количество успешных заказов за период попадает в диапазон.' },
  { key: 'registered_period', label: 'Зарегистрировались за период', badge: 'Дата', description: 'Дата регистрации находится внутри периода.' },
  { key: 'vip_lifetime', label: 'VIP за всё время', badge: 'VIP', description: 'Сумма успешных покупок за всё время от указанного порога.' },
  { key: 'points_balance_range', label: 'Баланс баллов', badge: 'Баллы', description: 'Текущий баланс баллов попадает в диапазон.' },
  { key: 'bought_product', label: 'Купили конкретный товар', badge: 'Товар', description: 'В заказах есть выбранный товар.' },
  { key: 'bought_category', label: 'Купили из категории', badge: 'Категория', description: 'В заказах есть товар из выбранной категории.' },
  { key: 'bound_partner', label: 'Привязаны к партнёру', badge: 'Партнёр', description: 'Пользователи, закреплённые за партнёром.' }
]

const periodSegments = new Set([
  'purchased_period',
  'not_purchased_period',
  'spent_period',
  'orders_count_period',
  'registered_period'
])

const search = ref('')
const users = ref([])
const selectedUser = ref(null)
const searching = ref(false)
const submitting = ref(false)
const error = ref('')
const success = ref('')
const productSearch = ref('')
const products = ref([])
const categories = ref([])
const partners = ref([])
const previewLoading = ref(false)
const previewError = ref('')
const preview = ref({ total: null, sample: [] })
const form = ref({
  scope: 'user',
  userId: null,
  amount: '',
  message: '',
  segment: {
    type: 'purchased_period',
    params: {}
  }
})

let searchTimer = null
let previewTimer = null
let productTimer = null
let previewController = null

const selectedSegment = computed(() => segments.find(segment => segment.key === form.value.segment.type) || segments[0])
const needsPeriod = computed(() => periodSegments.has(form.value.segment.type))
const previewReady = computed(() => form.value.scope !== 'user' && segmentReady.value && !previewError.value)

const segmentReady = computed(() => {
  if (form.value.scope === 'all') return true
  const params = form.value.segment.params || {}
  const type = form.value.segment.type

  if (needsPeriod.value && (!params.from || !params.to)) return false
  if (type === 'spent_period') return Boolean(params.minAmount || params.maxAmount)
  if (type === 'orders_count_period') return Boolean(params.minCount || params.maxCount)
  if (type === 'vip_lifetime') return Boolean(params.minAmount)
  if (type === 'points_balance_range') return Boolean(params.min || params.max)
  if (type === 'bought_product') return Boolean(params.productId)
  if (type === 'bought_category') return Boolean(params.categoryId)
  return true
})

const segmentHint = computed(() => {
  if (segmentReady.value) return ''
  const type = form.value.segment.type
  if (needsPeriod.value && (!form.value.segment.params.from || !form.value.segment.params.to)) {
    return 'Укажите начало и конец периода.'
  }
  if (type === 'spent_period') return 'Укажите сумму от или до.'
  if (type === 'orders_count_period') return 'Укажите количество заказов от или до.'
  if (type === 'vip_lifetime') return 'Укажите минимальную сумму покупок за всё время.'
  if (type === 'points_balance_range') return 'Укажите баланс от или до.'
  if (type === 'bought_product') return 'Выберите товар.'
  if (type === 'bought_category') return 'Выберите категорию.'
  return ''
})

const previewTitle = computed(() => {
  if (form.value.scope === 'all') return 'Под фильтр попадает пользователей'
  return 'Под выбранный фильтр попадает пользователей'
})

const canSubmit = computed(() => {
  const amount = Math.floor(Number(form.value.amount) || 0)
  if (amount <= 0 || amount > 1_000_000) return false
  if (form.value.scope === 'user') return Boolean(form.value.userId)
  return segmentReady.value && !previewLoading.value && !previewError.value && Number(preview.value.total || 0) > 0
})

const submitLabel = computed(() => {
  if (form.value.scope === 'all') return 'Начислить всем'
  if (form.value.scope === 'segment') return 'Начислить по фильтру'
  return 'Начислить пользователю'
})

function formatNumber(value) {
  return Number(value || 0).toLocaleString('ru-RU')
}

function displayUserName(user) {
  return user?.name || user?.email || user?.phone || `Пользователь #${user?.id}`
}

function setScope(scope) {
  form.value.scope = scope
  error.value = ''
  success.value = ''
  if (scope !== 'user') {
    users.value = []
    selectedUser.value = null
    form.value.userId = null
    schedulePreview()
  }
}

function selectSegment(type) {
  form.value.segment = { type, params: {} }
  preview.value = { total: null, sample: [] }
  previewError.value = ''
  schedulePreview()
}

function cleanParams(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== '' && value !== null && value !== undefined)
  )
}

function buildPreviewSegment() {
  if (form.value.scope === 'all') return { type: 'all', params: {} }
  return {
    type: form.value.segment.type,
    params: cleanParams(form.value.segment.params)
  }
}

async function fetchUsers() {
  const q = search.value.trim()
  if (!q) {
    users.value = []
    return
  }

  searching.value = true
  try {
    const { data } = await axios.get('/api/admin/users', {
      params: { q, limit: 8, offset: 0 }
    })
    users.value = data.users || []
  } catch (requestError) {
    users.value = []
  } finally {
    searching.value = false
  }
}

async function fetchProducts() {
  try {
    const { data } = await axios.get('/api/admin/products', {
      params: { q: productSearch.value.trim(), limit: 80, offset: 0 }
    })
    products.value = data.products || []
  } catch (requestError) {
    products.value = []
  }
}

async function fetchDictionaries() {
  const [categoriesResult, partnersResult] = await Promise.allSettled([
    axios.get('/api/categories'),
    axios.get('/api/admin/partners', { params: { limit: 100, offset: 0 } })
  ])

  if (categoriesResult.status === 'fulfilled') {
    categories.value = categoriesResult.value.data.categories || []
  }

  if (partnersResult.status === 'fulfilled') {
    partners.value = partnersResult.value.data.partners || []
  }
}

function selectUser(user) {
  selectedUser.value = user
  form.value.userId = user.id
  search.value = `${displayUserName(user)} · ${user.email || user.phone || `ID ${user.id}`}`
  users.value = []
}

function schedulePreview() {
  clearTimeout(previewTimer)
  if (form.value.scope === 'user') return

  if (!segmentReady.value) {
    preview.value = { total: null, sample: [] }
    previewError.value = ''
    previewLoading.value = false
    return
  }

  previewTimer = setTimeout(fetchPreview, 260)
}

async function fetchPreview() {
  if (form.value.scope === 'user' || !segmentReady.value) return
  previewController?.abort()
  previewController = new AbortController()
  previewLoading.value = true
  previewError.value = ''

  try {
    const { data } = await axios.post('/api/admin/points/segments/preview', {
      segment: buildPreviewSegment()
    }, {
      signal: previewController.signal
    })
    preview.value = {
      total: data.total ?? 0,
      sample: data.sample || []
    }
  } catch (requestError) {
    if (requestError?.code === 'ERR_CANCELED') return
    preview.value = { total: null, sample: [] }
    previewError.value = requestError?.response?.data?.error || 'Не удалось посчитать пользователей'
  } finally {
    previewLoading.value = false
  }
}

async function submitCredit() {
  if (!canSubmit.value || submitting.value) return
  error.value = ''
  success.value = ''

  const amount = Math.floor(Number(form.value.amount) || 0)
  const count = Number(preview.value.total || 0)
  const confirmation = form.value.scope === 'user'
    ? `Начислить ${formatNumber(amount)} баллов пользователю ${selectedUser.value?.email || selectedUser.value?.phone || selectedUser.value?.id}?`
    : `Начислить ${formatNumber(amount)} баллов группе "${form.value.scope === 'all' ? 'Все пользователи' : selectedSegment.value.label}"? Под фильтр попадает ${formatNumber(count)} пользователей.`

  if (!confirm(confirmation)) return

  submitting.value = true
  try {
    const payload = {
      scope: form.value.scope,
      userId: form.value.scope === 'user' ? form.value.userId : undefined,
      amount,
      message: form.value.message,
      segment: form.value.scope === 'segment' || form.value.scope === 'all' ? buildPreviewSegment() : undefined
    }
    const { data } = await axios.post('/api/admin/points/credit', payload)
    success.value = data.message || 'Баллы начислены'
    if (selectedUser.value && data.balance !== undefined) {
      selectedUser.value.pointsBalance = data.balance
    }
    form.value.amount = ''
    form.value.message = ''
    if (form.value.scope !== 'user') {
      await fetchPreview()
    }
  } catch (requestError) {
    error.value = requestError?.response?.data?.error || 'Не удалось начислить баллы'
  } finally {
    submitting.value = false
  }
}

watch(search, () => {
  const selectedMarker = selectedUser.value?.email || selectedUser.value?.phone || String(selectedUser.value?.id || '')
  if (selectedUser.value && selectedMarker && search.value.includes(selectedMarker)) return
  selectedUser.value = null
  form.value.userId = null
  clearTimeout(searchTimer)
  searchTimer = setTimeout(fetchUsers, 250)
})

watch(() => form.value.segment.params, schedulePreview, { deep: true })
watch(() => form.value.segment.type, schedulePreview)
watch(() => form.value.scope, schedulePreview)

watch(productSearch, () => {
  clearTimeout(productTimer)
  productTimer = setTimeout(fetchProducts, 250)
})

onMounted(async () => {
  await Promise.all([fetchDictionaries(), fetchProducts()])
})
</script>

<style scoped>
.points-admin-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 390px;
  gap: 1.5rem;
  align-items: start;
}

.points-form-card,
.points-info-card {
  position: relative;
  overflow: hidden;
  padding: 1.5rem;
  border-color: rgba(166, 185, 248, 0.16);
  background:
    radial-gradient(circle at 8% 0%, rgba(166, 185, 248, 0.16), transparent 28%),
    linear-gradient(145deg, rgba(255, 255, 255, 0.055), rgba(255, 255, 255, 0.015)),
    var(--bg-card);
}

.points-form-card::before,
.points-info-card::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image:
    linear-gradient(rgba(166, 185, 248, 0.045) 1px, transparent 1px),
    linear-gradient(90deg, rgba(166, 185, 248, 0.045) 1px, transparent 1px);
  background-size: 44px 44px;
  mask-image: linear-gradient(180deg, #000, transparent 72%);
}

.points-form-card > *,
.points-info-card > * {
  position: relative;
  z-index: 1;
}

.points-card-head {
  display: grid;
  gap: 0.45rem;
  margin-bottom: 1.25rem;
  padding: 1rem 1rem 1.1rem;
  border: 1px solid rgba(166, 185, 248, 0.18);
  border-radius: 18px;
  background:
    radial-gradient(circle at 100% 10%, rgba(166, 185, 248, 0.18), transparent 30%),
    rgba(10, 10, 16, 0.36);
}

.points-card-head__label,
.section-title span {
  color: var(--accent);
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.11em;
  text-transform: uppercase;
}

.points-card-head h2 {
  margin: 0;
  font-size: clamp(1.35rem, 2vw, 2rem);
  line-height: 1.05;
}

.points-card-head p {
  max-width: 720px;
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.95rem;
  line-height: 1.55;
}

.section-title {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.85rem;
}

.section-title strong {
  color: var(--text-primary);
  font-size: 0.92rem;
  font-weight: 900;
}

.points-mode {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.points-mode button {
  display: grid;
  gap: 0.35rem;
  min-height: 112px;
  padding: 1rem;
  border: 1px solid var(--border);
  border-radius: 16px;
  background:
    linear-gradient(160deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.015)),
    rgba(0, 0, 0, 0.12);
  color: var(--text-secondary);
  text-align: left;
  cursor: pointer;
  transition: var(--transition);
}

.points-mode button span {
  width: fit-content;
  padding: 0.2rem 0.45rem;
  border: 1px solid rgba(166, 185, 248, 0.22);
  border-radius: 999px;
  color: var(--accent);
  font-family: var(--font-mono);
  font-size: 0.7rem;
}

.points-mode button strong {
  color: var(--text-primary);
  font-size: 1.02rem;
  font-weight: 900;
}

.points-mode button small {
  color: var(--text-muted);
  line-height: 1.35;
}

.points-mode button.active {
  border-color: rgba(166, 185, 248, 0.75);
  background:
    radial-gradient(circle at 100% 0%, rgba(255, 255, 255, 0.35), transparent 34%),
    linear-gradient(145deg, rgba(166, 185, 248, 0.94), rgba(118, 143, 231, 0.72));
  box-shadow: 0 18px 45px rgba(89, 119, 223, 0.24);
  transform: translateY(-2px);
}

.points-mode button.active span {
  border-color: rgba(10, 10, 16, 0.18);
  color: #11131d;
  background: rgba(255, 255, 255, 0.28);
}

.points-mode button.active strong,
.points-mode button.active small {
  color: #10121b;
}

.recipient-card,
.credit-panel {
  margin-top: 1rem;
  padding: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 18px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.015)),
    rgba(0, 0, 0, 0.12);
}

.credit-panel {
  display: grid;
  gap: 1rem;
}

.credit-grid {
  display: grid;
  grid-template-columns: minmax(210px, 0.34fr) minmax(0, 1fr);
  gap: 1rem;
}

.form-label {
  margin-bottom: 0.45rem;
}

.input {
  border-color: rgba(255, 255, 255, 0.105);
  border-radius: 14px;
  background: rgba(5, 5, 10, 0.44);
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.04) inset;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.input:focus {
  border-color: rgba(166, 185, 248, 0.7);
  background: rgba(8, 8, 14, 0.68);
  box-shadow:
    0 0 0 3px rgba(166, 185, 248, 0.12),
    0 1px 0 rgba(255, 255, 255, 0.06) inset;
}

.points-amount-field .input {
  min-height: 96px;
  color: var(--accent);
  font-family: var(--font-mono);
  font-size: 2rem;
  font-weight: 900;
}

.user-search {
  position: relative;
}

.user-search .mini-spinner {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
}

.user-results {
  display: grid;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.user-results button {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  width: 100%;
  padding: 0.85rem;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.035);
  color: var(--text-primary);
  text-align: left;
  cursor: pointer;
}

.user-results button.selected,
.user-results button:hover {
  border-color: var(--accent);
}

.user-results span,
.user-results small,
.selected-user span,
.selected-user strong {
  display: block;
}

.user-results small {
  margin-top: 0.25rem;
  color: var(--text-muted);
}

.user-results b {
  color: var(--accent);
  font-family: var(--font-mono);
}

.selected-user {
  margin-bottom: 1rem;
  padding: 0.9rem 1rem;
  border: 1px solid rgba(152, 177, 255, 0.36);
  border-radius: 14px;
  background:
    linear-gradient(135deg, rgba(152, 177, 255, 0.16), rgba(152, 177, 255, 0.05));
}

.selected-user span,
.segment-kicker {
  color: var(--text-muted);
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.selected-user strong {
  margin-top: 0.35rem;
}

.segment-workspace {
  display: grid;
  gap: 1rem;
  margin: 1rem 0;
}

.segment-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid rgba(152, 177, 255, 0.22);
  border-radius: 18px;
  background:
    radial-gradient(circle at 0% 0%, rgba(152, 177, 255, 0.24), transparent 34%),
    linear-gradient(145deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.02)),
    rgba(10, 10, 16, 0.34);
}

.segment-header h2 {
  margin: 0.35rem 0 0;
  font-size: 1.2rem;
}

.segment-chip {
  flex: 0 0 auto;
  padding: 0.45rem 0.7rem;
  border: 1px solid rgba(152, 177, 255, 0.28);
  border-radius: 999px;
  color: var(--accent);
  font-size: 0.78rem;
  font-weight: 800;
}

.segment-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.65rem;
  max-height: 420px;
  padding-right: 0.2rem;
  overflow: auto;
}

.segment-option {
  display: grid;
  gap: 0.35rem;
  min-height: 104px;
  padding: 0.9rem;
  border: 1px solid var(--border);
  border-radius: 16px;
  background:
    linear-gradient(160deg, rgba(255, 255, 255, 0.045), rgba(255, 255, 255, 0.012)),
    rgba(0, 0, 0, 0.12);
  color: var(--text-primary);
  text-align: left;
  cursor: pointer;
}

.segment-option strong {
  font-size: 0.94rem;
}

.segment-option span {
  color: var(--text-secondary);
  font-size: 0.82rem;
  line-height: 1.35;
}

.segment-option.active {
  border-color: rgba(152, 177, 255, 0.7);
  background:
    radial-gradient(circle at 100% 0%, rgba(166, 185, 248, 0.22), transparent 36%),
    rgba(152, 177, 255, 0.12);
  box-shadow:
    0 0 0 1px rgba(152, 177, 255, 0.18) inset,
    0 14px 34px rgba(0, 0, 0, 0.18);
}

.segment-params {
  display: grid;
  gap: 0.85rem;
  padding: 1rem;
  border: 1px solid var(--border);
  border-radius: 18px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.035), rgba(255, 255, 255, 0.012));
}

.params-row,
.lookup-field {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.85rem;
}

.segment-hint {
  margin: 0;
  color: #f59e0b;
  font-weight: 700;
}

.preview-card {
  padding: 1.15rem;
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: 20px;
  background:
    radial-gradient(circle at 92% 12%, rgba(34, 197, 94, 0.22), transparent 32%),
    linear-gradient(145deg, rgba(34, 197, 94, 0.12), rgba(166, 185, 248, 0.055));
}

.preview-card.muted {
  border-color: var(--border);
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.035), rgba(255, 255, 255, 0.012)),
    rgba(0, 0, 0, 0.12);
}

.preview-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.preview-main span {
  color: var(--text-secondary);
  font-weight: 700;
}

.preview-main strong {
  color: var(--accent);
  font-family: var(--font-mono);
  font-size: clamp(2rem, 5vw, 3.15rem);
  line-height: 1;
}

.preview-status {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  margin-top: 0.75rem;
  color: var(--text-secondary);
}

.preview-users {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.85rem;
}

.preview-users span {
  display: grid;
  gap: 0.15rem;
  min-width: 180px;
  padding: 0.55rem 0.7rem;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: rgba(0, 0, 0, 0.18);
  font-weight: 800;
}

.preview-users small {
  color: var(--text-muted);
  font-size: 0.75rem;
  font-weight: 600;
}

.preview-error,
.preview-muted {
  margin: 0.75rem 0 0;
  color: var(--text-secondary);
}

.preview-error {
  color: #ef4444;
  font-weight: 800;
}

.points-submit {
  width: 100%;
  min-height: 64px;
  margin-top: 0.25rem;
  border-radius: 18px;
  color: #10121b;
  font-size: 1rem;
  font-weight: 900;
  box-shadow: 0 18px 45px rgba(89, 119, 223, 0.2);
}

.points-submit:disabled {
  opacity: 0.48;
  transform: none;
  box-shadow: none;
}

.points-info-card {
  position: sticky;
  top: 1rem;
  padding: 1.65rem;
}

.points-info-card__eyebrow {
  color: var(--accent);
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.points-info-card h2 {
  margin: 0.5rem 0 0.75rem;
  font-size: 1.6rem;
  line-height: 1.15;
}

.points-info-card p,
.points-info-card li {
  color: var(--text-secondary);
  line-height: 1.55;
}

.points-info-card ul {
  display: grid;
  gap: 0.65rem;
  padding-left: 1.2rem;
  margin: 1rem 0 0;
}

.success-message {
  padding: 0.875rem 1rem;
  border-radius: 12px;
  background: rgba(34, 197, 94, 0.12);
  color: #22c55e;
  font-weight: 700;
}

.error-message {
  padding: 0.875rem 1rem;
  border-radius: 12px;
  background: rgba(239, 68, 68, 0.12);
  color: #ef4444;
  font-weight: 800;
}

[data-theme="light"] .points-form-card,
[data-theme="light"] .points-info-card {
  background:
    radial-gradient(circle at 8% 0%, rgba(86, 115, 215, 0.12), transparent 28%),
    linear-gradient(145deg, rgba(255, 255, 255, 0.94), rgba(247, 248, 255, 0.86)),
    var(--bg-card);
}

[data-theme="light"] .points-card-head,
[data-theme="light"] .recipient-card,
[data-theme="light"] .credit-panel,
[data-theme="light"] .segment-header,
[data-theme="light"] .segment-params,
[data-theme="light"] .segment-option,
[data-theme="light"] .preview-card.muted {
  background: rgba(255, 255, 255, 0.76);
}

[data-theme="light"] .input {
  background: rgba(255, 255, 255, 0.84);
}

[data-theme="light"] .preview-users span {
  background: rgba(255, 255, 255, 0.64);
}

@media (max-width: 1100px) {
  .points-admin-grid {
    grid-template-columns: 1fr;
  }

  .points-info-card {
    position: static;
  }
}

@media (max-width: 720px) {
  .points-mode,
  .segment-list,
  .params-row,
  .lookup-field,
  .credit-grid {
    grid-template-columns: 1fr;
  }

  .segment-header,
  .preview-main {
    align-items: flex-start;
    flex-direction: column;
  }

  .points-form-card,
  .points-info-card {
    padding: 1rem;
  }
}
</style>
