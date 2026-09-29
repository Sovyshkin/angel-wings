<template>
  <div class="contact-page">
    <div class="container">
      <div class="contact-header" data-aos="fade-up">
        <div id="about-company" class="anchor-target"></div>
        <h1 class="page-title">Свяжитесь с нами</h1>
        <p class="page-subtitle">{{ isExpress ? 'Опишите конкретный вопрос, выберите специалиста и перейдите к безопасной оплате.' : 'Наши специалисты помогут подобрать оптимальный комплекс пептидов для ваших целей' }}</p>
      </div>

      <div class="info-sections" data-aos="fade-up" data-aos-delay="50">
        <div id="delivery-payment" class="info-section-card anchor-target">
          <h3>Доставка и оплата</h3>
          <p>Доставка выполняется по России. Оплата доступна онлайн после подтверждения заказа.</p>
        </div>
        <div id="guarantees" class="info-section-card anchor-target">
          <h3>Гарантии</h3>
          <p>Мы обеспечиваем контроль качества продукции и сопровождаем клиента на всех этапах заказа.</p>
        </div>
        <div id="faq" class="info-section-card anchor-target">
          <h3>Частые вопросы</h3>
          <p>Если у вас есть вопросы по подбору, оплате или доставке, наша поддержка поможет 24/7.</p>
        </div>
      </div>

      <div class="contact-grid">
        <div class="contact-form-wrapper" data-aos="fade-up" data-aos-delay="100">
          <div class="consultation-mode" role="tablist" aria-label="Тип консультации">
            <button type="button" :class="{ active: consultationType === 'free' }" role="tab" :aria-selected="consultationType === 'free'" @click="consultationType = 'free'">Бесплатная заявка</button>
            <button type="button" :class="{ active: isExpress }" role="tab" :aria-selected="isExpress" @click="consultationType = 'express'">Экспресс · 4 000 ₽</button>
          </div>
          <div class="consultation-mode__intro">
            <strong>{{ isExpress ? 'Экспресс-консультация до 20 минут' : 'Бесплатная заявка на консультацию' }}</strong>
            <span>{{ isExpress ? 'Выберите специалиста и формат — после оплаты заявка сразу поступит в работу.' : 'Оставьте контакты и вопрос — команда свяжется с вами.' }}</span>
          </div>
          <form @submit.prevent="handleSubmit" class="contact-form">
            <div class="form-group">
              <label for="name">Имя</label>
              <input 
                id="name" 
                type="text" 
                v-model="form.name" 
                placeholder="Как к вам обращаться?"
                class="input"
                :class="{ 'error': errors.name }"
              />
              <span v-if="errors.name" class="error-text">{{ errors.name }}</span>
            </div>

            <div class="form-group">
              <label for="email">Email</label>
              <input 
                id="email" 
                type="email" 
                v-model="form.email" 
                placeholder="your@email.com"
                class="input"
                :class="{ 'error': errors.email }"
              />
              <span v-if="errors.email" class="error-text">{{ errors.email }}</span>
            </div>

            <div class="form-group">
              <label for="phone">Телефон</label>
              <input 
                id="phone" 
                type="tel" 
                v-model="form.phone" 
                placeholder="+7 (___) ___-__-__"
                class="input"
              />
            </div>

            <div v-if="!isExpress" class="form-group">
              <label for="goal">Цель обращения</label>
              <select id="goal" v-model="form.goal" class="input">
                <option value="">Выберите тему</option>
                <option value="consult">Консультация по продуктам</option>
                <option value="order">Оформление заказа</option>
                <option value="support">Техническая поддержка</option>
                <option value="partnership">Сотрудничество</option>
                <option value="other">Другое</option>
              </select>
            </div>

            <template v-if="isExpress">
              <div class="form-group">
                <label for="specialist">Специалист</label>
                <div id="specialist" class="specialist-picker" role="radiogroup" aria-label="Выбор специалиста">
                  <button
                    v-for="specialist in specialists"
                    :key="specialist.id"
                    type="button"
                    role="radio"
                    :aria-checked="form.specialist === specialist.id"
                    :class="{ active: form.specialist === specialist.id }"
                    @click="form.specialist = specialist.id"
                  >
                    <img :src="specialist.image" :alt="specialist.name">
                    <span class="specialist-picker__check" aria-hidden="true">✓</span>
                    <span class="specialist-picker__name">{{ specialist.name }}</span>
                  </button>
                </div>
              </div>
              <div class="form-group">
                <label>Формат консультации</label>
                <div class="format-switch" :class="{ 'format-switch--call': form.contactFormat === 'CALL' }" role="radiogroup" aria-label="Формат консультации">
                  <span class="format-switch__active" aria-hidden="true"></span>
                  <button type="button" role="radio" :aria-checked="form.contactFormat === 'MESSAGES'" :class="{ active: form.contactFormat === 'MESSAGES' }" @click="form.contactFormat = 'MESSAGES'">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H8l-4 3v-5.3A7.5 7.5 0 1 1 20 11.5Z"/><path d="M8 11h.01M12 11h.01M16 11h.01"/></svg>
                    <span>Сообщения</span>
                  </button>
                  <button type="button" role="radio" :aria-checked="form.contactFormat === 'CALL'" :class="{ active: form.contactFormat === 'CALL' }" @click="form.contactFormat = 'CALL'">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.2 3.6 5.7 5.1c-.9.5-1.3 1.5-1 2.5 1.4 4.8 5.2 8.6 10 10 .9.3 1.9-.1 2.5-1l1.5-2.5-3.5-2.1-1.5 1.7a12.5 12.5 0 0 1-3.4-3.4L12 8.8 8.2 3.6Z"/></svg>
                    <span>Созвон</span>
                  </button>
                </div>
              </div>
            </template>

            <div class="form-group">
              <label for="message">{{ isExpress ? 'Ваш вопрос' : 'Сообщение' }}</label>
              <textarea 
                id="message" 
                v-model="form.message" 
                :placeholder="isExpress ? 'Например: можно ли использовать выбранный пептид с учётом моего запроса?' : 'Опишите ваш вопрос или задачу...'"
                class="input textarea"
                :class="{ 'error': errors.message }"
              ></textarea>
              <span v-if="errors.message" class="error-text">{{ errors.message }}</span>
            </div>

            <label v-if="isExpress" class="consultation-consent">
              <input v-model="form.consent" type="checkbox">
              <span>Соглашаюсь на обработку персональных данных для организации консультации.</span>
            </label>
            <span v-if="errors.consent" class="error-text">{{ errors.consent }}</span>

            <button type="submit" class="btn btn-primary btn-submit" :disabled="isSubmitting">
              <span v-if="isSubmitting" class="spinner"></span>
              <span v-else>{{ isExpress ? 'Перейти к оплате · 4 000 ₽' : 'Отправить заявку' }}</span>
            </button>

            <div v-if="submitSuccess" class="success-message">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Заявка отправлена! Мы свяжемся с вами в ближайшее время.
            </div>

            <div v-if="submitError" class="error-message">
              {{ submitError }}
            </div>
          </form>
        </div>

        <div id="contacts" class="contact-info anchor-target" data-aos="fade-up" data-aos-delay="200">
          <div class="info-card">
            <div class="info-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
              </svg>
            </div>
            <div class="info-content">
              <h3>Телефон</h3>
              <p><a href="tel:+79661790013">+7 966 179-00-13</a></p>
            </div>
          </div>

          <div class="info-card">
            <div class="info-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
            <div class="info-content">
              <h3>Email</h3>
              <p><a href="mailto:info@angel-wings.ru">info@angel-wings.ru</a></p>
            </div>
          </div>

          <div class="info-card">
            <div class="info-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div class="info-content">
              <h3>Время работы</h3>
              <p>Поддержка: 24/7</p>
            </div>
          </div>

          <div class="info-card">
            <div class="info-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
            <div class="info-content">
              <h3>Адрес</h3>
              <p>Москва, Россия</p>
            </div>
          </div>

          <div id="messengers" class="social-links anchor-target">
            <h3>Мессенджеры</h3>
            <div class="social-icons">
              <a href="https://t.me/+9u1dsIdwTzpmOWEy" target="_blank" rel="noopener noreferrer" class="social-icon" aria-label="Telegram">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.03-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.37.09 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                </svg>
              </a>
              <a href="https://www.instagram.com/angelwings_health?igsh=ODNtNDZtZDVjdWxq&utm_source=qr" target="_blank" rel="noopener noreferrer" class="social-icon" aria-label="Instagram">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, reactive, watch } from 'vue'
import axios from 'axios'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../store/auth'

const route = useRoute()
const authStore = useAuthStore()
const consultationType = ref(route.query.consultation === 'express' ? 'express' : 'free')
const isExpress = computed(() => consultationType.value === 'express')
const specialistIds = new Set(['OLESYA_TERENKO', 'MARINA_SHESTAKOVA'])
const specialists = [
  { id: 'OLESYA_TERENKO', name: 'Теренько Олеся', image: '/consultations/olesya.jpg' },
  { id: 'MARINA_SHESTAKOVA', name: 'Шестакова Марина', image: '/consultations/marina.jpg' }
]

const form = reactive({
  name: '',
  email: '',
  phone: '',
  goal: '',
  message: '',
  specialist: specialistIds.has(route.query.specialist) ? route.query.specialist : 'OLESYA_TERENKO',
  contactFormat: 'MESSAGES',
  consent: false
})

const errors = reactive({
  name: '',
  email: '',
  message: '',
  consent: ''
})

const isSubmitting = ref(false)
const submitSuccess = ref(false)
const submitError = ref('')

function validate() {
  let valid = true
  errors.name = ''
  errors.email = ''
  errors.message = ''
  errors.consent = ''

  if (!form.name.trim()) {
    errors.name = 'Пожалуйста, введите ваше имя'
    valid = false
  }

  if (!form.email.trim()) {
    errors.email = 'Пожалуйста, введите email'
    valid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Введите корректный email'
    valid = false
  }

  if (!form.message.trim()) {
    errors.message = 'Пожалуйста, напишите сообщение'
    valid = false
  }

  if (isExpress.value && !form.consent) {
    errors.consent = 'Необходимо согласие на обработку персональных данных'
    valid = false
  }

  return valid
}

async function handleSubmit() {
  if (isExpress.value && !authStore.isAuthenticated) {
    submitError.value = 'Экспресс-консультация доступна после входа в аккаунт — так 4 000 баллов вернутся именно на ваш баланс.'
    return
  }

  if (!validate()) return

  isSubmitting.value = true
  submitError.value = ''
  submitSuccess.value = false

  try {
    if (isExpress.value) {
      const { data } = await axios.post('/api/consultations', {
        name: form.name,
        email: form.email,
        phone: form.phone,
        specialist: form.specialist,
        contactFormat: form.contactFormat,
        question: form.message,
        consent: form.consent
      })
      window.location.assign(data.paymentUrl)
      return
    }

    await axios.post('/api/contact-requests', {
      name: form.name,
      email: form.email,
      phone: form.phone,
      goal: form.goal,
      message: form.message
    })
    submitSuccess.value = true
    Object.assign(form, { name: '', email: '', phone: '', goal: '', message: '', specialist: 'OLESYA_TERENKO', contactFormat: 'MESSAGES', consent: false })
    setTimeout(() => { submitSuccess.value = false }, 5000)
  } catch (error) {
    submitError.value = error?.response?.data?.error || 'Не удалось отправить сообщение. Попробуйте ещё раз.'
  } finally {
    isSubmitting.value = false
  }
}

watch(() => route.query, (query) => {
  if (query.consultation === 'express') consultationType.value = 'express'
  if (specialistIds.has(query.specialist)) form.specialist = query.specialist
}, { deep: true })
</script>

<style scoped>
.contact-page {
  padding: 3rem 0 5rem;
}

.contact-header {
  text-align: center;
  margin-bottom: 3rem;
}

.contact-header .page-title {
  margin-bottom: 0.75rem;
}

.contact-header .page-subtitle {
  max-width: 500px;
  margin: 0 auto;
}

.anchor-target {
  scroll-margin-top: 95px;
}

.info-sections {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.info-section-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 1.25rem;
}

.info-section-card h3 {
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 0.5rem;
  color: var(--text-primary);
}

.info-section-card p {
  font-size: 0.875rem;
  color: var(--text-secondary);
  line-height: 1.5;
}

.contact-grid {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 3rem;
  align-items: start;
}

.contact-form-wrapper {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 2.5rem;
}

.consultation-mode {
  display: grid;
  grid-template-columns: 1fr 1fr;
  margin-bottom: 1rem;
  padding: 4px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--bg-secondary);
}

.consultation-mode button {
  padding: .8rem;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--text-secondary);
  font: inherit;
  font-size: .82rem;
  font-weight: 700;
  cursor: pointer;
}

.consultation-mode button.active {
  background: var(--accent-dim);
  color: var(--text-primary);
  box-shadow: inset 0 0 0 1px var(--border-hover);
}

.consultation-mode__intro {
  display: grid;
  gap: .25rem;
  margin-bottom: 1.7rem;
}

.consultation-mode__intro strong { color: var(--text-primary); }
.consultation-mode__intro span { color: var(--text-secondary); font-size: .85rem; line-height: 1.45; }

.specialist-picker {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: .75rem;
}

.specialist-picker button {
  position: relative;
  min-height: 220px;
  overflow: hidden;
  padding: 0;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--bg-secondary);
  cursor: pointer;
  isolation: isolate;
  transition: border-color .35s cubic-bezier(.22, 1, .36, 1), box-shadow .35s cubic-bezier(.22, 1, .36, 1), transform .35s cubic-bezier(.22, 1, .36, 1);
}

.specialist-picker button::after {
  position: absolute;
  z-index: 1;
  inset: 0;
  background: linear-gradient(90deg, rgba(6, 12, 29, .76), rgba(6, 12, 29, .08));
  content: '';
}

.specialist-picker button:hover { border-color: rgba(162, 189, 255, .66); transform: translateY(-2px); }
.specialist-picker button.active { border-color: #a9c0ff; box-shadow: 0 0 0 2px rgba(126, 160, 255, .28), 0 12px 24px rgba(42, 73, 174, .2); }
.specialist-picker button:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

.specialist-picker img {
  position: absolute;
  z-index: 0;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 22%;
}

.specialist-picker__name {
  position: absolute;
  z-index: 2;
  left: .85rem;
  bottom: .75rem;
  max-width: calc(100% - 3rem);
  color: #fff;
  font-size: .82rem;
  font-weight: 700;
  text-align: left;
  text-shadow: 0 2px 8px rgba(0,0,0,.8);
}

.specialist-picker__check {
  position: absolute;
  z-index: 2;
  top: .65rem;
  right: .65rem;
  display: grid;
  width: 22px;
  height: 22px;
  place-items: center;
  border: 1px solid rgba(228, 236, 255, .64);
  border-radius: 50%;
  background: rgba(8, 16, 37, .72);
  color: #fff;
  font-size: .72rem;
  opacity: 0;
  transform: scale(.7);
  transition: opacity .25s ease, transform .35s cubic-bezier(.22,1,.36,1), background .25s ease;
}

.specialist-picker button.active .specialist-picker__check { opacity: 1; transform: scale(1); background: #809ff4; }

.format-switch {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
  padding: 4px;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: color-mix(in srgb, var(--bg-secondary) 88%, #081126);
  overflow: hidden;
}

.format-switch__active {
  position: absolute;
  top: 4px;
  bottom: 4px;
  left: 4px;
  width: calc(50% - 4px);
  border: 1px solid rgba(165, 189, 255, .64);
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(123, 157, 255, .52), rgba(67, 102, 206, .34));
  box-shadow: 0 6px 16px rgba(42, 82, 200, .22), inset 0 1px rgba(255,255,255,.3);
  transition: transform .38s cubic-bezier(.22, 1, .36, 1), background .38s ease;
}

.format-switch--call .format-switch__active {
  transform: translateX(100%);
  background: linear-gradient(135deg, rgba(111, 153, 255, .6), rgba(54, 95, 203, .38));
}

.format-switch button {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: .52rem;
  min-height: 44px;
  padding: .65rem .75rem;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: var(--text-muted);
  font: 700 .78rem var(--font-body);
  cursor: pointer;
  transition: color .28s ease, transform .28s ease;
}

.format-switch button:hover { color: var(--text-primary); }
.format-switch button:active { transform: scale(.975); }
.format-switch button.active { color: #f7f9ff; }
.format-switch button:focus-visible { outline: 2px solid var(--accent); outline-offset: -1px; }

.format-switch svg { width:18px; height:18px; fill:none; stroke:currentColor; stroke-width:1.8; stroke-linecap:round; stroke-linejoin:round; }

.consultation-consent {
  display: flex;
  gap: .55rem;
  align-items: flex-start;
  color: var(--text-secondary);
  font-size: .85rem;
  line-height: 1.45;
}

.consultation-consent input { margin-top: .18rem; accent-color: var(--accent); }
.consultation-consent { margin-top: -.4rem; }

.contact-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
}

.input.error {
  border-color: var(--danger);
}

.error-text {
  font-size: 0.75rem;
  color: var(--danger);
}

.error-message {
  padding: 1rem;
  background: rgba(255, 100, 100, 0.12);
  border: 1px solid rgba(255, 100, 100, 0.28);
  border-radius: var(--radius-sm);
  color: var(--danger);
  font-size: 0.875rem;
  font-weight: 600;
}

.textarea {
  min-height: 120px;
  resize: vertical;
}

.btn-submit {
  padding: 1rem 2rem;
  font-size: 1rem;
  margin-top: 0.5rem;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.success-message {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: rgba(166, 185, 248, 0.15);
  border: 1px solid var(--accent);
  border-radius: var(--radius-sm);
  color: var(--accent);
  font-size: 0.875rem;
}

.contact-info {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.info-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  transition: all 0.3s ease;
}

.info-card:hover {
  border-color: var(--border-hover);
  transform: translateY(-2px);
}

.info-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent-dim);
  border-radius: 12px;
  color: var(--accent);
  flex-shrink: 0;
}

.info-content h3 {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  margin-bottom: 0.25rem;
}

.info-content p {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.social-links {
  padding: 1.25rem;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
}

.social-links h3 {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  margin-bottom: 1rem;
}

.social-icons {
  display: flex;
  gap: 0.75rem;
}

.social-icon {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  border-radius: 10px;
  color: var(--text-secondary);
  transition: all 0.3s ease;
}

.social-icon:hover {
  background: var(--accent);
  color: var(--bg-primary);
  transform: translateY(-2px);
}

@media (max-width: 1024px) {
  .info-sections {
    grid-template-columns: 1fr;
  }

  .contact-grid {
    grid-template-columns: 1fr;
  }

  .contact-info {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .info-card {
    flex: 1;
    min-width: 200px;
  }

  .social-links {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .contact-form-wrapper {
    padding: 1.5rem;
  }

  .info-card {
    min-width: 100%;
  }

  .specialist-picker button { min-height: 150px; }
}
</style>
