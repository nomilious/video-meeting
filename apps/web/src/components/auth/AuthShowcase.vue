<template>
  <section class="auth-showcase" aria-labelledby="product-name">
    <p class="brand">
      <span aria-hidden="true" class="brand-mark">V</span>
      Meetings
    </p>

    <div class="auth-showcase__copy">
      <p class="section-label">КОМАНДНОЕ ПРОСТРАНСТВО</p>
      <h1 id="product-name">Разговоры, которые двигают работу вперёд.</h1>
      <p>Одно спокойное место для встреч команды — от первой идеи до следующего решения.</p>
    </div>

    <article class="schedule-preview" aria-label="Пример расписания встреч">
      <header>
        <span>Сегодня</span>
        <strong>3 встречи</strong>
      </header>
      <div class="schedule-preview__item">
        <time>10:00</time>
        <span>Планирование недели</span>
      </div>
      <div class="schedule-preview__item">
        <time>14:30</time>
        <span>Дизайн-ревью</span>
      </div>
      <div class="schedule-preview__item">
        <time>16:00</time>
        <span>Синхронизация команды</span>
      </div>
    </article>
  </section>
</template>

<style scoped>
.auth-showcase {
  display: flex;
  min-height: 100%;
  flex-direction: column;
  justify-content: space-between;
  padding: clamp(28px, 5vw, 72px);
  background:
    radial-gradient(circle at 12% 0%, #dceeff, transparent 37%),
    linear-gradient(145deg, #f8fbff 0%, #ecf5ff 100%);
}

.auth-showcase__copy {
  max-width: 620px;
  margin: clamp(64px, 12vw, 150px) 0;
}

.auth-showcase h1 {
  max-width: 12ch;
  margin: 16px 0 20px;
  font-size: clamp(48px, 6vw, 84px);
  letter-spacing: -0.065em;
  line-height: 0.98;
  text-wrap: balance;
}

.auth-showcase__copy > p:last-child {
  max-width: 470px;
  margin: 0;
  color: var(--muted);
  font-size: clamp(18px, 1.8vw, 22px);
  line-height: 1.45;
}

.schedule-preview {
  width: min(100%, 460px);
  overflow: hidden;
  border: 1px solid rgb(255 255 255 / 80%);
  border-radius: var(--radius-lg);
  background: rgb(255 255 255 / 75%);
  box-shadow: var(--shadow);
  backdrop-filter: blur(18px);
}

.schedule-preview header,
.schedule-preview__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 17px 20px;
}

.schedule-preview header {
  border-bottom: 1px solid rgb(210 210 215 / 75%);
  font-size: 14px;
}

.schedule-preview header span {
  color: var(--muted);
}

.schedule-preview__item {
  justify-content: flex-start;
  border-bottom: 1px solid rgb(210 210 215 / 55%);
  font-size: 15px;
}

.schedule-preview__item:last-child {
  border-bottom: 0;
}

.schedule-preview time {
  min-width: 42px;
  color: var(--blue);
  font-size: 13px;
  font-variant-numeric: tabular-nums;
  font-weight: 700;
}

@media (width <= 820px) {
  .auth-showcase {
    min-height: auto;
    padding-bottom: 40px;
  }

  .auth-showcase__copy {
    margin: 72px 0;
  }
}

@media (width <= 600px) {
  .auth-showcase {
    padding: 24px 20px 32px;
  }

  .auth-showcase__copy {
    margin: 56px 0;
  }

  .auth-showcase h1 {
    font-size: clamp(44px, 13vw, 58px);
  }

  .schedule-preview {
    display: none;
  }
}
</style>
