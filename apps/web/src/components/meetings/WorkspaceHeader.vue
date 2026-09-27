<script setup lang="ts">
const emit = defineEmits<{ logout: [] }>();
</script>

<template>
  <header class="app-bar">
    <p class="brand">
      <span aria-hidden="true" class="brand-mark">V</span>
      Meetings
    </p>
    <button class="button button--secondary" type="button" @click="emit('logout')">Выйти</button>
  </header>
</template>

<style scoped>
.app-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 64px;
}

.app-bar .button {
  min-height: 42px;
  padding-inline: 17px;
  font-size: 14px;
}
</style>
