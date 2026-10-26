<template>
  <time class="blog-date" :datetime="value">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M7 3v4M17 3v4M3 10h18" />
    </svg>
    <span>{{ label }}</span>
  </time>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({ value: { type: String, required: true } })
const formatter = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
const label = computed(() => {
  const parts = formatter.formatToParts(new Date(props.value))
  const part = type => parts.find(item => item.type === type)?.value || ''
  return `${part('day')} ${part('month')} ${part('year')}`
})
</script>

<style scoped>
.blog-date {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  width: fit-content;
  padding: 6px 10px;
  border: 1px solid rgba(157, 188, 255, .25);
  border-radius: 999px;
  background: rgba(116, 153, 247, .08);
  color: #bfd0f7;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;
}

.blog-date svg {
  width: 14px;
  height: 14px;
  flex: none;
  color: #9bb9ff;
}
</style>
