<template>
  <div class="order-result">
    <div class="result-card">
      <div class="checkmark failed">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
      </div>
      <h3>Оплата не прошла</h3>
      <p>К сожалению, платёж был отклонён. Попробуйте ещё раз или выберите другой способ оплаты.</p>
      <div class="order-id" v-if="orderId">Заказ #{{ orderId }}</div>
      <router-link to="/cart" class="btn btn-primary">
        Вернуться в корзину
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const orderId = ref(null)

onMounted(() => {
  orderId.value = route.query.orderId || null
})
</script>

<style scoped>
.order-result {
  min-height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.result-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 24px;
  padding: 3rem;
  max-width: 440px;
  width: 100%;
  text-align: center;
}

.checkmark {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  margin: 0 auto 1.5rem;
}

.checkmark.failed {
  background: rgba(255, 100, 100, 0.15);
  color: #ef4444;
}

h3 {
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 800;
  margin-bottom: 0.75rem;
}

p {
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
  line-height: 1.6;
}

.order-id {
  font-family: var(--font-mono);
  font-size: 0.9rem;
  color: var(--accent);
  background: var(--accent-dim);
  padding: 0.5rem 1rem;
  border-radius: 100px;
  display: inline-block;
  margin-bottom: 1.5rem;
}

.btn {
  width: 100%;
  padding: 1rem;
  justify-content: center;
}
</style>
