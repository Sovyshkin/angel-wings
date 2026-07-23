<template>
  <nav v-if="totalPages > 1" class="admin-pagination" aria-label="Пагинация">
    <div class="admin-pagination__summary">
      {{ fromItem }}-{{ toItem }} из {{ total }}
    </div>

    <div class="admin-pagination__controls">
      <button
        type="button"
        class="admin-pagination__btn admin-pagination__btn--wide"
        :disabled="page <= 1"
        @click="goTo(page - 1)"
      >
        Назад
      </button>

      <button
        v-for="item in visiblePages"
        :key="item.key"
        type="button"
        class="admin-pagination__btn"
        :class="{ active: item.value === page, dots: item.type === 'dots' }"
        :disabled="item.type === 'dots'"
        @click="item.type === 'page' && goTo(item.value)"
      >
        {{ item.label }}
      </button>

      <button
        type="button"
        class="admin-pagination__btn admin-pagination__btn--wide"
        :disabled="page >= totalPages"
        @click="goTo(page + 1)"
      >
        Вперёд
      </button>
    </div>
  </nav>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  total: {
    type: Number,
    default: 0
  },
  page: {
    type: Number,
    default: 1
  },
  perPage: {
    type: Number,
    default: 20
  }
})

const emit = defineEmits(['update:page'])

const totalPages = computed(() => Math.max(1, Math.ceil(props.total / props.perPage)))
const fromItem = computed(() => props.total ? ((props.page - 1) * props.perPage) + 1 : 0)
const toItem = computed(() => Math.min(props.total, props.page * props.perPage))

const visiblePages = computed(() => {
  const pages = []
  const total = totalPages.value
  const current = props.page
  const addPage = (value) => pages.push({ type: 'page', value, label: value, key: `page-${value}` })
  const addDots = (key) => pages.push({ type: 'dots', label: '…', key })

  if (total <= 7) {
    for (let page = 1; page <= total; page += 1) addPage(page)
    return pages
  }

  addPage(1)

  if (current > 4) addDots('dots-start')

  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  for (let page = start; page <= end; page += 1) addPage(page)

  if (current < total - 3) addDots('dots-end')

  addPage(total)
  return pages
})

function goTo(nextPage) {
  const safePage = Math.min(Math.max(1, nextPage), totalPages.value)
  if (safePage !== props.page) emit('update:page', safePage)
}
</script>

<style scoped>
.admin-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 1rem;
  padding: 0.85rem 1rem;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background:
    radial-gradient(circle at 100% 0, rgba(159, 181, 255, 0.12), transparent 32%),
    var(--bg-secondary);
}

.admin-pagination__summary {
  color: var(--text-muted);
  font-size: 0.9rem;
  white-space: nowrap;
}

.admin-pagination__controls {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.45rem;
}

.admin-pagination__btn {
  min-width: 40px;
  height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 0.8rem;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--bg-primary);
  color: var(--text-secondary);
  font-weight: 700;
  cursor: pointer;
  transition: var(--transition);
}

.admin-pagination__btn--wide {
  min-width: 88px;
}

.admin-pagination__btn:hover:not(:disabled),
.admin-pagination__btn.active {
  background: var(--accent);
  border-color: var(--accent);
  color: #10121b;
  box-shadow: 0 12px 28px rgba(159, 181, 255, 0.18);
}

.admin-pagination__btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.admin-pagination__btn.dots {
  background: transparent;
  border-color: transparent;
  box-shadow: none;
}

@media (max-width: 720px) {
  .admin-pagination {
    align-items: stretch;
    flex-direction: column;
  }

  .admin-pagination__controls {
    justify-content: flex-start;
  }
}
</style>
