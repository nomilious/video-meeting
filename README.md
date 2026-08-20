# Video Meetings

Монорепозиторий с приложениями на Next.js и Nest.js.

```bash
npm install
npm run dev
```

Web: http://localhost:3000  
API: http://localhost:3001

Отдельный запуск: `npm run dev:web` или `npm run dev:api`.

## Авторизация API

API использует Prisma и PostgreSQL. После запуска базы примените миграции:

```bash
npm run prisma:migrate --workspace=@video-meetings/api
```

`POST /auth/register` создаёт пользователя через CQRS-команду, а
`POST /auth/login` проверяет существующего через CQRS-запрос. Оба endpoint принимают `email` и `password`, возвращая
`{ "gvtToken": "..." }`. Задайте `DATABASE_URL` и `JWT_SECRET` в `.env` по
примеру из `.env.example`.

## Встречи API

Защищённые JWT‑токеном ручки `POST /meetings`, `GET /meetings` и
`GET /meetings/:id` создают и возвращают встречи текущего пользователя.
При создании передайте `title`, `date` в ISO 8601 и непустой массив строк
`participants`. Встречи других пользователей не выдаются и отвечают `404`.

## PostgreSQL

```bash
docker compose up -d postgres
```

База доступна на `localhost:5432`: пользователь и база — `video_meetings`,
пароль по умолчанию — `video_meetings`. Чтобы изменить пароль, скопируйте
`.env.example` в `.env` и укажите свой `POSTGRES_PASSWORD` до первого запуска.
