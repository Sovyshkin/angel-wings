<template>
  <main ref="aboutRoot" class="about-page" :class="{ 'is-ready': isAboutReady }" :aria-busy="!isAboutReady">
    <section ref="heroSection" class="about-hero">
      <div class="about-grid" aria-hidden="true"></div>
      <div class="about-hero__backdrop" aria-hidden="true">
        <span class="hero-backdrop__monogram">AW</span>
        <div class="hero-backdrop__geometry"></div>
      </div>
      <div class="about-hero__podium" aria-hidden="true">
        <div class="about-hero__podium-motion">
          <img src="/about-assets/hero-podium.png" alt="">
        </div>
      </div>
      <div class="about-hero__visual" aria-hidden="true">
        <div class="about-hero__visual-glow"></div>
        <div class="about-hero__visual-rings"></div>
      </div>
      <div class="container about-hero__container">
        <div class="about-hero__copy">
          <div class="about-eyebrow about-intro about-intro--1">
            <span></span>
            О нас
          </div>

          <h1 class="about-hero__title about-intro about-intro--2">
            Наука в<span class="about-hero__wide-break"><br></span> деталях.<br>
            <em>Забота в<span class="about-hero__wide-break"><br></span> каждом шаге.</em>
          </h1>

          <div class="about-hero__support">
            <div>
              <p class="about-hero__lead about-intro about-intro--3">
                Наша история в пептидах началась не с трендов, а с науки. Мы занимаемся пептидами,
                чтобы создавать фундамент для уникальных разработок и инноваций.
              </p>

              <div class="about-hero__actions about-intro about-intro--4">
                <a href="#principles" class="about-button about-button--primary">
                  Подробнее о компании
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </a>
              </div>
            </div>

          </div>
        </div>
      </div>

      <div class="about-hero__scroll" aria-hidden="true">
        <span>Узнать больше</span>
        <i></i>
      </div>
    </section>

    <section id="principles" class="about-section about-section--manifesto">
      <div class="container">
        <div class="section-heading reveal-block">
          <span class="section-number">Наш путь</span>
          <h2>Начали с науки.<br>Идём <em>своим путём.</em></h2>
          <p class="section-heading__story">
            Наша история в пептидах началась не с трендов, а с науки. В 2021 году мы совершили наш первый
            значимый шаг — самостоятельно синтезировали семаглутид. С тех пор мы идём своим путём. Мы
            занимаемся пептидами не потому, что это модно, а чтобы заложить прочный фундамент для будущих
            уникальных разработок и инноваций.
          </p>
        </div>

        <div class="principles-grid">
          <article
            v-for="(principle, index) in principles"
            :key="principle.title"
            class="principle-card reveal-block"
            :style="{ '--delay': `${index * 90}ms` }"
          >
            <div class="principle-card__top">
              <span class="principle-card__number" aria-hidden="true">
                0{{ index + 1 }}
              </span>
              <div v-html="principle.icon"></div>
            </div>
            <h3>{{ principle.title }}</h3>
            <p>{{ principle.text }}</p>
            <i></i>
          </article>
        </div>
      </div>
    </section>

    <section class="about-section about-section--journey">
      <div class="container journey-layout">
        <div class="journey-intro reveal-block">
          <span class="section-number">02 / Процесс</span>
          <h2>Вы всегда знаете,<br><em>что происходит,<br>почему и когда.</em></h2>
          <div class="journey-pulse" aria-hidden="true">
            <span></span>
            Система работает
          </div>
        </div>

        <ol class="journey-list">
          <li
            v-for="(step, index) in journey"
            :key="step.title"
            class="journey-step reveal-block"
            :style="{ '--delay': `${index * 80}ms` }"
          >
            <span class="journey-step__number">{{ String(index + 1).padStart(2, '0') }}</span>
            <div>
              <h3>{{ step.title }}</h3>
              <p>{{ step.text }}</p>
            </div>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </li>
        </ol>
      </div>
    </section>

    <section class="about-section about-section--production" aria-labelledby="production-title">
      <div class="container">
        <div class="production-layout reveal-block">
          <header class="production-layout__heading">
            <span class="section-number">03 / Наше производство</span>
            <h2 id="production-title">Показываем <em>процесс</em><br>таким, какой он есть.</h2>
            <p>
              Загляните в лабораторию: оборудование, команда и ежедневная работа над качеством каждого продукта.
            </p>
          </header>

          <div class="production-player" :class="{ 'is-started': hasProductionStarted }">
            <video
              ref="productionVideo"
              class="production-player__video"
              src="/about-assets/production.mp4"
              poster="/about-assets/production-poster.png"
              preload="metadata"
              playsinline
              :controls="hasProductionStarted"
              @play="hasProductionStarted = true"
            >
              Ваш браузер не поддерживает воспроизведение видео.
            </video>

            <button
              v-if="!hasProductionStarted"
              class="production-player__play"
              type="button"
              aria-label="Смотреть видео о производстве"
              @click="playProduction"
            >
              <span class="production-player__play-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24"><path d="m9 6 9 6-9 6V6Z" /></svg>
              </span>
              <span>Смотреть производство</span>
            </button>

            <div class="production-player__meta" aria-hidden="true">
              <span>Angel Wings / lab</span>
              <span>01:00</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="about-section about-section--goal">
      <div class="container">
        <div class="goal-panel reveal-block">
          <div class="goal-panel__copy">
            <span class="section-number">04 / Наша цель</span>
            <h2>Вывести индустрию<br><em>из «серой зоны».</em></h2>
            <p>
              Наша цель — вывести эту индустрию из «серой зоны» и привнести в неё стандарты качества
              профессиональной фармацевтики. Мы хотим, чтобы наш продукт стал эталоном для всех,
              кто работает с продукцией китайских заводов.
            </p>
          </div>

          <div class="goal-panel__signal" aria-hidden="true">
            <img src="/about-assets/goal-quality-seal.png" alt="">
          </div>
        </div>
      </div>
    </section>

    <section class="about-section about-section--standard">
      <div class="container">
        <div class="standard-panel reveal-block">
          <div class="standard-panel__copy">
            <span class="section-number">05 / Наша миссия</span>
            <h2>Новые стандарты<br><em>прозрачности и качества</em></h2>
            <p>
              Мы стремимся вывести индустрию ввоза и дистрибуции из «серой зоны», задав новые стандарты
              прозрачности и качества. Наш ориентир — принципы профессиональной фармацевтики, где
              безопасность и точность превыше всего.
            </p>
            <div class="standard-panel__actions">
              <RouterLink to="/contact" class="about-button about-button--light">Связаться с нами</RouterLink>
              <a href="/certificate-pts-105445.pdf" target="_blank" rel="noopener" class="standard-link">
                Сертификат
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9" /></svg>
              </a>
            </div>
          </div>

          <div class="standard-panel__mark" aria-hidden="true">
            <div class="standard-panel__glow"></div>
            <span class="standard-panel__mark-ring"></span>
            <img src="/logo-192.webp" alt="">
            <small>Angel Wings</small>
          </div>
        </div>
      </div>
    </section>

    <section class="about-cta">
      <div class="container">
        <div class="about-cta__inner reveal-block">
          <span>Готовы продолжить?</span>
          <h2>Изучите каталог<br>Angel Wings</h2>
          <RouterLink to="/catalog" class="about-cta__link" aria-label="Перейти в каталог">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </RouterLink>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { moleculeTransition } from '../composables/moleculeTransition'

let revealObserver = null
let heroParallaxFrame = 0
let heroParallaxRange = 1
let lastHeroParallaxProgress = -1
const aboutRoot = ref(null)
const heroSection = ref(null)
const productionVideo = ref(null)
const hasProductionStarted = ref(false)
const isAboutReady = computed(() => moleculeTransition.stage === 'about' || moleculeTransition.stage === 'idle')

const playProduction = async () => {
  if (!productionVideo.value) return
  try {
    await productionVideo.value.play()
  } catch {
    // Browser policies can block playback; native controls remain available as a fallback.
    hasProductionStarted.value = true
  }
}

const syncHeroParallaxRange = () => {
  heroParallaxRange = Math.max(1, (heroSection.value?.offsetHeight || window.innerHeight) * 0.68)
}

const applyHeroParallax = () => {
  heroParallaxFrame = 0
  const app = document.querySelector('.app')
  if (!app || !aboutRoot.value) return

  // The hero is a static composition on phones: movement makes it collide with the CTA.
  if (window.matchMedia('(max-width: 768px)').matches) {
    lastHeroParallaxProgress = -1
    app.classList.remove('is-about-hero-scrolling')
    app.style.removeProperty('--about-sphere-scroll-y')
    aboutRoot.value.style.removeProperty('--about-podium-scroll-x')
    return
  }

  const progress = Math.min(1, Math.max(0, window.scrollY / heroParallaxRange))
  if (Math.abs(progress - lastHeroParallaxProgress) < 0.002) return
  lastHeroParallaxProgress = progress

  if (progress > 0) app.classList.add('is-about-hero-scrolling')
  app.style.setProperty('--about-sphere-scroll-y', `${(-progress * 185).toFixed(1)}px`)
  aboutRoot.value.style.setProperty('--about-podium-scroll-x', `${(progress * 150).toFixed(1)}px`)
}

const queueHeroParallax = () => {
  if (heroParallaxFrame) return
  heroParallaxFrame = window.requestAnimationFrame(applyHeroParallax)
}

const principles = [
  {
    title: 'Качество',
    text: 'Безопасность и точность — основа каждого решения и каждого этапа работы.',
    icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 7 3v5c0 4.4-2.8 8.4-7 10-4.2-1.6-7-5.6-7-10V6l7-3Z"/><path d="m8.5 12 2.2 2.2 4.8-5"/></svg>'
  },
  {
    title: 'Наука',
    text: 'Мы начали с самостоятельного синтеза семаглутида и продолжаем развивать собственные разработки.',
    icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3h6M10 3v6l-5.5 9.2A2 2 0 0 0 6.2 21h11.6a2 2 0 0 0 1.7-2.8L14 9V3"/><path d="M8 15h8M10 12h4"/></svg>'
  },
  {
    title: 'Прозрачность',
    text: 'Надёжность и легальность — конкурентное преимущество, а не компромисс.',
    icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 7.5 5.7-2.9 9L12 21l-4.6-3.3-2.9-9L12 3Z"/><path d="m9.5 11.2 1.8 1.8 3.5-4"/></svg>'
  }
]

const journey = [
  { title: 'Актуальный каталог', text: 'Проверяем данные, наличие и варианты товаров перед публикацией.' },
  { title: 'Понятное оформление', text: 'Собираем заказ в едином сценарии без лишних шагов и скрытых условий.' },
  { title: 'Контроль и уведомления', text: 'Фиксируем статус оплаты и сообщаем о важных изменениях по заказу.' },
  { title: 'Доставка и сопровождение', text: 'Помогаем отследить отправление и остаёмся на связи после оформления.' }
]

onMounted(() => {
  const blocks = document.querySelectorAll('.reveal-block')
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const supportsObserver = 'IntersectionObserver' in window

  if (!reducedMotion) {
    syncHeroParallaxRange()
    applyHeroParallax()
    window.addEventListener('scroll', queueHeroParallax, { passive: true })
    window.addEventListener('resize', syncHeroParallaxRange, { passive: true })
  }

  if (!supportsObserver || reducedMotion) {
    blocks.forEach(block => block.classList.add('is-visible'))
    return
  }

  revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return
      entry.target.classList.add('is-visible')
      revealObserver?.unobserve(entry.target)
    })
  }, { threshold: 0.16, rootMargin: '0px 0px -7% 0px' })

  blocks.forEach(block => revealObserver.observe(block))

})

onBeforeUnmount(() => {
  revealObserver?.disconnect()
  window.cancelAnimationFrame(heroParallaxFrame)
  window.removeEventListener('scroll', queueHeroParallax)
  window.removeEventListener('resize', syncHeroParallaxRange)
  const app = document.querySelector('.app')
  app?.style.removeProperty('--about-sphere-scroll-y')
  app?.classList.remove('is-about-hero-scrolling')
  aboutRoot.value?.style.removeProperty('--about-podium-scroll-x')
})
</script>

<style scoped>
.about-page {
  --about-accent: #9eb7ff;
  --about-accent-strong: #6f95ff;
  position: relative;
  overflow: hidden;
  background: var(--bg-primary);
  opacity: 0;
  transition: opacity 0.5s ease;
}

.about-page.is-ready { opacity: 1; }

.about-hero {
  position: relative;
  min-height: calc(100svh - var(--header-height, 76px));
  display: flex;
  align-items: center;
  padding: clamp(4rem, 8vh, 7.5rem) 0 clamp(5rem, 9vh, 8rem);
  isolation: isolate;
}

.about-hero::before {
  content: '';
  position: absolute;
  width: min(54vw, 780px);
  height: min(62vh, 680px);
  right: -5%;
  top: 10%;
  border-radius: 43% 57% 46% 54% / 55% 42% 58% 45%;
  background:
    radial-gradient(ellipse at 36% 34%, rgba(121, 181, 255, 0.2), transparent 29%),
    radial-gradient(ellipse at 69% 61%, rgba(42, 104, 255, 0.2), transparent 39%),
    radial-gradient(ellipse at 42% 76%, rgba(50, 133, 255, 0.1), transparent 32%);
  filter: blur(48px);
  opacity: 0.86;
  transform: rotate(-13deg) scale(1.08);
  z-index: -2;
}

.about-grid {
  position: absolute;
  inset: 0;
  z-index: -1;
  opacity: 0.36;
  background-image:
    linear-gradient(rgba(158, 183, 255, 0.045) 1px, transparent 1px),
    linear-gradient(90deg, rgba(158, 183, 255, 0.045) 1px, transparent 1px);
  background-size: 72px 72px;
  mask-image: linear-gradient(180deg, black 0%, transparent 92%);
}

.about-hero__container {
  width: 100%;
}

.about-hero__visual {
  position: absolute;
  z-index: 2;
  width: min(47vw, 670px);
  aspect-ratio: 1;
  right: clamp(-4rem, -1vw, -1rem);
  top: 50%;
  pointer-events: none;
  transform: translateY(-50%);
}

.about-hero__visual-glow {
  position: absolute;
  inset: 18% 10% 6%;
  z-index: 0;
  border-radius: 48% 52% 45% 55% / 54% 42% 58% 46%;
  background:
    radial-gradient(ellipse at 45% 36%, rgba(119, 180, 255, 0.22), transparent 24%),
    radial-gradient(ellipse at 58% 70%, rgba(27, 102, 255, 0.34), transparent 48%);
  filter: blur(38px);
  opacity: 0.9;
}

.about-hero__visual-rings {
  position: absolute;
  z-index: 1;
  width: 76%;
  height: 16%;
  left: 12%;
  bottom: 3%;
  border: 1px solid rgba(96, 151, 255, 0.34);
  border-radius: 50%;
  box-shadow: 0 14px 0 -1px rgba(48, 112, 255, 0.16), 0 28px 0 -1px rgba(41, 91, 207, 0.09), 0 22px 55px rgba(15, 83, 255, 0.5);
}

.about-hero__visual-rings {
  display: none;
}

.about-hero__copy { position: relative; z-index: 4; }

@media (min-width: 1120px) {
  .about-hero__copy {
    max-width: min(49vw, 700px);
  }
}

.about-hero__molecule {
  --molecule-tilt-x: 0deg;
  --molecule-tilt-y: 0deg;
  --molecule-highlight-x: 50%;
  --molecule-highlight-y: 45%;
  position: absolute;
  z-index: 2;
  width: min(41vw, 580px);
  aspect-ratio: 1;
  right: clamp(2rem, 8vw, 11rem);
  top: clamp(4.5rem, 13vh, 9.5rem);
  pointer-events: auto;
  perspective: 1300px;
  transform: translateZ(0);
  opacity: 0;
  will-change: transform, opacity;
}

.about-hero__molecule.is-intro-ready {
  animation: moleculeSceneReveal 1.45s cubic-bezier(0.16, 1, 0.3, 1) 0.18s both;
}

@media (min-width: 1120px) {
  .about-hero__molecule {
    right: clamp(-4rem, -2vw, -1rem);
  }
}

.about-hero__molecule-glow {
  position: absolute;
  inset: 8% -12% 6% -18%;
  z-index: -1;
  border-radius: 43% 57% 46% 54% / 52% 40% 60% 48%;
  opacity: 0.48;
  background:
    radial-gradient(ellipse at var(--molecule-highlight-x) var(--molecule-highlight-y), rgba(211, 240, 255, 0.26), transparent 18%),
    radial-gradient(ellipse at 71% 46%, rgba(39, 128, 255, 0.21), transparent 34%),
    radial-gradient(ellipse at 28% 72%, rgba(48, 102, 238, 0.16), transparent 30%);
  filter: blur(68px);
  transform: rotate(-19deg) scale(1.16);
  transition: background-position 900ms cubic-bezier(0.22, 1, 0.36, 1);
}

.about-hero__molecule-frame {
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transform: rotateX(var(--molecule-tilt-x)) rotateY(var(--molecule-tilt-y));
  will-change: transform;
  transition: transform 480ms cubic-bezier(0.22, 1, 0.36, 1);
}

.about-hero__molecule.is-pointer-active .about-hero__molecule-frame {
  transition: none;
}

.about-hero__molecule-float {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  will-change: transform;
}

.about-hero__molecule.is-motion-active .about-hero__molecule-float {
  animation: moleculeWaterHover 10.5s cubic-bezier(0.42, 0, 0.58, 1) infinite;
}

.about-hero__molecule img {
  position: relative;
  z-index: 1;
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: none;
  transform: translateZ(16px);
  -webkit-user-drag: none;
  user-select: none;
}

.about-eyebrow,
.section-number {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--about-accent);
  font-family: var(--font-mono);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.about-eyebrow span {
  width: 34px;
  height: 1px;
  background: currentColor;
  box-shadow: 0 0 12px currentColor;
}

.about-hero__title {
  max-width: 700px;
  margin: 1.6rem 0 0;
  font-family: var(--font-display);
  font-size: clamp(3.4rem, 4.4vw, 4.7rem);
  font-weight: 700;
  line-height: 0.94;
  letter-spacing: -0.05em;
  text-wrap: pretty;
}

.about-hero__title em { display: inline-block; white-space: normal; }

.about-hero__title em,
.section-heading h2 em,
.journey-intro h2 em,
.standard-panel h2 em {
  color: var(--about-accent);
  font-style: normal;
  font-weight: inherit;
}

.about-hero__lead {
  max-width: 660px;
  color: var(--text-secondary);
  font-size: clamp(1rem, 1.25vw, 1.22rem);
  line-height: 1.75;
}

.about-hero__support {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(420px, 0.72fr);
  align-items: end;
  gap: clamp(3rem, 10vw, 10rem);
  margin-top: clamp(3rem, 6vh, 5rem);
}

@media (min-width: 1120px) {
  .about-hero__support {
    grid-template-columns: 1fr;
    gap: 2.6rem;
    margin-top: 2.8rem;
  }
}

.about-hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
  margin-top: 2.1rem;
}

.about-button {
  min-height: 52px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 0.85rem 1.3rem;
  border: 1px solid var(--border);
  border-radius: 14px;
  color: var(--text-primary);
  font-size: 0.83rem;
  font-weight: 750;
  transition: transform 0.3s ease, border-color 0.3s ease, background 0.3s ease, box-shadow 0.3s ease;
}

.about-button svg,
.standard-link svg,
.journey-step svg,
.about-cta__link svg {
  width: 19px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.about-button--primary {
  color: #08101f;
  border-color: transparent;
  background: var(--about-accent);
  box-shadow: 0 18px 46px rgba(86, 130, 255, 0.22);
}

.about-button--ghost { background: rgba(255, 255, 255, 0.025); }
.about-button:hover { transform: translateY(-3px); border-color: rgba(158, 183, 255, 0.58); }
.about-button--primary:hover { background: #b7c8ff; box-shadow: 0 22px 52px rgba(86, 130, 255, 0.32); }

.about-hero__signals {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
  margin-top: 0;
}

.about-hero__signals > div { display: grid; gap: 0.55rem; padding-top: 1rem; border-top: 1px solid rgba(158, 183, 255, 0.24); }
.signal-index { color: var(--about-accent); font-family: var(--font-mono); font-size: 0.65rem; }
.about-hero__signals strong { color: var(--text-secondary); font-size: 0.74rem; font-weight: 600; }

.about-hero__backdrop {
  position: absolute;
  inset: 0;
  z-index: -3;
  overflow: hidden;
  background:
    radial-gradient(ellipse 34% 47% at 76% 31%, rgba(71, 118, 236, 0.15), transparent 76%),
    radial-gradient(ellipse 25% 35% at 92% 68%, rgba(37, 97, 218, 0.09), transparent 78%),
    linear-gradient(120deg, rgba(7, 10, 18, 0.98), rgba(14, 24, 49, 0.95) 72%, rgba(9, 14, 27, 0.98));
}

.about-hero__backdrop::after {
  content: '';
  position: absolute;
  width: min(38vw, 560px);
  aspect-ratio: 1;
  right: -9%;
  bottom: -22%;
  border: 1px solid rgba(158, 183, 255, 0.14);
  transform: rotate(45deg);
  box-shadow: 0 0 0 70px rgba(158, 183, 255, 0.025), 0 0 0 140px rgba(158, 183, 255, 0.018);
}

.hero-backdrop__monogram {
  position: absolute;
  top: 2%;
  left: 50%;
  color: transparent;
  font-family: var(--font-display);
  font-size: clamp(18rem, 38vw, 42rem);
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.09em;
  opacity: 0.08;
  -webkit-text-stroke: 1px #9eb7ff;
  transform: translate3d(-50%, 0, 0);
  transform-origin: center;
  animation: editorialDrift 12s ease-in-out infinite;
}

.hero-backdrop__geometry {
  position: absolute;
  right: 6%;
  bottom: 16%;
  width: min(34vw, 500px);
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(158, 183, 255, 0.34));
  box-shadow: 0 -72px 0 rgba(158, 183, 255, 0.09), 0 72px 0 rgba(158, 183, 255, 0.09);
}

.hero-backdrop__geometry::before,
.hero-backdrop__geometry::after { content: ''; position: absolute; right: 0; width: 7px; height: 7px; border-radius: 50%; background: #85a6ff; box-shadow: 0 0 18px rgba(87, 133, 255, 0.8); }
.hero-backdrop__geometry::before { top: -75px; }
.hero-backdrop__geometry::after { top: 69px; }

.about-hero__scroll {
  position: absolute;
  left: 50%;
  bottom: 1.25rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--text-muted);
  font-family: var(--font-mono);
  font-size: 0.58rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  transform: translateX(-50%) rotate(90deg) translateX(50%);
  transform-origin: center;
}

.about-hero__scroll i { width: 52px; height: 1px; overflow: hidden; background: var(--border); }
.about-hero__scroll i::after { content: ''; display: block; width: 50%; height: 100%; background: var(--about-accent); animation: scrollLine 2.2s ease-in-out infinite; }

/* Focused hero composition: the video backdrop merges into the near-black scene. */
.about-hero {
  min-height: min(780px, calc(100svh - var(--header-height, 76px)));
  align-items: flex-start;
  padding: clamp(6rem, 12vh, 8rem) 0 clamp(3rem, 5vh, 4rem);
  overflow: clip;
  background: #02050d;
}

.about-grid,
.hero-backdrop__monogram,
.hero-backdrop__geometry,
.about-hero__scroll {
  display: none;
}

.about-hero__backdrop {
  background-color: #02050d;
}

.about-hero__backdrop::after { display: none; }

.about-hero__podium {
  position: absolute;
  z-index: -1;
  width: min(48vw, 680px);
  left: calc(79% - min(24vw, 340px));
  right: auto;
  bottom: -9.5rem;
  pointer-events: none;
  transform: translate3d(var(--about-podium-scroll-x, 0px), 0, 0);
  will-change: transform;
}

.about-hero__podium-motion {
  opacity: 0;
  transform: translate3d(-3.5rem, 3rem, 0) scale(0.94);
  transform-origin: 50% 100%;
  will-change: transform, opacity;
}

.about-hero__podium img {
  display: block;
  width: 100%;
  height: auto;
}

.about-page.is-ready .about-hero__podium-motion {
  animation: podiumReveal 1.5s cubic-bezier(0.16, 1, 0.3, 1) 0.32s both;
}

.about-hero::before {
  width: min(47vw, 680px);
  height: min(44vh, 480px);
  right: 1%;
  top: 22%;
  opacity: 0.58;
  filter: blur(64px);
}

.about-hero__copy { max-width: min(54vw, 760px); }

@media (min-width: 1120px) {
  .about-hero__copy { max-width: 760px; }
}

.about-eyebrow {
  gap: 0.85rem;
  font-size: 0.64rem;
  letter-spacing: 0.2em;
  opacity: 0.9;
}

.about-eyebrow span { width: 40px; }

.about-hero__title {
  max-width: 760px;
  margin-top: 1.55rem;
  font-size: clamp(3rem, 4.05vw, 4.6rem);
  font-weight: 700;
  line-height: 0.93;
  letter-spacing: -0.058em;
  text-wrap: balance;
}

.about-hero__title em {
  max-width: 18ch;
  margin-top: 0.12em;
  line-height: 0.98;
  letter-spacing: -0.055em;
}

/* Wide phrasing on large screens; the title wraps naturally on constrained widths. */
.about-hero__wide-break { display: none; }

.about-hero__support { margin-top: 2rem; }
.about-hero__lead {
  max-width: 56ch;
  color: color-mix(in srgb, var(--text-secondary) 92%, #c8d7ff);
  font-size: clamp(0.95rem, 1.05vw, 1.08rem);
  line-height: 1.72;
  letter-spacing: -0.012em;
}
.about-hero__actions { margin-top: 2rem; }
.about-button--primary { min-height: 48px; padding: 0.75rem 1.2rem; }

.about-hero__visual {
  width: min(54vw, 720px);
  right: clamp(-5rem, -2vw, -1.25rem);
  top: 48%;
}

.about-hero__visual-glow {
  inset: 26% 13% 6%;
  opacity: 0.68;
}

@media (min-width: 769px) and (max-width: 1119px) {
  .about-hero {
    min-height: min(780px, calc(100svh - var(--header-height, 76px)));
    padding-top: clamp(5.25rem, 10vh, 6.5rem);
    padding-bottom: clamp(3.5rem, 7vh, 5rem);
  }
  .about-hero__copy { max-width: 50vw; }
  .about-hero__support { display: block; margin-top: 1.8rem; }
  .about-hero__title {
    max-width: 14.5ch;
    font-size: clamp(3rem, 5.8vw, 4.15rem);
    line-height: 0.95;
  }
  .about-hero__title em { max-width: 14.5ch; }
  .about-hero__lead { max-width: 48ch; }
  .about-hero__podium {
    width: min(62vw, 560px);
    left: calc(75% - min(31vw, 280px));
    right: auto;
    bottom: -6rem;
  }
  .about-hero::before { width: 55vw; right: -9%; top: 24%; }
  .about-hero__visual { width: min(57vw, 590px); right: -12vw; top: 52%; }
}

.about-intro { opacity: 0; transform: translateY(22px); }
.about-page.is-ready .about-intro { animation: introReveal 0.85s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
.about-intro--1 { animation-delay: 0.05s; }
.about-intro--2 { animation-delay: 0.14s; }
.about-intro--3 { animation-delay: 0.24s; }
.about-intro--4 { animation-delay: 0.34s; }
.about-intro--5 { animation-delay: 0.44s; }
.about-section { position: relative; padding: clamp(5.5rem, 10vw, 10rem) 0; }

.about-section--manifesto::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(180deg, transparent, rgba(70, 114, 230, 0.045), transparent);
}

.section-heading {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(320px, 0.65fr);
  grid-template-areas:
    "number number"
    "title copy";
  align-items: end;
  column-gap: clamp(3rem, 8vw, 9rem);
  row-gap: clamp(1.7rem, 3vw, 2.7rem);
  margin-bottom: clamp(3rem, 6vw, 5rem);
}

.section-heading > .section-number {
  grid-area: number;
  width: 100%;
}

.section-heading > .section-number::after {
  content: '';
  width: min(12vw, 150px);
  height: 1px;
  margin-left: 0.5rem;
  background: rgba(158, 183, 255, 0.24);
}

.section-heading > h2 { grid-area: title; margin: 0; max-width: 860px; }
.section-heading > p { grid-area: copy; max-width: 460px; margin: 0 0 0.35rem; }
.section-heading > .section-heading__story {
  max-width: 48ch;
  font-size: 0.94rem;
  line-height: 1.72;
  text-wrap: pretty;
}

.section-heading h2,
.journey-intro h2,
.standard-panel h2 {
  font-family: var(--font-display);
  font-size: clamp(2.4rem, 4.4vw, 5rem);
  line-height: 1.02;
  letter-spacing: -0.04em;
}

.section-heading p,
.journey-intro > p,
.standard-panel__copy > p {
  color: var(--text-secondary);
  font-size: 0.98rem;
  line-height: 1.75;
}

.principles-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1rem; }

.principle-card {
  --principle-number-stroke: rgba(158, 183, 255, 0.2);
  --principle-number-fill: rgba(158, 183, 255, 0.025);
  position: relative;
  min-height: 330px;
  display: flex;
  flex-direction: column;
  padding: clamp(1.4rem, 2.4vw, 2.25rem);
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 22px;
  background: linear-gradient(145deg, rgba(158, 183, 255, 0.065), rgba(255, 255, 255, 0.012) 45%, transparent);
  transition: transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.35s ease;
}

.principle-card:hover { transform: translateY(-8px); border-color: rgba(158, 183, 255, 0.45); }
.principle-card__top { position: relative; z-index: 2; min-height: 112px; display: flex; align-items: flex-start; justify-content: space-between; color: var(--about-accent); }
.principle-card__number {
  position: absolute;
  top: -0.6rem;
  left: -0.2rem;
  z-index: -1;
  display: inline-flex;
  align-items: flex-start;
  color: var(--principle-number-fill);
  font-family: var(--font-body);
  font-size: clamp(6rem, 9vw, 9rem);
  font-weight: 800;
  line-height: 0.82;
  letter-spacing: -0.09em;
  font-variant-numeric: lining-nums tabular-nums;
  -webkit-text-stroke: 1px var(--principle-number-stroke);
  user-select: none;
  pointer-events: none;
  transform: scaleX(0.86);
  transform-origin: left top;
  transition: color 0.7s ease, -webkit-text-stroke-color 0.7s ease, transform 0.85s cubic-bezier(0.16, 1, 0.3, 1);
}
.principle-card__top div { position: relative; z-index: 2; width: 42px; height: 42px; display: grid; place-items: center; margin-left: auto; border: 1px solid rgba(158, 183, 255, 0.22); border-radius: 12px; background: color-mix(in srgb, var(--bg-primary) 76%, transparent); backdrop-filter: blur(8px); }
.principle-card__top :deep(svg) { width: 20px; fill: none; stroke: currentColor; stroke-width: 1.45; stroke-linecap: round; stroke-linejoin: round; }
.principle-card h3 { position: relative; z-index: 2; margin: auto 0 1rem; font-family: var(--font-display); font-size: clamp(1.35rem, 2vw, 1.85rem); }
.principle-card p { position: relative; z-index: 2; color: var(--text-secondary); font-size: 0.88rem; line-height: 1.7; }
.principle-card > i { position: absolute; width: 150px; height: 150px; right: -75px; bottom: -75px; border: 1px solid rgba(158, 183, 255, 0.13); border-radius: 50%; transition: transform 0.6s ease; }
.principle-card:hover > i { transform: scale(1.35); }

@media (hover: hover) and (pointer: fine) {
  .principle-card:hover .principle-card__number {
    color: rgba(158, 183, 255, 0.055);
    -webkit-text-stroke-color: rgba(158, 183, 255, 0.38);
    transform: translate3d(7px, -4px, 0) scaleX(0.86) scale(1.025);
  }
}

.about-section--journey { border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
.journey-layout { display: grid; grid-template-columns: minmax(300px, 0.7fr) minmax(0, 1fr); gap: clamp(3rem, 8vw, 9rem); }
.journey-intro { position: sticky; top: calc(var(--header-height, 76px) + 2rem); align-self: start; }
.journey-intro h2 { margin: 1.4rem 0 1.5rem; }
.journey-pulse { display: flex; align-items: center; gap: 0.7rem; margin-top: 2.5rem; color: var(--text-muted); font-family: var(--font-mono); font-size: 0.65rem; letter-spacing: 0.12em; text-transform: uppercase; }
.journey-pulse span { width: 8px; height: 8px; border-radius: 50%; background: #62d49d; box-shadow: 0 0 0 0 rgba(98, 212, 157, 0.5); animation: statusPulse 2s ease-out infinite; }
.journey-list { margin: 0; padding: 0; list-style: none; }

.journey-step {
  position: relative;
  isolation: isolate;
  display: grid;
  grid-template-columns: 55px minmax(0, 1fr) 34px;
  gap: 1.2rem;
  align-items: start;
  padding: 2rem 0;
  border-bottom: 1px solid var(--border);
  transition: border-color 0.7s ease;
}

.journey-step::before {
  content: '';
  position: absolute;
  inset: 5px -1rem;
  z-index: -1;
  border-radius: 14px;
  background: linear-gradient(90deg, rgba(158, 183, 255, 0.085), rgba(158, 183, 255, 0.018) 70%, transparent);
  opacity: 0;
  transform: translateX(-10px) scaleX(0.985);
  transform-origin: left center;
  transition:
    opacity 0.6s ease,
    transform 0.78s cubic-bezier(0.16, 1, 0.3, 1);
}

.journey-step:first-child { border-top: 1px solid var(--border); }
.journey-step__number {
  color: var(--about-accent);
  font-family: var(--font-mono);
  font-size: 0.68rem;
  transition: transform 0.72s cubic-bezier(0.16, 1, 0.3, 1);
}
.journey-step > div { transition: transform 0.72s cubic-bezier(0.16, 1, 0.3, 1); }
.journey-step h3 { margin-bottom: 0.55rem; font-family: var(--font-display); font-size: clamp(1.25rem, 2vw, 1.65rem); }
.journey-step p { max-width: 560px; color: var(--text-secondary); font-size: 0.88rem; line-height: 1.65; transition: color 0.6s ease; }
.journey-step svg { color: var(--text-muted); transition: color 0.6s ease, transform 0.72s cubic-bezier(0.16, 1, 0.3, 1); }

@media (hover: hover) and (pointer: fine) {
  .journey-step:hover { border-color: rgba(158, 183, 255, 0.42); }
  .journey-step:hover::before { opacity: 1; transform: translateX(0) scaleX(1); }
  .journey-step:hover .journey-step__number { transform: translateX(4px); }
  .journey-step:hover > div { transform: translateX(8px); }
  .journey-step:hover p { color: color-mix(in srgb, var(--text-secondary) 78%, var(--text-primary)); }
  .journey-step:hover svg { color: var(--about-accent); transform: translateX(7px); }
}

.about-section--production {
  padding-top: clamp(5rem, 9vw, 9rem);
  padding-bottom: clamp(4rem, 8vw, 8rem);
}

.production-layout {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: clamp(2rem, 4vw, 5rem);
  align-items: start;
}

.production-layout__heading { padding-bottom: 0; }
.production-layout__heading h2 {
  max-width: none;
  margin: 1.3rem 0 1.35rem;
  font-family: var(--font-display);
  font-size: clamp(2.5rem, 4.45vw, 5rem);
  line-height: 0.98;
  letter-spacing: -0.052em;
}
.production-layout__heading h2 em { color: var(--about-accent); font-style: normal; }
.production-layout__heading p {
  max-width: 54ch;
  color: var(--text-secondary);
  font-size: 0.97rem;
  line-height: 1.75;
  text-wrap: pretty;
}

.production-player {
  position: relative;
  isolation: isolate;
  aspect-ratio: 16 / 10;
  min-height: 320px;
  overflow: hidden;
  border: 1px solid rgba(158, 183, 255, 0.26);
  border-radius: clamp(22px, 2.5vw, 32px);
  background: #101010;
  box-shadow: 0 32px 90px rgba(0, 3, 13, 0.45), 0 0 0 1px rgba(145, 177, 255, 0.035) inset;
}
.production-player::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background:
    linear-gradient(90deg, rgba(2, 5, 13, 0.52), transparent 43%),
    linear-gradient(0deg, rgba(2, 5, 13, 0.62), transparent 34%);
  transition: opacity 0.45s ease;
}
.production-player::after {
  content: '';
  position: absolute;
  inset: 12px;
  z-index: 3;
  border: 1px solid rgba(224, 232, 255, 0.17);
  border-radius: calc(clamp(22px, 2.5vw, 32px) - 8px);
  pointer-events: none;
  transition: opacity 0.35s ease;
}
.production-player.is-started::before,
.production-player.is-started::after { opacity: 0; }
.production-player__video {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  background: #101010;
}
.production-player__play {
  position: absolute;
  z-index: 2;
  left: clamp(1.25rem, 3vw, 2.4rem);
  bottom: clamp(1.25rem, 3vw, 2.4rem);
  display: inline-flex;
  align-items: center;
  gap: 0.9rem;
  min-height: 58px;
  padding: 0.45rem 1.25rem 0.45rem 0.5rem;
  border: 1px solid rgba(234, 240, 255, 0.48);
  border-radius: 999px;
  color: #f9fbff;
  background: rgba(5, 9, 20, 0.48);
  box-shadow: 0 12px 38px rgba(0, 2, 12, 0.28);
  backdrop-filter: blur(12px);
  font-family: var(--font-mono);
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.095em;
  text-transform: uppercase;
  cursor: pointer;
  transition: transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), background 0.35s ease, border-color 0.35s ease;
}
.production-player__play-icon {
  width: 46px;
  height: 46px;
  display: grid;
  place-items: center;
  flex: none;
  border-radius: 50%;
  color: #0b1833;
  background: var(--about-accent);
  box-shadow: 0 0 0 7px rgba(158, 183, 255, 0.16);
}
.production-player__play-icon svg { width: 19px; fill: currentColor; transform: translateX(1px); }
.production-player__meta {
  position: absolute;
  z-index: 2;
  top: clamp(1.25rem, 3vw, 2.2rem);
  right: clamp(1.25rem, 3vw, 2.2rem);
  display: flex;
  gap: 1rem;
  color: rgba(244, 247, 255, 0.8);
  font-family: var(--font-mono);
  font-size: 0.58rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}
.production-player__meta span:last-child { color: var(--about-accent); }

@media (hover: hover) and (pointer: fine) {
  .production-player:hover .production-player__play {
    border-color: rgba(235, 241, 255, 0.8);
    background: rgba(18, 31, 60, 0.72);
    transform: translateY(-4px);
  }
  .production-player:hover .production-player__play-icon { animation: productionPlayPulse 1.5s ease-in-out infinite; }
}

@keyframes productionPlayPulse {
  50% { box-shadow: 0 0 0 11px rgba(158, 183, 255, 0.08); }
}

.about-section--goal { padding-top: clamp(4rem, 8vw, 8rem); }
.goal-panel {
  position: relative;
  isolation: isolate;
  min-height: 430px;
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(280px, 0.7fr);
  align-items: center;
  gap: clamp(2.5rem, 7vw, 7rem);
  padding: clamp(2rem, 5vw, 5rem);
  overflow: hidden;
  border: 1px solid rgba(158, 183, 255, 0.24);
  border-radius: clamp(24px, 3vw, 38px);
  background:
    radial-gradient(ellipse at 80% 52%, rgba(31, 83, 193, 0.22), transparent 38%),
    linear-gradient(120deg, rgba(16, 23, 44, 0.94), rgba(7, 10, 19, 0.98) 66%);
}

.goal-panel::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  opacity: 0.5;
  background-image: linear-gradient(rgba(158, 183, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(158, 183, 255, 0.05) 1px, transparent 1px);
  background-size: 64px 64px;
  mask-image: linear-gradient(90deg, black, transparent 78%);
}

.goal-panel__copy { position: relative; z-index: 2; max-width: 680px; }
.goal-panel h2 {
  max-width: 760px;
  margin: 1.25rem 0 1.55rem;
  font-family: var(--font-display);
  font-size: clamp(2.5rem, 4.65vw, 5.1rem);
  line-height: 0.98;
  letter-spacing: -0.052em;
}
.goal-panel h2 em { color: var(--about-accent); font-style: normal; }
.goal-panel p { max-width: 55ch; color: var(--text-secondary); font-size: 1rem; line-height: 1.75; text-wrap: pretty; }

.goal-panel__signal {
  position: relative;
  z-index: 1;
  justify-self: center;
  width: min(29vw, 360px);
  aspect-ratio: 1;
  display: grid;
  place-items: center;
  filter: drop-shadow(0 24px 36px rgba(0, 7, 28, 0.5));
}
.goal-panel__signal::before {
  content: '';
  position: absolute;
  z-index: -1;
  width: 78%;
  aspect-ratio: 1;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(71, 128, 255, 0.24), rgba(18, 48, 112, 0.1) 45%, transparent 70%);
  filter: blur(10px);
}
.goal-panel__signal img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  transform: translate3d(0, 0, 0);
  will-change: transform;
  animation: qualitySealFloat 7.5s cubic-bezier(.45, 0, .55, 1) infinite;
}
@keyframes qualitySealFloat {
  0%, 100% { transform: translate3d(0, -1.5%, 0) rotate(-1.2deg); }
  50% { transform: translate3d(0, 2.5%, 0) rotate(1.2deg); }
}

.standard-panel {
  position: relative;
  isolation: isolate;
  min-height: 560px;
  display: grid;
  grid-template-columns: minmax(0, 1.08fr) minmax(280px, 0.52fr);
  align-items: center;
  gap: clamp(2rem, 7vw, 8rem);
  padding: clamp(2.5rem, 5.5vw, 5.5rem) 0;
  overflow: hidden;
  border-top: 1px solid rgba(158, 183, 255, 0.28);
  border-bottom: 1px solid rgba(158, 183, 255, 0.18);
  color: #f7f9ff;
}
.standard-panel::before {
  content: '05';
  position: absolute;
  z-index: -1;
  right: -0.035em;
  bottom: -0.22em;
  color: rgba(158, 183, 255, 0.025);
  font-family: var(--font-display);
  font-size: clamp(19rem, 31vw, 39rem);
  font-weight: 700;
  line-height: 0.8;
  letter-spacing: -0.1em;
  pointer-events: none;
}
.standard-panel::after {
  content: '';
  position: absolute;
  z-index: -1;
  right: 0;
  top: 12%;
  width: min(36vw, 540px);
  aspect-ratio: 1;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(53, 109, 235, 0.18), rgba(29, 72, 166, 0.07) 38%, transparent 70%);
  filter: blur(10px);
}

.standard-panel__glow {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 180%;
  aspect-ratio: 1;
  border: 1px solid rgba(158, 183, 255, 0.14);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
}
.standard-panel__glow::before,
.standard-panel__glow::after {
  content: '';
  position: absolute;
  border: 1px solid rgba(158, 183, 255, 0.12);
  border-radius: 50%;
  animation: ringRotate 14s linear infinite;
}
.standard-panel__glow::before { inset: 22%; }
.standard-panel__glow::after { inset: 36%; border-style: dashed; animation-direction: reverse; animation-duration: 10s; }
.standard-panel__copy { position: relative; z-index: 2; max-width: 740px; }
.standard-panel h2 { max-width: 13ch; margin: 1.5rem 0; }
.standard-panel__copy > p { max-width: 55ch; color: rgba(230, 236, 255, 0.68); }
.standard-panel__actions { display: flex; align-items: center; gap: 1.4rem; margin-top: 2.2rem; }
.about-button--light { color: #08101f; border-color: transparent; background: #f1f5ff; }
.standard-link { display: inline-flex; align-items: center; gap: 0.55rem; color: #b9c9fb; font-size: 0.82rem; font-weight: 700; }

.standard-panel__mark {
  position: relative;
  z-index: 2;
  justify-self: center;
  width: min(25vw, 250px);
  aspect-ratio: 1;
  display: grid;
  place-items: center;
  margin-top: 2.5rem;
  transform: translateZ(0);
  transition: transform 1.05s cubic-bezier(0.16, 1, 0.3, 1);
  will-change: transform;
}
.standard-panel__mark-ring {
  position: absolute;
  inset: 14%;
  border: 1px solid rgba(158, 183, 255, 0.27);
  border-radius: 50%;
  animation: ringRotate 20s linear infinite;
  transition: border-color 0.9s ease, opacity 0.9s ease;
}
.standard-panel__mark-ring::before {
  content: '';
  position: absolute;
  width: 10px;
  height: 10px;
  left: 11%;
  top: 15%;
  border-radius: 50%;
  background: #9eb7ff;
  box-shadow: 0 0 20px 6px rgba(86, 130, 255, 0.5);
  transition: box-shadow 0.9s ease, transform 0.9s cubic-bezier(0.16, 1, 0.3, 1);
}
.standard-panel__mark img {
  width: 48%;
  border-radius: 50%;
  box-shadow: 0 22px 60px rgba(33, 84, 214, 0.32);
  transition: transform 1.05s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.9s ease;
}
.standard-panel__mark small { position: absolute; left: 50%; bottom: 8%; font-family: var(--font-mono); font-size: 0.58rem; letter-spacing: 0.18em; text-transform: uppercase; color: rgba(225, 232, 255, 0.58); transform: translateX(-50%); white-space: nowrap; }

@media (hover: hover) and (pointer: fine) {
  .standard-panel__mark:hover { transform: translateY(-5px) scale(1.018); }
  .standard-panel__mark:hover .standard-panel__mark-ring { border-color: rgba(158, 183, 255, 0.48); }
  .standard-panel__mark:hover .standard-panel__mark-ring::before {
    transform: scale(1.16);
    box-shadow: 0 0 26px 8px rgba(86, 130, 255, 0.58);
  }
  .standard-panel__mark:hover img {
    transform: scale(1.045);
    box-shadow: 0 28px 70px rgba(33, 84, 214, 0.42);
  }
}

.about-cta { padding: 0 0 clamp(5rem, 10vw, 9rem); }
.about-cta__inner { display: grid; grid-template-columns: 0.45fr 1fr auto; align-items: center; gap: 2rem; padding: clamp(2rem, 4vw, 3.5rem) 0; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
.about-cta__inner > span { color: var(--text-muted); font-family: var(--font-mono); font-size: 0.68rem; letter-spacing: 0.12em; text-transform: uppercase; }
.about-cta h2 { font-family: var(--font-display); font-size: clamp(2rem, 4vw, 4rem); line-height: 1; letter-spacing: -0.04em; }
.about-cta__link { width: 72px; height: 72px; display: grid; place-items: center; border: 1px solid var(--about-accent); border-radius: 50%; color: #08101f; background: var(--about-accent); transition: transform 0.35s ease, box-shadow 0.35s ease; }
.about-cta__link:hover { transform: rotate(-12deg) scale(1.06); box-shadow: 0 18px 45px rgba(86, 130, 255, 0.28); }
.about-cta__link svg { width: 25px; }

.reveal-block { opacity: 0; transform: translateY(34px); transition: opacity 0.75s ease var(--delay, 0ms), transform 0.75s cubic-bezier(0.16, 1, 0.3, 1) var(--delay, 0ms); }
.reveal-block.is-visible { opacity: 1; transform: translateY(0); }

[data-theme="light"] .about-page { --about-accent: #5278df; --about-accent-strong: #315dcc; }
[data-theme="light"] .about-grid { opacity: 0.62; background-image: linear-gradient(rgba(50, 82, 160, 0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(50, 82, 160, 0.055) 1px, transparent 1px); }
[data-theme="light"] .about-hero__backdrop {
  background:
    radial-gradient(ellipse 34% 47% at 76% 31%, rgba(92, 131, 230, 0.14), transparent 76%),
    radial-gradient(ellipse 25% 35% at 92% 68%, rgba(71, 120, 220, 0.08), transparent 78%),
    linear-gradient(120deg, #fafbff, #edf2fd 72%, #f8faff);
}
[data-theme="light"] .hero-backdrop__monogram { -webkit-text-stroke-color: #5278df; }
[data-theme="light"] .principle-card {
  --principle-number-stroke: rgba(49, 93, 204, 0.2);
  --principle-number-fill: rgba(49, 93, 204, 0.025);
  background: linear-gradient(145deg, rgba(94, 130, 224, 0.1), rgba(255, 255, 255, 0.5) 48%, transparent);
}
[data-theme="light"] .about-button--primary { color: #fff; }

@keyframes introReveal { to { opacity: 1; transform: translateY(0) scale(1); } }
@keyframes podiumReveal {
  0% { opacity: 0; transform: translate3d(-3.5rem, 3rem, 0) scale(0.94); }
  68% { opacity: 1; transform: translate3d(0.25rem, -0.25rem, 0) scale(1.012); }
  100% { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
}
@keyframes aboutLoaderPulse {
  0%, 100% { transform: scale(0.94); opacity: 0.62; }
  50% { transform: scale(1.06); opacity: 1; }
}
@keyframes editorialScan {
  0%, 12% { transform: translateY(-100%); opacity: 0; }
  22% { opacity: 1; }
  58%, 100% { transform: translateY(100%); opacity: 0; }
}
@keyframes editorialDrift {
  0%, 100% { transform: translate3d(-50%, 0, 0) scale(1); }
  50% { transform: translate3d(-50%, 6px, 0) scale(1.015); opacity: 0.16; }
}
@keyframes moleculeSceneReveal {
  0% {
    opacity: 0;
    transform: translate3d(44px, 42px, -56px) scale(0.88);
  }
  64% {
    opacity: 1;
    transform: translate3d(-4px, -3px, 0) scale(1.018);
  }
  100% {
    opacity: 1;
    transform: translate3d(0, 0, 0) scale(1);
  }
}
@keyframes moleculeWaterHover {
  0%, 100% { transform: translate3d(0, 0, 0) rotateZ(-0.35deg) scale(1); }
  28% { transform: translate3d(5px, -12px, 20px) rotateZ(0.3deg) scale(1.012); }
  58% { transform: translate3d(-4px, -22px, 8px) rotateZ(0.55deg) scale(1.018); }
  80% { transform: translate3d(-7px, -9px, 15px) rotateZ(-0.18deg) scale(1.008); }
}
@keyframes scrollLine { 0% { transform: translateX(-110%); } 60%, 100% { transform: translateX(210%); } }
@keyframes statusPulse { 70% { box-shadow: 0 0 0 9px rgba(98, 212, 157, 0); } 100% { box-shadow: 0 0 0 0 rgba(98, 212, 157, 0); } }
@keyframes ringRotate { to { transform: rotate(360deg); } }

@media (max-width: 1050px) {
  .about-hero__title { font-size: clamp(3rem, 6.2vw, 4.2rem); }
  .about-hero__support { grid-template-columns: minmax(0, 1fr) minmax(360px, 0.8fr); gap: 3rem; }
  .about-hero__molecule { width: min(39vw, 430px); right: 2rem; top: 9rem; opacity: 0.88; }
  .about-hero__visual { width: min(49vw, 490px); right: -4rem; }
  .section-heading { grid-template-columns: minmax(0, 1.15fr) minmax(280px, 0.7fr); column-gap: 3rem; }
  .production-layout { gap: 3rem; }
}

@media (max-width: 768px) {
  .about-hero {
    min-height: max(58rem, 125svh);
    padding: 2.2rem 0 clamp(16rem, 68vw, 20rem);
  }
  .about-hero::before { width: 110vw; height: 44vh; right: -35%; top: auto; bottom: 10%; opacity: 0.42; }
  .about-hero__podium {
    width: min(110vw, 450px);
    left: calc(50% - min(55vw, 225px));
    right: auto;
    bottom: -1.25rem;
  }
  .about-grid { background-size: 48px 48px; }
  .about-hero__visual { width: min(78vw, 360px); right: -19vw; top: 16%; opacity: 0.42; }
  .about-hero__molecule { width: min(72vw, 330px); right: -10vw; top: 1rem; opacity: 0.38; }
  .about-hero__container { display: flex; flex-direction: column; gap: 0.5rem; }
  .about-hero__copy { width: 100%; max-width: 100%; }
  .about-eyebrow { gap: 0.65rem; font-size: 0.59rem; letter-spacing: 0.17em; }
  .about-eyebrow span { width: 30px; }
  .about-hero__title { max-width: 100%; margin: 1.2rem 0 0; font-size: clamp(2.65rem, 11.4vw, 3.8rem); line-height: 0.94; letter-spacing: -0.055em; }
  .about-hero__title em { max-width: 100%; white-space: normal; }
  .about-hero__support,
  .about-hero__support > div { width: 100%; min-width: 0; }
  .about-hero__support { grid-template-columns: 1fr; gap: 2.5rem; margin-top: 2.25rem; }
  .about-hero__lead { width: 100%; max-width: 100%; font-size: 0.94rem; line-height: 1.68; }
  .about-hero__actions { display: grid; grid-template-columns: 1fr; }
  .about-button { width: 100%; }
  .about-hero__signals { gap: 0.45rem; }
  .about-hero__signals strong { font-size: 0.61rem; line-height: 1.35; }
  .hero-backdrop__monogram { top: 18%; font-size: clamp(17rem, 80vw, 26rem); }
  .hero-backdrop__geometry { right: -16%; width: 75vw; }
  .about-hero__scroll { display: none; }

  .about-section { padding: 4.5rem 0; }
  .section-heading { display: block; margin-bottom: 2rem; }
  .section-heading > .section-number { width: auto; }
  .section-heading > .section-number::after { width: 46px; }
  .section-heading h2,
  .journey-intro h2,
  .standard-panel h2 { margin: 1.2rem 0; font-size: clamp(2.15rem, 10vw, 3.2rem); }
  .section-heading p,
  .journey-intro > p,
  .standard-panel__copy > p { font-size: 0.9rem; line-height: 1.65; }
  .principles-grid { grid-template-columns: 1fr; }
  .principle-card { min-height: 210px; padding: 1.15rem; border-radius: 18px; }
  .principle-card__top { min-height: 76px; }
  .principle-card__number { font-size: 5.25rem; }
  .principle-card h3 { margin-bottom: 0.6rem; font-size: 1.25rem; }
  .principle-card p { font-size: 0.8rem; line-height: 1.58; }

  .journey-layout { grid-template-columns: 1fr; gap: 2.5rem; }
  .journey-intro { position: static; }
  .journey-step { grid-template-columns: 36px minmax(0, 1fr) 22px; gap: 0.75rem; padding: 1.5rem 0; }
  .journey-step h3 { font-size: 1.15rem; }
  .journey-step p { font-size: 0.82rem; }

  .about-section--production { padding: 4.5rem 0; }
  .production-layout { display: block; }
  .production-layout__heading { margin-bottom: 2rem; padding-bottom: 0; }
  .production-layout__heading h2 { max-width: 12ch; margin: 1.15rem 0 1.2rem; font-size: clamp(2.2rem, 10vw, 3.2rem); }
  .production-layout__heading p { font-size: 0.9rem; line-height: 1.68; }
  .production-player { min-height: 0; aspect-ratio: 4 / 3; border-radius: 21px; }
  .production-player__play { left: 1rem; bottom: 1rem; min-height: 52px; padding-right: 1rem; gap: 0.68rem; font-size: 0.55rem; }
  .production-player__play-icon { width: 40px; height: 40px; }
  .production-player__meta { top: 1rem; right: 1rem; gap: 0.6rem; font-size: 0.5rem; }

  .about-section--goal { padding-top: 4.5rem; }
  .goal-panel { grid-template-columns: 1fr; gap: 2.5rem; min-height: auto; padding: 2rem 1.25rem 2.4rem; border-radius: 24px; }
  .goal-panel h2 { margin: 1.15rem 0 1.35rem; font-size: clamp(2.3rem, 10.4vw, 3.2rem); }
  .goal-panel p { font-size: 0.9rem; line-height: 1.68; }
  .goal-panel__signal { width: min(66vw, 265px); }

  .standard-panel { min-height: auto; grid-template-columns: 1fr; gap: 0.5rem; padding: 3.5rem 0; }
  .standard-panel::before { right: -0.05em; bottom: -0.02em; font-size: 16rem; }
  .standard-panel::after { top: auto; bottom: 4%; right: -25%; width: 105vw; }
  .standard-panel__mark { grid-row: 2; width: 190px; margin: 2.5rem 0 0; }
  .standard-panel__actions { align-items: stretch; flex-direction: column; }
  .standard-link { justify-content: center; min-height: 42px; }

  .about-cta__inner { grid-template-columns: 1fr auto; gap: 1rem; }
  .about-cta__inner > span { grid-column: 1 / -1; }
  .about-cta__link { width: 58px; height: 58px; }
}

@media (max-width: 420px) {
  .about-hero__title { font-size: clamp(2.48rem, 11.8vw, 3.15rem); }
  .about-hero__signals { grid-template-columns: 1fr; }
  .about-hero__signals > div { grid-template-columns: 24px 1fr; align-items: center; }
}

@media (max-width: 500px) {
  .about-hero__wide-break { display: inline; }
}

@media (min-width: 540px) and (max-width: 768px) {
  .about-hero {
    min-height: max(53rem, 100svh);
  }
  .about-hero__podium { bottom: -1.25rem; }
}

@media (prefers-reduced-motion: reduce) {
  .about-page *,
  .about-page *::before,
  .about-page *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
  }
  .about-hero__molecule-frame,
  .about-hero__molecule-float { transform: none !important; transition: none; }
  .about-hero__molecule { opacity: 1; transform: none !important; }
  .about-intro,
  .reveal-block { opacity: 1; transform: none; transition: none; }
  .journey-step,
  .journey-step::before,
  .journey-step__number,
  .journey-step > div,
  .journey-step p,
  .journey-step svg { transition: none; }
}
</style>
