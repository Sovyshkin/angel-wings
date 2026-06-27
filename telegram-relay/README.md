# Angel Wings Telegram and Email Relay

Отдельный маленький backend для сервера за пределами РФ. Основной сайт отправляет сюда защищённые запросы, а relay отправляет уведомления в Telegram и письма через SMTP.

## Схема работы

1. Клиент оформляет заказ на `angel-wings.ru`.
2. Основной backend создаёт заказ и собирает текст уведомления.
3. Основной backend отправляет `POST /telegram/orders` на этот relay.
4. Relay отправляет сообщение в Telegram-группу от имени бота.

## Переменные окружения relay-сервера

Создай файл `.env` рядом с `package.json`:

```env
PORT=3010
NODE_ENV=production
TELEGRAM_RELAY_SECRET="очень-длинный-случайный-секрет"
TELEGRAM_RELAY_SIGNATURE_TOLERANCE_MS="300000"
TELEGRAM_BOT_TOKEN="токен_бота"
TELEGRAM_ORDERS_CHAT_ID="-1004244476310"
TELEGRAM_ORDERS_THREAD_ID=""

EMAIL_RELAY_SECRET="отдельный-длинный-секрет-для-почты"
SMTP_HOST="mail.hosting.reg.ru"
SMTP_PORT="465"
SMTP_SECURE="true"
SMTP_REQUIRE_TLS="false"
SMTP_USER="info@angel-wings.ru"
SMTP_PASSWORD="пароль-почтового-ящика"
SMTP_FROM="info@angel-wings.ru"
```

`TELEGRAM_RELAY_SECRET` должен совпадать с секретом на основном backend. Он используется не как обычный пароль, а как HMAC-секрет для подписи тела запроса.

## Переменные окружения основного backend

На основном сервере в `/var/www/angel-wings/server/.env` нужно добавить:

```env
TELEGRAM_RELAY_URL="https://telegram-relay.example.com"
TELEGRAM_RELAY_SECRET="тот-же-самый-длинный-секрет"
TELEGRAM_RELAY_TIMEOUT_MS="30000"

EMAIL_RELAY_URL="https://tg.angel-wings.ru"
EMAIL_RELAY_SECRET="тот-же-email-секрет-что-на-relay"
EMAIL_RELAY_TIMEOUT_MS="20000"
```

После этого `TELEGRAM_BOT_TOKEN` и SMTP-пароль на основном сервере не нужны: секреты внешних сервисов хранятся на немецком relay.

## Запуск на немецком сервере

```bash
cd /var/www
git clone https://github.com/Sovyshkin/angel-wings.git
cd /var/www/angel-wings/telegram-relay
npm install --omit=dev
cp .env.example .env
nano .env
npm start
```

Для PM2:

```bash
npm install -g pm2
pm2 start src/index.js --name angel-wings-telegram-relay
pm2 save
pm2 startup
```

## Nginx пример

```nginx
server {
    listen 80;
    server_name telegram-relay.example.com;

    location / {
        proxy_pass http://127.0.0.1:3010;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

После подключения SSL через certbot основной backend должен использовать `https://...`, не `http://...`.

## Проверка

Health-check:

```bash
curl https://telegram-relay.example.com/health
```

Тестовая отправка:

```bash
BODY='{"orderId":999,"text":"<b>Тест Angel Wings relay</b>","parseMode":"HTML"}'
TS="$(date +%s000)"
SECRET="ВАШ_TELEGRAM_RELAY_SECRET"
SIGNATURE="$(printf '%s.%s' "$TS" "$BODY" | openssl dgst -sha256 -hmac "$SECRET" -hex | awk '{print $2}')"

curl -X POST "https://telegram-relay.example.com/telegram/orders" \
  -H "Content-Type: application/json" \
  -H "X-AngelWings-Timestamp: $TS" \
  -H "X-AngelWings-Signature: $SIGNATURE" \
  -d "$BODY"
```

## Безопасность

- Relay не имеет доступа к базе данных магазина.
- Telegram bot token хранится только на немецком сервере.
- Endpoint отправки защищён HMAC-SHA256 подписью `timestamp.body`.
- Для Telegram и почты можно использовать разные HMAC-секреты.
- Старые или повторно отправленные запросы отклоняются по `TELEGRAM_RELAY_SIGNATURE_TOLERANCE_MS`.
- Сервис слушает только `127.0.0.1`, наружу его отдаёт nginx.
