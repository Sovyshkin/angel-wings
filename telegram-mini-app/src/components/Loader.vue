<template>
  <div class="loader-container" :class="{ fullscreen }">
    <div class="loader">
      <div class="loader-ring">
        <div class="loader-segment"></div>
        <div class="loader-segment"></div>
        <div class="loader-segment"></div>
        <div class="loader-core"></div>
      </div>
      <div class="loader-text" v-if="text">{{ text }}</div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  text: {
    type: String,
    default: ''
  },
  fullscreen: {
    type: Boolean,
    default: false
  }
})
</script>

<style scoped>
.loader-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4rem 0;
}

.loader-container.fullscreen {
  position: fixed;
  inset: 0;
  background: var(--bg-primary);
  z-index: 9999;
}

.loader {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

.loader-ring {
  position: relative;
  width: 64px;
  height: 64px;
}

.loader-segment {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 3px solid transparent;
}

.loader-segment:nth-child(1) {
  border-top-color: var(--accent);
  animation: spin 1s linear infinite;
}

.loader-segment:nth-child(2) {
  inset: 8px;
  border-right-color: rgba(166, 185, 248, 0.5);
  animation: spin 1.5s linear infinite reverse;
}

.loader-segment:nth-child(3) {
  inset: 16px;
  border-bottom-color: rgba(166, 185, 248, 0.3);
  animation: spin 2s linear infinite;
}

.loader-core {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 12px;
  height: 12px;
  background: var(--accent);
  border-radius: 50%;
  box-shadow: 0 0 20px var(--accent);
}

.loader-text {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-muted);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .loader-ring {
    width: 48px;
    height: 48px;
  }
  
  .loader-segment:nth-child(2) { inset: 6px; }
  .loader-segment:nth-child(3) { inset: 12px; }
}
</style>