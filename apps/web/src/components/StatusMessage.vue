<script setup lang="ts">
import type { Feedback } from '../types';

defineProps<{ feedback: Feedback | null }>();
</script>

<template>
  <p
    v-if="feedback"
    class="form-message"
    :class="{ 'form-message--success': feedback.kind === 'success' }"
    role="status"
    aria-live="polite"
  >
    {{ feedback.message }}
  </p>
</template>

<style scoped>
.form-message--success {
  color: var(--success);
}
</style>
