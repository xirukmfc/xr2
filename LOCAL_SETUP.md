# Локальная настройка xR2 Platform

## Быстрый старт

1. **Скопируйте файл с локальными настройками:**
   ```bash
   cp env.local.example .env
   ```

2. **Отредактируйте файл `.env` под ваши локальные настройки:**
   - Измените `SECRET_KEY` на уникальный ключ (минимум 32 символа)
   - Настройте `DATABASE_URL` для вашей локальной PostgreSQL
   - Добавьте ваши API ключи (Google OAuth, Anthropic и т.д.)

3. **Запустите проект локально:**
   ```bash
   ./start.sh
   ```

## Настройка базы данных

### PostgreSQL
```bash
# Создайте базу данных
createdb xr2_local

# Или через psql
psql -U postgres -c "CREATE DATABASE xr2_local;"
```

### Redis (опционально)
```bash
# Запустите Redis локально
redis-server
```

## Настройка OAuth (Google)

1. Перейдите в [Google Cloud Console](https://console.cloud.google.com/)
2. Создайте новый проект или выберите существующий
3. Включите Google+ API
4. Создайте OAuth 2.0 credentials
5. Добавьте в разрешенные URI:
   - `http://localhost:8000/auth/google/callback`
   - `http://localhost:3000/auth/google/callback`

## Структура проекта

- **Backend**: FastAPI на порту 8000
- **Frontend**: Next.js на порту 3000
- **Admin Panel**: http://localhost:8000/admin
- **API Docs**: http://localhost:8000/docs

## Полезные команды

```bash
# Запуск только backend
python main.py

# Запуск только frontend
cd prompt-editor && pnpm dev

# Миграции базы данных
alembic upgrade head

# Создание новой миграции
alembic revision --autogenerate -m "Description"
```

## Устранение проблем

### Ошибка подключения к базе данных
- Проверьте, что PostgreSQL запущен
- Убедитесь, что база данных `xr2_local` существует
- Проверьте правильность `DATABASE_URL` в `.env`

### Ошибки в админке
- Убедитесь, что в базе есть пользователь с правами администратора
- Проверьте, что все зависимости установлены: `pip install -r requirements.txt`

### Проблемы с Docker
- Используйте локальный запуск через `./start.sh` для разработки
- Docker предназначен для production развертывания
