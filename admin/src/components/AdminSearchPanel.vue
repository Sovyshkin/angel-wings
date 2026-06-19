<template>
  <div class="admin-search-panel card">
    <div class="admin-search-panel__field">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
      </svg>
      <input
        :value="modelValue"
        type="search"
        :placeholder="placeholder"
        @input="$emit('update:modelValue', $event.target.value)"
      >
      <button v-if="modelValue" type="button" class="admin-search-panel__clear" @click="$emit('update:modelValue', '')">
        Очистить
      </button>
    </div>
    <div class="admin-search-panel__meta">
      <strong>{{ total }}</strong>
      <span>{{ modelValue ? foundLabel : totalLabel }}</span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: 'Поиск'
  },
  total: {
    type: Number,
    default: 0
  },
  totalLabel: {
    type: String,
    default: 'записей'
  },
  foundLabel: {
    type: String,
    default: 'найдено'
  }
})

defineEmits(['update:modelValue'])
</script>

<style scoped>
.admin-search-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem;
  margin-bottom: 1rem;
}

.admin-search-panel__field {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
  padding: 0.875rem 1rem;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background:
    radial-gradient(circle at 0 0, rgba(159, 181, 255, 0.12), transparent 34%),
    var(--bg-secondary);
}

.admin-search-panel__field svg {
  flex-shrink: 0;
  color: var(--text-muted);
}

.admin-search-panel__field input {
  width: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--text-primary);
  font: inherit;
}

.admin-search-panel__field input::placeholder {
  color: var(--text-muted);
}

.admin-search-panel__clear {
  flex-shrink: 0;
  border: 0;
  border-radius: 999px;
  padding: 0.45rem 0.75rem;
  background: rgba(239, 68, 68, 0.12);
  color: #ef4444;
  cursor: pointer;
  font-weight: 700;
  transition: var(--transition);
}

.admin-search-panel__clear:hover {
  background: rgba(239, 68, 68, 0.2);
}

.admin-search-panel__meta {
  display: grid;
  gap: 0.1rem;
  min-width: 150px;
  text-align: right;
}

.admin-search-panel__meta strong {
  color: var(--accent);
  font-size: 1.45rem;
  line-height: 1;
}

.admin-search-panel__meta span {
  color: var(--text-muted);
  font-size: 0.78rem;
}

@media (max-width: 720px) {
  .admin-search-panel {
    flex-direction: column;
    align-items: stretch;
  }

  .admin-search-panel__field {
    flex-wrap: wrap;
  }

  .admin-search-panel__clear {
    width: 100%;
  }

  .admin-search-panel__meta {
    min-width: 0;
    text-align: left;
  }
}
</style>
