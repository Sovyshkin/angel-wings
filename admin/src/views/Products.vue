<template>
  <div class="products-page">
    <div class="page-header">
      <div>
        <h1 class="page-title" style="font-size: 1.75rem; margin-bottom: 0.25rem;">Товары</h1>
        <p class="page-subtitle">Управление каталогом товаров</p>
      </div>
      <div class="header-actions">
        <button type="button" class="btn btn-secondary stock-open-btn" @click="openStockDialog">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
            <path d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5z"/><path d="m4 7.5 8 4.5 8-4.5M12 12v9"/><path d="M12 6v4m-2-2h4"/>
          </svg>
          <span>Изменить остатки</span>
        </button>
        <router-link to="/products/new" class="btn btn-primary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          <span class="btn-text">Добавить товар</span>
        </router-link>
      </div>
    </div>

    <div v-if="stockNotice" class="stock-notice" role="status">{{ stockNotice }}</div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
    </div>

    <div v-else-if="error" class="error-message">{{ error }}</div>

    <div v-else>
      <AdminSearchPanel
        v-model="search"
        :total="total"
        placeholder="Поиск по названию, ID, категории, цене, остатку или статусу"
        total-label="товаров в каталоге"
        found-label="товаров найдено"
      />

      <div class="products-table-wrapper card">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Название</th>
              <th>Категория</th>
              <th>Цена</th>
              <th>Остаток</th>
              <th>Упаковка</th>
              <th>Статус</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="product in products" :key="product.id">
              <td class="cell-id">{{ product.id }}</td>
              <td>
                <div class="product-cell">
                  <img v-if="product.image" :src="product.image" :alt="product.title" class="product-thumb">
                  <span class="product-title">{{ product.title }}</span>
                </div>
              </td>
              <td class="cell-category">
                {{ product.categories?.map(c => c.name).join(', ') || '—' }}
              </td>
              <td class="cell-price">{{ formatPrice(product.price) }}</td>
              <td :class="['cell-stock', { low: product.stock <= 10 }]">{{ product.stock }}</td>
              <td class="cell-package">{{ formatPackageSize(product) }}</td>
              <td>
                <span :class="['badge', product.active ? 'badge-success' : 'badge-danger']">
                  {{ product.active ? 'Активен' : 'Скрыт' }}
                </span>
              </td>
              <td class="cell-actions">
                <div class="actions-wrapper">
                  <router-link :to="`/products/${product.id}/edit`" class="action-btn" title="Редактировать">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </router-link>
                  <button @click="deleteProduct(product.id)" class="action-btn danger" title="Удалить">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="products-cards">
        <div v-for="product in products" :key="product.id" class="product-card card">
          <div class="product-card__header">
            <img v-if="product.image" :src="product.image" :alt="product.title" class="product-card__img">
            <div v-else class="product-card__img-placeholder">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
              </svg>
            </div>
            <span :class="['badge', product.active ? 'badge-success' : 'badge-danger']">
              {{ product.active ? 'Активен' : 'Скрыт' }}
            </span>
          </div>
          <div class="product-card__body">
            <span class="product-card__id">#{{ product.id }}</span>
            <h3 class="product-card__title">{{ product.title }}</h3>
            <p class="product-card__category">{{ product.categories?.map(c => c.name).join(', ') || 'Без категории' }}</p>
            <div class="product-card__meta">
              <span class="product-card__price">{{ formatPrice(product.price) }}</span>
              <span :class="['product-card__stock', { low: product.stock <= 10 }]">{{ product.stock }} шт</span>
            </div>
            <div class="product-card__package">
              Упаковка: {{ formatPackageSize(product) }}
            </div>
          </div>
          <div class="product-card__actions">
            <router-link :to="`/products/${product.id}/edit`" class="btn btn-secondary btn-sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Изменить
            </router-link>
            <button @click="deleteProduct(product.id)" class="btn btn-danger btn-sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <AdminPagination
        v-model:page="currentPage"
        :total="total"
        :per-page="PRODUCTS_PER_PAGE"
      />

      <div v-if="products.length === 0" class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
        </svg>
        <span>Нет товаров</span>
        <router-link to="/products/new" class="btn btn-primary btn-sm">Добавить первый</router-link>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="stockDialogOpen" class="stock-overlay" @click.self="closeStockDialog">
        <section class="stock-dialog" role="dialog" aria-modal="true" aria-labelledby="stock-dialog-title">
          <div class="stock-dialog__header">
            <div>
              <span class="stock-dialog__eyebrow">УПРАВЛЕНИЕ СКЛАДОМ</span>
              <h2 id="stock-dialog-title">Изменить остатки</h2>
              <p>Выберите товары и укажите количество. Изменения применятся ко всем выбранным за один раз.</p>
            </div>
            <button type="button" class="stock-icon-button" aria-label="Закрыть" :disabled="stockSaving" @click="closeStockDialog">×</button>
          </div>

          <div class="stock-mode" role="group" aria-label="Способ изменения остатка">
            <button type="button" :class="{ active: stockMode === 'increase' }" :aria-pressed="stockMode === 'increase'" :disabled="stockSaving" @click="stockMode = 'increase'">+ Поступление</button>
            <button type="button" :class="{ active: stockMode === 'set' }" :aria-pressed="stockMode === 'set'" :disabled="stockSaving" @click="stockMode = 'set'">Установить остаток</button>
          </div>
          <p class="stock-mode-hint">{{ stockMode === 'increase' ? 'Количество прибавится к выбранным товарам или дозировкам.' : 'Указанное число станет новым остатком каждой выбранной позиции. Можно указать 0.' }}</p>

          <div class="stock-dialog__grid" :class="{ 'is-saving': stockSaving }">
            <div class="stock-picker">
              <div class="stock-section-heading"><strong>Каталог</strong><span>{{ stockResultsTotal }} товаров</span></div>
              <label class="stock-search-label" for="stock-search">Найти товар</label>
              <input id="stock-search" v-model="stockSearch" class="stock-search-input" type="search" placeholder="Название, ID или артикул" autocomplete="off">
              <div class="stock-list" aria-label="Найденные товары">
                <div v-if="stockResultsLoading" class="stock-list-state">Загружаем товары…</div>
                <div v-else-if="stockResultsError" class="stock-list-state stock-list-state--error">{{ stockResultsError }}</div>
                <div v-else-if="!stockResults.length" class="stock-list-state">Товары не найдены</div>
                <template v-else>
                  <template v-for="product in stockResults" :key="product.id">
                    <label v-for="option in stockOptions(product)" :key="stockKey(option)" class="stock-product" :class="{ selected: selectedStockIds.has(stockKey(option)) }">
                      <input type="checkbox" :checked="selectedStockIds.has(stockKey(option))" @change="toggleStockProduct(option)">
                      <span class="stock-product__name">{{ option.title }}<small>#{{ option.id }}{{ option.sku ? ` · ${option.sku}` : '' }}{{ option.dosage ? ` · ${option.dosage}` : '' }}</small></span>
                      <span class="stock-product__count">{{ option.stock }} шт.</span>
                    </label>
                  </template>
                </template>
              </div>
              <button v-if="stockResults.length && !stockResultsLoading" type="button" class="stock-select-visible" @click="selectVisibleStockProducts">Выбрать показанные товары</button>
              <p v-if="stockResultsTotal > stockResults.length" class="stock-picker-note">Показаны первые {{ stockResults.length }} результатов. Уточните поиск для остальных.</p>
            </div>

            <div class="stock-selected">
              <div class="stock-section-heading"><strong>К изменению</strong><span>{{ selectedStockProducts.length }} позиций</span></div>
              <div class="stock-common">
                <label for="stock-common-quantity">Одно количество для всех</label>
                <div class="stock-common__controls">
                  <input id="stock-common-quantity" v-model="stockCommonQuantity" type="number" inputmode="numeric" :min="stockMode === 'increase' ? 1 : 0" step="1" placeholder="Например, 30">
                  <button type="button" :disabled="!selectedStockProducts.length" @click="applyCommonStockQuantity">Применить</button>
                </div>
                <small>После применения количество можно поправить у любого товара отдельно.</small>
              </div>
              <div class="stock-selected-list">
                <div v-if="!selectedStockProducts.length" class="stock-list-state">Выберите товары слева — они появятся здесь.</div>
                <div v-for="(item, index) in selectedStockProducts" :key="stockKey(item)" class="stock-selected-item">
                  <div class="stock-selected-item__top">
                    <span>{{ item.title }}<small>#{{ item.id }}{{ item.dosage ? ` · ${item.dosage}` : '' }} · сейчас {{ item.stock }} шт.</small></span>
                    <button type="button" class="stock-remove" :aria-label="`Убрать ${item.title}${item.dosage ? ` · ${item.dosage}` : ''}`" @click="removeStockProduct(item)">×</button>
                  </div>
                  <div class="stock-selected-item__bottom">
                    <label :for="`stock-qty-${index}`">{{ stockMode === 'increase' ? 'Пришло' : 'Новый остаток' }}</label>
                    <input :id="`stock-qty-${index}`" v-model="item.quantity" type="number" inputmode="numeric" :min="stockMode === 'increase' ? 1 : 0" step="1" placeholder="шт.">
                    <span class="stock-preview">→ {{ previewStock(item) }} шт.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <p class="stock-scope-note">Для товара с дозировками каждая дозировка меняется отдельно. Общий остаток обновляется на ту же величину.</p>
          <div v-if="stockError" class="stock-save-error" role="alert">{{ stockError }}</div>
          <div class="stock-dialog__footer">
            <span>{{ selectedStockProducts.length ? `Будет изменено позиций: ${selectedStockProducts.length}` : 'Выберите хотя бы одну позицию' }}</span>
            <div>
              <button type="button" class="btn btn-secondary" :disabled="stockSaving" @click="closeStockDialog">Отмена</button>
              <button type="button" class="btn btn-primary" :disabled="stockSaving || !selectedStockProducts.length" @click="saveStockAdjustments">{{ stockSaving ? 'Сохраняем…' : 'Сохранить остатки' }}</button>
            </div>
          </div>
        </section>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import axios from 'axios'
import AdminSearchPanel from '../components/AdminSearchPanel.vue'
import AdminPagination from '../components/AdminPagination.vue'

const API_URL = '/api/admin/products'

const products = ref([])
const total = ref(0)
const loading = ref(true)
const error = ref('')
const search = ref('')
const currentPage = ref(1)
const PRODUCTS_PER_PAGE = 20
let searchTimer = null

const stockDialogOpen = ref(false)
const stockMode = ref('increase')
const stockSearch = ref('')
const stockResults = ref([])
const stockResultsTotal = ref(0)
const stockResultsLoading = ref(false)
const stockResultsError = ref('')
const stockCommonQuantity = ref('')
const selectedStockProducts = ref([])
const selectedStockIds = computed(() => new Set(selectedStockProducts.value.map(stockKey)))
const stockSaving = ref(false)
const stockError = ref('')
const stockNotice = ref('')
let stockSearchTimer = null
let stockRequestId = 0

function stockKey(item) {
  return `${item.id}:${item.dosage || ''}`
}

function stockOptions(product) {
  const dosages = Array.isArray(product.specs?.dosages) ? product.specs.dosages : []
  if (!dosages.length) return [{ id: product.id, title: product.title, sku: product.sku, stock: product.stock, dosage: null }]
  return dosages.filter(item => String(item?.dosage || '').trim()).map(item => ({
    id: product.id,
    title: product.title,
    sku: product.sku,
    dosage: String(item.dosage).trim(),
    stock: Number(item.quantity) || 0
  }))
}

function isValidStockQuantity(value) {
  if (value === '' || value === null || value === undefined) return false
  const number = Number(value)
  return Number.isSafeInteger(number) && number >= (stockMode.value === 'increase' ? 1 : 0) && number <= 2147483647
}

function previewStock(item) {
  if (!isValidStockQuantity(item.quantity)) return '—'
  const result = stockMode.value === 'increase' ? item.stock + Number(item.quantity) : Number(item.quantity)
  return result <= 2147483647 ? result : '—'
}

async function fetchStockResults() {
  const requestId = ++stockRequestId
  stockResultsLoading.value = true
  stockResultsError.value = ''
  try {
    const { data } = await axios.get(API_URL, { params: { q: stockSearch.value.trim(), limit: 50, offset: 0 } })
    if (requestId !== stockRequestId || !stockDialogOpen.value) return
    stockResults.value = data.products || []
    stockResultsTotal.value = data.total || 0
  } catch (e) {
    if (requestId !== stockRequestId || !stockDialogOpen.value) return
    stockResultsError.value = 'Не удалось загрузить товары. Повторите поиск.'
  } finally {
    if (requestId === stockRequestId) stockResultsLoading.value = false
  }
}

function openStockDialog() {
  stockDialogOpen.value = true
  stockMode.value = 'increase'
  stockSearch.value = ''
  stockCommonQuantity.value = ''
  selectedStockProducts.value = []
  stockError.value = ''
  fetchStockResults()
}

function closeStockDialog() {
  if (stockSaving.value) return
  stockDialogOpen.value = false
  stockRequestId++
  clearTimeout(stockSearchTimer)
}

function toggleStockProduct(product) {
  if (selectedStockIds.value.has(stockKey(product))) {
    removeStockProduct(product)
  } else if (selectedStockProducts.value.length < 100) {
    selectedStockProducts.value.push({ ...product, quantity: isValidStockQuantity(stockCommonQuantity.value) ? String(stockCommonQuantity.value) : '' })
  } else {
    stockError.value = 'За один раз можно изменить не более 100 позиций.'
  }
}

function removeStockProduct(option) {
  selectedStockProducts.value = selectedStockProducts.value.filter(item => stockKey(item) !== stockKey(option))
}

function selectVisibleStockProducts() {
  for (const product of stockResults.value) {
    for (const option of stockOptions(product)) {
      if (selectedStockProducts.value.length >= 100) return
      if (!selectedStockIds.value.has(stockKey(option))) toggleStockProduct(option)
    }
  }
}

function applyCommonStockQuantity() {
  if (!isValidStockQuantity(stockCommonQuantity.value)) {
    stockError.value = stockMode.value === 'increase' ? 'Введите целое количество поступивших товаров больше нуля.' : 'Введите новый целый остаток от нуля.'
    return
  }
  stockError.value = ''
  selectedStockProducts.value.forEach(item => { item.quantity = String(stockCommonQuantity.value) })
}

async function saveStockAdjustments() {
  if (!selectedStockProducts.value.length) return
  if (selectedStockProducts.value.some(item => !isValidStockQuantity(item.quantity) || previewStock(item) === '—')) {
    stockError.value = 'Проверьте количество и новый остаток каждого выбранного товара.'
    return
  }
  stockSaving.value = true
  stockError.value = ''
  try {
    const entries = selectedStockProducts.value.map(item => ({
      productId: item.id,
      ...(item.dosage ? { dosage: item.dosage } : {}),
      quantity: Number(item.quantity),
      ...(stockMode.value === 'set' ? { expectedStock: item.stock } : {})
    }))
    const { data } = await axios.post(`${API_URL}/stock-adjustments`, { mode: stockMode.value, entries })
    stockNotice.value = `Остатки обновлены: ${data.changes.length} позиций.`
    stockSaving.value = false
    closeStockDialog()
    await fetchProducts()
  } catch (e) {
    const conflict = e.response?.data
    if (e.response?.status === 409 && Number.isInteger(conflict?.currentStock)) {
      const selected = selectedStockProducts.value.find(item => item.id === conflict.productId && (item.dosage || null) === (conflict.dosage || null))
      if (selected) selected.stock = conflict.currentStock
      const result = stockResults.value.find(item => item.id === conflict.productId)
      if (result && conflict.dosage) {
        const variant = result.specs?.dosages?.find(item => String(item.dosage || '').trim() === conflict.dosage)
        if (variant) variant.quantity = conflict.currentStock
      } else if (result) result.stock = conflict.currentStock
    }
    stockError.value = e.response?.data?.error || 'Не удалось обновить остатки. Попробуйте ещё раз.'
  } finally {
    stockSaving.value = false
  }
}

function handleStockEscape(event) {
  if (event.key === 'Escape' && stockDialogOpen.value) closeStockDialog()
}

async function fetchProducts() {
  try {
    const { data } = await axios.get(API_URL, {
      params: {
        q: search.value.trim(),
        limit: PRODUCTS_PER_PAGE,
        offset: (currentPage.value - 1) * PRODUCTS_PER_PAGE
      }
    })
    products.value = data.products
    total.value = data.total || 0
  } catch (e) {
    error.value = 'Ошибка загрузки товаров'
  } finally {
    loading.value = false
  }
}

async function deleteProduct(id) {
  if (!confirm('Удалить этот товар?')) return
  try {
    const { data } = await axios.delete(`${API_URL}/${id}`)
    const nextTotal = Math.max(0, total.value - 1)
    const nextLastPage = Math.max(1, Math.ceil(nextTotal / PRODUCTS_PER_PAGE))
    if (currentPage.value > nextLastPage) {
      currentPage.value = nextLastPage
    } else {
      await fetchProducts()
    }
    if (data?.deactivated) {
      alert(data.message)
    }
  } catch (e) {
    alert(e.response?.data?.error || 'Ошибка удаления')
  }
}

function formatPrice(val) {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 0 }).format(val)
}

function formatPackageSize(product) {
  const length = Number(product?.packageLength || 0)
  const width = Number(product?.packageWidth || 0)
  const height = Number(product?.packageHeight || 0)
  if (length <= 0 && width <= 0 && height <= 0) return '—'
  return `${length || 0}×${width || 0}×${height || 0} см`
}

onMounted(() => {
  fetchProducts()
  window.addEventListener('keydown', handleStockEscape)
})

onUnmounted(() => {
  clearTimeout(searchTimer)
  clearTimeout(stockSearchTimer)
  window.removeEventListener('keydown', handleStockEscape)
})

watch(stockMode, () => {
  stockCommonQuantity.value = ''
  selectedStockProducts.value.forEach(item => { item.quantity = '' })
  stockError.value = ''
})

watch(stockSearch, () => {
  if (!stockDialogOpen.value) return
  clearTimeout(stockSearchTimer)
  stockSearchTimer = setTimeout(fetchStockResults, 250)
})

watch(currentPage, fetchProducts)

watch(search, () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    if (currentPage.value === 1) {
      fetchProducts()
    } else {
      currentPage.value = 1
    }
  }, 250)
})
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 2rem;
}

.header-actions { display: flex; align-items: center; gap: 0.65rem; flex-wrap: wrap; }
.header-actions .btn { white-space: nowrap; }
.stock-open-btn { border: 1px solid var(--border); }
.stock-notice { margin: -0.7rem 0 1.25rem; padding: 0.85rem 1rem; border: 1px solid #49bb8c66; border-radius: 12px; color: #9fe5c4; background: #14372a88; }

.stock-overlay { position: fixed; inset: 0; z-index: 1000; display: grid; place-items: center; padding: 20px; background: rgba(4, 7, 17, 0.78); backdrop-filter: blur(9px); }
.stock-dialog { width: min(940px, 100%); max-height: min(90vh, 950px); display: flex; flex-direction: column; overflow: hidden; border: 1px solid #445172; border-radius: 22px; background: linear-gradient(145deg, #1b2030, #111522 70%); color: var(--text-primary); box-shadow: 0 30px 90px #0009, 0 0 42px #6386d016; }
.stock-dialog__header { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; padding: 27px 30px 16px; }
.stock-dialog__eyebrow { color: #9db6ef; font-size: 0.7rem; font-weight: 800; letter-spacing: 0.16em; }
.stock-dialog__header h2 { font-size: clamp(1.35rem, 3vw, 1.85rem); line-height: 1.1; margin: 8px 0 9px; }
.stock-dialog__header p { margin: 0; max-width: 620px; color: var(--text-secondary); font-size: 0.9rem; line-height: 1.5; }
.stock-icon-button { flex: none; width: 36px; height: 36px; border: 1px solid #4b5268; border-radius: 10px; color: var(--text-secondary); background: #ffffff08; font-size: 1.45rem; line-height: 1; cursor: pointer; }
.stock-icon-button:hover { color: white; border-color: #91aaf0; }
.stock-mode { display: flex; align-self: flex-start; gap: 4px; margin: 0 30px; padding: 4px; border: 1px solid #3b4561; border-radius: 12px; background: #0b1020; }
.stock-mode button { padding: 10px 17px; border: 0; border-radius: 9px; background: transparent; color: var(--text-secondary); cursor: pointer; font-weight: 650; transition: background .18s, color .18s; }
.stock-mode button.active { background: #9fb6f4; color: #0a1530; box-shadow: 0 2px 12px #779dff31; }
.stock-mode button:disabled { cursor: wait; }
.stock-mode-hint { margin: 10px 30px 18px; color: #aeb9d1; font-size: 0.82rem; }
.stock-dialog__grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; min-height: 0; padding: 0 30px; }
.stock-dialog__grid.is-saving { opacity: .68; pointer-events: none; }
.stock-picker, .stock-selected { display: flex; flex-direction: column; min-width: 0; min-height: 0; padding: 17px; border: 1px solid #343c52; border-radius: 15px; background: #0d1220a9; }
.stock-section-heading { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; margin-bottom: 15px; }
.stock-section-heading strong { font-size: 0.98rem; }
.stock-section-heading span { color: #a4b8e9; font-size: 0.8rem; }
.stock-search-label, .stock-common label { display: block; margin-bottom: 7px; color: var(--text-secondary); font-size: 0.79rem; font-weight: 600; }
.stock-search-input, .stock-common input, .stock-selected-item input { min-width: 0; border: 1px solid #3c4560; border-radius: 10px; background: #0d101b; color: #f1f5ff; outline: none; }
.stock-search-input:focus, .stock-common input:focus, .stock-selected-item input:focus { border-color: #9bb5fb; box-shadow: 0 0 0 3px #92b0f523; }
.stock-search-input { width: 100%; padding: 11px 12px; }
.stock-list { min-height: 145px; max-height: 305px; overflow-y: auto; margin-top: 11px; scrollbar-width: thin; scrollbar-color: #4b5b81 transparent; }
.stock-list-state { display: grid; place-items: center; min-height: 115px; padding: 15px; color: var(--text-secondary); text-align: center; font-size: 0.85rem; }
.stock-list-state--error { color: #ff9a9a; }
.stock-product { display: flex; align-items: center; gap: 11px; padding: 10px 8px; border-bottom: 1px solid #32394b; cursor: pointer; }
.stock-product:hover, .stock-product.selected { background: #6688cf14; }
.stock-product input { width: 17px; height: 17px; flex: none; accent-color: #9eb9fa; }
.stock-product__name { min-width: 0; flex: 1; font-weight: 600; line-height: 1.3; }
.stock-product__name small, .stock-selected-item__top small { display: block; margin-top: 4px; color: var(--text-muted); font-size: 0.72rem; font-weight: 400; }
.stock-product__count { flex: none; color: #a8bdf1; font-size: 0.79rem; }
.stock-select-visible { align-self: flex-start; margin-top: 12px; padding: 0; border: 0; background: none; color: #a9c3ff; cursor: pointer; font-size: 0.82rem; font-weight: 650; }
.stock-select-visible:hover { text-decoration: underline; }
.stock-picker-note { margin: 8px 0 0; color: var(--text-muted); font-size: 0.72rem; }
.stock-common { padding: 12px; border: 1px solid #4e608c; border-radius: 12px; background: linear-gradient(115deg, #1c2c50a3, #141c31a0); }
.stock-common__controls { display: flex; gap: 8px; }
.stock-common input { width: 100%; flex: 1; padding: 9px 10px; }
.stock-common button { padding: 9px 13px; border: 1px solid #9cb5f0; border-radius: 9px; color: #dfe9ff; background: #39599a; cursor: pointer; font-weight: 650; }
.stock-common button:disabled { opacity: .45; cursor: not-allowed; }
.stock-common small { display: block; margin-top: 7px; color: #aebbd7; font-size: 0.7rem; line-height: 1.35; }
.stock-selected-list { min-height: 120px; max-height: 300px; overflow-y: auto; margin-top: 11px; scrollbar-width: thin; scrollbar-color: #4b5b81 transparent; }
.stock-selected-item { padding: 11px 2px 13px; border-bottom: 1px solid #32394b; }
.stock-selected-item__top { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; font-size: 0.87rem; font-weight: 650; }
.stock-remove { border: 0; color: #99a6c2; background: none; cursor: pointer; font-size: 1.2rem; line-height: 1; }
.stock-remove:hover { color: #ff9d9d; }
.stock-selected-item__bottom { display: flex; align-items: center; gap: 10px; margin-top: 9px; }
.stock-selected-item__bottom label { min-width: 105px; color: var(--text-secondary); font-size: 0.76rem; }
.stock-selected-item input { width: 85px; padding: 8px 9px; }
.stock-preview { margin-left: auto; color: #bad0ff; white-space: nowrap; font-size: 0.8rem; }
.stock-scope-note { margin: 13px 30px 0; color: #9ba7c1; font-size: 0.76rem; }
.stock-save-error { margin: 10px 30px 0; padding: 9px 12px; border: 1px solid #dc6c7775; border-radius: 9px; color: #ffb3ba; background: #64202b4a; font-size: 0.83rem; }
.stock-dialog__footer { display: flex; align-items: center; justify-content: space-between; gap: 15px; margin-top: 16px; padding: 17px 30px; border-top: 1px solid #343c52; }
.stock-dialog__footer > span { color: var(--text-secondary); font-size: 0.8rem; }
.stock-dialog__footer > div { display: flex; gap: 9px; }
.stock-dialog__footer .btn { white-space: nowrap; }

.products-table-wrapper {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 820px;
}

.data-table th,
.data-table td {
  padding: 1rem 1.25rem;
  text-align: left;
  border-bottom: 1px solid var(--border);
}

.data-table th {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-secondary);
  background: var(--bg-secondary);
}

.data-table tr:last-child td {
  border-bottom: none;
}

.data-table tr:hover td {
  background: var(--bg-hover);
}

.cell-id {
  font-family: var(--font-body);
  font-size: 0.8125rem;
  color: var(--text-muted);
}

.product-cell {
  display: flex;
  align-items: center;
  gap: 0.875rem;
}

.product-thumb {
  width: 44px;
  height: 44px;
  object-fit: cover;
  border-radius: var(--radius-sm);
  background: var(--bg-secondary);
}

.product-title {
  font-weight: 600;
}

.cell-category {
  color: var(--text-secondary);
  font-size: 0.9375rem;
}

.cell-price {
  font-weight: 600;
}

.cell-stock {
  font-family: var(--font-body);
}

.cell-stock.low {
  color: var(--danger);
  font-weight: 600;
}

.cell-package {
  color: var(--text-secondary);
  font-size: 0.875rem;
  white-space: nowrap;
}

.badge {
  display: inline-block;
  padding: 0.25rem 0.625rem;
  border-radius: 20px;
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.badge-success { background: #22c55e22; color: #22c55e; }
.badge-danger { background: #ef444422; color: #ef4444; }

.cell-actions {
  width: 90px;
}

.actions-wrapper {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  transition: var(--transition);
}

.action-btn:hover {
  background: var(--accent);
  color: #fff;
}

.action-btn.danger:hover {
  background: var(--danger);
}

.products-cards {
  display: none;
}

.product-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.product-card__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1rem;
  background: var(--bg-secondary);
}

.product-card__img {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: var(--radius-sm);
}

.product-card__img-placeholder {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-hover);
  border-radius: var(--radius-sm);
  color: var(--text-muted);
}

.product-card__body {
  padding: 1rem;
  flex: 1;
}

.product-card__id {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.product-card__title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0.25rem 0;
}

.product-card__category {
  font-size: 0.8125rem;
  color: var(--text-secondary);
  margin-bottom: 0.75rem;
}

.product-card__meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.product-card__package {
  margin-top: 0.6rem;
  color: var(--text-muted);
  font-size: 0.82rem;
}

.product-card__price {
  font-weight: 700;
  color: var(--accent);
}

.product-card__stock {
  font-size: 0.8125rem;
  color: var(--text-secondary);
}

.product-card__stock.low {
  color: var(--danger);
  font-weight: 600;
}

.product-card__actions {
  display: flex;
  gap: 0.5rem;
  padding: 1rem;
  padding-top: 0;
}

.product-card__actions .btn {
  flex: 1;
}

.btn-danger {
  background: var(--danger);
  color: white;
}

.btn-danger:hover {
  background: #ff4444;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 4rem;
  color: var(--text-muted);
}

.loading-state {
  display: flex;
  justify-content: center;
  padding: 4rem;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.error-message {
  background: var(--danger);
  color: white;
  padding: 1rem;
  border-radius: var(--radius-sm);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 1rem;
  }

  .page-header .btn {
    width: 100%;
    justify-content: center;
  }

  .header-actions { width: 100%; }
  .header-actions .btn { flex: 1; }
  .stock-dialog__grid { grid-template-columns: 1fr; overflow-y: auto; }
  .stock-list, .stock-selected-list { max-height: 210px; }
  .stock-dialog__header { padding: 20px 18px 13px; }
  .stock-mode { margin: 0 18px; }
  .stock-mode-hint { margin: 9px 18px 14px; }
  .stock-dialog__grid { padding: 0 18px; }
  .stock-scope-note { margin: 12px 18px 0; }
  .stock-save-error { margin: 10px 18px 0; }
  .stock-dialog__footer { padding: 14px 18px; }

  .products-table-wrapper {
    display: none;
  }

  .products-cards {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
}

@media (min-width: 769px) {
  .products-cards {
    display: none !important;
  }
}

@media (max-width: 480px) {
  .header-actions { flex-direction: column; align-items: stretch; }
  .header-actions .btn { width: 100%; padding: 0.75rem; }
  .stock-overlay { padding: 8px; }
  .stock-dialog { max-height: 96vh; border-radius: 14px; }
  .stock-mode { align-self: stretch; }
  .stock-mode button { flex: 1; padding: 9px; font-size: 0.82rem; }
  .stock-dialog__footer { flex-direction: column; align-items: stretch; }
  .stock-dialog__footer > div .btn { flex: 1; }
}
</style>
