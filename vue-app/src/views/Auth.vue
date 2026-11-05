<template>
  <div class="auth">
    <div class="auth__container" data-aos="zoom-in">
      <div class="auth__card" data-aos="fade-up" data-aos-delay="100">
        <div class="auth__header">
          <router-link to="/" class="auth__logo">
            <img
              src="/angel-wings-logo-light.svg"
              alt="ANGEL WINGS"
              class="auth__logo-img"
              width="192"
              height="192"
              decoding="async"
            >
          </router-link>
          <h1 class="auth__title">Вход в Angel Wings</h1>
          <p class="auth__subtitle">
            {{ verificationStep ? 'Введите код из письма' : 'Укажите почту — отправим код для входа или создадим аккаунт' }}
          </p>
        </div>
        
        <form v-if="!verificationStep" @submit.prevent="handleSubmit" class="auth__form">
          <div class="form-group">
            <label>Email</label>
            <input v-model="form.email" type="email" class="input" placeholder="example@mail.ru" autocomplete="email" required>
          </div>
          
          <div v-if="error" class="error-message">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {{ error }}
          </div>
          
          <button type="submit" class="btn btn-primary btn-submit" :disabled="loading">
            <span v-if="loading" class="spinner"></span>
            <span v-else>Получить код</span>
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
            <span v-else>Подтвердить вход</span>
          </button>

          <button type="button" class="link-btn verification-resend" :disabled="resending" @click="resendCode">
            {{ resending ? 'Отправляем...' : 'Отправить код повторно' }}
          </button>
        </form>
        
        <div v-if="verificationStep" class="auth__footer"><button type="button" @click="resetEmail" class="link-btn">Изменить email</button></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../store/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const campaignKeyPattern = /^(?:points-4000-2026-10-30|gift-[0-9-]{10}-[a-f\d]{8})$/

function goAfterAuth() {
  if (typeof route.query.claim === 'string' && campaignKeyPattern.test(route.query.claim)) return router.push({ path: '/', query: { claim: route.query.claim } })
  if (route.query.redirect === '/cart') return router.push('/cart')
  return router.push('/profile')
}

const loading = ref(false)
const resending = ref(false)
const error = ref('')
const verificationStep = ref(false)
const pendingEmail = ref('')
const verificationCode = ref('')
const loginChallengeToken = ref('')

const form = ref({ email: '' })

function resetEmail() {
  error.value = ''
  verificationStep.value = false
  pendingEmail.value = ''
  verificationCode.value = ''
  loginChallengeToken.value = ''
}

async function handleSubmit() {
  error.value = ''
  loading.value = true

  try {
    const result = await authStore.login(form.value.email)
    pendingEmail.value = result.email || form.value.email
    loginChallengeToken.value = result.challengeToken || ''
    verificationStep.value = true
    verificationCode.value = ''
  } catch (e) {
    error.value = e.message || 'Произошла ошибка. Попробуйте снова.'
  } finally {
    loading.value = false
  }
}

async function handleVerifyEmail() {
  error.value = ''
  loading.value = true

  try {
    await authStore.verifyEmail(pendingEmail.value, verificationCode.value, {
      purpose: 'login_verification',
      challengeToken: loginChallengeToken.value
    })
    goAfterAuth()
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
    await authStore.resendVerification(pendingEmail.value, {
      purpose: 'login_verification',
      challengeToken: loginChallengeToken.value
    })
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

.password-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.forgot-password-link {
  color: var(--accent);
  font-size: 0.8rem;
  font-weight: 700;
  text-decoration: none;
}

.forgot-password-link:hover {
  text-decoration: underline;
}

.marketing-consent {
  display: flex;
  align-items: flex-start;
  gap: .7rem;
  color: var(--text-secondary);
  font-size: .84rem;
  line-height: 1.45;
  cursor: pointer;
}

.marketing-consent input {
  width: 17px;
  height: 17px;
  margin-top: .1rem;
  accent-color: var(--accent);
  flex: none;
}

.marketing-consent small {
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
