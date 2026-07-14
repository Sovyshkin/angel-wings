<template>
  <main class="reset-page">
    <section class="reset-card" data-aos="fade-up">
      <router-link to="/" class="reset-logo" aria-label="На главную">
        <img src="/logo-192.webp" alt="Angel Wings" width="64" height="64" decoding="async">
      </router-link>

      <div class="reset-eyebrow">Новый пароль</div>
      <h1>Задайте новый пароль</h1>
      <p class="reset-lead">
        Придумайте пароль минимум из 6 символов. После сохранения старая ссылка восстановления больше не сработает.
      </p>

      <form v-if="!success" class="reset-form" @submit.prevent="submitReset">
        <label class="reset-field">
          <span>Новый пароль</span>
          <input
            v-model="password"
            type="password"
            class="input"
            placeholder="Минимум 6 символов"
            autocomplete="new-password"
            minlength="6"
            required
          >
        </label>

        <label class="reset-field">
          <span>Повторите пароль</span>
          <input
            v-model="confirmPassword"
            type="password"
            class="input"
            placeholder="Повторите новый пароль"
            autocomplete="new-password"
            minlength="6"
            required
          >
        </label>

        <div v-if="passwordMismatch" class="reset-message reset-message--error">
          Пароли не совпадают.
        </div>

        <div v-if="error" class="reset-message reset-message--error">
          {{ error }}
        </div>

        <button class="btn btn-primary reset-submit" type="submit" :disabled="loading || passwordMismatch || password.length < 6 || !token">
          <span v-if="loading" class="spinner"></span>
          <span v-else>Сохранить пароль</span>
        </button>
      </form>

      <div v-else class="reset-success">
        <div class="reset-success__icon">✓</div>
        <h2>Пароль обновлён</h2>
        <p>{{ successMessage }}</p>
        <router-link to="/auth" class="btn btn-primary reset-success__button">Войти</router-link>
      </div>

      <div v-if="!success" class="reset-actions">
        <router-link to="/forgot-password">Запросить новую ссылку</router-link>
      </div>
    </section>
  </main>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../store/auth'

const route = useRoute()
const authStore = useAuthStore()

const token = computed(() => String(route.query.token || '').trim())
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const success = ref(false)
const error = ref(token.value ? '' : 'Ссылка восстановления недействительна или повреждена.')
const successMessage = ref('Пароль успешно обновлён. Теперь можно войти с новым паролем.')

const passwordMismatch = computed(() => (
  Boolean(confirmPassword.value) && password.value !== confirmPassword.value
))

async function submitReset() {
  if (!token.value) {
    error.value = 'Ссылка восстановления недействительна или повреждена.'
    return
  }

  if (password.value !== confirmPassword.value) {
    error.value = 'Пароли не совпадают.'
    return
  }

  error.value = ''
  loading.value = true

  try {
    const result = await authStore.resetPassword(token.value, password.value)
    successMessage.value = result?.message || successMessage.value
    success.value = true
  } catch (e) {
    error.value = e.response?.data?.error || e.message || 'Не удалось обновить пароль. Запросите новую ссылку.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.reset-page {
  min-height: calc(100vh - 96px);
  display: grid;
  place-items: center;
  padding: 5rem 1.25rem;
  position: relative;
  overflow: hidden;
}

.reset-page::before {
  content: '';
  position: absolute;
  inset: 10% auto auto 50%;
  width: 40rem;
  height: 40rem;
  transform: translateX(-50%);
  border-radius: 50%;
  background: radial-gradient(circle, rgba(165, 184, 255, 0.25), transparent 68%);
  filter: blur(30px);
  pointer-events: none;
}

.reset-card {
  width: min(100%, 540px);
  position: relative;
  z-index: 1;
  padding: clamp(1.5rem, 4vw, 2.5rem);
  border: 1px solid rgba(165, 184, 255, 0.24);
  border-radius: 32px;
  background:
    linear-gradient(160deg, rgba(165, 184, 255, 0.12), rgba(255, 255, 255, 0.02)),
    var(--bg-card);
  box-shadow: 0 28px 90px rgba(0, 0, 0, 0.34);
}

.reset-logo {
  width: 72px;
  height: 72px;
  display: grid;
  place-items: center;
  margin-bottom: 1.5rem;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border);
}

.reset-logo img {
  width: 56px;
  height: 56px;
  object-fit: contain;
}

.reset-eyebrow {
  color: var(--accent);
  font-family: var(--font-mono);
  font-size: 0.78rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  margin-bottom: 0.75rem;
}

.reset-card h1,
.reset-success h2 {
  font-family: var(--font-display);
  font-size: clamp(2rem, 6vw, 3rem);
  line-height: 1;
  margin: 0 0 1rem;
}

.reset-lead,
.reset-success p {
  color: var(--text-secondary);
  line-height: 1.65;
  margin: 0;
}

.reset-form {
  display: grid;
  gap: 1.1rem;
  margin-top: 2rem;
}

.reset-field {
  display: grid;
  gap: 0.6rem;
}

.reset-field span {
  color: var(--text-muted);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.reset-submit {
  width: 100%;
  min-height: 56px;
}

.reset-message {
  padding: 1rem;
  border-radius: 18px;
  line-height: 1.45;
}

.reset-message--error {
  color: var(--danger);
  background: rgba(255, 100, 100, 0.1);
  border: 1px solid rgba(255, 100, 100, 0.35);
}

.reset-success {
  display: grid;
  gap: 1rem;
  margin-top: 2rem;
  padding: 1.25rem;
  border-radius: 24px;
  border: 1px solid rgba(43, 255, 136, 0.22);
  background: rgba(43, 255, 136, 0.08);
}

.reset-success__icon {
  width: 52px;
  height: 52px;
  display: grid;
  place-items: center;
  border-radius: 18px;
  color: #09130d;
  background: #2bff88;
  font-weight: 900;
  font-size: 1.4rem;
}

.reset-success__button {
  width: 100%;
  margin-top: 0.5rem;
}

.reset-actions {
  margin-top: 1.5rem;
  text-align: center;
}

.reset-actions a {
  color: var(--accent);
  font-weight: 800;
  text-decoration: none;
}

.reset-actions a:hover {
  text-decoration: underline;
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
</style>
