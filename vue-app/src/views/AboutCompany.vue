<template>
  <main class="about-page">
    <section class="about-hero">
      <div class="about-grid" aria-hidden="true"></div>
      <div class="about-hero__backdrop" aria-hidden="true">
        <div class="hero-backdrop__scan"></div>
        <span class="hero-backdrop__monogram">AW</span>
        <div class="hero-backdrop__geometry"></div>
      </div>
      <div class="container about-hero__container">
        <div class="about-hero__copy">
          <div class="about-eyebrow about-intro about-intro--1">
            <span></span>
            О компании Angel Wings
          </div>

          <h1 class="about-hero__title about-intro about-intro--2">
            Наука в деталях.<br>
            <em>Сервис — по-человечески.</em>
          </h1>

          <div class="about-hero__support">
            <div>
              <p class="about-hero__lead about-intro about-intro--3">
                Мы развиваем профессиональную среду для выбора исследовательской пептидной продукции —
                с понятной информацией, аккуратной логистикой и поддержкой на каждом этапе заказа.
              </p>

              <div class="about-hero__actions about-intro about-intro--4">
                <RouterLink to="/catalog" class="about-button about-button--primary">
                  Перейти в каталог
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </RouterLink>
                <a href="/pharmaceutical-license.pdf" target="_blank" rel="noopener" class="about-button about-button--ghost">
                  Посмотреть документы
                </a>
              </div>
            </div>

            <div class="about-hero__signals about-intro about-intro--5" aria-label="Принципы компании">
              <div>
                <span class="signal-index">01</span>
                <strong>Точная информация</strong>
              </div>
              <div>
                <span class="signal-index">02</span>
                <strong>Контроль процессов</strong>
              </div>
              <div>
                <span class="signal-index">03</span>
                <strong>Живая поддержка</strong>
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

    <section class="about-section about-section--manifesto">
      <div class="container">
        <div class="section-heading reveal-block">
          <span class="section-number">01 / Подход</span>
          <h2>Не просто каталог.<br><em>Понятная система выбора.</em></h2>
          <p>
            Мы соединяем продуктовую информацию, удобный интерфейс и внимательное сопровождение,
            чтобы каждый этап — от первого знакомства до получения заказа — был предсказуемым.
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
                <span>0</span><span :class="{ 'principle-card__digit--three': index === 2 }">{{ index + 1 }}</span>
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
          <h2>Путь заказа<br><em>без белых пятен</em></h2>
          <p>
            За интерфейсом работают связанные процессы: актуальный каталог, проверка заказа,
            уведомления и сопровождение доставки.
          </p>
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

    <section class="about-section about-section--standard">
      <div class="container">
        <div class="standard-panel reveal-block">
          <div class="standard-panel__copy">
            <span class="section-number">03 / Стандарт Angel Wings</span>
            <h2>Доверие начинается<br><em>с прозрачности</em></h2>
            <p>
              Мы последовательно улучшаем карточки товаров, личный кабинет, уведомления и внутренние
              процессы. Если возникает вопрос, команда помогает разобраться с оформлением, оплатой,
              доставкой и статусом заказа.
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
import { onBeforeUnmount, onMounted } from 'vue'

let revealObserver = null

const principles = [
  {
    title: 'Информация без шума',
    text: 'Структурируем характеристики и описание так, чтобы важные детали находились быстро и читались однозначно.',
    icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19V5a2 2 0 0 1 2-2h9l5 5v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z"/><path d="M14 3v6h6M8 13h8M8 17h5"/></svg>'
  },
  {
    title: 'Аккуратная логистика',
    text: 'Заказ проходит последовательную сборку, а ключевые этапы доставки сопровождаются понятными статусами.',
    icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h11v11H3zM14 9h4l3 4v4h-7z"/><circle cx="7" cy="19" r="2"/><circle cx="18" cy="19" r="2"/></svg>'
  },
  {
    title: 'Поддержка в контексте',
    text: 'Помогаем не шаблонными ответами, а по конкретному заказу: от оформления и оплаты до получения.',
    icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3v-7a9 9 0 1 1 18 0Z"/><path d="M8 10h8M8 14h5"/></svg>'
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
  if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
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

onBeforeUnmount(() => revealObserver?.disconnect())
</script>

<style scoped>
.about-page {
  --about-accent: #9eb7ff;
  --about-accent-strong: #6f95ff;
  position: relative;
  overflow: hidden;
  background: var(--bg-primary);
}

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
  width: min(66vw, 960px);
  aspect-ratio: 1;
  right: -15%;
  top: -24%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(54, 112, 255, 0.17), transparent 67%);
  filter: blur(8px);
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

.about-hero__copy { position: relative; z-index: 4; }

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
  max-width: 1380px;
  margin: 1.6rem 0 0;
  font-family: var(--font-display);
  font-size: clamp(4rem, 7.4vw, 8rem);
  font-weight: 700;
  line-height: 0.9;
  letter-spacing: -0.055em;
  text-wrap: balance;
}

.about-hero__title em { display: inline-block; white-space: nowrap; }

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
    radial-gradient(circle at 82% 25%, rgba(71, 118, 236, 0.2), transparent 34%),
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

.hero-backdrop__scan {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(180deg, transparent 0%, rgba(139, 174, 255, 0.12) 49%, rgba(139, 174, 255, 0.45) 50%, transparent 51%);
  transform: translateY(-100%);
  animation: editorialScan 8s cubic-bezier(0.45, 0, 0.55, 1) infinite 1.2s;
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

.about-intro { opacity: 0; transform: translateY(22px); animation: introReveal 0.85s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
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
  font-family: var(--font-display);
  font-size: clamp(6rem, 9vw, 9rem);
  font-weight: 800;
  line-height: 0.82;
  letter-spacing: -0.09em;
  -webkit-text-stroke: 1px var(--principle-number-stroke);
  user-select: none;
  pointer-events: none;
  transform: scaleX(0.72);
  transform-origin: left top;
  transition: color 0.7s ease, -webkit-text-stroke-color 0.7s ease, transform 0.85s cubic-bezier(0.16, 1, 0.3, 1);
}
.principle-card__number > span { display: inline-block; }
.principle-card__digit--three { transform: translateY(0.05em) scaleY(0.7); transform-origin: center top; }
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
    transform: translate3d(7px, -4px, 0) scaleX(0.72) scale(1.025);
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

.standard-panel {
  position: relative;
  min-height: 560px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(300px, 0.55fr);
  align-items: center;
  gap: 3rem;
  padding: clamp(2rem, 5vw, 5rem);
  overflow: hidden;
  border: 1px solid rgba(158, 183, 255, 0.24);
  border-radius: clamp(24px, 3vw, 42px);
  background:
    radial-gradient(circle at 85% 35%, rgba(51, 116, 255, 0.22), transparent 35%),
    linear-gradient(135deg, #0d1425, #080b13 68%);
  color: #f7f9ff;
  box-shadow: 0 40px 100px rgba(0, 0, 0, 0.22);
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
.standard-panel__copy { position: relative; z-index: 2; max-width: 720px; }
.standard-panel h2 { margin: 1.5rem 0; }
.standard-panel__copy > p { max-width: 640px; color: rgba(230, 236, 255, 0.68); }
.standard-panel__actions { display: flex; align-items: center; gap: 1.4rem; margin-top: 2.2rem; }
.about-button--light { color: #08101f; border-color: transparent; background: #f1f5ff; }
.standard-link { display: inline-flex; align-items: center; gap: 0.55rem; color: #b9c9fb; font-size: 0.82rem; font-weight: 700; }

.standard-panel__mark {
  position: relative;
  z-index: 2;
  justify-self: center;
  width: min(28vw, 270px);
  aspect-ratio: 1;
  display: grid;
  place-items: center;
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
    radial-gradient(circle at 82% 25%, rgba(92, 131, 230, 0.18), transparent 34%),
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
@keyframes editorialScan {
  0%, 12% { transform: translateY(-100%); opacity: 0; }
  22% { opacity: 1; }
  58%, 100% { transform: translateY(100%); opacity: 0; }
}
@keyframes editorialDrift {
  0%, 100% { transform: translate3d(-50%, 0, 0) scale(1); }
  50% { transform: translate3d(-50%, 6px, 0) scale(1.015); opacity: 0.16; }
}
@keyframes scrollLine { 0% { transform: translateX(-110%); } 60%, 100% { transform: translateX(210%); } }
@keyframes statusPulse { 70% { box-shadow: 0 0 0 9px rgba(98, 212, 157, 0); } 100% { box-shadow: 0 0 0 0 rgba(98, 212, 157, 0); } }
@keyframes ringRotate { to { transform: rotate(360deg); } }

@media (max-width: 1050px) {
  .about-hero__title { font-size: clamp(3.5rem, 7.5vw, 5.25rem); }
  .about-hero__support { grid-template-columns: minmax(0, 1fr) minmax(360px, 0.8fr); gap: 3rem; }
  .section-heading { grid-template-columns: minmax(0, 1.15fr) minmax(280px, 0.7fr); column-gap: 3rem; }
}

@media (max-width: 768px) {
  .about-hero { min-height: auto; padding: 2.2rem 0 4.5rem; }
  .about-grid { background-size: 48px 48px; }
  .about-hero__container { display: flex; flex-direction: column; gap: 0.5rem; }
  .about-hero__copy { width: 100%; }
  .about-eyebrow { font-size: 0.61rem; }
  .about-hero__title { margin: 1.15rem 0 0; font-size: clamp(2.75rem, 12.5vw, 4.6rem); line-height: 0.94; }
  .about-hero__title em { white-space: normal; }
  .about-hero__support { grid-template-columns: 1fr; gap: 2.5rem; margin-top: 2.25rem; }
  .about-hero__lead { font-size: 0.92rem; line-height: 1.65; }
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
  .principle-card { min-height: 245px; border-radius: 18px; }

  .journey-layout { grid-template-columns: 1fr; gap: 2.5rem; }
  .journey-intro { position: static; }
  .journey-step { grid-template-columns: 36px minmax(0, 1fr) 22px; gap: 0.75rem; padding: 1.5rem 0; }
  .journey-step h3 { font-size: 1.15rem; }
  .journey-step p { font-size: 0.82rem; }

  .standard-panel { min-height: auto; grid-template-columns: 1fr; padding: 2rem 1.25rem; border-radius: 24px; }
  .standard-panel__mark { grid-row: 1; width: 190px; margin-top: 3rem; }
  .standard-panel__actions { align-items: stretch; flex-direction: column; }
  .standard-link { justify-content: center; min-height: 42px; }

  .about-cta__inner { grid-template-columns: 1fr auto; gap: 1rem; }
  .about-cta__inner > span { grid-column: 1 / -1; }
  .about-cta__link { width: 58px; height: 58px; }
}

@media (max-width: 420px) {
  .about-hero__title { font-size: clamp(2.6rem, 12.2vw, 3.2rem); }
  .about-hero__signals { grid-template-columns: 1fr; }
  .about-hero__signals > div { grid-template-columns: 24px 1fr; align-items: center; }
}

@media (prefers-reduced-motion: reduce) {
  .about-page *,
  .about-page *::before,
  .about-page *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
  }
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
