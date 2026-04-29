<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-card card hover-lift">
        <router-link to="/" class="login-logo">
          <span class="logo-text">ANGEL WINGS</span>
        </router-link>
        
        <h1 class="login-title">Вход в админку</h1>
        <p class="login-subtitle">Управление магазином пептидов</p>
        
        <form @submit.prevent="handleLogin" class="login-form">
          <div class="form-group">
            <label class="form-label">Email</label>
            <input 
              type="email" 
              v-model="email" 
              required 
              class="input" 
              placeholder="admin@peptidi.shop"
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

async function handleLogin() {
  error.value = ''
  loading.value = true
  
  try {
    await authStore.login(email.value, password.value)
    router.push('/dashboard')
  } catch (e) {
    error.value = e.response?.data?.error || 'Ошибка входа'
  } finally {
    loading.value = false
  }
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