<template>
  <div ref="root" class="report-export">
    <button type="button" class="btn btn-secondary report-export-trigger" :disabled="loading" :aria-expanded="open" :aria-controls="menuId" @click="open = !open">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 3v12m-5-5 5 5 5-5M5 21h14"/></svg>
      {{ loading ? 'Формируем…' : buttonText }}
    </button>
    <div v-if="open" :id="menuId" class="report-export-panel" role="group" :aria-label="title" @keydown.esc="open = false">
      <div class="report-export-heading">
        <strong>{{ title }}</strong>
        <span>{{ description }}</span>
      </div>

      <div class="report-export-presets" role="group" aria-label="Быстрый выбор периода">
        <button v-for="preset in presets" :key="preset.value" type="button" :class="{ selected: activePreset === preset.value }" :aria-pressed="activePreset === preset.value" @click="choosePreset(preset.value)">{{ preset.label }}</button>
      </div>

      <div class="report-export-dates">
        <label>Начало периода<input v-model="dateFrom" type="date" :max="dateTo || today" @input="activePreset = 'custom'"></label>
        <label>Конец периода<input v-model="dateTo" type="date" :min="dateFrom || undefined" :max="today" @input="activePreset = 'custom'"></label>
      </div>
      <p v-if="!rangeValid" class="report-export-error">Укажите обе даты; начало должно быть не позже конца.</p>
      <p v-else class="report-export-range">{{ rangeLabel }}</p>

      <div class="report-export-files" role="group" aria-label="Скачать отчёт">
        <button type="button" :disabled="!rangeValid || loading" @click="download('xlsx')">Excel <small>.xlsx</small></button>
        <button type="button" :disabled="!rangeValid || loading" @click="download('pdf')">PDF <small>.pdf</small></button>
        <button type="button" :disabled="!rangeValid || loading" @click="download('docx')">Word <small>.docx</small></button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

defineProps({
  loading: { type: Boolean, default: false },
  buttonText: { type: String, default: 'Выгрузить отчёт' },
  title: { type: String, default: 'Период отчёта' },
  description: { type: String, default: 'Выберите даты создания заказов' },
  menuId: { type: String, required: true }
})
const emit = defineEmits(['export'])
const root = ref(null)
const open = ref(false)
const dateFrom = ref('')
const dateTo = ref('')
const activePreset = ref('all')
const presets = [
  { value: 'all', label: 'За всё время' },
  { value: 'week', label: 'Последние 7 дней' },
  { value: 'month', label: 'Последние 30 дней' },
  { value: 'thisMonth', label: 'Этот месяц' },
  { value: 'previousMonth', label: 'Прошлый месяц' }
]

function moscowToday() {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Moscow', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(new Date()).map(part => [part.type, part.value]))
  return `${parts.year}-${parts.month}-${parts.day}`
}

const today = ref(moscowToday())
const rangeValid = computed(() => (!dateFrom.value && !dateTo.value) || Boolean(dateFrom.value && dateTo.value && dateFrom.value <= dateTo.value))
const rangeLabel = computed(() => dateFrom.value && dateTo.value ? `Заказы с ${formatDay(dateFrom.value)} по ${formatDay(dateTo.value)} включительно` : 'В отчёт войдут заказы за всё время')

function formatDay(iso) {
  const [year, month, day] = iso.split('-')
  return `${day}.${month}.${year}`
}

function shiftDay(iso, days) {
  const date = new Date(`${iso}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

function choosePreset(value) {
  today.value = moscowToday()
  activePreset.value = value
  if (value === 'all') {
    dateFrom.value = ''
    dateTo.value = ''
  } else if (value === 'week' || value === 'month') {
    dateFrom.value = shiftDay(today.value, value === 'week' ? -6 : -29)
    dateTo.value = today.value
  } else if (value === 'thisMonth') {
    dateFrom.value = `${today.value.slice(0, 7)}-01`
    dateTo.value = today.value
  } else {
    dateTo.value = shiftDay(`${today.value.slice(0, 7)}-01`, -1)
    dateFrom.value = `${dateTo.value.slice(0, 7)}-01`
  }
}

function download(format) {
  if (!rangeValid.value) return
  emit('export', format, dateFrom.value && dateTo.value ? { dateFrom: dateFrom.value, dateTo: dateTo.value } : {})
  open.value = false
}

function handleOutside(event) {
  if (open.value && root.value && !root.value.contains(event.target)) open.value = false
}

onMounted(() => document.addEventListener('pointerdown', handleOutside))
onBeforeUnmount(() => document.removeEventListener('pointerdown', handleOutside))
</script>

<style scoped>
.report-export { position: relative; min-width: 0; }
.report-export-trigger { display: inline-flex; align-items: center; justify-content: center; gap: .45rem; white-space: nowrap; }
.report-export-panel {
  position: absolute; top: calc(100% + 10px); right: 0; z-index: 40; width: min(370px, calc(100vw - 24px));
  padding: 18px; border: 1px solid var(--border); border-radius: 18px;
  background: var(--bg-card, var(--bg-secondary)); color: var(--text-primary);
  box-shadow: 0 22px 55px #0008;
}
.report-export-heading { display: grid; gap: 3px; margin-bottom: 15px; }
.report-export-heading strong { font-size: 1rem; }
.report-export-heading span { color: var(--text-secondary); font-size: .78rem; }
.report-export-presets { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 16px; }
.report-export-presets button {
  border: 1px solid var(--border); border-radius: 999px; padding: 7px 10px;
  background: var(--bg-secondary); color: var(--text-secondary); font: inherit; font-size: .74rem; cursor: pointer;
}
.report-export-presets button.selected { border-color: var(--accent); background: var(--accent-dim); color: var(--accent); }
.report-export-dates { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 9px; }
.report-export-dates label { display: grid; gap: 6px; color: var(--text-secondary); font-size: .74rem; }
.report-export-dates input {
  width: 100%; min-width: 0; padding: 9px; border: 1px solid var(--border); border-radius: 9px;
  background: var(--bg-secondary); color: var(--text-primary); color-scheme: dark; font: inherit; font-size: .83rem;
}
:global([data-theme="light"]) .report-export-dates input { color-scheme: light; }
.report-export-range, .report-export-error { margin: 11px 0 15px; font-size: .76rem; line-height: 1.35; }
.report-export-range { color: var(--text-secondary); }
.report-export-error { color: #f87171; }
.report-export-files { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
.report-export-files button {
  display: grid; gap: 2px; padding: 9px 5px; border: 1px solid var(--border); border-radius: 9px;
  background: var(--bg-secondary); color: var(--text-primary); font: inherit; font-size: .81rem; cursor: pointer;
}
.report-export-files small { color: var(--text-muted); font-size: .68rem; }
.report-export-files button:hover:not(:disabled), .report-export-files button:focus-visible { border-color: var(--accent); background: var(--accent-dim); }
.report-export-files button:disabled { opacity: .45; cursor: not-allowed; }
@media (max-width: 600px) { .report-export-trigger { width: 100%; } .report-export-panel { right: -10px; } }
</style>
