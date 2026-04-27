<template>
  <div class="contact-page">
    <div class="container">
      <div class="contact-header" data-aos="fade-up">
        <h1 class="page-title">Свяжитесь с нами</h1>
        <p class="page-subtitle">Наши специалисты помогут подобрать оптимальный комплекс пептидов для ваших целей</p>
      </div>

      <div class="contact-grid">
        <div class="contact-form-wrapper" data-aos="fade-up" data-aos-delay="100">
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

            <div class="form-group">
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

            <div class="form-group">
              <label for="message">Сообщение</label>
              <textarea 
                id="message" 
                v-model="form.message" 
                placeholder="Опишите ваш вопрос или задачу..."
                class="input textarea"
                :class="{ 'error': errors.message }"
              ></textarea>
              <span v-if="errors.message" class="error-text">{{ errors.message }}</span>
            </div>

            <button type="submit" class="btn btn-primary btn-submit" :disabled="isSubmitting">
              <span v-if="isSubmitting" class="spinner"></span>
              <span v-else>Отправить сообщение</span>
            </button>

            <div v-if="submitSuccess" class="success-message">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Сообщение отправлено! Мы свяжемся с вами в ближайшее время.
            </div>
          </form>
        </div>

        <div class="contact-info" data-aos="fade-up" data-aos-delay="200">
          <div class="info-card">
            <div class="info-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
              </svg>
            </div>
            <div class="info-content">
              <h3>Телефон</h3>
              <p>+7 (800) 555-35-35</p>
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
              <p>info@peptidi.shop</p>
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

          <div class="social-links">
            <h3>Мессенджеры</h3>
            <div class="social-icons">
              <a href="#" class="social-icon" aria-label="Telegram">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.03-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.37.09 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                </svg>
              </a>
              <a href="#" class="social-icon" aria-label="WhatsApp">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.471-.1-.661-.216-.306-.3-.478-.31-.63-.025-.21.069-.437.26-.73.164-.27.298-.305.4-.305h.203c.178 0 .304.069.405.178.071.079.227.26.227.52.006.168-.008.347.032.52l.026.05c.099.173.297.406.426.56.13.152.265.2.371.126.096-.066.415-.446.53-.73.128-.317.148-.66.11-.92-.054-.37-.21-.543-.36-.75-.125-.176-.256-.203-.411-.15-.169.059-.99.463-1.923.873-.606.267-1.14.385-1.576.322-.315-.045-.978-.3-1.32-.952-.265-.506-.264-1.06-.185-1.5.108-.597.725-.996 1.364-1.442.74-.514 1.647-.793 2.662-.793.196 0 .392.02.57.062.357.083.714.285 1.05.557-.213.052-.47.082-.727.082l-.002.002z"/>
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
import { ref, reactive } from 'vue'

const form = reactive({
  name: '',
  email: '',
  phone: '',
  goal: '',
  message: ''
})

const errors = reactive({
  name: '',
  email: '',
  message: ''
})

const isSubmitting = ref(false)
const submitSuccess = ref(false)

function validate() {
  let valid = true
  errors.name = ''
  errors.email = ''
  errors.message = ''

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

  return valid
}

async function handleSubmit() {
  if (!validate()) return

  isSubmitting.value = true
  await new Promise(resolve => setTimeout(resolve, 1500))
  isSubmitting.value = false
  submitSuccess.value = true
  
  Object.keys(form).forEach(key => form[key] = '')
  setTimeout(() => { submitSuccess.value = false }, 5000)
}
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
}
</style>