<script setup lang="ts">
import { computed, toRef } from 'vue';
import { useAuthentication } from '../../composables/useAuthentication';
import type { AuthMode } from '../../types';
import StatusMessage from '../StatusMessage.vue';

const props = defineProps<{ mode: AuthMode }>();

const { credentials, pending, feedback, submit } = useAuthentication(toRef(props, 'mode'));
const isLogin = computed(() => props.mode === 'login');
const submitLabel = computed(() => {
  if (pending.value) {
    return 'Проверяем…';
  }

  return isLogin.value ? 'Войти' : 'Создать аккаунт';
});
</script>

<template>
  <section class="auth-panel" aria-labelledby="auth-title">
    <header class="auth-panel__header">
      <p class="section-label">
        {{ isLogin ? 'С ВОЗВРАЩЕНИЕМ' : 'НАЧНИТЕ РАБОТУ' }}
      </p>
      <h2 id="auth-title">
        {{ isLogin ? 'Войти в Meetings' : 'Создать аккаунт' }}
      </h2>
      <p>
        {{
          isLogin
            ? 'Введите данные, чтобы продолжить работу с командой.'
            : 'Используйте рабочий email и пароль не короче 8 символов.'
        }}
      </p>
    </header>

    <form class="auth-form" :aria-busy="pending" @submit.prevent="submit">
      <label class="field" for="email">
        <span>Email</span>
        <input
          id="email"
          v-model="credentials.email"
          autocomplete="email"
          name="email"
          placeholder="name@company.com"
          required
          type="email"
          :disabled="pending"
        />
      </label>

      <label class="field" for="password">
        <span>Пароль</span>
        <input
          id="password"
          v-model="credentials.password"
          :autocomplete="isLogin ? 'current-password' : 'new-password'"
          minlength="8"
          name="password"
          placeholder="Не менее 8 символов"
          required
          type="password"
          :disabled="pending"
        />
      </label>

      <button class="button button--primary" :disabled="pending" type="submit">
        {{ submitLabel }}
      </button>
      <StatusMessage :feedback="feedback" />
    </form>

    <footer class="auth-panel__footer">
      <span>{{ isLogin ? 'Впервые в Meetings?' : 'Уже есть аккаунт?' }}</span>
      <RouterLink :to="isLogin ? '/auth/Register' : '/auth/Login'">
        {{ isLogin ? 'Создать аккаунт' : 'Войти' }}
      </RouterLink>
    </footer>
  </section>
</template>

<style scoped>
.auth-panel {
  display: flex;
  flex-direction: column;
  justify-content: center;
  max-width: 510px;
  margin: auto;
  padding: 48px;
}

.auth-panel__header h2 {
  margin: 12px 0 8px;
  font-size: clamp(32px, 4vw, 42px);
  letter-spacing: -0.045em;
  line-height: 1.08;
}

.auth-panel__header > p:last-child {
  margin: 0;
  color: var(--muted);
}

.auth-form {
  display: grid;
  gap: 18px;
  margin-top: 36px;
}

.auth-form .button {
  margin-top: 6px;
}

.auth-panel__footer {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 28px;
  color: var(--muted);
  font-size: 14px;
}

.auth-panel__footer a {
  color: var(--blue);
  font-weight: 600;
  text-decoration: none;
}

.auth-panel__footer a:hover {
  text-decoration: underline;
}

@media (width <= 820px) {
  .auth-panel {
    width: min(100%, 560px);
    padding: 48px 28px 56px;
  }
}

@media (width <= 600px) {
  .auth-panel {
    padding: 40px 20px 48px;
  }
}
</style>
