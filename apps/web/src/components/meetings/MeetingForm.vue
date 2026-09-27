<script setup lang="ts">
import { reactive, shallowRef } from 'vue';
import type { MeetingCreate } from '../../api/client';

const props = defineProps<{ pending: boolean }>();
const emit = defineEmits<{ submit: [meeting: MeetingCreate] }>();

const draft = reactive({ title: '', date: '', participants: '' });
const error = shallowRef('');

function submit() {
  if (props.pending) {
    return;
  }

  error.value = '';
  const names = draft.participants
    .split(/[\n,]+/)
    .map((value) => value.trim())
    .filter(Boolean);
  const time = new Date(draft.date);

  if (!draft.title.trim() || !names.length || !Number.isFinite(time.getTime())) {
    error.value = 'Укажите название, дату и хотя бы одного участника.';
    return;
  }

  emit('submit', {
    title: draft.title.trim(),
    date: time.toISOString(),
    participants: names,
  });
}
</script>

<template>
  <section class="composer" aria-labelledby="create-title">
    <header>
      <p class="section-label">НОВОЕ СОБЫТИЕ</p>
      <h2 id="create-title">Запланировать встречу</h2>
      <p>Укажите главное — детали появятся у команды в одном месте.</p>
    </header>

    <form class="meeting-form" :aria-busy="pending" @submit.prevent="submit">
      <label class="field" for="title">
        <span>Название</span>
        <input
          id="title"
          v-model="draft.title"
          name="title"
          placeholder="Например, дизайн-ревью"
          required
          :disabled="pending"
        />
      </label>

      <label class="field" for="date">
        <span>Дата и время</span>
        <input
          id="date"
          v-model="draft.date"
          name="date"
          required
          type="datetime-local"
          :disabled="pending"
        />
      </label>

      <label class="field field--full" for="participants">
        <span>Участники</span>
        <textarea
          id="participants"
          v-model="draft.participants"
          name="participants"
          placeholder="name@company.com, colleague@company.com"
          required
          :disabled="pending"
        />
      </label>

      <button class="button button--primary" type="submit" :disabled="pending">
        {{ pending ? 'Создаём…' : 'Создать встречу' }}
      </button>
      <p v-if="error" class="form-message" role="alert">{{ error }}</p>
    </form>
  </section>
</template>

<style scoped>
.composer {
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: var(--surface);
  margin: 0 0 52px;
  padding: clamp(24px, 4vw, 40px);
  box-shadow: var(--shadow);
}

.composer header {
  max-width: 580px;
}

.composer h2 {
  margin: 9px 0 8px;
  font-size: clamp(28px, 3vw, 36px);
  letter-spacing: -0.045em;
  line-height: 1.1;
}

.composer header > p:last-child {
  margin: 0;
  color: var(--muted);
}

.meeting-form {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  max-width: 780px;
  margin-top: 32px;
}

.field--full {
  grid-column: 1 / -1;
}

.meeting-form .button {
  width: fit-content;
}

@media (width <= 600px) {
  .meeting-form {
    grid-template-columns: 1fr;
  }

  .composer {
    margin-bottom: 40px;
    padding: 24px 20px;
  }

  .field--full {
    grid-column: auto;
  }

  .meeting-form .button {
    width: 100%;
  }
}
</style>
