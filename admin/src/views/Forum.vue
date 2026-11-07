<template>
  <div class="forum-admin">
    <div class="forum-admin__heading"><div><span class="forum-admin__eyebrow">ANGEL WINGS / FORUM</span><h1>Форум</h1><p>Лендинг, его блоки и заявки в одном месте.</p></div><a :href="forumPreviewUrl" target="_blank" rel="noopener" class="forum-admin__preview">Открыть лендинг ↗</a></div>
    <div class="forum-admin__tabs"><button :class="{active: tab === 'content'}" @click="tab = 'content'">Редактор лендинга</button><button :class="{active: tab === 'applications'}" @click="tab = 'applications'; loadApplications()">Заявки <span v-if="newCount">{{ newCount }}</span></button></div>

    <div v-if="tab === 'content'" class="forum-admin__layout">
      <aside class="forum-admin__sidebar"><div class="forum-admin__sidebar-title">Блоки страницы <small>{{ visibleCount }}/8 включено</small></div><button v-for="(section, key) in content" :key="key" class="forum-admin__section" :class="{ active: currentSection === key }" @click="currentSection = key"><span class="forum-admin__section-index">{{ sectionNumber(key) }}</span><span>{{ sectionLabels[key] }}<small>{{ section.visible ? 'На странице' : 'Скрыт' }}</small></span><span class="forum-admin__section-arrow">→</span></button><p class="forum-admin__hint">Изменения появятся на сайте после сохранения.</p></aside>
      <main v-if="content[currentSection]" class="forum-admin__editor"><div class="forum-admin__editor-header"><div><span>БЛОК {{ sectionNumber(currentSection) }} / 08</span><h2>{{ sectionLabels[currentSection] }}</h2></div><label class="forum-admin__switch"><input v-model="content[currentSection].visible" type="checkbox"><span></span><strong>{{ content[currentSection].visible ? 'Показывать' : 'Скрыт' }}</strong></label></div>
        <div v-for="field in sectionFields[currentSection]" :key="field.key" class="forum-admin__field"><label :for="`forum-${currentSection}-${field.key}`">{{ field.label }}</label><textarea v-if="field.type === 'textarea'" :id="`forum-${currentSection}-${field.key}`" v-model="content[currentSection][field.key]" rows="4" :placeholder="field.label"></textarea><template v-else-if="field.type === 'media'"><div v-if="content[currentSection][field.key]" class="forum-admin__media-preview"><video v-if="field.key === 'video'" :src="previewMedia(content[currentSection][field.key])" controls></video><img v-else :src="previewMedia(content[currentSection][field.key])" alt="Предпросмотр"><button type="button" @click="content[currentSection][field.key] = ''">Удалить</button></div><div class="forum-admin__media-input"><input :id="`forum-${currentSection}-${field.key}`" v-model="content[currentSection][field.key]" type="url" :placeholder="field.key === 'video' ? 'https://.../video.mp4' : 'https://.../image.webp'"><label class="forum-admin__upload">{{ uploading === `${currentSection}.${field.key}` ? 'Загрузка…' : 'Загрузить файл' }}<input type="file" :accept="field.key === 'video' ? 'video/mp4,video/webm' : 'image/jpeg,image/png,image/webp,image/gif'" hidden @change="uploadMedia($event, currentSection, field.key)"></label></div><small>Можно вставить HTTPS ссылку или загрузить файл. Видео: MP4/WEBM до 50 МБ.</small></template><input v-else :id="`forum-${currentSection}-${field.key}`" v-model="content[currentSection][field.key]" type="text" :placeholder="field.label"></div>
        <div v-if="currentSection === 'hero'" class="forum-admin__repeaters">
          <label class="forum-admin__card-toggle"><input v-model="content.hero.penVisible" type="checkbox"> Показывать главный объект (ручку или видео)</label>
          <div class="forum-admin__repeaters-head"><div><h3>Объекты главного блока</h3><p>У каждого объекта можно сменить изображение для тёмной и светлой темы или скрыть его.</p></div></div>
          <div class="forum-admin__objects">
            <article v-for="(object, index) in content.hero.objects" :key="object.name" class="forum-admin__object">
              <div class="forum-admin__object-preview"><img v-if="object.image" :src="previewMedia(object.image)" :alt="object.label"><span v-else>Нет изображения</span></div>
              <div class="forum-admin__object-controls">
                <div class="forum-admin__object-head"><strong>{{ object.label }}</strong><label><input v-model="object.visible" type="checkbox"> Показывать</label></div>
                <label class="forum-admin__object-label">Тёмная тема</label>
                <div class="forum-admin__media-input"><input v-model="object.image" type="text" :aria-label="`Изображение для тёмной темы: ${object.label}`" placeholder="URL или путь к файлу"><label class="forum-admin__upload">{{ uploading === `hero.objects.${index}` ? 'Загрузка…' : 'Загрузить' }}<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden @change="uploadMedia($event, 'hero', 'image', index, 'objects')"></label></div>
                <label class="forum-admin__object-label">Светлая тема</label>
                <div class="forum-admin__media-input"><input v-model="object.lightImage" type="text" :aria-label="`Изображение для светлой темы: ${object.label}`" placeholder="URL или путь к файлу"><label class="forum-admin__upload">{{ uploading === `hero.objects.${index}` ? 'Загрузка…' : 'Загрузить' }}<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden @change="uploadMedia($event, 'hero', 'lightImage', index, 'objects')"></label></div>
              </div>
            </article>
          </div>
          <div class="forum-admin__repeaters-head forum-admin__repeaters-head--sub"><div><h3>Фоновые объекты страницы</h3><p>Композиция остаётся на своих местах. Можно заменить или скрыть каждый тип молекулы и волны.</p></div></div>
          <div class="forum-admin__objects">
            <article v-for="(asset, index) in content.hero.sceneAssets" :key="asset.name" class="forum-admin__object">
              <div class="forum-admin__object-preview"><img v-if="asset.image" :src="previewMedia(asset.image)" :alt="asset.name"><span v-else>Нет изображения</span></div>
              <div class="forum-admin__object-controls"><div class="forum-admin__object-head"><strong>{{ asset.label }}</strong><label><input v-model="asset.visible" type="checkbox"> Показывать</label></div><div class="forum-admin__media-input"><input v-model="asset.image" type="text" :aria-label="`Фоновый объект: ${asset.label}`" placeholder="URL или путь к файлу"><label class="forum-admin__upload">{{ uploading === `hero.sceneAssets.${index}` ? 'Загрузка…' : 'Загрузить' }}<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden @change="uploadMedia($event, 'hero', 'image', index, 'sceneAssets')"></label></div></div>
            </article>
          </div>
        </div>
        <div v-if="['advantages', 'events'].includes(currentSection)" class="forum-admin__repeaters">
          <div class="forum-admin__repeaters-head"><div><h3>{{ currentSection === 'events' ? 'События' : 'Преимущества' }}</h3><p>Карточки можно добавлять, менять местами и скрывать без удаления.</p></div><button type="button" :disabled="content[currentSection].items.length >= 12" @click="addItem">+ Добавить карточку</button></div>
          <details v-for="(item, index) in content[currentSection].items" :key="index" class="forum-admin__card" :open="index === 0">
            <summary><span>{{ String(index + 1).padStart(2, '0') }}</span>{{ item.title || 'Новая карточка' }}<span v-if="item.visible === false" class="forum-admin__hidden-tag">Скрыта</span><span class="forum-admin__card-actions"><button type="button" :disabled="index === 0" @click.prevent.stop="moveItem(index, -1)" aria-label="Поднять карточку">↑</button><button type="button" :disabled="index === content[currentSection].items.length - 1" @click.prevent.stop="moveItem(index, 1)" aria-label="Опустить карточку">↓</button><button type="button" @click.prevent.stop="removeItem(index)">Удалить</button></span></summary>
            <div class="forum-admin__card-fields">
              <label class="forum-admin__card-toggle"><input v-model="item.visible" type="checkbox"> Показывать карточку на лендинге</label>
              <div v-for="field in itemFields[currentSection]" :key="field.key" class="forum-admin__field">
                <label :for="`forum-item-${currentSection}-${index}-${field.key}`">{{ field.label }}</label>
                <textarea v-if="field.type === 'textarea'" :id="`forum-item-${currentSection}-${index}-${field.key}`" v-model="item[field.key]" rows="3"></textarea>
                <select v-else-if="field.key === 'icon'" :id="`forum-item-${currentSection}-${index}-${field.key}`" v-model="item.icon"><option value="flask">Колба</option><option value="layers">Слои</option><option value="people">Люди</option><option value="network">Энергия</option></select>
                <template v-else-if="field.type === 'media'"><div v-if="item[field.key]" class="forum-admin__media-preview"><video v-if="field.key === 'video'" :src="previewMedia(item[field.key])" controls></video><img v-else :src="previewMedia(item[field.key])" alt="Предпросмотр"><button type="button" @click="item[field.key] = ''">Удалить</button></div><div class="forum-admin__media-input"><input :id="`forum-item-${currentSection}-${index}-${field.key}`" v-model="item[field.key]" type="text" placeholder="URL или путь к файлу"><label class="forum-admin__upload">{{ uploading === `${currentSection}.items.${index}` ? 'Загрузка…' : 'Загрузить' }}<input type="file" :accept="field.key === 'video' ? 'video/mp4,video/webm' : 'image/jpeg,image/png,image/webp,image/gif'" hidden @change="uploadMedia($event, currentSection, field.key, index)"></label></div></template>
                <input v-else :id="`forum-item-${currentSection}-${index}-${field.key}`" v-model="item[field.key]" type="text">
              </div>
            </div>
          </details>
        </div>
        <ForumProductEditor v-if="currentSection === 'products'" :settings="content.products" :catalog="catalogProducts" :upload-media="uploadMedia" :preview-media="previewMedia" :uploading="uploading" />
        <div v-if="currentSection === 'about'" class="forum-admin__repeaters">
          <div class="forum-admin__repeaters-head">
            <div><h3>Показатели компании</h3><p>Добавьте подтверждённые значения или скройте отдельную карточку.</p></div>
            <button type="button" :disabled="content.about.stats.length >= 12" @click="addStat">+ Добавить показатель</button>
          </div>
          <article v-for="(stat, index) in content.about.stats" :key="index" class="forum-admin__form-field forum-admin__stat">
            <label class="forum-admin__stat-visible"><input v-model="stat.visible" type="checkbox"> Показывать</label>
            <label class="forum-admin__stat-field">Значение<input v-model="stat.value" type="text" placeholder="Подтверждённое число"></label>
            <label class="forum-admin__stat-field">Подпись<input v-model="stat.label" type="text" placeholder="Например, продуктов"></label>
            <button type="button" class="forum-admin__text-button forum-admin__stat-remove" @click="content.about.stats.splice(index, 1)">Удалить</button>
          </article>
        </div>
        <div v-if="currentSection === 'form'" class="forum-admin__repeaters">
          <div class="forum-admin__repeaters-head">
            <div><h3>Поля заявки</h3><p>Настройте подписи, обязательность, видимость и варианты ответов.</p></div>
            <button type="button" :disabled="content.form.fields.length >= 15" @click="addCustomField">+ Добавить поле</button>
          </div>
          <article v-for="field in content.form.fields" :key="field.key" class="forum-admin__form-field forum-admin__form-field--editor">
            <strong>{{ formFieldNames[field.key] || 'Доп. поле' }}</strong>
            <div class="forum-admin__form-field-inputs" :class="{ 'is-single': field.type === 'multiselect' }">
              <label>Подпись<input v-model="field.label" type="text"></label>
              <label v-if="field.type !== 'multiselect'">Подсказка<input v-model="field.placeholder" type="text"></label>
            </div>
            <div v-if="Array.isArray(field.options)" class="forum-admin__field-options">
              <span>Варианты ответа</span>
              <div v-for="(option, index) in field.options" :key="index" class="forum-admin__field-option">
                <input v-model="field.options[index]" type="text" placeholder="Новый вариант" :aria-label="`Вариант ${index + 1} для поля ${field.label}`">
                <button type="button" :disabled="field.options.length <= 1" @click="field.options.splice(index, 1)">Удалить</button>
              </div>
              <button type="button" :disabled="field.options.length >= 12" @click="field.options.push('')">+ Добавить вариант</button>
            </div>
            <div class="forum-admin__form-field-toggles">
              <label v-if="!['name','email','phone'].includes(field.key)"><input v-model="field.visible" type="checkbox"> Показывать</label>
              <span v-else>Обязательное поле</span>
              <label v-if="!['name','email','phone'].includes(field.key)"><input v-model="field.required" type="checkbox"> Обязательное</label>
              <button v-if="field.key.startsWith('custom_')" type="button" class="forum-admin__text-button" @click="removeCustomField(field.key)">Удалить поле</button>
            </div>
          </article>
          <p class="forum-admin__hint">Согласие на обработку данных обязательно для отправки заявки.</p>
        </div>
        <div class="forum-admin__save"><span v-if="saveMessage" :class="{ error: saveError }" role="status">{{ saveMessage }}</span><button type="button" :disabled="saving" @click="saveContent">{{ saving ? 'Сохранение…' : 'Сохранить изменения' }}</button></div>
      </main>
      <div v-else class="forum-admin__editor">{{ contentError || 'Загружаем содержимое…' }}</div>
    </div>

    <div v-else class="forum-admin__applications">
      <div class="forum-admin__application-head">
        <div><h2>Заявки с форума</h2><p>Всего: {{ total }} · Новых: {{ newCount }}</p></div>
        <select v-model="statusFilter" aria-label="Фильтр заявок по статусу" @change="offset = 0; loadApplications()">
          <option value="">Все статусы</option>
          <option value="NEW">Новые</option>
          <option value="IN_PROGRESS">В работе</option>
          <option value="DONE">Завершены</option>
          <option value="ARCHIVED">Архив</option>
        </select>
      </div>
      <p v-if="applicationsError" class="forum-admin__error">{{ applicationsError }}</p>
      <p v-else-if="loadingApplications">Загружаем заявки…</p>
      <div v-else-if="!applications.length" class="forum-admin__empty">Заявок пока нет.</div>
      <div v-else class="forum-admin__application-list">
        <article v-for="item in applications" :key="item.id" class="forum-admin__application">
          <header>
            <div>
              <span class="forum-admin__application-meta">ЗАЯВКА #{{ item.id }} · {{ formatDate(item.createdAt) }}</span>
              <span class="forum-admin__application-name-label">ФИО</span>
              <h3>{{ item.name }}</h3>
            </div>
            <span class="forum-admin__status" :class="item.status.toLowerCase()">{{ statusNames[item.status] }}</span>
          </header>
          <dl class="forum-admin__application-details">
            <div><dt>Телефон</dt><dd><a v-if="item.phone" :href="`tel:${item.phone}`">{{ item.phone }}</a><span v-else>—</span></dd></div>
            <div><dt>Почта</dt><dd><a v-if="item.email" :href="`mailto:${item.email}`">{{ item.email }}</a><span v-else>—</span></dd></div>
            <div><dt>Компания / организация</dt><dd>{{ item.company || '—' }}</dd></div>
            <div><dt>Должность</dt><dd>{{ item.position || '—' }}</dd></div>
            <div v-for="(field, index) in applicationExtraFields(item)" :key="index"><dt>{{ field.label }}</dt><dd>{{ field.value }}</dd></div>
          </dl>
          <div class="forum-admin__application-controls">
            <label>Внутренняя заметка<textarea v-model="item.adminNote" rows="2" placeholder="Комментарий для команды"></textarea></label>
            <label>Статус<select v-model="item.status"><option v-for="(label, status) in statusNames" :key="status" :value="status">{{ label }}</option></select></label>
            <button :disabled="savingApplication === item.id" @click="saveApplication(item)">{{ savingApplication === item.id ? 'Сохранение…' : 'Сохранить' }}</button>
          </div>
        </article>
      </div>
      <div v-if="total > 30" class="forum-admin__pagination">
        <button :disabled="offset === 0" @click="offset -= 30; loadApplications()">← Назад</button>
        <span>{{ offset + 1 }}–{{ Math.min(offset + 30, total) }} из {{ total }}</span>
        <button :disabled="offset + 30 >= total" @click="offset += 30; loadApplications()">Вперёд →</button>
      </div>
    </div>
  </div>
</template>
<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import axios from 'axios'
import ForumProductEditor from './ForumProductEditor.vue'
const tab = ref('content')
const content = reactive({})
const contentError = ref('')
const currentSection = ref('hero')
const saving = ref(false)
const saveMessage = ref('')
const saveError = ref(false)
const uploading = ref('')
const applications = ref([])
const catalogProducts = ref([])
const applicationsError = ref('')
const loadingApplications = ref(false)
const savingApplication = ref(null)
const statusFilter = ref('')
const offset = ref(0)
const total = ref(0)
const newCount = ref(0)
const sectionLabels = { hero: 'Hero · главный блок', advantages: 'Преимущества', products: 'Товары', about: 'Кто мы / О нас', events: 'Мероприятия / События', cta: 'CTA-баннер', form: 'Форма заявки', footer: 'Подвал' }
const sectionOrder = Object.keys(sectionLabels)
const sectionNumber = key => String(sectionOrder.indexOf(key) + 1).padStart(2, '0')
const visibleCount = computed(() => Object.values(content).filter(section => section.visible).length)
const title = { key: 'title', label: 'Заголовок' }
const eyebrow = { key: 'eyebrow', label: 'Надпись над заголовком' }
const description = { key: 'description', label: 'Описание', type: 'textarea' }
const image = { key: 'image', label: 'Изображение', type: 'media' }
const video = { key: 'video', label: 'Видео', type: 'media' }
const button = { key: 'button', label: 'Текст кнопки' }
const link = { key: 'link', label: 'Ссылка кнопки' }
const navLabel = { key: 'navLabel', label: 'Название в меню' }
const sectionFields = { hero: [navLabel, { ...image, key: 'logo', label: 'Логотип в шапке' }, eyebrow, title, description, { key: 'date', label: 'Дата форума (подтверждённая)' }, { key: 'place', label: 'Место проведения (подтверждённое)' }, button, { key: 'secondaryButton', label: 'Вторая кнопка Hero' }, { key: 'secondaryLink', label: 'Ссылка второй кнопки' }, { key: 'programLabel', label: 'Текст кнопки программы' }, { key: 'programLink', label: 'Ссылка на программу' }, { ...image, key: 'background', label: 'Фон сцены — тёмная тема' }, { ...image, key: 'lightBackground', label: 'Фон сцены — светлая тема' }, { ...image, label: 'Главный объект — изображение' }, { ...video, label: 'Главный объект — видео' }], advantages: [navLabel, eyebrow, title, description], products: [navLabel, eyebrow, title, description, { key: 'catalogButton', label: 'Кнопка каталога' }, { key: 'catalogLink', label: 'Ссылка на каталог' }], about: [navLabel, eyebrow, title, description, button, link, image, video], events: [navLabel, eyebrow, title, description, { key: 'datePendingLabel', label: 'Текст при отсутствии даты' }, { key: 'placePendingLabel', label: 'Текст при отсутствии места' }], cta: [eyebrow, title, description, button, image, video], form: [navLabel, { key: 'navButton', label: 'Кнопка в шапке' }, eyebrow, title, description, { key: 'stepContactTitle', label: 'Шаг 1 — контакты' }, { key: 'stepProfileTitle', label: 'Шаг 2 — о вас' }, { key: 'stepInterestsTitle', label: 'Шаг 3 — интересы' }, { key: 'nextButton', label: 'Кнопка продолжения' }, { key: 'backButton', label: 'Кнопка возврата' }, button, { key: 'success', label: 'Сообщение после отправки' }, { key: 'policyText', label: 'Текст согласия перед ссылкой' }, { key: 'policyLabel', label: 'Текст ссылки на политику' }, { key: 'policyLink', label: 'Ссылка на политику' }, { ...image, key: 'topMolecule', label: 'Декор формы сверху' }, { ...image, key: 'bottomMolecule', label: 'Декор формы снизу' }], footer: [{ ...image, key: 'logo', label: 'Логотип в подвале' }, description, { key: 'navHeading', label: 'Заголовок навигации' }, { key: 'infoHeading', label: 'Заголовок информации' }, { key: 'contactsHeading', label: 'Заголовок контактов' }, { key: 'mainSiteLabel', label: 'Текст ссылки на основной сайт' }, { key: 'privacyLabel', label: 'Текст политики' }, { key: 'telegramLabel', label: 'Текст Telegram' }, { key: 'email', label: 'Email' }, { key: 'phone', label: 'Телефон' }, { key: 'copyright', label: 'Строка копирайта' }, { key: 'mainSite', label: 'Адрес основного сайта' }, { key: 'telegram', label: 'Ссылка Telegram' }, { key: 'privacyLink', label: 'Ссылка политики' }] }
sectionFields.cta = [eyebrow, title, description, button, { ...image, label: 'Фон баннера' }, video, { ...image, key: 'leftMolecule', label: 'Молекула слева' }, { ...image, key: 'rightMolecule', label: 'Молекула справа' }]
const itemFields = { advantages: [title, { key: 'icon', label: 'Иконка' }, { key: 'text', label: 'Описание', type: 'textarea' }, image], events: [title, { key: 'date', label: 'Дата (после подтверждения)' }, { key: 'place', label: 'Место или формат (после подтверждения)' }, image, video, link] }
const formFieldNames = { name: 'ФИО', phone: 'Телефон', email: 'Email', city: 'Город / регион', role: 'Кто вы?', position: 'Специальность / должность', company: 'Организация / место работы', topics: 'Интересующие темы' }
const statusNames = { NEW: 'Новая', IN_PROGRESS: 'В работе', DONE: 'Завершена', ARCHIVED: 'Архив' }
const forumPreviewUrl = ['localhost', '127.0.0.1'].includes(window.location.hostname) ? `${window.location.protocol}//${window.location.hostname}:5185/` : (import.meta.env.VITE_FORUM_URL || 'https://forum.angel-wings.ru/')
const previewMedia = url => url?.startsWith('/uploads/') ? url : url?.startsWith('/') ? `/api/forum/preview-assets${url}` : url
const formatDate = value => new Date(value).toLocaleString('ru-RU')
function applicationExtraFields(item) {
  return String(item.message || '').split('\n').map(line => {
    const separator = line.indexOf(': ')
    return separator > 0
      ? { label: line.slice(0, separator), value: line.slice(separator + 2) }
      : { label: 'Дополнительно', value: line }
  }).filter(field => field.value.trim())
}
async function loadContent() { try { const { data } = await axios.get('/api/forum'); Object.assign(content, data.content) } catch { contentError.value = 'Не удалось загрузить содержимое лендинга.' } }
async function saveContent() { saving.value = true; saveMessage.value = ''; try { const { data } = await axios.put('/api/forum/admin/content', { content }); Object.assign(content, data.content); saveMessage.value = 'Изменения сохранены и видны на лендинге.'; saveError.value = false } catch (error) { saveMessage.value = error.response?.data?.error || 'Не удалось сохранить изменения.'; saveError.value = true } finally { saving.value = false } }
function addItem() { const shape = Object.fromEntries(itemFields[currentSection.value].map(field => [field.key, ''])); shape.visible = true; if (currentSection.value === 'advantages') shape.icon = 'flask'; content[currentSection.value].items.push(shape) }
function removeItem(index) { content[currentSection.value].items.splice(index, 1) }
function moveItem(index, direction) { const items = content[currentSection.value].items; const next = index + direction; if (next < 0 || next >= items.length) return; [items[index], items[next]] = [items[next], items[index]] }
function addStat() { content.about.stats.push({ visible: true, value: '', label: '' }) }
function addCustomField() { content.form.fields.push({ key: `custom_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`, label: 'Новое поле', placeholder: '', required: false, visible: true }) }
function removeCustomField(key) { content.form.fields = content.form.fields.filter(field => field.key !== key) }
async function loadCatalog() { try { const { data } = await axios.get(import.meta.env.DEV ? '/catalog-api/products' : '/api/products', { params: { limit: 150 } }); const products = Array.isArray(data) ? data : Array.isArray(data.products) ? data.products : []; catalogProducts.value = products.filter(product => product?.id && product.active !== false && !/тестов|test/i.test(product.description || '') && !/picsum\.photos|placeholder/i.test(product.image || '')) } catch { catalogProducts.value = [] } }
watch([() => content.products?.items, catalogProducts], ([items, products]) => {
  if (!items?.length || !products.length) return
  const normalize = value => String(value || '').replace(/\s+/g, ' ').trim().toLocaleLowerCase('ru-RU')
  for (const item of items) {
    if (item.productId) continue
    const match = products.find(product => normalize(product.title) === normalize(item.title))
    if (match) item.productId = String(match.id)
  }
})
async function uploadMedia(event, section, key, index = null, collection = 'items') { const file = event.target.files?.[0]; event.target.value = ''; if (!file) return; uploading.value = index === null ? `${section}.${key}` : `${section}.${collection}.${index}`; saveMessage.value = ''; try { const body = new FormData(); body.append('file', file); const { data } = await axios.post('/api/forum/admin/media', body); if (index === null) content[section][key] = data.url; else content[section][collection][index][key] = data.url } catch (error) { saveMessage.value = error.response?.data?.error || 'Не удалось загрузить файл.'; saveError.value = true } finally { uploading.value = '' } }
function updateNewCount(count) {
  newCount.value = Number(count || 0)
  window.dispatchEvent(new CustomEvent('forum-applications-count', { detail: { newCount: newCount.value } }))
}
async function loadApplications() {
  loadingApplications.value = true
  applicationsError.value = ''
  try {
    const { data } = await axios.get('/api/forum/admin/applications', { params: { status: statusFilter.value, offset: offset.value, limit: 30 } })
    applications.value = data.applications
    total.value = data.total
    updateNewCount(data.newCount)
  } catch {
    applicationsError.value = 'Не удалось загрузить заявки.'
  } finally {
    loadingApplications.value = false
  }
}
async function saveApplication(item) {
  savingApplication.value = item.id
  applicationsError.value = ''
  try {
    const { data } = await axios.patch(`/api/forum/admin/applications/${item.id}`, { status: item.status, adminNote: item.adminNote })
    Object.assign(item, data.application)
    if (statusFilter.value && item.status !== statusFilter.value) await loadApplications()
    else updateNewCount((await axios.get('/api/forum/admin/applications', { params: { limit: 1 } })).data.newCount)
  } catch {
    applicationsError.value = 'Не удалось сохранить заявку.'
  } finally {
    savingApplication.value = null
  }
}
onMounted(() => { loadContent(); loadCatalog(); loadApplications() })
</script>
<style src="./forumAdmin.css"></style>
