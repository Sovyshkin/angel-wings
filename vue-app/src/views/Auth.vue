<template>
  <div class="auth">
    <div class="auth__container">
      <div class="auth__card">
        <div class="auth__header">
          <router-link to="/" class="auth__logo">
            <svg width="40" height="40" viewBox="0 0 28 28" fill="none">
              <path d="M14 2L4 8v12l10 6 10-6V8L14 2z" stroke="currentColor" stroke-width="2" fill="none"/>
              <path d="M14 8l-6 3.5v7L14 22l6-3.5v-7L14 8z" fill="currentColor" opacity="0.3"/>
              <circle cx="14" cy="14" r="3" fill="currentColor"/>
            </svg>
          </router-link>
          <h1 class="auth__title">{{ isLogin ? 'Добро пожаловать' : 'Создать аккаунт' }}</h1>
          <p class="auth__subtitle">{{ isLogin ? 'Войдите в свой аккаунт' : 'Заполните данные для регистрации' }}</p>
        </div>
        
        <form @submit.prevent="handleSubmit" class="auth__form">
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
                placeholder="Минимум 8 символов"
                required
                minlength="8"
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
const error = ref('')

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
  form.value = { name: '', email: '', password: '', confirmPassword: '', phone: '' }
}

async function handleSubmit() {
  error.value = ''
  loading.value = true
  
  try {
    if (isLogin.value) {
      const mockUser = {
        id: 1,
        name: form.value.email.split('@')[0],
        email: form.value.email,
        phone: '+7 (999) 123-45-67',
        registered: new Date().toISOString()
      }
      authStore.login(mockUser, 'mock-jwt-token-' + Date.now())
      router.push('/profile')
    } else {
      if (form.value.password !== form.value.confirmPassword) {
        error.value = 'Пароли не совпадают'
        return
      }
      const mockUser = {
        id: Date.now(),
        name: form.value.name,
        email: form.value.email,
        phone: form.value.phone || '',
        registered: new Date().toISOString()
      }
      authStore.login(mockUser, 'mock-jwt-token-' + Date.now())
      router.push('/profile')
    }
  } catch (e) {
    error.value = 'Произошла ошибка. Попробуйте снова.'
  } finally {
    loading.value = false
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
  color: var(--accent);
  margin-bottom: 1.5rem;
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
    padding: 2rem 1rem;
  }

  .auth__card {
    padding: 1.5rem;
    border-radius: 20px;
  }

  .auth__title {
    font-size: 1.5rem;
  }

  .auth__subtitle {
    font-size: 0.85rem;
  }

  .auth__form {
    gap: 1rem;
  }

  .form-group label {
    font-size: 0.75rem;
  }

  .btn-submit {
    padding: 0.875rem;
  }

  .password-toggle {
    right: 0.5rem;
  }
}
</style>