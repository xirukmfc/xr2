# Настройка Google OAuth для продакшена

## Шаги настройки

### 1. Создание OAuth 2.0 Client ID в Google Cloud Console

1. Перейдите в [Google Cloud Console](https://console.cloud.google.com/)
2. Выберите ваш проект (или создайте новый)
3. Перейдите в **APIs & Services** → **Credentials**
4. Нажмите **Create Credentials** → **OAuth client ID**
5. Выберите тип приложения: **Web application**
6. Заполните форму:
   - **Name**: xR2 Platform Production
   - **Authorized JavaScript origins** (обязательно!):
     - `https://xr2.uk`
   - **Authorized redirect URIs** (можно оставить пустым или указать):
     - `https://xr2.uk` (для совместимости)
     - `https://xr2.uk/login` (опционально)
     
   **Важно:** Для popup OAuth flow (который используется в проекте) критично указать **Authorized JavaScript origins**. Redirect URIs не используются напрямую, но Google может требовать указать хотя бы один для валидации.
7. Нажмите **Create**
8. Скопируйте **Client ID** и **Client Secret**

### 2. Настройка переменных окружения на продакшен-сервере

Подключитесь к серверу:
```bash
ssh root@<PROD_HOST>
cd /opt/xr2
```

Создайте или отредактируйте файл `.env.prod`:
```bash
nano .env.prod
```

Добавьте следующие переменные (замените на ваши реальные значения):
```bash
# Google OAuth Configuration
GOOGLE_CLIENT_ID=ваш_client_id_из_google_cloud_console
GOOGLE_CLIENT_SECRET=ваш_client_secret_из_google_cloud_console
NEXT_PUBLIC_GOOGLE_CLIENT_ID=ваш_client_id_из_google_cloud_console
```

**Важно:** `GOOGLE_CLIENT_ID` и `NEXT_PUBLIC_GOOGLE_CLIENT_ID` должны быть одинаковыми (это один и тот же Client ID).

### 3. Пересборка и перезапуск фронтенда

После добавления переменных окружения нужно пересобрать фронтенд, чтобы переменная `NEXT_PUBLIC_GOOGLE_CLIENT_ID` была встроена в сборку:

```bash
cd /opt/xr2
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build frontend
```

Или перезапустить все сервисы:
```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build
```

### 4. Проверка работы

1. Откройте https://xr2.uk/login
2. Должна появиться кнопка "Sign in with Google"
3. При нажатии должен открыться Google OAuth popup
4. После авторизации вы должны быть перенаправлены в приложение

### 5. Проверка логов (если что-то не работает)

```bash
# Логи фронтенда
docker logs xr2_frontend_prod --tail 100

# Логи бэкенда
docker logs xr2_app_prod --tail 100
```

## Устранение проблем

### Кнопка "Sign in with Google" не отображается

- Проверьте, что `NEXT_PUBLIC_GOOGLE_CLIENT_ID` установлена в `.env.prod`
- Убедитесь, что фронтенд был пересобран после добавления переменной
- Проверьте логи фронтенда на наличие ошибок

### Ошибка "Invalid client ID" или "Invalid credential"

- Убедитесь, что `GOOGLE_CLIENT_ID` в `.env.prod` совпадает с Client ID из Google Cloud Console
- Проверьте, что в Google Cloud Console добавлен правильный Authorized JavaScript origin: `https://xr2.uk`
- Убедитесь, что бэкенд перезапущен после изменения переменных окружения

### Ошибка "Redirect URI mismatch"

- Проверьте, что в Google Cloud Console добавлен правильный Authorized JavaScript origin: `https://xr2.uk`
- Убедитесь, что используется HTTPS (не HTTP)

## Примечания

- Переменная `NEXT_PUBLIC_GOOGLE_CLIENT_ID` встраивается в сборку фронтенда во время `docker build`, поэтому после изменения этой переменной нужно пересобрать контейнер
- Переменные `GOOGLE_CLIENT_ID` и `GOOGLE_CLIENT_SECRET` используются бэкендом и применяются при перезапуске контейнера без пересборки
- Для безопасности убедитесь, что файл `.env.prod` не попал в git (должен быть в `.gitignore`)
