<template>
  <div v-if="visible" class="campaign-backdrop" @click.self="dismissed = true">
    <section class="campaign-card" role="dialog" aria-modal="true" aria-labelledby="campaign-title">
      <button class="campaign-close" type="button" aria-label="Закрыть" @click="dismissed = true">×</button>
      <span class="campaign-eyebrow">Подарок Angel Wings</span>
      <div class="campaign-orbit" aria-hidden="true"><span>4 000</span></div>
      <h2 id="campaign-title">{{ offer ? 'Ваши баллы ждут вас' : 'Получить 4 000 баллов' }}</h2>
      <p v-if="offer">Получите <strong>4 000 баллов</strong> для следующего заказа. Они появятся на балансе только после нажатия кнопки.</p>
      <p v-else-if="loading">Проверяем ваше предложение…</p>
      <p v-else-if="status === 'claimed'">Вы уже получили эти баллы. Проверьте баланс в профиле.</p>
      <p v-else-if="status === 'error'">Не удалось проверить предложение. Попробуйте ещё раз.</p>
      <p v-else>Для этого Telegram-аккаунта предложение не найдено.</p>
      <div v-if="offer" class="campaign-terms"><span>1 балл = 1 ₽</span><span>Действуют 1 месяц после получения</span></div>
      <p v-if="error" class="campaign-error" role="alert">{{ error }}</p>
      <button v-if="offer" class="campaign-claim" type="button" :disabled="claiming" @click="claim">{{ claiming ? 'Начисляем…' : 'Получить 4 000 баллов' }}</button>
      <button v-else-if="status === 'error'" class="campaign-claim" type="button" @click="loadOffer">Повторить</button>
      <button class="campaign-later" type="button" @click="dismissed = true">Позже</button>
    </section>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import axios from 'axios'
import { useRoute, useRouter } from 'vue-router'

const props = defineProps({ enabled: { type: Boolean, default: false } })
const emit = defineEmits(['claimed'])
const route = useRoute()
const router = useRouter()
const campaignKey = 'points-4000-2026-10-30'
const offer = ref(null)
const dismissed = ref(false)
const claiming = ref(false)
const loading = ref(false)
const status = ref('')
const error = ref('')
let lastCheckedAt = 0
let retryTimer = null
const invited = computed(() => route.query.claim === campaignKey)
const visible = computed(() => !dismissed.value && props.enabled && status.value !== 'claimed' && (Boolean(offer.value) || invited.value))

async function loadOffer(retryOnFailure = true) {
  if (!props.enabled || loading.value || claiming.value) return
  if (retryTimer) window.clearTimeout(retryTimer)
  retryTimer = null
  lastCheckedAt = Date.now()
  loading.value = true
  status.value = ''
  try {
    const { data } = await axios.get('/api/points/campaign/offer')
    offer.value = data?.offer || null
    status.value = data?.claimed ? 'claimed' : 'unavailable'
  } catch {
    offer.value = null
    status.value = 'error'
    if (retryOnFailure && props.enabled) {
      retryTimer = window.setTimeout(() => loadOffer(false), 1500)
    }
  } finally {
    loading.value = false
  }
}

watch([() => props.enabled, () => route.query.claim], ([enabled, claim], [, previousClaim] = []) => {
  if (claim === campaignKey && previousClaim !== claim) dismissed.value = false
  if (!enabled) { offer.value = null; return }
  loadOffer()
}, { immediate: true })

function refreshWhenActive() {
  if (document.visibilityState === 'hidden' || !props.enabled || dismissed.value || claiming.value) return
  if (Date.now() - lastCheckedAt < 15000) return
  loadOffer()
}

function reopenOnLaunch() {
  if (document.visibilityState === 'hidden' || !props.enabled || claiming.value) return
  // Telegram can keep its WebView alive between launches. "Позже" closes the
  // offer only for the current launch; an unclaimed offer opens again next time.
  dismissed.value = false
  if (Date.now() - lastCheckedAt >= 1000) loadOffer()
}

function reopenRestoredPage(event) {
  if (event.persisted) reopenOnLaunch()
}

onMounted(() => {
  window.addEventListener('focus', refreshWhenActive)
  document.addEventListener('visibilitychange', reopenOnLaunch)
  window.addEventListener('pageshow', reopenRestoredPage)
  window.Telegram?.WebApp?.onEvent?.('activated', reopenOnLaunch)
})
onBeforeUnmount(() => {
  if (retryTimer) window.clearTimeout(retryTimer)
  window.removeEventListener('focus', refreshWhenActive)
  document.removeEventListener('visibilitychange', reopenOnLaunch)
  window.removeEventListener('pageshow', reopenRestoredPage)
  window.Telegram?.WebApp?.offEvent?.('activated', reopenOnLaunch)
})

async function claim() {
  if (claiming.value) return
  claiming.value = true
  error.value = ''
  try {
    const { data } = await axios.post('/api/points/campaign/claim')
    offer.value = null
    status.value = 'claimed'
    if (invited.value) router.replace({ path: route.path, query: { ...route.query, claim: undefined } })
    emit('claimed', data)
  } catch (cause) {
    error.value = cause?.response?.data?.error || 'Не удалось начислить баллы. Попробуйте ещё раз.'
  } finally { claiming.value = false }
}
</script>

<style scoped>
.campaign-backdrop{position:fixed;inset:0;z-index:10020;display:grid;place-items:center;padding:18px;background:rgba(3,6,20,.78);backdrop-filter:blur(12px)}
.campaign-card{position:relative;isolation:isolate;width:min(100%,460px);overflow:hidden;padding:28px 22px 20px;border:1px solid rgba(166,188,255,.34);border-radius:26px;background:radial-gradient(circle at 50% 2%,rgba(42,93,219,.38),transparent 49%),#111521;box-shadow:0 28px 90px rgba(0,0,0,.45);color:#f7f8ff;text-align:center}
.campaign-card::before{content:"";position:absolute;z-index:-1;inset:0;background:linear-gradient(130deg,rgba(255,255,255,.08),transparent 40%)}
.campaign-close{position:absolute;top:12px;right:17px;border:0;background:transparent;color:#aeb7d4;font-size:31px;line-height:1;cursor:pointer}
.campaign-eyebrow{color:#a8bdff;font-size:11px;font-weight:700;letter-spacing:.19em;text-transform:uppercase}
.campaign-orbit{width:142px;height:142px;margin:19px auto 18px;display:grid;place-items:center;border:1px solid rgba(171,197,255,.58);border-radius:50%;background:radial-gradient(circle at 34% 28%,#74a7ff 0,#214fae 37%,#101f52 72%,#09112f 100%);box-shadow:inset 0 0 28px #9bc6ff60,0 0 45px #4f86ff65;transform:rotate(-9deg)}
.campaign-orbit span{font-size:39px;font-weight:800;letter-spacing:-.06em;color:#fff;text-shadow:0 2px 18px #b8d6ff}
h2{margin:0 0 12px;font-size:26px;line-height:1.12;letter-spacing:-.035em}
p{margin:0;color:#c3c8d7;font-size:14px;line-height:1.55}p strong{color:#fff}
.campaign-terms{display:flex;gap:7px;justify-content:center;flex-wrap:wrap;margin:18px 0 22px}.campaign-terms span{padding:7px 10px;border:1px solid rgba(174,191,238,.2);border-radius:30px;color:#b5c9ff;background:#ffffff0c;font-size:11px}
.campaign-claim{width:100%;min-height:50px;border:0;border-radius:14px;background:#a8baff;color:#111a34;font-size:15px;font-weight:800;cursor:pointer;box-shadow:0 10px 28px #5c84ff40}.campaign-claim:disabled{opacity:.65;cursor:wait}
.campaign-later{margin-top:12px;padding:7px;border:0;background:transparent;color:#aeb6d0;cursor:pointer}.campaign-error{margin:0 0 12px;color:#ff9c9c}
@media(prefers-reduced-motion:no-preference){.campaign-card{animation:campaign-arrive .36s cubic-bezier(.17,.85,.3,1) both}@keyframes campaign-arrive{from{opacity:0;transform:translateY(18px) scale(.96)}to{opacity:1;transform:none}}}
</style>
