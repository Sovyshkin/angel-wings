<template>
  <div class="blog-editor"><div class="blog-editor__top"><router-link to="/blog">← К статьям</router-link><div class="blog-editor__actions"><span class="blog-editor__save-state">{{ saveState }}</span><button type="button" @click="preview = !preview">{{ preview ? 'Редактор' : 'Предпросмотр' }}</button><button type="button" @click="save('DRAFT')" :disabled="saving">Сохранить черновик</button><button type="button" class="blog-admin__primary" @click="save('PUBLISHED')" :disabled="saving">{{ form.status === 'PUBLISHED' ? 'Обновить' : 'Опубликовать' }}</button></div></div>
    <p v-if="error" class="blog-admin__error">{{ error }}</p>
    <div v-if="preview" class="blog-editor__preview"><img v-if="form.cover" :src="form.cover" :alt="form.coverAlt"><span>{{ selectedCategory?.name || 'Без категории' }}</span><h1>{{ form.title || 'Заголовок статьи' }}</h1><p>{{ form.excerpt }}</p><div class="blog-editor__preview-body" v-html="previewHtml"></div></div>
    <div v-else class="blog-editor__layout"><div class="blog-editor__main"><div class="blog-editor__cover" :style="form.cover ? { backgroundImage: `url(${form.cover})` } : {}"><div v-if="!form.cover">Обложка статьи</div><label>↑ {{ form.cover ? 'Заменить обложку' : 'Загрузить обложку' }}<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden @change="uploadCover"></label><button v-if="form.cover" type="button" @click="form.cover = ''; form.coverAlt = ''">Удалить</button></div>
      <input v-model="form.title" class="blog-editor__title" placeholder="Заголовок статьи" aria-label="Заголовок статьи"><textarea v-model="form.excerpt" class="blog-editor__excerpt" rows="2" placeholder="Краткое описание для карточки и читателя…" aria-label="Краткое описание"></textarea>
      <div class="blog-editor__toolbar" role="toolbar" aria-label="Форматирование текста"><button type="button" title="Обычный текст" @mousedown.prevent @click="formatBlock('p')">Текст</button><button type="button" title="Заголовок 2" @mousedown.prevent @click="formatBlock('h2')">H2</button><button type="button" title="Заголовок 3" @mousedown.prevent @click="formatBlock('h3')">H3</button><button type="button" title="Жирный" @mousedown.prevent @click="command('bold')"><b>B</b></button><button type="button" title="Курсив" @mousedown.prevent @click="command('italic')"><i>I</i></button><button type="button" title="Маркированный список" @mousedown.prevent @click="command('insertUnorderedList')">• Список</button><button type="button" title="Нумерованный список" @mousedown.prevent @click="command('insertOrderedList')">1. Список</button><button type="button" title="Цитата" @mousedown.prevent @click="formatBlock('blockquote')">❝</button><button type="button" title="Ссылка" @mousedown.prevent @click="addLink">🔗</button><button type="button" title="Таблица" @mousedown.prevent @click="addTable">▦</button><label title="Вставить изображение">▧<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden @change="uploadInline"></label></div>
      <div ref="editable" class="blog-editor__editable" contenteditable="true" role="textbox" aria-label="Текст статьи" aria-multiline="true" data-placeholder="Начните писать статью. Перетащите изображение сюда или используйте панель инструментов…" @input="onContentInput" @keyup="rememberSelection" @mouseup="rememberSelection" @dragover.prevent @drop.prevent="handleDrop" @paste="handlePaste"></div><p class="blog-editor__tip">Изображения можно перетащить в текст. Для каждого изображения требуется ALT-описание.</p>
    </div><aside class="blog-editor__side"><section><h3>Публикация</h3><label>Статус <strong>{{ form.status === 'PUBLISHED' ? 'Опубликована' : 'Черновик' }}</strong></label><label>Категория<select v-model="form.categoryId"><option :value="null">Выберите категорию</option><option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option></select></label><label>Автор<input v-model="form.author" maxlength="100"></label><label class="blog-editor__check"><input v-model="form.featured" type="checkbox"> Рекомендуемая статья</label><label>ALT обложки<input v-model="form.coverAlt" placeholder="Что изображено на обложке"></label></section><section><h3>SEO</h3><label>URL /blog/<input v-model="form.slug" placeholder="Создаётся из заголовка"></label><label>Meta Title <span>{{ effectiveTitle.length }}/60</span><input v-model="form.metaTitle" :placeholder="form.title || 'Название статьи'"></label><label>Meta Description <span>{{ effectiveDescription.length }}/160</span><textarea v-model="form.metaDescription" :placeholder="form.excerpt || 'Краткое описание'" rows="3"></textarea></label><div class="blog-editor__seo"><strong>SEO-подсказки</strong><p v-for="hint in seoHints" :key="hint">{{ hint }}</p><p v-if="!seoHints.length">✓ Основные поля готовы</p></div></section></aside></div>
  </div>
</template>
<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import './blogAdmin.css'

const route = useRoute(), router = useRouter(), editable = ref(null), categories = ref([]), preview = ref(false), error = ref(''), saving = ref(false), saveState = ref('Не сохранено'), loading = ref(true)
const form = reactive({ title: '', slug: '', excerpt: '', content: '', cover: '', coverAlt: '', author: 'ANGEL WINGS', categoryId: null, status: 'DRAFT', featured: false, metaTitle: '', metaDescription: '' })
let timer = null, saveQueue = Promise.resolve(), suppressWatch = false
let savedRange = null
const selectedCategory = computed(() => categories.value.find(cat => cat.id === Number(form.categoryId)))
const effectiveTitle = computed(() => form.metaTitle || form.title)
const effectiveDescription = computed(() => form.metaDescription || form.excerpt)
const seoHints = computed(() => [!form.title && 'Добавьте заголовок', !form.excerpt && 'Добавьте описание для карточки', !form.categoryId && 'Выберите категорию', !form.cover && 'Добавьте обложку', form.cover && !form.coverAlt && 'Заполните ALT обложки', effectiveTitle.value.length > 60 && 'Meta Title длиннее 60 символов', effectiveDescription.value.length > 160 && 'Meta Description длиннее 160 символов', !/<h2[ >]/i.test(form.content) && 'Добавьте H2 для структуры текста', /<img\b(?![^>]*\balt=)/i.test(form.content) && 'Укажите ALT для изображений'].filter(Boolean))
const previewHtml = computed(() => form.content.replace(/<script[\s\S]*?<\/script>/gi, ''))
async function init() {
  try {
    const { data } = await axios.get('/api/blog/categories'); categories.value = data
    if (route.params.id) { const result = await axios.get(`/api/blog/admin/posts/${route.params.id}`); Object.assign(form, result.data); await nextTick(); editable.value.innerHTML = form.content }
    saveState.value = route.params.id ? 'Все изменения сохранены' : 'Новая статья'
  } catch { error.value = 'Не удалось загрузить статью' }
  finally { loading.value = false }
}
async function persist(status) {
  const payload = { ...form, status }
  const action = async () => {
    saving.value = true; error.value = ''; saveState.value = 'Сохраняем…'
    try {
      const { data } = route.params.id ? await axios.put(`/api/blog/admin/posts/${route.params.id}`, payload) : await axios.post('/api/blog/admin/posts', payload)
      suppressWatch = true; form.slug = data.slug; form.status = data.status; form.metaTitle = data.metaTitle; form.metaDescription = data.metaDescription; suppressWatch = false
      if (!route.params.id) await router.replace(`/blog/${data.id}/edit`)
      saveState.value = 'Сохранено ' + new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    } catch (err) { error.value = err.response?.data?.error || 'Не удалось сохранить статью'; saveState.value = 'Ошибка сохранения' }
    finally { saving.value = false }
  }
  saveQueue = saveQueue.then(action, action)
  return saveQueue
}
function save(status) { clearTimeout(timer); return persist(status) }
watch(form, () => { if (loading.value || suppressWatch) return; saveState.value = 'Есть несохранённые изменения'; clearTimeout(timer); timer = setTimeout(() => persist(form.status), 1800) }, { deep: true })
function onContentInput() { form.content = editable.value.innerHTML; rememberSelection() }
function rememberSelection() { const selection = window.getSelection(); if (selection?.rangeCount && editable.value?.contains(selection.anchorNode)) savedRange = selection.getRangeAt(0).cloneRange() }
function focusEditor() { editable.value?.focus(); if (savedRange) { const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(savedRange) } }
function command(name, value) { focusEditor(); document.execCommand(name, false, value); onContentInput() }
function formatBlock(tag) { command('formatBlock', tag) }
function addLink() { const href = prompt('Адрес ссылки (https://):'); if (href && /^https?:\/\//i.test(href)) command('createLink', href) }
function addTable() { focusEditor(); document.execCommand('insertHTML', false, '<table><tbody><tr><th>Заголовок 1</th><th>Заголовок 2</th></tr><tr><td>Текст</td><td>Текст</td></tr></tbody></table><p><br></p>'); onContentInput() }
async function uploadFile(file) { const data = new FormData(); data.append('image', file); const result = await axios.post('/api/blog/admin/images', data); return result.data.url }
async function uploadCover(event) { const file = event.target.files?.[0]; if (!file) return; try { form.cover = await uploadFile(file); if (!form.coverAlt) form.coverAlt = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ') } catch { error.value = 'Не удалось загрузить обложку (максимум 5 МБ)' } event.target.value = '' }
async function insertImage(file) { const range = savedRange?.cloneRange(); const alt = prompt('ALT: кратко опишите изображение'); if (!alt?.trim()) return; try { const url = await uploadFile(file); savedRange = range; focusEditor(); document.execCommand('insertHTML', false, `<figure><img src="${url}" alt="${alt.replace(/[<>&"']/g, '')}"><figcaption></figcaption></figure><p><br></p>`); onContentInput() } catch { error.value = 'Не удалось загрузить изображение (максимум 5 МБ)' } }
async function uploadInline(event) { const file = event.target.files?.[0]; if (file) await insertImage(file); event.target.value = '' }
async function handleDrop(event) { const file = [...event.dataTransfer.files].find(file => file.type.startsWith('image/')); if (!file) return; savedRange = document.caretRangeFromPoint?.(event.clientX, event.clientY) || savedRange; await insertImage(file) }
function handlePaste(event) { const html = event.clipboardData?.getData('text/html'); if (html) { event.preventDefault(); document.execCommand('insertText', false, event.clipboardData.getData('text/plain')); onContentInput() } }
onMounted(init)
onBeforeUnmount(() => { clearTimeout(timer); if (saveState.value === 'Есть несохранённые изменения') persist(form.status) })
</script>
