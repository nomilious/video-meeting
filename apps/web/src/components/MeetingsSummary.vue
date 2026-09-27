<script setup lang="ts">
import { computed } from 'vue';
import type { LoadStatus } from '../types';

const props = defineProps<{
  email: string;
  count: number;
  status: LoadStatus;
  pending: boolean;
  composerOpen: boolean;
}>();
const emit = defineEmits<{ toggleComposer: [] }>();
const greeting = computed(
  () => `Добрый день${props.email ? `, ${props.email}` : ''}`,
);
const total = computed(() => (props.status === 'ready' ? props.count : '—'));
const canCompose = computed(() => props.status === 'ready' && !props.pending);
</script>

<template>
  <section class="workspace-hero" aria-labelledby="workspace-title">
    <div>
      <p class="section-label">ВАШЕ ПРОСТРАНСТВО</p>
      <h1 id="workspace-title">{{ greeting }}</h1>
      <p>
        Держите команду в курсе — от ближайшей синхронизации до важных решений.
      </p>
    </div>
    <button
      :aria-expanded="composerOpen"
      :disabled="!canCompose"
      class="button button--primary"
      type="button"
      @click="emit('toggleComposer')"
    >
      {{ composerOpen ? 'Закрыть форму' : 'Новая встреча' }}
    </button>
  </section>
  <section class="overview" aria-label="Обзор встреч">
    <article class="metric-card">
      <span>Всего встреч</span><strong aria-live="polite">{{ total }}</strong>
      <p>В вашем календаре</p>
    </article>
    <article class="overview-note">
      <p class="section-label">ФОКУС НА СЕГОДНЯ</p>
      <strong>{{
        count ? 'Все планы под рукой.' : 'Начните с первой встречи.'
      }}</strong
      ><span>{{
        count
          ? 'Расписание ближайших встреч — ниже.'
          : 'Добавьте название, время и участников — остальное уже готово.'
      }}</span>
    </article>
  </section>
</template>

<style scoped>
.workspace-hero {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 32px;
  margin: clamp(52px, 8vw, 104px) 0 40px;
}
.workspace-hero h1 {
  max-width: 16ch;
  margin: 10px 0 12px;
  font-size: clamp(40px, 5.4vw, 68px);
  letter-spacing: -0.06em;
  line-height: 1;
  overflow-wrap: anywhere;
  text-wrap: balance;
}
.workspace-hero > div > p:last-child {
  max-width: 535px;
  margin: 0;
  color: var(--muted);
  font-size: 18px;
}
.workspace-hero > .button {
  flex: 0 0 auto;
}
.overview {
  display: grid;
  grid-template-columns: minmax(220px, 0.72fr) minmax(320px, 1.28fr);
  gap: 16px;
  margin-bottom: 48px;
}
.metric-card,
.overview-note {
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: var(--surface);
}
.metric-card {
  display: flex;
  min-height: 196px;
  flex-direction: column;
  justify-content: space-between;
  padding: 24px;
}
.metric-card > span,
.metric-card p {
  margin: 0;
  color: var(--muted);
  font-size: 14px;
}
.metric-card strong {
  font-size: 52px;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.065em;
  line-height: 1;
}
.overview-note {
  display: flex;
  min-height: 196px;
  flex-direction: column;
  justify-content: center;
  padding: 28px;
  background: linear-gradient(135deg, #0a84ff, #0071e3);
  border-color: transparent;
  color: #fff;
}
.overview-note .section-label {
  color: #d7ebff;
}
.overview-note strong {
  max-width: 18ch;
  margin: 12px 0 8px;
  font-size: clamp(23px, 3vw, 32px);
  letter-spacing: -0.04em;
  line-height: 1.12;
}
.overview-note span {
  max-width: 52ch;
  color: #e8f3ff;
}
@media (width <= 820px) {
  .workspace-hero {
    align-items: flex-start;
    flex-direction: column;
  }
}
@media (width <= 600px) {
  .workspace-hero {
    margin: 48px 0 32px;
    gap: 24px;
  }
  .workspace-hero h1 {
    font-size: clamp(40px, 12vw, 52px);
  }
  .workspace-hero > .button {
    width: 100%;
  }
  .overview {
    grid-template-columns: 1fr;
  }
  .metric-card,
  .overview-note {
    min-height: 164px;
  }
}
</style>
