<template>
  <main class="consultation-result container">
    <div class="consultation-result__card">
      <span class="consultation-result__eyebrow">ANGEL WINGS · КОНСУЛЬТАЦИИ</span>
      <template v-if="loading"><div class="spinner"></div><h1>Проверяем оплату…</h1></template>
      <template v-else-if="paid"><div class="consultation-result__icon">✓</div><h1>Заявка оплачена</h1><p>Специалист получит ваш запрос и свяжется с вами по указанным контактам для согласования формата консультации.</p></template>
      <template v-else><div class="consultation-result__icon consultation-result__icon--pending">!</div><h1>{{ failed ? 'Оплата не завершена' : 'Платёж обрабатывается' }}</h1><p>{{ failed ? 'Попробуйте оформить консультацию ещё раз. Если деньги списались, пожалуйста, напишите нам.' : 'Банк ещё не прислал подтверждение. Обновите страницу через несколько секунд.' }}</p></template>
      <router-link to="/" class="btn btn-accent">На главную</router-link>
    </div>
  </main>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
const route = useRoute()
const loading = ref(true)
const paymentStatus = ref('PENDING')
const paid = computed(() => paymentStatus.value === 'PAID')
const failed = computed(() => paymentStatus.value === 'FAILED' || route.name === 'ConsultationFail')
onMounted(async () => {
  const id = Number(route.query.consultationId)
  if (!id) { loading.value = false; return }
  try { const { data } = await axios.get(`/api/consultations/${id}/status`); paymentStatus.value = data.paymentStatus } catch { paymentStatus.value = 'FAILED' } finally { loading.value = false }
})
</script>

<style scoped>
.consultation-result{display:grid;min-height:70vh;place-items:center;padding:4rem 1rem}.consultation-result__card{max-width:38rem;padding:3rem;text-align:center;border:1px solid rgba(224,194,139,.28);border-radius:1.5rem;background:linear-gradient(145deg,#201d2a,#0d111e);box-shadow:0 2rem 5rem rgba(0,0,0,.25)}.consultation-result__eyebrow{color:#dfbf88;font:700 .68rem var(--font-mono);letter-spacing:.16em}.consultation-result h1{margin:1rem 0;font-family:var(--font-display);font-size:clamp(2rem,5vw,3.4rem)}.consultation-result p{margin:0 0 1.6rem;color:var(--text-secondary);line-height:1.6}.consultation-result__icon{display:grid;width:3.6rem;height:3.6rem;margin:1.5rem auto 0;place-items:center;border-radius:50%;background:#1f7652;color:#fff;font-size:1.8rem}.consultation-result__icon--pending{background:#855b22}.spinner{margin:2rem auto}.btn{border:0;background:#e3c48d;color:#24180e}@media(max-width:600px){.consultation-result__card{padding:2rem 1.25rem}}
</style>
