<template>
  <span :class="['payment-method-chip', `payment-method-chip--${kind}`]" :title="`Способ оплаты: ${label}`">
    <svg v-if="kind === 'card'" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="1.75" y="4" width="16.5" height="12" rx="2.4" stroke="currentColor" stroke-width="1.6" />
      <path d="M2.5 8h15M5 12.5h3.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
    </svg>
    <svg v-else-if="kind === 'sbp'" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M10.8 2.5 4.2 10h5l-1 7.5 7.6-9h-5.2l.2-6Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
    </svg>
    <svg v-else viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="7.25" stroke="currentColor" stroke-width="1.5" />
      <path d="M6.75 10.25 9 12.5l4.5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
    <span>{{ label }}</span>
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({ type: { type: String, default: '' } })
const kind = computed(() => {
  const type = props.type.toLowerCase()
  return type === 'card' || type === 'sbp' ? type : 'other'
})
const label = computed(() => ({
  sbp: 'СБП',
  card: 'Карта',
  tinkoff: 'Т-Pay',
  dolyame: 'Долями',
  digitalruble: 'Цифровой рубль',
})[props.type.toLowerCase()] || 'Неизвестен')
</script>

<style scoped>
.payment-method-chip {
  display: inline-flex;
  align-items: center;
  gap: .4rem;
  width: fit-content;
  max-width: 100%;
  padding: .3rem .6rem;
  border: 1px solid rgba(163, 180, 255, .23);
  border-radius: 999px;
  background: rgba(163, 180, 255, .09);
  color: #bac8ff;
  font-size: .72rem;
  font-weight: 650;
  line-height: 1.2;
  white-space: nowrap;
}

.payment-method-chip--sbp {
  border-color: rgba(72, 200, 222, .3);
  background: rgba(72, 200, 222, .1);
  color: #75dbe9;
}

.payment-method-chip--other {
  color: var(--text-secondary);
}

.payment-method-chip svg {
  flex: none;
  width: 14px;
  height: 14px;
}
</style>
