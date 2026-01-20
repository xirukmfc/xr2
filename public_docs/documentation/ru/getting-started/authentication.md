# Аутентификация

Все запросы к API xR2 требуют аутентификации с использованием Product API ключа.

## Получение API ключа

1. Войдите в [xr2.uk](https://xr2.uk)
2. Перейдите в раздел [API Keys](https://xr2.uk/api-keys)
3. Нажмите **+ New API Key**
4. Скопируйте ваш **API Key**

Ваш ключ будет выглядеть так: `xr2_prod_xxxxxxxxxxxxxxxx`

## Использование API ключа

### HTTP заголовок

Все API запросы должны включать API ключ в качестве Bearer токена:

```http
Authorization: Bearer xr2_prod_xxxxxxxxxxxxxxxx
```

### Пример запроса

```bash
curl -X GET https://xr2.uk/api/v1/check-api-key \
  -H "Authorization: Bearer xr2_prod_xxxxxxxxxxxxxxxx"
```

### Настройка SDK

**Python:**

```python
from xr2_sdk.client import xR2Client

client = xR2Client(api_key="xr2_prod_xxx")
```

Или используйте переменную окружения:

```python
import os
client = xR2Client(api_key=os.environ["XR2_API_KEY"])
```

**Node.js:**

```typescript
import { XR2Client } from "xr2-sdk";

const client = new XR2Client("xr2_prod_xxx");
```

Или используйте переменную окружения:

```typescript
const client = new XR2Client(process.env.XR2_API_KEY);
```

## Лучшие практики безопасности

> **Важно: Никогда не раскрывайте ваш API ключ в:**
>
> - Клиентском JavaScript коде
> - Публичных репозиториях
> - Лог-файлах
> - Сообщениях об ошибках

### Рекомендуемые практики:

1. **Используйте переменные окружения** — Храните ключи в `.env` файлах (не коммитьте в git)
2. **Регулярно обновляйте ключи** — Периодически генерируйте новые ключи
3. **Используйте разные ключи** — Отдельные ключи для разработки и продакшена
4. **Отслеживайте использование** — Проверяйте дашборд на предмет подозрительной активности

## Проверка ключа

Используйте эндпоинт Check API Key для проверки работоспособности вашего ключа:

```bash
curl -X GET https://xr2.uk/api/v1/check-api-key \
  -H "Authorization: Bearer xr2_prod_xxx"
```

**Ответ:**

```json
{
  "ok": true,
  "user": "your_username"
}
```

## Устранение неполадок

### 401 Unauthorized

- Проверьте правильность ключа (без лишних пробелов)
- Убедитесь, что ключ начинается с `xr2_prod_`
- Проверьте, что ключ активен в вашем дашборде

### 403 Forbidden

- Ключ мог быть отозван
- Проверьте статус вашего аккаунта на [xr2.uk](https://xr2.uk)
