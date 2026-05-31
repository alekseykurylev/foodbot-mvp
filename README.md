## foodbot-mvp

MVP for a food ordering bot: one Next.js app for the Mini App, backend API, Telegram webhook, and MAX webhook.

### Webhooks

Local endpoints:

```text
POST /api/telegram/webhook
POST /api/max/webhook
```

Required env:

```env
TELEGRAM_BOT_TOKEN=
TELEGRAM_WEBHOOK_SECRET=
MAX_BOT_TOKEN=
MAX_WEBHOOK_SECRET=
```

Telegram registration:

```sh
curl "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook?url=https://your-domain.com/api/telegram/webhook&secret_token=$TELEGRAM_WEBHOOK_SECRET"
```

MAX registration:

```sh
curl -X POST "https://platform-api.max.ru/subscriptions" \
  -H "Authorization: $MAX_BOT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-domain.com/api/max/webhook",
    "update_types": ["message_created", "bot_started"],
    "secret": "'"$MAX_WEBHOOK_SECRET"'"
  }'
```

For local testing, expose the Next.js dev server through an HTTPS tunnel and use the tunnel URL in webhook registration.
