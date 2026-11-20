<template>
  <div v-if="notice && enabled" class="marketing-backdrop" @click.self="dismiss">
    <section class="marketing-card" role="dialog" aria-modal="true" aria-labelledby="marketing-title">
      <button class="marketing-close" type="button" aria-label="Закрыть сообщение" @click="dismiss">×</button>
      <span class="marketing-eyebrow">Новое от Angel Wings</span>
      <img v-if="notice.imageUrl" :src="notice.imageUrl" alt="" class="marketing-image">
      <h2 id="marketing-title">{{ notice.title }}</h2>
      <p>{{ notice.body }}</p>
      <button class="marketing-action" type="button" @click="openLink">{{ notice.buttonText }}</button>
      <button class="marketing-later" type="button" @click="dismiss">Закрыть</button>
    </section>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import axios from 'axios'

const props = defineProps({ enabled: { type: Boolean, default: false } })
const notice = ref(null)
let request = 0
let timer

async function loadNotice() {
  const current = ++request
  if (!props.enabled) { notice.value = null; return }
  if (notice.value) return
  try {
    const { data } = await axios.get('/api/marketing-notices/unseen')
    if (current === request) notice.value = data.notice || null
  } catch { if (current === request) notice.value = null }
}

async function dismiss() {
  const current = notice.value
  notice.value = null
  if (!current) return
  try { await axios.post(`/api/marketing-notices/${current.id}/seen`) } catch { /* Show again after a failed acknowledgement. */ }
}

async function openLink() {
  const url = notice.value?.buttonUrl
  await dismiss()
  if (url) {
    if (window.Telegram?.WebApp?.openLink) window.Telegram.WebApp.openLink(url)
    else window.location.assign(url)
  }
}

watch(() => props.enabled, loadNotice, { immediate: true })
onMounted(() => {
  timer = window.setInterval(() => { if (document.visibilityState === 'visible') loadNotice() }, 60000)
  document.addEventListener('visibilitychange', loadNotice)
})
onBeforeUnmount(() => { window.clearInterval(timer); document.removeEventListener('visibilitychange', loadNotice); request++ })
</script>

<style scoped>
.marketing-backdrop { position: fixed; inset: 0; z-index: 10010; display: grid; place-items: center; padding: 18px; background: rgba(3, 6, 20, .76); backdrop-filter: blur(10px); }
.marketing-card { position: relative; width: min(100%, 500px); max-height: calc(100dvh - 36px); overflow: auto; padding: 30px 26px 24px; border: 1px solid rgba(166, 188, 255, .35); border-radius: 26px; background: radial-gradient(circle at 50% 0, rgba(46, 90, 190, .28), transparent 55%), #111827; box-shadow: 0 28px 90px rgba(0, 0, 0, .5); color: #f7f8ff; text-align: center; }
.marketing-close { position: absolute; top: 12px; right: 16px; border: 0; background: none; color: #aeb7d4; font-size: 30px; cursor: pointer; }
.marketing-eyebrow { color: #a8bdff; font-size: 11px; font-weight: 800; letter-spacing: .16em; text-transform: uppercase; }
.marketing-image { display: block; width: min(100%, 380px); max-height: 240px; object-fit: contain; margin: 18px auto; border-radius: 16px; }
.marketing-card h2 { margin: 16px 0 10px; font-size: clamp(24px, 5vw, 34px); line-height: 1.2; }
.marketing-card p { margin: 0 0 24px; color: #c4cee6; line-height: 1.6; white-space: pre-line; }
.marketing-action { width: 100%; min-height: 52px; padding: 12px 20px; border: 0; border-radius: 14px; background: #a8baff; color: #101832; font: inherit; font-weight: 800; cursor: pointer; }
.marketing-later { margin-top: 10px; padding: 8px 12px; border: 0; background: none; color: #b8c5e9; font: inherit; cursor: pointer; }
</style>
