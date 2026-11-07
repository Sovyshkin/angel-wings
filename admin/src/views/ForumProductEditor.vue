<template>
  <div class="forum-admin__repeaters">
    <label class="forum-admin__card-toggle"><input v-model="settings.showAllCatalog" type="checkbox"> Автоматически показывать все активные товары каталога</label>
    <div class="forum-admin__repeaters-head">
      <div><h3>Карточки товаров</h3><p>Все активные товары берутся из каталога. Найдите товар, чтобы скрыть его или добавить в настройки. Настроенные карточки идут первыми.</p></div>
    </div>
    <input v-model.trim="search" class="forum-admin__search" type="search" placeholder="Поиск по названию товара" aria-label="Поиск товара в каталоге">
    <div v-if="!catalog.length" class="forum-admin__hint">Каталог пока не загрузился. Существующие настройки можно изменить ниже.</div>
    <div v-else class="forum-admin__catalog-list">
      <div v-for="product in filteredCatalog" :key="product.id" class="forum-admin__catalog-row">
        <img v-if="product.image" :src="catalogImage(product.image)" alt="" loading="lazy">
        <span class="forum-admin__catalog-title">{{ product.title }}<small>{{ isVisible(product) ? 'На лендинге' : 'Скрыт на лендинге' }}</small></span>
        <button type="button" class="forum-admin__catalog-visibility" @click="toggleProduct(product)">{{ isVisible(product) ? 'Скрыть' : 'Показать' }}</button>
        <button type="button" class="forum-admin__catalog-configure" @click="configureProduct(product)">{{ findOverride(product) ? 'Настроить' : 'Добавить в настройки' }}</button>
      </div>
      <p v-if="!filteredCatalog.length" class="forum-admin__hint">Товары по этому запросу не найдены.</p>
    </div>

    <div class="forum-admin__repeaters-head forum-admin__repeaters-head--sub"><div><h3>Настроенные карточки</h3><p>Здесь можно менять текст, изображения, видео, ссылку и порядок. Пустые поля берутся из каталога.</p></div></div>
    <details v-for="(item, index) in settings.items" :key="`${item.productId || item.title}-${index}`" class="forum-admin__card" :open="openProductId === String(item.productId || item.title)">
      <summary><span>{{ String(index + 1).padStart(2, '0') }}</span>{{ item.title || 'Товар из каталога' }}
        <span v-if="item.visible === false" class="forum-admin__hidden-tag">Скрыт</span>
        <span class="forum-admin__card-actions"><button type="button" :disabled="index === 0" @click.prevent.stop="move(index, -1)" aria-label="Поднять карточку">↑</button><button type="button" :disabled="index === settings.items.length - 1" @click.prevent.stop="move(index, 1)" aria-label="Опустить карточку">↓</button><button type="button" @click.prevent.stop="reset(index)">Сбросить</button></span>
      </summary>
      <div class="forum-admin__card-fields">
        <label class="forum-admin__card-toggle"><input v-model="item.visible" type="checkbox"> Показывать карточку</label>
        <p v-if="!catalog.some(product => String(product.id) === String(item.productId) || (!item.productId && normalize(product.title) === normalize(item.title)))" class="forum-admin__hint">Товар не найден среди активных товаров каталога. Карточка не показывается на лендинге.</p>
        <div v-for="field in editableFields" :key="field.key" class="forum-admin__field">
          <label :for="`forum-product-${index}-${field.key}`">{{ field.label }}</label>
          <textarea v-if="field.type === 'textarea'" :id="`forum-product-${index}-${field.key}`" v-model="item[field.key]" rows="3"></textarea>
          <template v-else-if="field.type === 'media'">
            <div v-if="item[field.key]" class="forum-admin__media-preview"><video v-if="field.key === 'video'" :src="previewMedia(item[field.key])" controls></video><img v-else :src="previewMedia(item[field.key])" alt="Предпросмотр"><button type="button" @click="item[field.key] = ''">Удалить</button></div>
            <div class="forum-admin__media-input"><input :id="`forum-product-${index}-${field.key}`" v-model="item[field.key]" type="text" placeholder="URL или путь к файлу"><label class="forum-admin__upload">{{ uploading === `products.items.${index}` ? 'Загрузка…' : 'Загрузить' }}<input type="file" :accept="field.key === 'video' ? 'video/mp4,video/webm' : 'image/jpeg,image/png,image/webp,image/gif'" hidden @change="uploadMedia($event, 'products', field.key, index)"></label></div>
          </template>
          <input v-else :id="`forum-product-${index}-${field.key}`" v-model="item[field.key]" type="text">
        </div>
      </div>
    </details>
  </div>
</template>
<script setup>
import { computed, ref } from 'vue'
const props = defineProps({ settings: Object, catalog: Array, uploadMedia: Function, previewMedia: Function, uploading: String })
const search = ref('')
const openProductId = ref('')
const editableFields = [
  { key: 'title', label: 'Название карточки' }, { key: 'category', label: 'Категория (пусто — из каталога)' },
  { key: 'price', label: 'Цена (пусто — из каталога)' }, { key: 'text', label: 'Описание (пусто — из каталога)', type: 'textarea' },
  { key: 'image', label: 'Изображение (пусто — из каталога)', type: 'media' }, { key: 'video', label: 'Видео', type: 'media' },
  { key: 'link', label: 'Ссылка (пусто — на товар в каталоге)' }
]
const normalize = value => String(value || '').replace(/\s+/g, ' ').trim().toLocaleLowerCase('ru-RU')
const catalogImage = url => import.meta.env.DEV && url.startsWith('/uploads/') ? `https://angel-wings.ru${url}` : url
const filteredCatalog = computed(() => (props.catalog || []).filter(product => normalize(product.title).includes(normalize(search.value))))
function findOverride(product) {
  return props.settings.items.find(item => item.productId ? String(item.productId) === String(product.id) : normalize(item.title) === normalize(product.title))
}
function isVisible(product) { const item = findOverride(product); return item?.visible !== false && (props.settings.showAllCatalog !== false || !!item) }
function ensureOverride(product) {
  let item = findOverride(product)
  if (item) { item.productId = String(product.id); return item }
  item = { productId: String(product.id), visible: true, title: product.title, category: '', price: '', text: '', image: '', video: '', link: '' }
  props.settings.items.push(item)
  return item
}
function toggleProduct(product) { const shown = isVisible(product); const item = ensureOverride(product); item.visible = !shown }
function configureProduct(product) { if (props.settings.items.length >= 200 && !findOverride(product)) return; const item = ensureOverride(product); openProductId.value = String(item.productId) }
function move(index, direction) { const items = props.settings.items; const next = index + direction; if (next < 0 || next >= items.length) return; [items[index], items[next]] = [items[next], items[index]] }
function reset(index) { props.settings.items.splice(index, 1) }
</script>
