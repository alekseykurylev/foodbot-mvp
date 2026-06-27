## foodbot-mvp

MVP бота для заказа еды: одно Next.js-приложение для Mini App, backend API, Telegram webhook и MAX webhook.

### Вебхуки

Локальные endpoints:

```text
POST /api/telegram/webhook
POST /api/max/webhook
```

Обязательные переменные окружения:

```env
TELEGRAM_BOT_TOKEN=
TELEGRAM_WEBHOOK_SECRET=
MAX_BOT_TOKEN=
MAX_BOT_NAME=
MAX_WEBHOOK_SECRET=
```

Регистрация Telegram webhook:

```sh
curl "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook?url=https://your-domain.com/api/telegram/webhook&secret_token=$TELEGRAM_WEBHOOK_SECRET"
```

Регистрация MAX webhook:

```sh
curl -X POST "https://platform-api2.max.ru/subscriptions" \
  -H "Authorization: {access_token}" \
  -H "Content-Type: application/json" \
  -d '{
  "url": "https://your-domain.com/webhook",
  "update_types": ["message_created", "bot_started"],
  "secret": "your_secret"
}'
```

Сертификаты Минцифры
https://www.sberbank.ru/ru/person/kibrary/materialy-po-temam/sertifikaty-tls