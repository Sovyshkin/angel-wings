<template>
  <div class="product-form">
    <div class="page-header">
      <div class="header-left">
        <router-link to="/products" class="back-link">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
          Назад
        </router-link>
        <h1 class="page-title" style="font-size: 1.75rem; margin-bottom: 0.25rem;">
          {{ isEdit ? 'Редактирование товара' : 'Новый товар' }}
        </h1>
      </div>
    </div>
    
    <form @submit.prevent="handleSubmit" class="form-grid card">
      <div class="form-section">
        <h3 class="section-title">Основная информация</h3>
        
        <div class="form-group">
          <label class="form-label">Название *</label>
          <input type="text" v-model="form.title" required class="input" placeholder="CJC-1295">
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">SKU</label>
            <input type="text" v-model="form.sku" class="input" placeholder="CJC-1295">
          </div>
          <div class="form-group">
            <label class="form-label">Цена *</label>
            <input type="number" v-model.number="form.price" required min="0" class="input" placeholder="4500">
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Старая цена</label>
            <input type="number" v-model.number="form.comparePrice" min="0" class="input" placeholder="5000">
          </div>
          <div class="form-group">
            <label class="form-label">На складе</label>
            <input type="number" v-model.number="form.stock" min="0" class="input" placeholder="25">
          </div>
        </div>
        
        <div class="form-group">
          <label class="form-label">Категория</label>
          <select v-model="form.categoryId" class="input">
            <option value="">Без категории</option>
            <option v-for="cat in categories" :key="cat.term_id" :value="cat.term_id">{{ cat.name }}</option>
          </select>
        </div>
      </div>
      
      <div class="form-section">
        <h3 class="section-title">Описание</h3>
        
        <div class="form-group">
          <label class="form-label">Описание товара</label>
          <textarea v-model="form.description" rows="5" class="input" placeholder="Описание..."></textarea>
        </div>
        
        <div class="form-group">
          <label class="form-label">Характеристики</label>
          <div class="specs-editor">
            <div class="specs-list">
              <div class="spec-row" v-for="(spec, index) in specsArray" :key="index">
                <input
                  type="text"
                  v-model="spec.key"
                  class="input spec-key-input"
                  placeholder="Название (например Чистота)"
                >
                <input
                  type="text"
                  v-model="spec.value"
                  class="input spec-value-input"
                  placeholder="Значение (например 99.9%)"
                >
                <button type="button" @click="removeSpec(index)" class="btn-remove-spec">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            </div>
            <button type="button" @click="addSpec" class="btn-add-spec">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Добавить характеристику
            </button>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Дозировки, цены и остатки</label>
          <div class="specs-editor">
            <div class="specs-list">
              <div class="spec-row dosage-row" v-for="(item, index) in dosageVariants" :key="index">
                <input
                  type="text"
                  v-model="item.dosage"
                  class="input spec-key-input"
                  placeholder="Дозировка (например 10мг/3мл)"
                >
                <input
                  type="number"
                  v-model.number="item.quantity"
                  min="0"
                  class="input dosage-qty-input"
                  placeholder="Количество"
                >
                <input
                  type="number"
                  v-model.number="item.price"
                  min="0"
                  class="input dosage-price-input"
                  placeholder="Цена"
                >
                <button type="button" @click="removeDosage(index)" class="btn-remove-spec">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            </div>
            <div class="dosage-actions">
              <button type="button" @click="addDosage" class="btn-add-spec">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Добавить дозировку
              </button>
              <button type="button" @click="applyDosagesTotalToStock" class="btn btn-secondary btn-sync-stock">
                В общий остаток: {{ dosageTotal }}
              </button>
            </div>
          </div>
        </div>
        
        <div class="form-row" style="margin-top: 1.5rem;">
          <div class="form-group">
            <label class="form-label">Чистота</label>
            <input type="text" v-model="form.purity" class="input" placeholder="99.9%">
          </div>
          <div class="form-group">
            <label class="form-label">Объём</label>
            <input type="text" v-model="form.volume" class="input" placeholder="10 мл">
          </div>
          <div class="form-group">
            <label class="form-label">Страна</label>
            <input type="text" v-model="form.country" class="input" placeholder="США">
          </div>
        </div>
      </div>
      
      <div class="form-section">
        <h3 class="section-title">Изображение</h3>
        
        <div class="form-group">
          <label class="form-label">Фото товара</label>
          <div class="file-input-wrapper">
            <input type="file" @change="handleFileChange" accept="image/*" class="file-input">
            <div class="file-input-trigger">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
              </svg>
              <span>Выбрать изображение</span>
            </div>
          </div>
          <div v-if="form.image" class="image-preview">
            <img :src="form.image" alt="Preview">
            <button type="button" @click="removeImage" class="remove-image">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Галерея (несколько фото)</label>
          <div class="file-input-wrapper">
            <input type="file" @change="handleGalleryFilesChange" accept="image/*" multiple class="file-input">
            <div class="file-input-trigger">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
              </svg>
              <span>Добавить фото в галерею</span>
            </div>
          </div>
          <div v-if="galleryPreviewUrls.length" class="gallery-preview-grid">
            <div class="gallery-preview-item" v-for="(imageUrl, index) in galleryPreviewUrls" :key="`${imageUrl}-${index}`">
              <img :src="imageUrl" alt="Gallery preview">
              <button type="button" @click="removeGalleryImage(index)" class="remove-image">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div class="form-section">
        <h3 class="section-title">Настройки</h3>
        
        <div class="toggle-group">
          <label class="toggle">
            <input type="checkbox" v-model="form.featured">
            <span class="toggle-slider"></span>
            <span class="toggle-label">Рекомендуемый товар</span>
          </label>
        </div>
        
        <div class="toggle-group">
          <label class="toggle">
            <input type="checkbox" v-model="form.active">
            <span class="toggle-slider"></span>
            <span class="toggle-label">Активен (видим на сайте)</span>
          </label>
        </div>
        
        <div v-if="error" class="error-message">{{ error }}</div>
        <div v-if="success" class="success-message">{{ success }}</div>
        
        <div class="form-actions">
          <router-link to="/products" class="btn btn-secondary">Отмена</router-link>
          <button type="submit" class="btn btn-primary" :disabled="loading">
            {{ loading ? 'Сохранение...' : 'Сохранить' }}
          </button>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'

const route = useRoute()
const router = useRouter()

const API_URL = '/api/products'
const isEdit = computed(() => !!route.params.id)

const form = ref({
  title: '',
  sku: '',
  price: 0,
  comparePrice: null,
  stock: 0,
  categoryId: '',
  description: '',
  specs: {},
  purity: '',
  volume: '',
  country: '',
  featured: false,
  active: true,
  image: null
})

const specsArray = ref([])
const dosageVariants = ref([])
const categories = ref([])
const error = ref('')
const success = ref('')
const loading = ref(false)
const file = ref(null)
const galleryFiles = ref([])
const existingGalleryImages = ref([])
const galleryPreviewUrls = ref([])
const dosageTotal = computed(() =>
  dosageVariants.value.reduce((sum, item) => sum + Math.max(0, parseInt(item.quantity) || 0), 0)
)

async function fetchCategories() {
  const { data } = await axios.get(`/api/categories`)
  categories.value = data.categories
}

async function fetchProduct() {
  const { data } = await axios.get(`/api/admin/products/${route.params.id}`)
  const p = data.product
  form.value = {
    title: p.title,
    sku: p.sku || '',
    price: parseFloat(p.price),
    comparePrice: p.comparePrice ? parseFloat(p.comparePrice) : null,
    stock: p.stock,
    categoryId: p.categories?.[0]?.id || '',
    description: p.description,
    specs: p.specs || {},
    purity: p.purity || '',
    volume: p.volume || '',
    country: p.country || '',
    featured: p.featured,
    active: p.active,
    image: p.image
  }
  existingGalleryImages.value = Array.isArray(p.images) ? [...p.images] : []
  galleryFiles.value = []
  galleryPreviewUrls.value = [...existingGalleryImages.value]
  const specs = p.specs || {}
  specsArray.value = jsonToSpecsArray(specs)
  dosageVariants.value = parseDosageVariants(specs)
}

function handleFileChange(e) {
  file.value = e.target.files[0]
  if (file.value) {
    form.value.image = URL.createObjectURL(file.value)
  }
}

function removeImage() {
  form.value.image = null
  file.value = null
}

function handleGalleryFilesChange(e) {
  const incoming = Array.from(e.target.files || [])
  if (!incoming.length) return
  galleryFiles.value.push(...incoming)
  syncGalleryPreviewUrls()
}

function syncGalleryPreviewUrls() {
  const localUrls = galleryFiles.value.map(fileItem => URL.createObjectURL(fileItem))
  galleryPreviewUrls.value = [...existingGalleryImages.value, ...localUrls]
}

function removeGalleryImage(index) {
  if (index < existingGalleryImages.value.length) {
    existingGalleryImages.value.splice(index, 1)
  } else {
    const localIndex = index - existingGalleryImages.value.length
    galleryFiles.value.splice(localIndex, 1)
  }
  syncGalleryPreviewUrls()
}

function addSpec() {
  specsArray.value.push({ key: '', value: '' })
}

function removeSpec(index) {
  specsArray.value.splice(index, 1)
}

function addDosage() {
  dosageVariants.value.push({ dosage: '', quantity: 0, price: null })
}

function removeDosage(index) {
  dosageVariants.value.splice(index, 1)
}

function parseDosageVariants(specs) {
  if (!Array.isArray(specs?.dosages)) return []

  return specs.dosages
    .map(item => ({
      dosage: typeof item?.dosage === 'string' ? item.dosage : '',
      quantity: Math.max(0, parseInt(item?.quantity) || 0),
      price: item?.price !== undefined && item?.price !== null ? Math.max(0, parseFloat(item.price) || 0) : null
    }))
    .filter(item => item.dosage.trim() || item.quantity > 0)
}

function normalizeDosageVariants() {
  return dosageVariants.value
    .map(item => ({
      dosage: (item.dosage || '').trim(),
      quantity: Math.max(0, parseInt(item.quantity) || 0),
      price: item.price === '' || item.price === null || item.price === undefined
        ? null
        : Math.max(0, parseFloat(item.price) || 0)
    }))
    .filter(item => item.dosage || item.quantity > 0)
}

function applyDosagesTotalToStock() {
  form.value.stock = dosageTotal.value
}

function specsToJson() {
  const obj = {}
  specsArray.value.forEach(s => {
    const key = s.key.trim()
    if (key && key !== 'dosages') {
      obj[key] = s.value
    }
  })
  const dosages = normalizeDosageVariants()
  if (dosages.length) obj.dosages = dosages
  return JSON.stringify(obj)
}

function jsonToSpecsArray(obj) {
  if (!obj || typeof obj !== 'object') return []
  return Object.entries(obj)
    .filter(([key]) => key !== 'dosages')
    .map(([key, value]) => ({ key, value }))
}

async function handleSubmit() {
  error.value = ''
  success.value = ''
  loading.value = true
  
  try {
    const formData = new FormData()
    formData.append('title', form.value.title)
    formData.append('description', form.value.description)
    formData.append('price', form.value.price)
    if (form.value.comparePrice) formData.append('comparePrice', form.value.comparePrice)
    if (form.value.sku) formData.append('sku', form.value.sku)
    formData.append('stock', form.value.stock)
    formData.append('specs', specsToJson())
    formData.append('featured', form.value.featured)
    formData.append('active', form.value.active)
    if (form.value.purity) formData.append('purity', form.value.purity)
    if (form.value.volume) formData.append('volume', form.value.volume)
    if (form.value.country) formData.append('country', form.value.country)
    if (form.value.categoryId) formData.append('categories', JSON.stringify([form.value.categoryId]))
    if (file.value) formData.append('image', file.value)
    formData.append('existingImages', JSON.stringify(existingGalleryImages.value))
    galleryFiles.value.forEach(fileItem => formData.append('images', fileItem))
    
    if (isEdit.value) {
      await axios.put(`${API_URL}/${route.params.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      success.value = 'Товар обновлен!'
    } else {
      await axios.post(API_URL, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      success.value = 'Товар создан!'
      setTimeout(() => router.push('/products'), 1500)
    }
  } catch (e) {
    error.value = e.response?.data?.error || 'Ошибка сохранения'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchCategories()
  if (isEdit.value) fetchProduct()
})
</script>

<style scoped>
.page-header {
  margin-bottom: 2rem;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
  transition: var(--transition);
}

.back-link:hover {
  color: var(--accent);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0;
  padding: 0;
  overflow: hidden;
}

.form-section {
  padding: 2rem;
  border-right: 1px solid var(--border);
}

.form-section:last-child {
  border-right: none;
}

.form-section:first-child {
  border-radius: var(--radius) 0 0 var(--radius);
}

.form-section:last-child {
  border-radius: 0 var(--radius) var(--radius) 0;
}

.section-title {
  font-family: var(--font-display);
  font-size: 0.875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.file-input-wrapper {
  position: relative;
}

.file-input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.file-input-trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 2.5rem;
  background: var(--bg-secondary);
  border: 2px dashed var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  transition: var(--transition);
  text-align: center;
}

.file-input-wrapper:hover .file-input-trigger {
  border-color: var(--accent);
  color: var(--accent);
}

.image-preview {
  position: relative;
  margin-top: 1rem;
  display: inline-block;
}

.image-preview img {
  max-width: 100%;
  max-height: 200px;
  border-radius: var(--radius-sm);
  display: block;
}

.gallery-preview-grid {
  margin-top: 1rem;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
}

.gallery-preview-item {
  position: relative;
  border-radius: var(--radius-sm);
  overflow: hidden;
  border: 1px solid var(--border);
  background: var(--bg-secondary);
  aspect-ratio: 1;
}

.gallery-preview-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-image {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--danger);
  border-radius: 50%;
  color: white;
  border: 2px solid var(--bg-card);
}

.toggle-group {
  margin-bottom: 1rem;
}

.toggle {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
}

.toggle input {
  display: none;
}

.toggle-slider {
  position: relative;
  width: 48px;
  height: 26px;
  background: var(--bg-secondary);
  border-radius: 13px;
  transition: var(--transition);
  flex-shrink: 0;
}

.toggle-slider::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: 20px;
  height: 20px;
  background: var(--text-muted);
  border-radius: 50%;
  transition: var(--transition);
}

.toggle input:checked + .toggle-slider {
  background: var(--accent);
}

.toggle input:checked + .toggle-slider::after {
  left: 25px;
  background: white;
}

.toggle-label {
  font-size: 0.9375rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
}

.error-message {
  background: var(--danger);
  color: white;
  padding: 1rem;
  border-radius: var(--radius-sm);
  margin-top: 1rem;
}

.success-message {
  background: #22c55e22;
  color: #22c55e;
  padding: 1rem;
  border-radius: var(--radius-sm);
  margin-top: 1rem;
}

.font-mono {
  font-family: var(--font-body);
  font-size: 0.8125rem;
}

.specs-editor {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.specs-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.spec-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.spec-key-input {
  flex: 1;
  min-width: 100px;
}

.spec-value-input {
  flex: 2;
  min-width: 140px;
}

.dosage-qty-input {
  flex: 0 0 150px;
}

.dosage-price-input {
  flex: 0 0 150px;
}

.dosage-actions {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.75rem;
}

.btn-sync-stock {
  white-space: nowrap;
}

.btn-remove-spec {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--danger);
  border-radius: var(--radius-sm);
  color: white;
  flex-shrink: 0;
}

.btn-add-spec {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: var(--bg-secondary);
  border: 1px dashed var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-size: 0.875rem;
  transition: var(--transition);
  width: 100%;
}

.btn-add-spec:hover {
  border-color: var(--accent);
  color: var(--accent);
}

@media (max-width: 1024px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .form-section {
    border-right: none;
    border-bottom: 1px solid var(--border);
  }

  .form-section:last-child {
    border-bottom: none;
  }

  .form-section:first-child {
    border-radius: var(--radius) var(--radius) 0 0;
  }

  .form-section:last-child {
    border-radius: 0 0 var(--radius) var(--radius);
  }
}

@media (max-width: 640px) {
  .page-header {
    margin-bottom: 1.5rem;
  }

  .form-section {
    padding: 1.5rem 1rem;
  }

  .section-title {
    margin-bottom: 1rem;
    font-size: 0.75rem;
  }

  .form-row {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  .form-label {
    font-size: 0.8125rem;
  }

  .file-input-trigger {
    padding: 1.5rem;
  }

  .gallery-preview-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .form-actions {
    flex-direction: column-reverse;
    gap: 0.75rem;
    margin-top: 1rem;
  }

  .form-actions .btn {
    width: 100%;
    justify-content: center;
  }

  .spec-row {
    flex-wrap: wrap;
  }

  .spec-key-input,
  .spec-value-input,
  .dosage-qty-input,
  .dosage-price-input {
    flex: 1 1 100%;
    min-width: unset;
  }

  .dosage-actions {
    grid-template-columns: 1fr;
  }

  .btn-remove-spec {
    align-self: flex-end;
    margin-top: 0.25rem;
  }
}
</style>
