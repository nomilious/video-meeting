<script setup lang="ts">
import AuthForm from '../components/auth/AuthForm.vue';
import AuthShowcase from '../components/auth/AuthShowcase.vue';
import type { AuthMode } from '../types';

defineProps<{ mode: AuthMode }>();
</script>

<template>
  <main class="auth-page">
    <AuthShowcase />
    <AuthForm :mode="mode" />
  </main>
</template>

<style scoped>
.auth-page {
  display: grid;
  min-height: 100dvh;
  grid-template-columns: minmax(0, 1.15fr) minmax(380px, 0.85fr);
  background: var(--surface);
}

@media (width <= 820px) {
  .auth-page {
    grid-template-columns: 1fr;
  }
}
</style>
