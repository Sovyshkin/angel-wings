<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-card card hover-lift">
        <router-link to="/" class="login-logo">
          <span class="logo-text">ANGEL WINGS</span>
        </router-link>
        
        <h1 class="login-title">{{ verificationStep ? 'Подтверждение входа' : 'Вход в админку' }}</h1>
        <p class="login-subtitle">
          {{ verificationStep ? `Код отправлен на ${pendingEmail}` : 'Управление магазином пептидов' }}
        </p>
        
        <form v-if="!verificationStep" @submit.prevent="handleLogin" class="login-form">
          <div class="form-group">
            <label class="form-label">Email</label>
            <input 
              type="email" 
              v-model="email" 
              required 
              class="input" 
              placeholder="Nickkirillov001@gmail.com"
            >
          </div>
          
          <div class="form-group">
            <label class="form-label">Пароль</label>
            <input 
              type="password" 
              v-model="password" 
              required 
              class="input" 
              placeholder="••••••••"
            >
          </div>
          
          <div v-if="error" class="error-message">{{ error }}</div>
          
          <button type="submit" class="btn btn-primary btn-full" :disabled="loading">
            <span v-if="loading">Вход...</span>
            <span v-else>Войти</span>
          </button>
        </form>

        <form v-else @submit.prevent="handleVerification" class="login-form">
          <div class="verification-notice">
            Введите шестизначный код из письма. Код действует 15 минут.
          </div>
          <div class="form-group">
            <label class="form-label">Код подтверждения</label>
            <input
              v-model="verificationCode"
              type="text"
              inputmode="numeric"
              autocomplete="one-time-code"
              maxlength="6"
              required
              class="input verification-input"
              placeholder="000000"
            >
          </div>

          <div v-if="error" class="error-message">{{ error }}</div>

          <button type="submit" class="btn btn-primary btn-full" :disabled="loading || verificationCode.length !== 6">
            {{ loading ? 'Проверяем...' : 'Подтвердить вход' }}
          </button>
          <button type="button" class="resend-button" :disabled="resending" @click="resendCode">
            {{ resending ? 'Отправляем...' : 'Отправить код повторно' }}
          </button>
          <button type="button" class="resend-button" @click="backToLogin">Вернуться к вводу пароля</button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../store/auth'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)
const resending = ref(false)
const verificationStep = ref(false)
const pendingEmail = ref('')
const verificationCode = ref('')
const challengeToken = ref('')

async function handleLogin() {
  error.value = ''
  loading.value = true
  
  try {
    const result = await authStore.login(email.value, password.value)
    if (result?.requiresLoginVerification) {
      pendingEmail.value = result.email || email.value
      challengeToken.value = result.challengeToken || ''
      verificationCode.value = ''
      verificationStep.value = true
      return
    }
    router.push('/dashboard')
  } catch (e) {
    error.value = e.response?.data?.error || 'Ошибка входа'
  } finally {
    loading.value = false
  }
}

async function handleVerification() {
  error.value = ''
  loading.value = true
  try {
    await authStore.verifyLogin(pendingEmail.value, verificationCode.value, challengeToken.value)
    router.push('/dashboard')
  } catch (e) {
    error.value = e.response?.data?.error || 'Неверный или истёкший код'
  } finally {
    loading.value = false
  }
}

async function resendCode() {
  error.value = ''
  resending.value = true
  try {
    await authStore.resendLoginCode(pendingEmail.value, challengeToken.value)
  } catch (e) {
    error.value = e.response?.data?.error || 'Не удалось отправить код'
  } finally {
    resending.value = false
  }
}

function backToLogin() {
  verificationStep.value = false
  verificationCode.value = ''
  challengeToken.value = ''
  error.value = ''
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.login-container {
  width: 100%;
  max-width: 420px;
}

.login-card {
  padding: 3rem;
}

.login-logo {
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
}

.logo-text {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 1.5rem;
  letter-spacing: 0.2em;
  color: var(--accent);
}

.login-title {
  font-family: var(--font-display);
  font-size: 1.75rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 0.5rem;
}

.login-subtitle {
  text-align: center;
  color: var(--text-secondary);
  margin-bottom: 2rem;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.btn-full {
  width: 100%;
  margin-top: 0.5rem;
}

.error-message {
  background: var(--danger);
  color: white;
  padding: 0.875rem 1rem;
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  text-align: center;
}

.verification-notice {
  color: var(--text-secondary);
  font-size: 0.9rem;
  line-height: 1.5;
  text-align: center;
}

.verification-input {
  text-align: center;
  font-family: var(--font-mono);
  font-size: 1.35rem;
  letter-spacing: 0.35em;
}

.resend-button {
  border: 0;
  background: transparent;
  color: var(--accent);
  cursor: pointer;
  font: inherit;
}

.resend-button:disabled {
  cursor: wait;
  opacity: 0.55;
}

@media (max-width: 480px) {
  .login-card {
    padding: 2rem 1.5rem;
  }

  .login-title {
    font-size: 1.5rem;
  }

  .login-subtitle {
    font-size: 0.9375rem;
  }

  .btn {
    padding: 0.75rem 1.5rem;
  }
}
</style>
