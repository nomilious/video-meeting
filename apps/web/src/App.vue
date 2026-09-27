<template>
  <RouterView />
</template>

<style>
:root {
  --blue: #0071e3;
  --blue-pressed: #0077ed;
  --ink: #1d1d1f;
  --muted: #6e6e73;
  --line: #d2d2d7;
  --surface: #fff;
  --canvas: #f5f5f7;
  --success: #16803c;
  --danger: #b3261e;
  --radius-lg: 28px;
  --radius-md: 20px;
  --shadow: 0 18px 48px rgb(0 0 0 / 7%);
}
* {
  box-sizing: border-box;
}
html {
  background: var(--canvas);
}
body {
  min-width: 320px;
  margin: 0;
  background: var(--canvas);
  color: var(--ink);
  font-family:
    -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif;
  font-size: 16px;
  line-height: 1.5;
  text-rendering: optimizeLegibility;
}
button,
input,
textarea {
  font: inherit;
}
button,
a {
  touch-action: manipulation;
}
button {
  cursor: pointer;
}
.brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  color: var(--ink);
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.03em;
}
.brand-mark {
  display: grid;
  width: 30px;
  height: 30px;
  place-items: center;
  border-radius: 10px;
  background: linear-gradient(145deg, #1287ff, #0066cc);
  color: #fff;
  font-size: 16px;
  font-weight: 800;
  letter-spacing: -0.08em;
}
.section-label {
  margin: 0;
  color: var(--blue);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
}
.button {
  display: inline-flex;
  min-height: 48px;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  border-radius: 999px;
  padding: 11px 20px;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.25;
  transition:
    background-color 180ms ease,
    border-color 180ms ease,
    box-shadow 180ms ease,
    transform 180ms ease;
}
.button:active {
  transform: scale(0.98);
}
.button:disabled {
  cursor: not-allowed;
  opacity: 0.52;
}
.button--primary {
  background: var(--blue);
  color: #fff;
  box-shadow: 0 3px 10px rgb(0 113 227 / 18%);
}
.button--primary:hover:not(:disabled) {
  background: var(--blue-pressed);
  box-shadow: 0 5px 14px rgb(0 113 227 / 24%);
}
.button--secondary {
  border-color: var(--line);
  background: var(--surface);
  color: var(--ink);
}
.button--secondary:hover {
  border-color: #a1a1a6;
  background: #fbfbfc;
}
.field {
  display: grid;
  gap: 8px;
  color: var(--ink);
  font-size: 14px;
  font-weight: 600;
}
.field input,
.field textarea {
  width: 100%;
  min-height: 52px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: var(--surface);
  color: var(--ink);
  padding: 13px 14px;
  font-weight: 400;
  line-height: 1.45;
  outline: none;
  transition:
    border-color 180ms ease,
    box-shadow 180ms ease;
}
.field textarea {
  min-height: 116px;
  resize: vertical;
}
.field input::placeholder,
.field textarea::placeholder {
  color: #86868b;
}
.field input:hover,
.field textarea:hover {
  border-color: #a1a1a6;
}
.field input:focus,
.field textarea:focus {
  border-color: var(--blue);
  box-shadow: 0 0 0 4px rgb(0 113 227 / 15%);
}
:focus-visible {
  outline: 3px solid var(--blue);
  outline-offset: 3px;
}
.field input:focus-visible,
.field textarea:focus-visible {
  outline: none;
}
.form-message {
  margin: 0;
  color: var(--danger);
  font-size: 14px;
  line-height: 1.45;
}
.form-message--success {
  color: var(--success);
}
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
  }
}
</style>
