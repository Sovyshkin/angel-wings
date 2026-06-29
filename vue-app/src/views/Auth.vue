<template>
  <div class="auth">
    <div class="auth__container" data-aos="zoom-in">
      <div class="auth__card" data-aos="fade-up" data-aos-delay="100">
        <div class="auth__header">
          <router-link to="/" class="auth__logo">
            <img
              src="/logo-192.webp"
              alt="ANGEL WINGS"
              class="auth__logo-img"
              width="192"
              height="192"
              decoding="async"
            >
          </router-link>
          <h1 class="auth__title">{{ isLogin ? 'Добро пожаловать' : 'Создать аккаунт' }}</h1>
          <p class="auth__subtitle">
            {{ verificationStep ? 'Введите код из письма' : (isLogin ? 'Войдите в свой аккаунт' : 'Заполните данные для регистрации') }}
          </p>
        </div>
        
        <form v-if="!verificationStep" @submit.prevent="handleSubmit" class="auth__form">
          <div v-if="!isLogin" class="form-group">
            <label>Имя</label>
            <input v-model="form.name" type="text" class="input" placeholder="Иван Иванов" required>
          </div>
          
          <div class="form-group">
            <label>Email</label>
            <input v-model="form.email" type="email" class="input" placeholder="example@mail.ru" required>
          </div>
          
          <div class="form-group">
            <label>Пароль</label>
            <div class="password-input">
              <input 
                v-model="form.password" 
                :type="showPassword ? 'text' : 'password'" 
                class="input" 
                placeholder="Минимум 6 символов"
                required
                minlength="6"
              >
              <button type="button" class="password-toggle" @click="showPassword = !showPassword">
                <svg v-if="showPassword" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
                <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </button>
            </div>
          </div>
          
          <div v-if="!isLogin" class="form-group">
            <label>Подтвердите пароль</label>
            <input v-model="form.confirmPassword" type="password" class="input" placeholder="Повторите пароль" required>
            <span v-if="form.confirmPassword && form.password !== form.confirmPassword" class="error-text">Пароли не совпадают</span>
          </div>
          
          <div v-if="!isLogin" class="form-group">
            <label>Телефон</label>
            <input v-model="form.phone" type="tel" class="input" placeholder="+7 (999) 999-99-99">
          </div>
          
          <div v-if="error" class="error-message">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {{ error }}
          </div>
          
          <button type="submit" class="btn btn-primary btn-submit" :disabled="loading || (!isLogin && form.password !== form.confirmPassword)">
            <span v-if="loading" class="spinner"></span>
            <span v-else>{{ isLogin ? 'Войти' : 'Зарегистрироваться' }}</span>
          </button>
        </form>

        <form v-else @submit.prevent="handleVerifyEmail" class="auth__form verification-form">
          <div class="verification-box">
            <span class="verification-box__label">Код отправлен на</span>
            <strong>{{ pendingEmail }}</strong>
            <p>Проверьте входящие и папку “Спам”. Код действует 15 минут.</p>
          </div>

          <div class="form-group">
            <label>Код подтверждения</label>
            <input
              v-model="verificationCode"
              type="text"
              inputmode="numeric"
              maxlength="6"
              class="input verification-code-input"
              placeholder="000000"
              required
            >
          </div>

          <div v-if="error" class="error-message">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {{ error }}
          </div>

          <button type="submit" class="btn btn-primary btn-submit" :disabled="loading || verificationCode.length !== 6">
            <span v-if="loading" class="spinner"></span>
            <span v-else>Подтвердить email</span>
          </button>

          <button type="button" class="link-btn verification-resend" :disabled="resending" @click="resendCode">
            {{ resending ? 'Отправляем...' : 'Отправить код повторно' }}
          </button>
        </form>
        
        <div class="auth__footer">
          <p>{{ isLogin ? 'Нет аккаунта?' : 'Уже есть аккаунт?' }}
            <button @click="toggleMode" class="link-btn">{{ isLogin ? 'Зарегистрироваться' : 'Войти' }}</button>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../store/auth'

const router = useRouter()
const authStore = useAuthStore()

const isLogin = ref(true)
const showPassword = ref(false)
const loading = ref(false)
const resending = ref(false)
const error = ref('')
const verificationStep = ref(false)
const pendingEmail = ref('')
const verificationCode = ref('')

const form = ref({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  phone: ''
})

function toggleMode() {
  isLogin.value = !isLogin.value
  error.value = ''
  verificationStep.value = false
  pendingEmail.value = ''
  verificationCode.value = ''
  form.value = { name: '', email: '', password: '', confirmPassword: '', phone: '' }
}

async function handleSubmit() {
  error.value = ''
  loading.value = true

  try {
    if (isLogin.value) {
      await authStore.login(form.value.email, form.value.password)
      router.push('/profile')
    } else {
      if (form.value.password !== form.value.confirmPassword) {
        error.value = 'Пароли не совпадают'
        return
      }
      const result = await authStore.register({
        name: form.value.name,
        email: form.value.email,
        password: form.value.password,
        phone: form.value.phone
      })
      if (result?.requiresEmailVerification) {
        pendingEmail.value = result.email || form.value.email
        verificationStep.value = true
        verificationCode.value = ''
        return
      }
      router.push('/profile')
    }
  } catch (e) {
    if (e.code === 'EMAIL_NOT_VERIFIED') {
      pendingEmail.value = e.email || form.value.email
      verificationStep.value = true
      verificationCode.value = ''
      error.value = ''
      return
    }
    error.value = e.message || 'Произошла ошибка. Попробуйте снова.'
  } finally {
    loading.value = false
  }
}

async function handleVerifyEmail() {
  error.value = ''
  loading.value = true

  try {
    await authStore.verifyEmail(pendingEmail.value, verificationCode.value)
    router.push('/profile')
  } catch (e) {
    error.value = e.response?.data?.error || e.message || 'Не удалось подтвердить email'
  } finally {
    loading.value = false
  }
}

async function resendCode() {
  error.value = ''
  resending.value = true

  try {
    await authStore.resendVerification(pendingEmail.value)
  } catch (e) {
    error.value = e.response?.data?.error || e.message || 'Не удалось отправить код повторно'
  } finally {
    resending.value = false
  }
}
</script>

<style scoped>
.auth {
  min-height: calc(100vh - 200px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
}

.auth__container {
  width: 100%;
  max-width: 440px;
}

.auth__card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 24px;
  padding: 2.5rem;
  transition: background 0.4s ease, border-color 0.4s ease;
}

.auth__header {
  text-align: center;
  margin-bottom: 2rem;
}

.auth__logo {
  display: inline-flex;
  margin-bottom: 1.5rem;
}

.auth__logo-img {
  width: 48px;
  height: 48px;
  object-fit: contain;
}

.auth__title {
  font-family: var(--font-display);
  font-size: 1.75rem;
  font-weight: 800;
  margin-bottom: 0.5rem;
}

.auth__subtitle {
  color: var(--text-secondary);
  font-size: 0.95rem;
}

.auth__form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
}

.password-input {
  position: relative;
}

.password-input .input {
  padding-right: 3rem;
}

.password-toggle {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0.25rem;
}

.password-toggle:hover {
  color: var(--text-primary);
}

.error-text {
  font-size: 0.8rem;
  color: var(--danger);
}

.error-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 1rem;
  background: rgba(255, 100, 100, 0.1);
  border: 1px solid var(--danger);
  border-radius: var(--radius-sm);
  color: var(--danger);
  font-size: 0.875rem;
}

.verification-form {
  animation: verificationFadeIn 0.25s ease;
}

.verification-box {
  padding: 1rem;
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(165, 184, 255, 0.18), rgba(255, 255, 255, 0.04));
  border: 1px solid rgba(165, 184, 255, 0.28);
  color: var(--text-secondary);
}

.verification-box__label {
  display: block;
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 0.35rem;
  color: var(--text-muted);
}

.verification-box strong {
  display: block;
  color: var(--text-primary);
  word-break: break-word;
}

.verification-box p {
  margin: 0.6rem 0 0;
  font-size: 0.9rem;
  line-height: 1.5;
}

.verification-code-input {
  text-align: center;
  letter-spacing: 0.35em;
  font-size: 1.3rem;
  font-weight: 700;
}

.verification-resend {
  margin: 0.75rem auto 0;
  display: block;
}

.verification-resend:disabled {
  opacity: 0.6;
  cursor: wait;
}

.btn-submit {
  width: 100%;
  padding: 1rem;
  font-size: 1rem;
  margin-top: 0.5rem;
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid transparent;
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes verificationFadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.auth__footer {
  text-align: center;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border);
}

.auth__footer p {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.link-btn {
  background: none;
  border: none;
  color: var(--accent);
  font-weight: 600;
  cursor: pointer;
  margin-left: 0.25rem;
}

.link-btn:hover {
  text-decoration: underline;
}

@media (max-width: 640px) {
  .auth {
    padding: 1.5rem 1rem;
    min-height: auto;
  }

  .auth__container {
    max-width: 100%;
  }

  .auth__card {
    padding: 1.5rem 1rem;
    border-radius: 16px;
  }

  .auth__title {
    font-size: 1.375rem;
  }

  .auth__subtitle {
    font-size: 0.85rem;
  }

  .auth__form {
    gap: 0.875rem;
  }

  .form-group label {
    font-size: 0.7rem;
  }

  .form-group {
    margin-bottom: 0.25rem;
  }

  .btn-submit {
    padding: 0.875rem;
    margin-top: 0.25rem;
  }

  .password-toggle {
    right: 0.5rem;
  }

  .password-input .input {
    padding-right: 2.5rem;
  }
}
</style>
