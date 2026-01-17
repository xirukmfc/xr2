# Конфигурация авторизации через логин/пароль

## Описание

В продакшене по умолчанию отключена форма авторизации через логин/пароль в UI. Пользователи могут авторизоваться только через Google OAuth.

Однако API endpoint `/auth/login` остается доступным для автотестов и других программных доступов.

## Переменная окружения

`NEXT_PUBLIC_ENABLE_PASSWORD_LOGIN` - управляет отображением формы логина/пароля в UI.

- `false` (по умолчанию для продакшена) - форма логина/пароля скрыта, доступна только Google OAuth
- `true` (по умолчанию для локальной разработки) - форма логина/пароля отображается вместе с Google OAuth

## Настройка для продакшена

В файле `.env.prod` на сервере:

```bash
# Скрыть форму логина/пароля (только Google OAuth)
NEXT_PUBLIC_ENABLE_PASSWORD_LOGIN=false
```

## Настройка для локальной разработки

В файле `.env.local` или `.env`:

```bash
# Показать форму логина/пароля (для разработки и тестирования)
NEXT_PUBLIC_ENABLE_PASSWORD_LOGIN=true
```

## Автотесты

Автотесты используют API напрямую через метод `get_api_token()`, который делает запрос к `/internal/auth/login`. 

**Важно:** API endpoint `/auth/login` всегда доступен независимо от значения `NEXT_PUBLIC_ENABLE_PASSWORD_LOGIN`. Эта переменная влияет только на отображение формы в UI.

### Пример использования в автотестах:

```python
# Автотесты используют API напрямую
async def get_api_token(self, username: str = None, password: str = None) -> str:
    async with aiohttp.ClientSession() as session:
        resp = await session.post(
            f"{self.backend_url}/internal/auth/login",
            json={
                "username": username,
                "password": password
            }
        )
        data = await resp.json()
        return data.get("access_token")
```

## Пересборка фронтенда

После изменения `NEXT_PUBLIC_ENABLE_PASSWORD_LOGIN` необходимо пересобрать фронтенд:

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build frontend
```

## Безопасность

- Форма логина/пароля скрыта в UI для обычных пользователей
- API endpoint остается доступным для программного доступа (автотесты, интеграции)
- Для дополнительной защиты можно ограничить доступ к API endpoint через firewall или middleware
