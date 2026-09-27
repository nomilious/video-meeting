# Video Meetings

Vue 3 + TypeScript + Vite, FastAPI + Pydantic 2, async SQLAlchemy 2 + asyncpg,
PostgreSQL 16 и Alembic. Регистрация, вход и личное расписание встреч.

## Запуск через Docker Compose

```bash
cp .env.example .env
# Задайте свой JWT_SECRET и POSTGRES_PASSWORD в .env.
docker compose up --build -d
```

Web: http://localhost:3000. API: http://localhost:3001.
Swagger: http://localhost:3001/docs.

Compose запускает PostgreSQL и ждёт его healthcheck. Одноразовый сервис
`migrate` выполняет `alembic upgrade head`. API запускается только после
успешных миграций; nginx с Vue-приложением — после healthcheck API.
Ошибка миграции блокирует запуск API. Повторный `docker compose up --build -d`
применяет новые версии миграций; уже применённые версии повторно не выполняются.

Данные хранятся в прежнем volume `postgres_data`. Для обновления существующего
проекта сохраните прежний POSTGRES_PASSWORD; смена переменной не меняет пароль
уже созданной базы. Не удаляйте volume при переходе на новый backend.

## Локальная разработка

Нужны Node.js 22+, Python 3.12+, uv и Docker либо локальный PostgreSQL.

```bash
cp .env.example .env
# Настройте JWT_SECRET и DATABASE_URL в .env.
npm install
cd apps/api
uv sync --frozen
cd ../..
docker compose up -d postgres
cd apps/api
uv run alembic upgrade head
cd ../..
npm run dev
```

`npm run dev:web` запускает Vite на 3000. `npm run dev:api` запускает Uvicorn
на 3001 с перезагрузкой. FastAPI читает корневой `.env`; Vite тоже использует
корневой файл. DATABASE_URL для локального запуска указывает на localhost;
Compose передаёт DB_HOST=postgres и DB_PASSWORD отдельно; SQLAlchemy безопасно
кодирует пароль при сборке URL. Если вы поменяли пароль базы,
обновите и локальный DATABASE_URL. Спецсимволы пароля в URL нужно percent-encode.

## Архитектура

- `apps/web/src/components`: формы авторизации, рабочее пространство, форма и
  список встреч. Composition API, `<script setup lang="ts">`, Vue Router.
  Стили компонентов находятся в `<style scoped>`; общие классы, токены
  и глобальные правила — в `apps/web/src/App.vue`.
- `apps/web/src/api/client.ts`: общий HTTP-клиент, токен и сообщения об ошибках.
- `apps/web/src/api/schema.d.ts`: типы, сгенерированные из FastAPI OpenAPI.
- `apps/api/app`: настройки, async-сессии БД, ORM-модели, Pydantic-схемы,
  routers авторизации и встреч. У каждого запроса своя сессия SQLAlchemy.
- `apps/api/migrations`: Alembic, включая переход с прежней схемы Prisma.

Браузер обращается к `/api`; Vite в разработке и nginx в Compose проксируют
запросы в FastAPI. Внешний API можно задать через VITE_API_URL для локального
Vite; в контейнерной сборке используется `/api`. WEB_ORIGIN задаёт разрешённый
origin для прямых запросов в API.

Страницы `/auth/Login`, `/auth/Register`, `/meetings` сохранены. Корень
перенаправляет на встречи; без токена — на вход. После регистрации пользователь
входит в аккаунт. JWT `gvtToken` живёт час и хранится в sessionStorage;
API проверяет подпись, срок действия и существование пользователя. Встречи
фильтруются по владельцу на backend. Bcrypt выполняется вне event loop.

## API

- `POST /auth/register`: email и password, 201 `{ "gvtToken": "..." }`.
- `POST /auth/login`: email и password, 200 `{ "gvtToken": "..." }`.
- `GET /auth/me`: 200 `{ "id": "...", "email": "..." }`.
- `POST /meetings`: title, date (ISO 8601), непустой массив participants;
  201 `{ "id", "title", "date", "participants" }`.
- `GET /meetings`: массив встреч владельца по дате; опциональные offset и limit
  (1–100) включают пагинацию. Без limit возвращается прежний полный массив.
- `GET /meetings/{id}`: встреча владельца, иначе 404.
- `GET /health`: проверка доступности PostgreSQL.

Защищённые ручки требуют `Authorization: Bearer <gvtToken>`.
Ошибки используют стандартный FastAPI `detail`; 401 — авторизация, 409 — занятый
email, 422 — неверные данные. Email нормализуется в нижний регистр; пароль
от 8 символов до 72 байт UTF-8 при регистрации (ограничение bcrypt).
Вход с прежними длинными паролями сохраняет поведение Node bcrypt.

## Миграции и прежние данные

Baseline `0001` создаёт таблицы User/Meeting либо принимает существующие
таблицы Prisma. Имена таблиц, колонок, строковые ID и bcrypt-хеши сохранены.
`0002` переводит прежние UTC timestamp в timestamptz и добавляет проверки
непустых названий и массивов участников. CHECK constraints добавлены NOT VALID,
чтобы не удалять прежние некорректные строки; новые записи проверяются сразу.
Таблица `_prisma_migrations` может остаться как история, новый backend её не
использует. Prisma больше не запускайте. Переход требует остановить прежний API.

```bash
cd apps/api
uv run alembic revision --autogenerate -m "description"
# Проверьте сгенерированную миграцию перед применением.
uv run alembic upgrade head
```

Baseline намеренно не удаляет таблицы при downgrade, поскольку мог принять
существующие данные. Для рабочей базы используйте новые корректирующие миграции.

## Проверки и обновление типов

```bash
npm run api:types
npm run build
npm run lint
cd apps/api
DATABASE_URL=postgresql+asyncpg://user:password@localhost/test_db uv run alembic upgrade head
TEST_DATABASE_URL=postgresql+asyncpg://user:password@localhost/test_db uv run pytest
```

Тесты требуют отдельную мигрированную PostgreSQL-базу и роль с CREATEDB
(проверка миграций создаёт и удаляет собственные временные базы). Проверяют авторизацию,
валидацию, создание/чтение, пагинацию и изоляцию встреч. Созданные тестами
пользователи удаляются. Если TEST_DATABASE_URL не задан, интеграционный тест
пропускается. После изменения Pydantic-схем обновите OpenAPI и TypeScript-типы
через `npm run api:types`. npm и uv используют зафиксированные lockfiles.
