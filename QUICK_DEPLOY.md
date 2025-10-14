# Quick Deploy Guide

## Простой деплой на сервер за 3 шага

### Вариант 1: Прямой деплой через Git (рекомендуется)

#### На сервере:

```bash
# 1. Клонировать проект
git clone https://github.com/your-repo/xR2.git
cd xR2

# 2. Настроить .env.prod
cp .env.example .env.prod
nano .env.prod  # Измените пароли и секреты

# 3. Запустить
make deploy
```

**Готово!** Приложение доступно на https://xr2.uk

---

### Вариант 2: Копирование файлов с локальной машины

#### С вашего компьютера:

```bash
# 1. Скопировать проект на сервер
rsync -avz --exclude '.git' --exclude 'node_modules' --exclude '.next' \
    ./ root@xr2.uk:/opt/xr2/

# 2. Подключиться к серверу
ssh root@xr2.uk
cd /opt/xr2
```

#### На сервере:

```bash
# 3. Настроить и запустить
cp .env.example .env.prod
nano .env.prod  # Измените пароли
make deploy
```

---

## Основные команды

### После первого деплоя

```bash
# Просмотр логов
docker compose --env-file .env.prod -f docker-compose.prod.yml logs -f

# Проверка статуса
docker compose --env-file .env.prod -f docker-compose.prod.yml ps

# Или используйте make:
make logs
make status
```

### Управление сервисами

```bash
make deploy    # Деплой (первый запуск или обновление)
make up        # Просто запустить (без пересборки)
make down      # Остановить
make restart   # Перезапустить
make rebuild   # Пересобрать образы
make logs      # Смотреть логи
```

### Обновление при изменениях в коде

```bash
# Вариант 1: Через Git
git pull
make deploy

# Вариант 2: Через rsync (если не используете Git)
# На локальной машине:
rsync -avz --exclude '.git' --exclude 'node_modules' \
    ./ root@xr2.uk:/opt/xr2/

# На сервере:
make deploy
```

---

## Что происходит при `make deploy`?

1. Проверяет наличие `.env.prod`
2. Собирает все Docker образы:
   - Backend (FastAPI)
   - Frontend (Next.js) с production URL
   - PostgreSQL + Redis
3. Запускает все сервисы
4. Инициализирует базу данных
5. Показывает статус

---

## Настройка .env.prod

Обязательно измените эти значения:

```env
# Database
POSTGRES_PASSWORD=ваш_надежный_пароль_123

# Redis
REDIS_PASSWORD=ваш_redis_пароль_456

# Security
SECRET_KEY=очень_длинный_секретный_ключ_минимум_32_символа

# Admin
ADMIN_USERNAME=admin
ADMIN_PASSWORD=надежный_админ_пароль_789
ADMIN_EMAIL=admin@xr2.uk

# Domain
CORS_ORIGINS=https://xr2.uk
EXTERNAL_API_BASE_URL=https://xr2.uk
```

---

## SSL Сертификаты (опционально)

### Вариант 1: Let's Encrypt (рекомендуется)

```bash
# Установить certbot
apt install certbot

# Получить сертификат
certbot certonly --standalone -d xr2.uk

# Скопировать в проект
cp /etc/letsencrypt/live/xr2.uk/fullchain.pem nginx/ssl/cert.pem
cp /etc/letsencrypt/live/xr2.uk/privkey.pem nginx/ssl/key.pem

# Перезапустить nginx
docker compose --env-file .env.prod -f docker-compose.prod.yml restart nginx
```

### Вариант 2: Self-signed (для тестирования)

```bash
mkdir -p nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem
```

---

## Проверка работоспособности

```bash
# Проверить здоровье сервисов
make health

# Или вручную:
curl https://xr2.uk/health
curl https://xr2.uk/docs
```

---

## Troubleshooting

### Сервисы не запускаются

```bash
# Посмотреть логи
make logs

# Или конкретного сервиса:
docker compose --env-file .env.prod -f docker-compose.prod.yml logs app
docker compose --env-file .env.prod -f docker-compose.prod.yml logs frontend
```

### Порты заняты

```bash
# Проверить какие порты используются
lsof -i :80
lsof -i :443
lsof -i :8000

# Остановить старые контейнеры
make down
```

### База данных не инициализируется

```bash
# Пересоздать базу
docker compose --env-file .env.prod -f docker-compose.prod.yml down -v
make deploy
```

### Frontend не собирается

```bash
# Очистить кэш и пересобрать
docker compose --env-file .env.prod -f docker-compose.prod.yml build --no-cache frontend
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d frontend
```

---

## Структура проекта для деплоя

```
xR2/
├── docker-compose.prod.yml   # Production конфигурация
├── .env.prod                 # Production переменные окружения
├── Makefile                  # Команды для управления
├── Dockerfile               # Backend образ
├── prompt-editor/
│   └── Dockerfile          # Frontend образ
├── nginx/
│   ├── nginx.conf         # Nginx конфигурация
│   └── ssl/               # SSL сертификаты
└── scripts/               # Скрипты инициализации
```

---

## Минимальные требования сервера

- **OS**: Ubuntu 20.04+ или аналог
- **RAM**: 2GB минимум (4GB рекомендуется)
- **Disk**: 20GB свободного места
- **Ports**: 80, 443, 22 (SSH)
- **Software**: Docker, Docker Compose (установятся автоматически)

---

## Автоматическое обновление

Создайте cron job для автоматических обновлений:

```bash
# Редактировать crontab
crontab -e

# Добавить (обновление каждую ночь в 3:00)
0 3 * * * cd /opt/xr2 && git pull && make deploy >> /var/log/xr2-deploy.log 2>&1
```

---

## Backup

```bash
# Создать backup
make db-backup

# Восстановить из backup
make db-restore
```

---

## Поддержка

Если что-то не работает:
1. Проверьте логи: `make logs`
2. Проверьте статус: `make status`
3. Перезапустите: `make restart`
4. В крайнем случае: `make down && make deploy`
