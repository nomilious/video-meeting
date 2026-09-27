<script setup lang="ts">
import { computed } from 'vue';
import type { Meeting } from '../api/client';
import type { LoadStatus } from '../types';

const props = defineProps<{
  meetings: readonly Meeting[];
  status: LoadStatus;
}>();
const emit = defineEmits<{ retry: [] }>();
const formatter = new Intl.DateTimeFormat('ru-RU', {
  dateStyle: 'medium',
  timeStyle: 'short',
});
const plural = new Intl.PluralRules('ru');
function participantLabel(count: number) {
  const category = plural.select(count);
  return category === 'one'
    ? 'участник'
    : category === 'few'
      ? 'участника'
      : 'участников';
}

const visibleMeetings = computed(() =>
  props.meetings.slice(0, 3).map((meeting) => ({
    ...meeting,
    formattedDate: formatter.format(new Date(meeting.date)),
    participantDescription: `${meeting.participants.length} ${participantLabel(meeting.participants.length)}`,
  })),
);
</script>

<template>
  <section
    class="meetings-section"
    aria-labelledby="meetings-title"
    :aria-busy="status === 'loading'"
  >
    <header class="section-heading">
      <div>
        <p class="section-label">БЛИЖАЙШЕЕ</p>
        <h2 id="meetings-title">Последние встречи</h2>
      </div>
      <span>{{ visibleMeetings.length }} из {{ meetings.length }}</span>
    </header>
    <p v-if="status === 'loading'" class="empty-state" role="status">
      Загружаем встречи…
    </p>
    <button
      v-else-if="status === 'error'"
      class="button button--secondary"
      type="button"
      @click="emit('retry')"
    >
      Повторить загрузку
    </button>
    <p v-else-if="meetings.length === 0" class="empty-state">
      Встреч пока нет. Создайте первую, чтобы она появилась здесь.
    </p>
    <ul v-else class="meeting-list">
      <li v-for="meeting in visibleMeetings" :key="meeting.id">
        <article class="meeting-card">
          <time :datetime="meeting.date">{{ meeting.formattedDate }}</time>
          <h3>{{ meeting.title }}</h3>
          <p>
            {{ meeting.participantDescription }}
          </p>
        </article>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.meeting-card {
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: var(--surface);
}
.section-heading h2 {
  margin: 9px 0 8px;
  font-size: clamp(28px, 3vw, 36px);
  letter-spacing: -0.045em;
  line-height: 1.1;
}
.meetings-section {
  max-width: 820px;
}
.section-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}
.section-heading h2 {
  margin-bottom: 0;
}
.section-heading > span {
  color: var(--muted);
  font-size: 14px;
  font-variant-numeric: tabular-nums;
}
.empty-state {
  margin: 0;
  border: 1px dashed #a1a1a6;
  border-radius: var(--radius-md);
  padding: 24px;
  color: var(--muted);
}
.meeting-list {
  display: grid;
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.meeting-card {
  padding: 22px 24px;
  transition:
    border-color 180ms ease,
    box-shadow 180ms ease,
    transform 180ms ease;
}
.meeting-card:hover {
  border-color: #a1a1a6;
  box-shadow: 0 8px 24px rgb(0 0 0 / 6%);
  transform: translateY(-1px);
}
.meeting-card time,
.meeting-card p {
  margin: 0;
  color: var(--muted);
  font-size: 14px;
}
.meeting-card time {
  font-variant-numeric: tabular-nums;
}
.meeting-card h3 {
  margin: 8px 0 5px;
  font-size: 19px;
  letter-spacing: -0.025em;
  overflow-wrap: anywhere;
}
@media (width <= 600px) {
  .section-heading {
    align-items: flex-start;
    flex-direction: column;
    gap: 8px;
  }
}
</style>
