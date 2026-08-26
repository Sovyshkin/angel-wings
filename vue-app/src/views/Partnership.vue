<template>
  <div class="partnership-page">
    <section class="partnership-hero">
      <div class="partnership-bg" aria-hidden="true">
        <img class="partnership-bg__molecule partnership-bg__molecule--one" src="/hero-assets/молекула-1.png" alt="">
        <img class="partnership-bg__molecule partnership-bg__molecule--two" src="/hero-assets/молекула-3.png" alt="">
        <img class="partnership-bg__drop partnership-bg__drop--one" src="/hero-assets/капелька-1.png" alt="">
        <img class="partnership-bg__drop partnership-bg__drop--two" src="/hero-assets/капелька-2.png" alt="">
      </div>

      <div class="container partnership-hero__grid">
        <div class="partnership-hero__copy">
          <span class="partnership-kicker">Партнёрская программа</span>
          <h1>Станьте партнёром Angel Wings</h1>
          <p>
            Подключим кабинет партнёра, персональный реферальный код и прозрачную систему начислений
            за приведённых клиентов.
          </p>
          <div class="partnership-hero__actions">
            <a href="#partner-form" class="btn btn-primary">Оставить заявку</a>
            <router-link to="/partner" class="btn btn-secondary">Кабинет партнёра</router-link>
          </div>
        </div>

        <div class="partnership-card">
          <div class="partnership-card__label">Как это работает</div>
          <div class="partnership-card__steps">
            <div>
              <span>01</span>
              <strong>Заявка</strong>
              <p>Вы рассказываете о себе, канале и формате сотрудничества.</p>
            </div>
            <div>
              <span>02</span>
              <strong>Проверка</strong>
              <p>Администратор принимает решение и назначает партнёрский профиль.</p>
            </div>
            <div>
              <span>03</span>
              <strong>Кабинет</strong>
              <p>В кабинете доступны код, ссылки, статистика, баланс и выплаты.</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="partnership-content">
      <div class="container partnership-content__grid">
        <div class="partnership-info">
          <div class="section-mini">
            <span>Преимущества</span>
            <h2>Партнёрство без ручного учёта</h2>
            <p>
              После одобрения заявки система автоматически связывает заказы с партнёром:
              по реферальному коду, промокодам и привязкам клиентов.
            </p>
          </div>

          <div class="partner-benefits">
            <article>
              <span class="benefit-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7H14a3.5 3.5 0 010 7H6"/>
                </svg>
              </span>
              <h3>Начисления по заказам</h3>
              <p>Комиссии фиксируются в системе и отображаются в партнёрском кабинете.</p>
            </article>
            <article>
              <span class="benefit-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
                  <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
                </svg>
              </span>
              <h3>Реферальные инструменты</h3>
              <p>Партнёр получает код и может работать через промокоды или прямую привязку клиентов.</p>
            </article>
            <article>
              <span class="benefit-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 3v18h18"/>
                  <path d="M7 15l4-4 3 3 5-7"/>
                </svg>
              </span>
              <h3>Прозрачная статистика</h3>
              <p>Видны клиенты, заказы, начисления, выплаты и текущий партнёрский баланс.</p>
            </article>
          </div>
        </div>

        <form id="partner-form" class="partnership-form" @submit.prevent="submitApplication">
          <div class="partnership-form__head">
            <span>Заявка</span>
            <h2>Расскажите о себе</h2>
            <p>Мы свяжемся после проверки и подскажем следующий шаг.</p>
          </div>

          <div v-if="success" class="form-status form-status--success">
            Заявка отправлена. После одобрения администратор подключит партнёрский кабинет.
          </div>

          <div v-if="error" class="form-status form-status--error">{{ error }}</div>

          <div class="form-grid">
            <label>
              Имя
              <input v-model.trim="form.name" required type="text" placeholder="Иван Петров">
            </label>
            <label>
              Email
              <input v-model.trim="form.email" required type="email" placeholder="partner@example.com">
            </label>
            <label>
              Телефон
              <input v-model.trim="form.phone" type="tel" placeholder="+7 999 123-45-67">
            </label>
            <label>
              Telegram
              <input v-model.trim="form.telegram" type="text" placeholder="@username">
            </label>
            <label>
              Город
              <input v-model.trim="form.city" type="text" placeholder="Москва">
            </label>
            <label>
              Канал или аудитория
              <input v-model.trim="form.audience" type="text" placeholder="Блог, клиника, комьюнити">
            </label>
          </div>

          <label>
            Опыт и формат сотрудничества
            <textarea v-model.trim="form.experience" rows="4" placeholder="Расскажите, с какой аудиторией работаете и какой формат видите"></textarea>
          </label>

          <label>
            Комментарий
            <textarea v-model.trim="form.message" rows="4" placeholder="Дополнительная информация, ссылки, вопросы"></textarea>
          </label>

          <button class="btn btn-primary partnership-form__submit" :disabled="submitting">
            {{ submitting ? 'Отправляем...' : 'Отправить заявку' }}
          </button>
        </form>
      </div>
    </section>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import axios from 'axios'
import { useAuthStore } from '../store/auth'

const authStore = useAuthStore()
const submitting = ref(false)
const success = ref(false)
const error = ref('')

const form = reactive({
  name: '',
  email: '',
  phone: '',
  telegram: '',
  city: '',
  audience: '',
  experience: '',
  message: ''
})

onMounted(() => {
  if (!authStore.user) return
  form.name = authStore.user.name || ''
  form.email = authStore.user.email || ''
  form.phone = authStore.user.phone || ''
})

async function submitApplication() {
  error.value = ''
  success.value = false

  if (!form.phone && !form.telegram) {
    error.value = 'Укажите телефон или Telegram для связи'
    return
  }

  submitting.value = true
  try {
    await axios.post('/api/partner-applications', { ...form })
    success.value = true
    form.audience = ''
    form.experience = ''
    form.message = ''
  } catch (e) {
    error.value = e.response?.data?.error || 'Не удалось отправить заявку. Попробуйте ещё раз.'
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.partnership-page {
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(circle at 20% 10%, rgba(166, 185, 248, 0.13), transparent 28%),
    radial-gradient(circle at 82% 28%, rgba(55, 140, 255, 0.11), transparent 26%),
    var(--bg-primary);
}

.partnership-hero {
  position: relative;
  min-height: 620px;
  padding: 7.5rem 0 4.5rem;
  overflow: hidden;
}

.partnership-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  user-select: none;
}

.partnership-bg img {
  position: absolute;
  height: auto;
  object-fit: contain;
  mix-blend-mode: screen;
  animation: floatAsset 10s ease-in-out infinite alternate;
}

.partnership-bg__molecule--one {
  width: clamp(190px, 17vw, 320px);
  right: 7%;
  top: 13%;
  opacity: 0.34;
  filter: blur(1px) drop-shadow(0 0 18px rgba(70, 140, 255, 0.25));
}

.partnership-bg__molecule--two {
  width: clamp(160px, 12vw, 240px);
  left: -4%;
  bottom: 10%;
  opacity: 0.18;
  filter: blur(7px);
  animation-duration: 14s;
}

.partnership-bg__drop--one {
  width: clamp(70px, 6vw, 120px);
  right: 24%;
  bottom: 16%;
  opacity: 0.32;
  filter: blur(1px) drop-shadow(0 0 16px rgba(80, 160, 255, 0.2));
  animation-duration: 9s;
}

.partnership-bg__drop--two {
  width: clamp(120px, 9vw, 180px);
  right: -2%;
  top: 42%;
  opacity: 0.16;
  filter: blur(12px);
  animation-duration: 15s;
}

.partnership-hero__grid {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(320px, 0.65fr);
  gap: clamp(2rem, 5vw, 5rem);
  align-items: center;
}

.partnership-kicker,
.section-mini span,
.partnership-form__head span {
  display: inline-flex;
  width: fit-content;
  padding: 0.45rem 0.8rem;
  border: 1px solid rgba(166, 185, 248, 0.36);
  border-radius: 999px;
  color: var(--accent);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  background: rgba(166, 185, 248, 0.08);
}

.partnership-hero h1 {
  margin: 1.4rem 0 1.2rem;
  max-width: 840px;
  font-family: var(--font-display);
  font-size: clamp(2.7rem, 6.5vw, 6.6rem);
  line-height: 0.96;
  letter-spacing: 0;
}

.partnership-hero p,
.section-mini p {
  max-width: 680px;
  color: var(--text-secondary);
  font-size: clamp(1rem, 1.5vw, 1.25rem);
  line-height: 1.7;
}

.partnership-hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 2.2rem;
}

.partnership-card,
.partnership-form,
.partner-benefits article {
  border: 1px solid var(--border);
  background:
    linear-gradient(145deg, rgba(166, 185, 248, 0.12), rgba(255, 255, 255, 0.03)),
    var(--bg-card);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.22);
}

.partnership-card {
  padding: 1.5rem;
  border-radius: 24px;
}

.partnership-card__label {
  margin-bottom: 1rem;
  color: var(--text-muted);
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.partnership-card__steps {
  display: grid;
  gap: 0.9rem;
}

.partnership-card__steps div {
  padding: 1rem;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.03);
}

.partnership-card__steps span {
  display: block;
  margin-bottom: 0.55rem;
  color: var(--accent);
  font-family: var(--font-mono);
  font-weight: 800;
}

.partnership-card__steps strong {
  display: block;
  margin-bottom: 0.35rem;
  color: var(--text-primary);
}

.partnership-card__steps p {
  color: var(--text-secondary);
  font-size: 0.92rem;
  line-height: 1.55;
}

.partnership-content {
  position: relative;
  padding: 2rem 0 7rem;
}

.partnership-content__grid {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(360px, 0.7fr);
  gap: clamp(2rem, 4vw, 4rem);
  align-items: start;
}

.section-mini h2,
.partnership-form__head h2 {
  margin: 1rem 0 0.8rem;
  font-family: var(--font-display);
  font-size: clamp(1.9rem, 3vw, 3rem);
  line-height: 1.08;
}

.partner-benefits {
  display: grid;
  gap: 1rem;
  margin-top: 2rem;
}

.partner-benefits article {
  display: grid;
  grid-template-columns: auto 1fr;
  column-gap: 1rem;
  padding: 1.25rem;
  border-radius: 18px;
}

.benefit-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  grid-row: span 2;
  border-radius: 14px;
  color: #0b1020;
  background: var(--accent);
}

.partner-benefits h3 {
  margin-bottom: 0.35rem;
  font-size: 1.05rem;
}

.partner-benefits p {
  color: var(--text-secondary);
  line-height: 1.6;
}

.partnership-form {
  position: sticky;
  top: 92px;
  display: grid;
  gap: 1rem;
  padding: clamp(1.2rem, 2vw, 1.8rem);
  border-radius: 24px;
}

.partnership-form__head p {
  color: var(--text-secondary);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.partnership-form label {
  display: grid;
  gap: 0.5rem;
  color: var(--text-secondary);
  font-size: 0.9rem;
  font-weight: 700;
}

.partnership-form input,
.partnership-form textarea {
  width: 100%;
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 0.9rem 1rem;
  background: var(--bg-secondary);
  color: var(--text-primary);
  font: inherit;
  resize: vertical;
  transition: border-color 0.25s ease, box-shadow 0.25s ease;
}

.partnership-form input:focus,
.partnership-form textarea:focus {
  border-color: rgba(166, 185, 248, 0.72);
  box-shadow: 0 0 0 4px rgba(166, 185, 248, 0.14);
}

.partnership-form__submit {
  width: 100%;
  min-height: 54px;
}

.form-status {
  border-radius: 14px;
  padding: 0.95rem 1rem;
  font-weight: 700;
  line-height: 1.45;
}

.form-status--success {
  border: 1px solid rgba(94, 226, 174, 0.32);
  background: rgba(94, 226, 174, 0.12);
  color: #7ff1c4;
}

.form-status--error {
  border: 1px solid rgba(255, 100, 100, 0.34);
  background: rgba(255, 100, 100, 0.1);
  color: #ff9b9b;
}

[data-theme="light"] .partnership-page {
  background:
    radial-gradient(circle at 18% 6%, rgba(86, 126, 255, 0.14), transparent 28%),
    radial-gradient(circle at 82% 24%, rgba(73, 143, 255, 0.11), transparent 26%),
    #f6f8ff;
}

[data-theme="light"] .partnership-bg img {
  mix-blend-mode: multiply;
  opacity: 0.12;
}

[data-theme="light"] .partnership-card,
[data-theme="light"] .partnership-form,
[data-theme="light"] .partner-benefits article {
  background: rgba(255, 255, 255, 0.82);
  box-shadow: 0 22px 50px rgba(47, 62, 112, 0.1);
}

[data-theme="light"] .form-status--success {
  color: #137a55;
}

[data-theme="light"] .form-status--error {
  color: #b53636;
}

@keyframes floatAsset {
  from { transform: translate3d(0, 0, 0) rotate(-2deg); }
  to { transform: translate3d(10px, -14px, 0) rotate(2deg); }
}

@media (max-width: 980px) {
  .partnership-hero {
    min-height: auto;
    padding: 6rem 0 3rem;
  }

  .partnership-hero__grid,
  .partnership-content__grid {
    grid-template-columns: 1fr;
  }

  .partnership-form {
    position: relative;
    top: auto;
  }
}

@media (max-width: 640px) {
  .partnership-hero {
    padding-top: 5rem;
  }

  .partnership-hero h1 {
    font-size: clamp(2.35rem, 13vw, 3.6rem);
  }

  .partnership-hero__actions,
  .form-grid {
    grid-template-columns: 1fr;
  }

  .partnership-hero__actions {
    display: grid;
  }

  .partner-benefits article {
    grid-template-columns: 1fr;
  }

  .benefit-icon {
    grid-row: auto;
    margin-bottom: 0.8rem;
  }
}
</style>
