<template>
  <Transition name="cookie-consent">
    <section
      v-if="isVisible"
      class="cookie-consent"
      role="dialog"
      aria-label="Настройки cookies"
      aria-live="polite"
    >
      <span class="cookie-consent__shine" aria-hidden="true"></span>

      <img
        src="/cookie-liquid.webp"
        class="cookie-consent__icon"
        alt=""
        width="68"
        height="68"
        decoding="async"
      >

      <p class="cookie-consent__text">
        Мы используем cookies, чтобы сайт работал лучше и
        помогает нам улучшать сервис.
      </p>

      <div class="cookie-consent__actions">
        <button type="button" class="cookie-consent__button cookie-consent__button--accept" @click="choose('all')">
          Принять
        </button>
        <button type="button" class="cookie-consent__button cookie-consent__button--necessary" @click="choose('necessary')">
          Только необходимые
        </button>
      </div>
    </section>
  </Transition>
</template>

<script setup>
import { onMounted, ref } from 'vue'

const CONSENT_KEY = 'cookieConsent'
const isVisible = ref(false)

function getConsent() {
  try {
    const value = localStorage.getItem(CONSENT_KEY)
    return value === 'all' || value === 'necessary' ? value : null
  } catch {
    return null
  }
}

function choose(value) {
  try {
    localStorage.setItem(CONSENT_KEY, value)
  } catch {
    // The visitor's choice still takes effect during the current page visit.
  }

  window.dispatchEvent(new CustomEvent('aw:cookie-consent', { detail: value }))
  isVisible.value = false
}

onMounted(() => {
  isVisible.value = !getConsent()
})
</script>

<style scoped>
.cookie-consent {
  position: fixed;
  z-index: 10050;
  left: 50%;
  bottom: 20px;
  display: grid;
  grid-template-columns: 62px minmax(235px, 1fr) auto;
  align-items: center;
  column-gap: 14px;
  width: min(768px, calc(100vw - 32px));
  min-height: 84px;
  padding: 10px 14px 10px 12px;
  overflow: hidden;
  border: 1px solid transparent;
  border-radius: 32px;
  background:
    radial-gradient(ellipse 32% 140% at 4% 7%, rgba(157, 193, 255, 0.13), transparent 78%),
    radial-gradient(ellipse 36% 125% at 100% 100%, rgba(66, 112, 234, 0.16), transparent 80%),
    linear-gradient(105deg, rgba(12, 27, 62, 0.86), rgba(5, 14, 34, 0.84) 55%, rgba(13, 30, 70, 0.87)) padding-box,
    linear-gradient(125deg, rgba(240, 247, 255, 0.82), rgba(126, 166, 255, 0.38) 27%, rgba(91, 132, 245, 0.19) 56%, rgba(180, 210, 255, 0.69) 100%) border-box;
  box-shadow:
    0 18px 48px rgba(0, 18, 67, 0.38),
    0 3px 20px rgba(59, 119, 255, 0.24),
    inset 0 2px 2px rgba(245, 250, 255, 0.31),
    inset 0 -3px 5px rgba(79, 138, 255, 0.22),
    inset 2px 0 5px rgba(215, 233, 255, 0.17),
    inset -2px 0 5px rgba(153, 190, 255, 0.14);
  backdrop-filter: blur(32px) saturate(170%) brightness(0.88);
  -webkit-backdrop-filter: blur(32px) saturate(170%) brightness(0.88);
  transform: translateX(-50%);
  isolation: isolate;
}

.cookie-consent::before,
.cookie-consent::after {
  position: absolute;
  z-index: 0;
  content: '';
  pointer-events: none;
}

.cookie-consent::before {
  inset: 2px 2px auto;
  height: 45%;
  border-radius: 32px 32px 48% 48%;
  background: linear-gradient(180deg, rgba(238, 248, 255, 0.13), rgba(140, 184, 255, 0.04) 35%, transparent 100%);
  mask-image: linear-gradient(90deg, rgba(0, 0, 0, 0.95), rgba(0, 0, 0, 0.3) 62%, rgba(0, 0, 0, 0.68));
}

.cookie-consent::after {
  inset: auto 5% 1px 12%;
  height: 12px;
  border-radius: 50%;
  background: radial-gradient(ellipse, rgba(124, 183, 255, 0.32), transparent 72%);
  filter: blur(5px);
}

.cookie-consent__shine {
  position: absolute;
  z-index: 0;
  top: -36px;
  left: 12%;
  width: 38%;
  height: 77px;
  border-radius: 999px;
  background: radial-gradient(ellipse, rgba(226, 240, 255, 0.11), rgba(149, 196, 255, 0.04) 52%, transparent 75%);
  filter: blur(12px);
  pointer-events: none;
}

.cookie-consent__icon,
.cookie-consent__text,
.cookie-consent__actions {
  position: relative;
  z-index: 1;
}

.cookie-consent__icon {
  display: block;
  width: 62px;
  height: 62px;
  object-fit: contain;
  filter: drop-shadow(0 5px 9px rgba(29, 109, 255, 0.28));
  user-select: none;
}

.cookie-consent__text {
  max-width: 285px;
  margin: 0;
  color: rgba(247, 250, 255, 0.93);
  font-size: 13.5px;
  font-weight: 600;
  line-height: 1.38;
  letter-spacing: -0.012em;
}

.cookie-consent__actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.cookie-consent__button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 46px;
  border-radius: 20px;
  padding: 0 23px;
  font: inherit;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: -0.01em;
  white-space: nowrap;
  cursor: pointer;
  transition: transform 180ms ease, border-color 180ms ease, background 180ms ease, box-shadow 180ms ease;
}

.cookie-consent__button:hover {
  transform: translateY(-1px);
}

.cookie-consent__button:focus-visible {
  outline: 2px solid #d4e2ff;
  outline-offset: 3px;
}

.cookie-consent__button--accept {
  border: 1px solid rgba(208, 226, 255, 0.46);
  background: linear-gradient(180deg, #a6c1ff 0%, #759ff7 100%);
  color: #071333;
  box-shadow: 0 0 24px rgba(65, 120, 255, 0.34), inset 0 1px 0 rgba(255, 255, 255, 0.54);
}

.cookie-consent__button--accept:hover {
  box-shadow: 0 0 28px rgba(90, 143, 255, 0.51), inset 0 1px 0 rgba(255, 255, 255, 0.64);
}

.cookie-consent__button--necessary {
  border: 1px solid rgba(126, 171, 255, 0.55);
  background: linear-gradient(180deg, rgba(30, 50, 101, 0.67), rgba(12, 24, 57, 0.7));
  color: rgba(243, 248, 255, 0.96);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 0 18px rgba(42, 97, 225, 0.14);
}

.cookie-consent__button--necessary:hover {
  border-color: rgba(161, 195, 255, 0.78);
  background: linear-gradient(180deg, rgba(42, 68, 133, 0.7), rgba(16, 31, 70, 0.74));
}

.cookie-consent-enter-active,
.cookie-consent-leave-active {
  transition: opacity 350ms cubic-bezier(0.16, 1, 0.3, 1), transform 350ms cubic-bezier(0.16, 1, 0.3, 1);
}

.cookie-consent-enter-from,
.cookie-consent-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(12px);
}

@media (max-width: 760px) {
  .cookie-consent {
    grid-template-columns: 56px minmax(0, 1fr);
    column-gap: 10px;
    row-gap: 10px;
    width: calc(100vw - 24px);
    min-height: 0;
    padding: 11px 12px 12px 10px;
    border-radius: 26px;
  }

  .cookie-consent__icon {
    width: 55px;
    height: 55px;
  }

  .cookie-consent__text {
    max-width: none;
    font-size: 12.5px;
  }

  .cookie-consent__actions {
    grid-column: 1 / -1;
    display: grid;
    grid-template-columns: 0.82fr 1.18fr;
    gap: 8px;
  }

  .cookie-consent__button {
    min-width: 0;
    min-height: 42px;
    padding: 0 12px;
    border-radius: 17px;
    font-size: 12px;
  }
}

@media (max-width: 380px) {
  .cookie-consent {
    bottom: 10px;
  }

  .cookie-consent__text {
    font-size: 12px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .cookie-consent-enter-active,
  .cookie-consent-leave-active,
  .cookie-consent__button {
    transition: none;
  }
}
</style>
