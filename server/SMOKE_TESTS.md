# Smoke-тесты API (сервер)

Этот набор проверяет базовую работоспособность API после деплоя.

## Что проверяется

- `GET /api/products`
- `GET /api/categories`
- `POST /api/orders` без токена (ожидается `401`)
- Опционально user-flow (если задать логин/пароль):
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/orders/my`
- Опционально admin-flow (если задать логин/пароль):
- `POST /api/auth/login`
- `GET /api/admin/orders`
- `GET /api/admin/products`

## Файлы

- Скрипт: `scripts/smoke-test.mjs`
- NPM команды:
- `npm run test:smoke`
- `npm run test:smoke:prod`

## Запуск на сервере

```bash
cd /var/www/angel-wings/server
npm run test:smoke:prod
```

## Полный запуск (с авторизацией user + admin)

```bash
cd /var/www/angel-wings/server
SMOKE_BASE_URL="https://angel-wings.ru" \
SMOKE_EMAIL="user@example.com" \
SMOKE_PASSWORD="user_password" \
SMOKE_ADMIN_EMAIL="admin@example.com" \
SMOKE_ADMIN_PASSWORD="admin_password" \
npm run test:smoke
```

## Интерпретация результата

- В консоли выводятся строки `PASS | ...` и `FAIL | ...`.
- В конце summary.
- Если есть хотя бы один `FAIL`, скрипт завершится с кодом `1`.

Это удобно для CI/CD и для ручной проверки после `git pull`.
