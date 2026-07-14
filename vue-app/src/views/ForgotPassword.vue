<template>
  <main class="recovery-page">
    <section class="recovery-card" data-aos="fade-up">
      <router-link to="/" class="recovery-logo" aria-label="На главную">
        <img src="/logo-192.webp" alt="Angel Wings" width="64" height="64" decoding="async">
      </router-link>

      <div class="recovery-eyebrow">Восстановление доступа</div>
      <h1>Забыли пароль?</h1>
      <p class="recovery-lead">
        Укажите email аккаунта. Мы отправим одноразовую ссылку, по которой можно задать новый пароль.
      </p>

      <form v-if="!sent" class="recovery-form" @submit.prevent="submitRequest">
        <label class="recovery-field">
          <span>Email</span>
          <input
            v-model.trim="email"
            type="email"
            class="input"
            placeholder="example@mail.ru"
            autocomplete="email"
            required
          >
        </label>

        <div v-if="error" class="recovery-message recovery-message--error">
          {{ error }}
        </div>

        <button class="btn btn-primary recovery-submit" type="submit" :disabled="loading">
          <span v-if="loading" class="spinner"></span>
          <span v-else>Отправить ссылку</span>
        </button>
      </form>

      <div v-else class="recovery-success">
        <div class="recovery-success__icon">✓</div>
        <h2>Письмо отправлено</h2>
        <p>{{ successMessage }}</p>
        <p class="recovery-success__hint">Если письма нет во входящих, проверьте папку “Спам”.</p>
      </div>

      <div class="recovery-actions">
        <router-link to="/auth">Вернуться ко входу</router-link>
      </div>
    </section>
  </main>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '../store/auth'

const authStore = useAuthStore()
const email = ref('')
const loading = ref(false)
const sent = ref(false)
const error = ref('')
const successMessage = ref('Если такой email зарегистрирован, ссылка для восстановления уже отправлена.')

async function submitRequest() {
  error.value = ''
  loading.value = true

  try {
    const result = await authStore.forgotPassword(email.value)
    successMessage.value = result?.message || successMessage.value
    sent.value = true
  } catch (e) {
    error.value = e.response?.data?.error || e.message || 'Не удалось отправить письмо. Попробуйте позже.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.recovery-page {
  min-height: calc(100vh - 96px);
  display: grid;
  place-items: center;
  padding: 5rem 1.25rem;
  position: relative;
  overflow: hidden;
}

.recovery-page::before,
.recovery-page::after {
  content: '';
  position: absolute;
  width: 34rem;
  height: 34rem;
  border-radius: 50%;
  filter: blur(90px);
  opacity: 0.22;
  pointer-events: none;
}

.recovery-page::before {
  background: #9fb3ff;
  top: 4rem;
  left: -12rem;
}

.recovery-page::after {
  background: #2bff88;
  right: -14rem;
  bottom: -16rem;
}

.recovery-card {
  width: min(100%, 520px);
  position: relative;
  z-index: 1;
  padding: clamp(1.5rem, 4vw, 2.5rem);
  border: 1px solid rgba(165, 184, 255, 0.24);
  border-radius: 32px;
  background:
    linear-gradient(145deg, rgba(165, 184, 255, 0.10), rgba(255, 255, 255, 0.02)),
    var(--bg-card);
  box-shadow: 0 28px 90px rgba(0, 0, 0, 0.34);
}

.recovery-logo {
  width: 72px;
  height: 72px;
  display: grid;
  place-items: center;
  margin-bottom: 1.5rem;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border);
}

.recovery-logo img {
  width: 56px;
  height: 56px;
  object-fit: contain;
}

.recovery-eyebrow {
  color: var(--accent);
  font-family: var(--font-mono);
  font-size: 0.78rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  margin-bottom: 0.75rem;
}

.recovery-card h1,
.recovery-success h2 {
  font-family: var(--font-display);
  font-size: clamp(2rem, 6vw, 3rem);
  line-height: 1;
  margin: 0 0 1rem;
}

.recovery-lead,
.recovery-success p {
  color: var(--text-secondary);
  line-height: 1.65;
  margin: 0;
}

.recovery-form {
  display: grid;
  gap: 1.25rem;
  margin-top: 2rem;
}

.recovery-field {
  display: grid;
  gap: 0.6rem;
}

.recovery-field span {
  color: var(--text-muted);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.recovery-submit {
  width: 100%;
  min-height: 56px;
}

.recovery-message {
  padding: 1rem;
  border-radius: 18px;
  line-height: 1.45;
}

.recovery-message--error {
  color: var(--danger);
  background: rgba(255, 100, 100, 0.1);
  border: 1px solid rgba(255, 100, 100, 0.35);
}

.recovery-success {
  display: grid;
  gap: 1rem;
  margin-top: 2rem;
  padding: 1.25rem;
  border-radius: 24px;
  border: 1px solid rgba(43, 255, 136, 0.22);
  background: rgba(43, 255, 136, 0.08);
}

.recovery-success__icon {
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

.recovery-success__hint {
  color: var(--text-muted) !important;
  font-size: 0.92rem;
}

.recovery-actions {
  margin-top: 1.5rem;
  text-align: center;
}

.recovery-actions a {
  color: var(--accent);
  font-weight: 800;
  text-decoration: none;
}

.recovery-actions a:hover {
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
