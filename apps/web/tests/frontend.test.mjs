import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { chromium } from 'playwright';
import { createServer } from 'vite';

test('authentication, meeting states, duplicate submissions, and cancelled navigation', async (t) => {
  const server = await createServer({
    root: fileURLToPath(new URL('../', import.meta.url)),
    server: { host: '127.0.0.1', port: 0, strictPort: true },
  });
  t.after(() => server.close());
  await server.listen();
  const browser = await chromium.launch({ headless: true });
  t.after(() => browser.close());
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });
  const url = server.resolvedUrls.local[0];
  const pageErrors = [];
  const warnings = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'warning') warnings.push(message.text());
  });

  let meetings = [];
  let createRequests = 0;
  let failList = false;
  let failCreate = false;
  let registerDelay = 0;
  let loadDelay = 0;
  let cancelledRequests = 0;
  page.on('requestfailed', (request) => {
    if (request.failure()?.errorText.includes('ABORTED')) cancelledRequests++;
  });
  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (path === '/api/auth/register') {
      await delay(registerDelay);
      return route.fulfill({
        status: 201,
        json: { gvtToken: 'browser-test-token' },
      });
    }
    if (path === '/api/auth/login') {
      return route.fulfill(
        request.postDataJSON().password === 'SecurePassword123!'
          ? { json: { gvtToken: 'browser-test-token' } }
          : { status: 401, json: { detail: 'Invalid credentials' } },
      );
    }
    await delay(loadDelay);
    if (path === '/api/auth/me') {
      return route.fulfill(
        request.headers().authorization === 'Bearer browser-test-token'
          ? { json: { id: 'browser-user', email: 'browser@example.com' } }
          : { status: 401, json: { detail: 'Invalid token' } },
      );
    }
    assert.equal(path, '/api/meetings');
    if (request.method() === 'GET') {
      return route.fulfill(
        failList
          ? { status: 503, json: { detail: 'Unavailable' } }
          : { json: meetings },
      );
    }
    createRequests++;
    await delay(100);
    if (failCreate)
      return route.fulfill({ status: 503, json: { detail: 'Unavailable' } });
    const meeting = {
      id: `meeting-${createRequests}`,
      ...request.postDataJSON(),
    };
    meetings = [...meetings, meeting];
    return route.fulfill({ status: 201, json: meeting });
  });

  await page.goto(url);
  await page.waitForURL('**/auth/Login');
  await page.getByRole('link', { name: 'Создать аккаунт' }).click();
  await page.getByLabel('Email', { exact: true }).fill('browser@example.com');
  await page.getByLabel('Пароль', { exact: true }).fill('SecurePassword123!');
  await page
    .getByRole('button', { name: 'Создать аккаунт', exact: true })
    .click();
  await page
    .getByRole('status')
    .filter({ hasText: 'Аккаунт создан' })
    .waitFor();
  assert.equal(
    await page.getByLabel('Пароль', { exact: true }).inputValue(),
    '',
  );
  await page.getByRole('link', { name: 'Войти', exact: true }).click();
  assert.equal(
    await page.getByLabel('Email', { exact: true }).inputValue(),
    'browser@example.com',
  );
  await page.getByLabel('Пароль', { exact: true }).fill('wrong-password');
  await page.getByRole('button', { name: 'Войти', exact: true }).click();
  await page
    .getByRole('status')
    .filter({ hasText: 'Неверный email или пароль' })
    .waitFor();
  await page.getByLabel('Пароль', { exact: true }).fill('SecurePassword123!');
  loadDelay = 150;
  await page.getByRole('button', { name: 'Войти', exact: true }).click();
  await page.waitForURL('**/meetings');
  await page.getByText('Загружаем встречи…', { exact: true }).waitFor();
  assert.equal(
    await page.getByRole('button', { name: 'Новая встреча' }).isDisabled(),
    true,
  );
  await page.getByText('Встреч пока нет.', { exact: false }).waitFor();
  loadDelay = 0;

  await page.getByRole('button', { name: 'Новая встреча' }).click();
  await page
    .getByLabel('Название', { exact: true })
    .fill('Frontend regression');
  await page
    .getByLabel('Дата и время', { exact: true })
    .fill('2026-10-20T14:30');
  await page.getByLabel('Участники', { exact: true }).fill(' , ');
  await page
    .getByRole('button', { name: 'Создать встречу', exact: true })
    .click();
  await page.getByRole('alert').waitFor();
  assert.equal(createRequests, 0);
  await page
    .getByLabel('Участники', { exact: true })
    .fill('alice@example.com, bob@example.com');
  failCreate = true;
  await page
    .getByRole('button', { name: 'Создать встречу', exact: true })
    .click();
  await page
    .getByRole('status')
    .filter({ hasText: 'Сервер не смог выполнить запрос' })
    .waitFor();
  assert.equal(
    await page.getByLabel('Название', { exact: true }).inputValue(),
    'Frontend regression',
  );
  failCreate = false;
  await page.locator('.meeting-form').evaluate((form) => {
    for (let i = 0; i < 2; i++)
      form.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
  });
  await page
    .getByRole('heading', { name: 'Frontend regression', exact: true })
    .waitFor();
  assert.equal(
    createRequests,
    2,
    'two submissions must produce only one additional request',
  );
  assert.deepEqual(meetings[0].participants, [
    'alice@example.com',
    'bob@example.com',
  ]);
  assert.equal(await page.locator('.composer').count(), 0);
  await page.reload();
  await page
    .getByRole('heading', { name: 'Frontend regression', exact: true })
    .waitFor();

  failList = true;
  await page.reload();
  await page.getByRole('button', { name: 'Повторить загрузку' }).waitFor();
  assert.equal(
    await page.getByRole('button', { name: 'Новая встреча' }).isDisabled(),
    true,
  );
  failList = false;
  await page.getByRole('button', { name: 'Повторить загрузку' }).click();
  await page
    .getByRole('heading', { name: 'Frontend regression', exact: true })
    .waitFor();
  await page.setViewportSize({ width: 375, height: 812 });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  );
  await page.getByRole('button', { name: 'Выйти', exact: true }).click();
  await page.waitForURL('**/auth/Login');
  assert.equal(
    await page.evaluate(() => sessionStorage.getItem('gvtToken')),
    null,
  );

  registerDelay = 250;
  await page.getByRole('link', { name: 'Создать аккаунт' }).click();
  await page.getByLabel('Email', { exact: true }).fill('late@example.com');
  await page.getByLabel('Пароль', { exact: true }).fill('SecurePassword123!');
  const started = page.waitForRequest('**/api/auth/register');
  await page
    .getByRole('button', { name: 'Создать аккаунт', exact: true })
    .click();
  await started;
  await page.getByRole('link', { name: 'Войти', exact: true }).click();
  await page.waitForURL('**/auth/Login');
  await delay(300);
  assert.equal(
    await page.getByRole('status').count(),
    0,
    'cancelled registration must not update login',
  );
  assert.equal(
    await page.evaluate(() => sessionStorage.getItem('gvtToken')),
    null,
  );
  assert.ok(cancelledRequests > 0, 'navigation should abort the old request');
  assert.deepEqual(pageErrors, []);
  assert.deepEqual(warnings, []);
});
