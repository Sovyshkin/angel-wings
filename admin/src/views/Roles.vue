<template>
  <div class="roles-page">
    <div class="roles-heading">
      <div>
        <p class="roles-kicker">ДОСТУП К АДМИН-ПАНЕЛИ</p>
        <h1>Роли и права</h1>
        <p>Создайте роль, отметьте доступные разделы, затем назначьте её сотруднику в «Пользователях».</p>
      </div>
      <button class="btn btn-primary" type="button" @click="startCreate">+ Новая роль</button>
    </div>

    <p v-if="error" class="roles-alert" role="alert">{{ error }}</p>
    <p v-if="notice" class="roles-notice" role="status">{{ notice }}</p>

    <div class="roles-layout">
      <aside class="roles-list" aria-label="Список ролей">
        <div class="roles-list__caption">Системные роли</div>
        <div class="roles-system"><strong>Администратор</strong><span>Все разделы · управление ролями</span></div>
        <div class="roles-system"><strong>Копирайтер</strong><span>Только блог</span></div>
        <div class="roles-list__caption">Настраиваемые роли <span>{{ roles.length }}</span></div>
        <p v-if="loading" class="roles-empty">Загрузка ролей…</p>
        <p v-else-if="!roles.length" class="roles-empty">Ролей пока нет. Создайте первую роль для сотрудника.</p>
        <button v-for="role in roles" :key="role.id" type="button" class="roles-list__item" :class="{ active: selectedId === role.id }" @click="selectRole(role)">
          <span class="roles-list__item-name">{{ role.name }}</span>
          <span class="roles-list__item-meta">{{ role.permissions.length }} разделов · {{ role.usersCount }} сотрудников</span>
        </button>
      </aside>

      <section class="roles-editor" aria-label="Настройка роли">
        <div class="roles-editor__top">
          <div>
            <span class="roles-editor__eyebrow">{{ selectedId ? 'НАСТРОЙКА ДОСТУПА' : 'НОВАЯ РОЛЬ' }}</span>
            <h2>{{ selectedId ? 'Редактирование роли' : 'Создание роли' }}</h2>
          </div>
          <span class="roles-editor__count">{{ form.permissions.length }} / {{ sections.length }} разделов</span>
        </div>

        <div class="roles-fields">
          <label>Название роли<input v-model.trim="form.name" maxlength="60" placeholder="Например, Менеджер заказов"></label>
          <label>Описание <span>необязательно</span><textarea v-model.trim="form.description" maxlength="240" rows="2" placeholder="Кому и для чего нужен этот доступ"></textarea></label>
        </div>

        <div class="roles-permissions-heading"><div><h3>Доступные разделы</h3><p>Остальные разделы и их API будут закрыты для этой роли.</p></div><button type="button" @click="clearPermissions">Снять все</button></div>
        <div class="roles-permissions">
          <label v-for="section in sections" :key="section.code" class="roles-permission" :class="{ checked: form.permissions.includes(section.code) }">
            <input v-model="form.permissions" type="checkbox" :value="section.code">
            <span class="roles-permission__mark" aria-hidden="true">{{ form.permissions.includes(section.code) ? '✓' : '' }}</span>
            <span>{{ section.name }}</span>
          </label>
        </div>
        <p class="roles-security-note">Пользователи и управление ролями доступны только администратору. Изменения прав применяются к уже вошедшим сотрудникам сразу после сохранения.</p>

        <div class="roles-actions">
          <button class="btn btn-primary" type="button" :disabled="saving || !form.name || !form.permissions.length" @click="saveRole">{{ saving ? 'Сохранение…' : selectedId ? 'Сохранить изменения' : 'Создать роль' }}</button>
          <button v-if="selectedId" class="btn btn-secondary" type="button" @click="startCreate">Отмена</button>
          <button v-if="selectedId" class="roles-delete" type="button" :disabled="saving || selectedRole?.usersCount > 0" :title="selectedRole?.usersCount ? 'Сначала назначьте сотрудникам другую роль' : ''" @click="deleteRole">Удалить роль</button>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import axios from 'axios'

const roles = ref([])
const sections = ref([])
const selectedId = ref(null)
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const notice = ref('')
const form = reactive({ name: '', description: '', permissions: [] })
const selectedRole = computed(() => roles.value.find(role => role.id === selectedId.value))

function startCreate() {
  selectedId.value = null
  form.name = ''
  form.description = ''
  form.permissions = []
  error.value = ''
  notice.value = ''
}
function selectRole(role) {
  selectedId.value = role.id
  form.name = role.name
  form.description = role.description
  form.permissions = [...role.permissions]
  error.value = ''
  notice.value = ''
}
function clearPermissions() { form.permissions = [] }
async function loadRoles() {
  try {
    const { data } = await axios.get('/api/admin/roles')
    roles.value = data.roles
    sections.value = data.sections
    if (selectedId.value) {
      const current = roles.value.find(role => role.id === selectedId.value)
      if (current) selectRole(current)
    }
  } catch (e) { error.value = e.response?.data?.error || 'Не удалось загрузить роли' }
  finally { loading.value = false }
}
async function saveRole() {
  error.value = ''; notice.value = ''; saving.value = true
  try {
    const payload = { name: form.name, description: form.description, permissions: form.permissions }
    const { data } = selectedId.value
      ? await axios.put(`/api/admin/roles/${selectedId.value}`, payload)
      : await axios.post('/api/admin/roles', payload)
    await loadRoles()
    selectRole(data.role)
    notice.value = 'Права сохранены. Они уже действуют для сотрудников с этой ролью.'
  } catch (e) { error.value = e.response?.data?.error || 'Не удалось сохранить роль' }
  finally { saving.value = false }
}
async function deleteRole() {
  if (!selectedId.value || !window.confirm(`Удалить роль «${form.name}»?`)) return
  error.value = ''; saving.value = true
  try {
    await axios.delete(`/api/admin/roles/${selectedId.value}`)
    startCreate()
    await loadRoles()
    notice.value = 'Роль удалена'
  } catch (e) { error.value = e.response?.data?.error || 'Не удалось удалить роль' }
  finally { saving.value = false }
}
onMounted(loadRoles)
</script>

<style scoped>
.roles-page{max-width:1440px;margin:0 auto;padding:32px 28px 80px;color:var(--text-primary)}
.roles-heading{display:flex;align-items:end;justify-content:space-between;gap:24px;margin-bottom:28px}
.roles-kicker,.roles-editor__eyebrow{font-size:11px;font-weight:800;letter-spacing:.16em;color:var(--accent);margin:0 0 10px}
.roles-heading h1{font-size:clamp(30px,3vw,42px);line-height:1.1;margin:0 0 10px}
.roles-heading p:last-child{margin:0;color:var(--text-secondary);line-height:1.5}
.roles-layout{display:grid;grid-template-columns:minmax(240px,310px) minmax(0,1fr);gap:20px;align-items:start}
.roles-list,.roles-editor{border:1px solid var(--border);border-radius:22px;background:var(--bg-secondary);box-shadow:0 20px 50px rgba(0,0,0,.06)}
.roles-list{padding:16px}.roles-list__caption{display:flex;justify-content:space-between;margin:14px 12px 10px;font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--text-secondary)}
.roles-system,.roles-list__item{width:100%;display:flex;flex-direction:column;text-align:left;gap:5px;padding:15px 16px;border-radius:14px}
.roles-system{opacity:.72}.roles-system strong,.roles-list__item-name{font-size:15px;color:var(--text-primary)}.roles-system span,.roles-list__item-meta{font-size:12px;color:var(--text-secondary)}
.roles-list__item{border:1px solid transparent;background:transparent;cursor:pointer}.roles-list__item:hover{background:rgba(143,170,255,.08)}.roles-list__item.active{border-color:var(--accent);background:rgba(143,170,255,.13)}
.roles-empty{font-size:14px;color:var(--text-secondary);line-height:1.5;padding:8px 12px}
.roles-editor{padding:clamp(20px,3vw,36px)}.roles-editor__top{display:flex;justify-content:space-between;align-items:start;gap:16px}.roles-editor h2{font-size:25px;margin:0 0 24px}.roles-editor__count{white-space:nowrap;border-radius:100px;padding:8px 12px;background:rgba(143,170,255,.11);color:var(--accent);font-weight:700;font-size:12px}
.roles-fields{display:grid;gap:16px}.roles-fields label{display:grid;gap:8px;font-size:13px;font-weight:700}.roles-fields label span{font-weight:400;color:var(--text-secondary)}.roles-fields input,.roles-fields textarea{width:100%;box-sizing:border-box;border:1px solid var(--border);border-radius:12px;background:var(--bg-primary);color:var(--text-primary);padding:13px 15px;font:inherit;resize:vertical}.roles-fields input:focus,.roles-fields textarea:focus{outline:2px solid var(--accent);outline-offset:1px}
.roles-permissions-heading{display:flex;justify-content:space-between;gap:20px;align-items:center;margin:30px 0 14px}.roles-permissions-heading h3{margin:0 0 4px;font-size:18px}.roles-permissions-heading p{margin:0;color:var(--text-secondary);font-size:13px}.roles-permissions-heading button{background:none;border:0;color:var(--accent);cursor:pointer;white-space:nowrap}
.roles-permissions{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.roles-permission{display:flex;align-items:center;gap:10px;min-height:52px;padding:10px 13px;box-sizing:border-box;border:1px solid var(--border);border-radius:12px;cursor:pointer;font-size:14px;transition:border-color .2s,background .2s}.roles-permission.checked{border-color:var(--accent);background:rgba(143,170,255,.1)}.roles-permission input{position:absolute;opacity:0;width:1px;height:1px}.roles-permission:focus-within{outline:2px solid var(--accent);outline-offset:2px}.roles-permission__mark{display:grid;place-items:center;flex:none;width:20px;height:20px;border:1px solid var(--accent);border-radius:6px;color:var(--bg-primary);font-weight:800}.roles-permission.checked .roles-permission__mark{background:var(--accent)}
.roles-security-note{border-left:2px solid var(--accent);padding:3px 0 3px 14px;color:var(--text-secondary);line-height:1.5;font-size:13px;margin:24px 0}.roles-actions{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.roles-delete{margin-left:auto;border:0;background:none;color:#e8757b;cursor:pointer;font:inherit}.roles-delete:disabled{opacity:.45;cursor:not-allowed}.roles-alert,.roles-notice{padding:13px 16px;border-radius:12px;margin:0 0 16px}.roles-alert{color:#e8757b;background:rgba(232,117,123,.1)}.roles-notice{color:#36bd79;background:rgba(54,189,121,.1)}
@media(max-width:900px){.roles-layout{grid-template-columns:1fr}.roles-permissions{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:560px){.roles-page{padding:24px 16px 70px}.roles-heading{align-items:start;flex-direction:column}.roles-permissions{grid-template-columns:1fr}.roles-editor__top{flex-direction:column}.roles-delete{margin-left:0}}
</style>
