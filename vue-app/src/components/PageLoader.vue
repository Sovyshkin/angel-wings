<template>
  <Transition name="loader">
    <div v-if="show" class="page-loader">
      <div class="page-loader__inner">
        <div class="page-loader__ring">
          <div class="page-loader__segment"></div>
          <div class="page-loader__segment"></div>
          <div class="page-loader__segment"></div>
        </div>
        <div class="page-loader__orb"></div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const show = ref(false)
let timeout = null

function handleStart() {
  timeout = setTimeout(() => {
    show.value = true
  }, 150)
}

function handleEnd() {
  if (timeout) {
    clearTimeout(timeout)
    timeout = null
  }
  show.value = false
}

onMounted(() => {
  router.beforeEach((to, from, next) => {
    handleStart()
    next()
  })
  
  router.afterEach(() => {
    handleEnd()
  })
})

onUnmounted(() => {
  if (timeout) clearTimeout(timeout)
})
</script>

<style scoped>
.page-loader {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-primary);
}

.page-loader__inner {
  position: relative;
  width: 100px;
  height: 100px;
}

.page-loader__ring {
  position: absolute;
  inset: 0;
  animation: spin 1.2s linear infinite;
}

.page-loader__segment {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 4px solid transparent;
}

.page-loader__segment:nth-child(1) {
  border-top-color: var(--accent);
}

.page-loader__segment:nth-child(2) {
  inset: 15px;
  border-right-color: rgba(163, 255, 18, 0.5);
  animation-duration: 1.5s;
  animation-direction: reverse;
}

.page-loader__segment:nth-child(3) {
  inset: 30px;
  border-bottom-color: rgba(163, 255, 18, 0.25);
  animation-duration: 2s;
}

.page-loader__orb {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 20px;
  height: 20px;
  background: var(--accent);
  border-radius: 50%;
  box-shadow: 0 0 30px var(--accent), 0 0 60px var(--accent);
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes pulse {
  0%, 100% { 
    transform: translate(-50%, -50%) scale(1);
    box-shadow: 0 0 30px var(--accent), 0 0 60px var(--accent);
  }
  50% { 
    transform: translate(-50%, -50%) scale(1.2);
    box-shadow: 0 0 40px var(--accent), 0 0 80px var(--accent);
  }
}

.loader-enter-active,
.loader-leave-active {
  transition: opacity 0.3s ease;
}

.loader-enter-from,
.loader-leave-to {
  opacity: 0;
}
</style>