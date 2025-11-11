# 🚀 Инструкция по развертыванию xR2 Platform в Production

## 📋 Оглавление

1. [Требования к серверу](#требования-к-серверу)
2. [Подготовка сервера](#подготовка-сервера)
3. [Настройка домена и SSL](#настройка-домена-и-ssl)
4. [Настройка конфигурации](#настройка-конфигурации)
5. [Развертывание приложения](#развертывание-приложения)
6. [Проверка работы](#проверка-работы)
7. [Мониторинг и обслуживание](#мониторинг-и-обслуживание)
8. [Резервное копирование](#резервное-копирование)
9. [Troubleshooting](#troubleshooting)

---

## 🖥️ Требования к серверу

### Минимальные требования:
- **CPU**: 2 ядра (рекомендуется 4 ядра)
- **RAM**: 4 GB (рекомендуется 8 GB)
- **Диск**: 20 GB свободного места (рекомендуется 50 GB SSD)
- **ОС**: Ubuntu 20.04/22.04 LTS, Debian 11+, или CentOS 8+
- **Сеть**: Белый IP-адрес, открытые порты 80, 443

### Домен:
- Настроенная A-запись для вашего домена (например, `auth.ps.kz`)
- Доступ к DNS для настройки записей

---

## 🔧 Подготовка сервера

### 1. Подключение к серверу

```bash
ssh root@your-server-ip
# или
ssh user@your-server-ip
```

### 2. Обновление системы

```bash
# Для Ubuntu/Debian
sudo apt update && sudo apt upgrade -y

# Для CentOS/RHEL
sudo yum update -y
```

### 3. Установка необходимых пакетов

```bash
# Для Ubuntu/Debian
sudo apt install -y curl git wget software-properties-common

# Для CentOS/RHEL
sudo yum install -y curl git wget
```

### 4. Установка Docker

```bash
# Скачивание и установка Docker
curl -fsSL https://get.docker.com | sh

# Запуск Docker
sudo systemctl enable docker
sudo systemctl start docker

# Проверка установки
docker --version
```

### 5. Установка Docker Compose

```bash
# Установка Docker Compose v2 (встроенный)
docker compose version

# Если нужна отдельная установка Docker Compose v1:
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
docker-compose --version
```

### 6. Настройка Swap (если нет)

Swap необходим для предотвращения ошибок нехватки памяти при сборке frontend:

```bash
# Проверка наличия swap
sudo swapon --show

# Если swap отсутствует, создаем 4GB swap
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Добавляем в /etc/fstab для автозагрузки
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Проверка
free -h
```

### 7. Настройка firewall (опционально, но рекомендуется)

```bash
# Для Ubuntu/Debian с ufw
sudo ufw allow 22/tcp     # SSH
sudo ufw allow 80/tcp     # HTTP
sudo ufw allow 443/tcp    # HTTPS
sudo ufw enable
sudo ufw status

# Для CentOS/RHEL с firewalld
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

---

## 🌐 Настройка домена и SSL

### 1. Настройка DNS

В панели управления вашего регистратора доменов (например, для `auth.ps.kz`):

1. Создайте **A-запись**:
   - **Имя**: `auth` (или `@` для корневого домена)
   - **Тип**: A
   - **Значение**: IP-адрес вашего сервера
   - **TTL**: 300 (или по умолчанию)

2. Дождитесь распространения DNS (может занять до 24 часов, обычно 5-30 минут)

Проверка:
```bash
# Проверка распространения DNS
nslookup auth.ps.kz
# или
dig auth.ps.kz
```

### 2. Установка Certbot для SSL (Let's Encrypt)

```bash
# Для Ubuntu/Debian
sudo apt install -y certbot python3-certbot-nginx

# Для CentOS/RHEL
sudo yum install -y certbot python3-certbot-nginx
```

### 3. Установка системного Nginx (временно для получения сертификата)

```bash
# Устанавливаем nginx на хост-систему
sudo apt install -y nginx  # Ubuntu/Debian
# или
sudo yum install -y nginx  # CentOS/RHEL

# Запускаем nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 4. Получение SSL сертификата

```bash
# Получаем сертификат для вашего домена
sudo certbot --nginx -d auth.ps.kz

# Или если хотите использовать www поддомен тоже:
sudo certbot --nginx -d auth.ps.kz -d www.auth.ps.kz

# Следуйте инструкциям:
# - Введите email для уведомлений
# - Согласитесь с условиями использования
# - Выберите опцию перенаправления HTTP на HTTPS (рекомендуется)
```

### 5. Копирование сертификатов в проект

```bash
# Создаем директорию для SSL сертификатов в проекте
mkdir -p /opt/xr2/nginx/ssl

# Копируем сертификаты
sudo cp /etc/letsencrypt/live/auth.ps.kz/fullchain.pem /opt/xr2/nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/auth.ps.kz/privkey.pem /opt/xr2/nginx/ssl/key.pem

# Устанавливаем правильные права
sudo chmod 644 /opt/xr2/nginx/ssl/cert.pem
sudo chmod 600 /opt/xr2/nginx/ssl/key.pem
```

### 6. Остановка системного Nginx

После получения сертификатов останавливаем системный nginx, так как будем использовать контейнерный:

```bash
sudo systemctl stop nginx
sudo systemctl disable nginx
```

### 7. Автоматическое обновление сертификатов

```bash
# Настраиваем автоматическое обновление
sudo certbot renew --dry-run

# Создаем скрипт для обновления сертификатов в проекте
sudo nano /etc/letsencrypt/renewal-hooks/deploy/copy-certs.sh
```

Добавьте в файл:
```bash
#!/bin/bash
cp /etc/letsencrypt/live/auth.ps.kz/fullchain.pem /opt/xr2/nginx/ssl/cert.pem
cp /etc/letsencrypt/live/auth.ps.kz/privkey.pem /opt/xr2/nginx/ssl/key.pem
chmod 644 /opt/xr2/nginx/ssl/cert.pem
chmod 600 /opt/xr2/nginx/ssl/key.pem
cd /opt/xr2 && docker compose --env-file .env.prod -f docker-compose.prod.yml restart nginx
```

Сделайте скрипт исполняемым:
```bash
sudo chmod +x /etc/letsencrypt/renewal-hooks/deploy/copy-certs.sh
```

---

## ⚙️ Настройка конфигурации

### 1. Клонирование проекта

```bash
# Создаем директорию для проекта
sudo mkdir -p /opt/xr2
cd /opt/xr2

# Клонируем репозиторий (замените на ваш репозиторий)
git clone <your-repository-url> .

# Или копируем файлы с локальной машины через rsync:
# rsync -avz --progress /path/to/local/xR2/ root@your-server:/opt/xr2/
```

### 2. Создание файла .env.prod

```bash
cd /opt/xr2
cp env.example .env.prod
nano .env.prod
```

### 3. Настройка .env.prod

Обязательно измените следующие параметры:

```env
# Database Configuration
POSTGRES_PASSWORD=ваш_сильный_пароль_для_postgres_минимум_32_символа
DATABASE_URL=postgresql://xr2_user:ваш_сильный_пароль_для_postgres@postgres:5432/xr2_db

# Redis Configuration
REDIS_PASSWORD=ваш_сильный_пароль_для_redis_минимум_32_символа
REDIS_URL=redis://:ваш_сильный_пароль_для_redis@redis:6379/0

# Security Configuration
SECRET_KEY=ваш_секретный_ключ_минимум_64_случайных_символа_для_jwt_токенов
ADMIN_USERNAME=ваш_админ_логин
ADMIN_PASSWORD=ваш_сильный_пароль_для_админа_минимум_32_символа
ADMIN_EMAIL=admin@auth.ps.kz

# API Security & Rate Limiting
RATE_LIMIT_PER_MINUTE=60
RATE_LIMIT_BURST=100
MAX_REQUESTS_PER_IP_PER_MINUTE=100
MAX_REQUESTS_PER_API_KEY_PER_MINUTE=1000

# Environment
ENVIRONMENT=production
DEBUG=false

# CORS Configuration
CORS_ORIGINS=https://auth.ps.kz,https://www.ps.kz

# SSL Configuration
SSL_CERT_PATH=/etc/nginx/ssl/cert.pem
SSL_KEY_PATH=/etc/nginx/ssl/key.pem

# Logging
LOG_LEVEL=INFO
LOG_FILE_PATH=/app/logs/app.log
```

**Генерация безопасных паролей:**

```bash
# Генерация случайного пароля (32 символа)
openssl rand -base64 32

# Генерация секретного ключа (64 символа)
openssl rand -hex 64
```

### 4. Настройка Nginx для вашего домена

Создайте конфигурацию для production:

```bash
cp nginx/nginx.conf nginx/nginx.prod.conf
nano nginx/nginx.prod.conf
```

Измените `server_name` на ваш домен:

```nginx
server {
    listen 80;
    server_name auth.ps.kz;  # Измените на ваш домен

    # Перенаправление на HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name auth.ps.kz;  # Измените на ваш домен

    # SSL конфигурация
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    # SSL настройки безопасности
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_session_tickets off;

    # Остальная конфигурация из nginx.conf...
}
```

### 5. Настройка API URL для фронтенда

Отредактируйте `docker-compose.prod.yml`:

```bash
nano docker-compose.prod.yml
```

Найдите секцию `frontend` и измените `NEXT_PUBLIC_API_URL`:

```yaml
frontend:
  build:
    context: ./prompt-editor
    dockerfile: Dockerfile
    args:
      NEXT_PUBLIC_API_URL: https://auth.ps.kz/internal  # Измените на ваш домен
```

---

## 🚀 Развертывание приложения

### Способ 1: Автоматическое развертывание (рекомендуется)

```bash
cd /opt/xr2

# Подготовка сервера (очистка кэша, настройка swap)
./prepare-server.sh

# Быстрое развертывание с оптимизациями
export DOCKER_BUILDKIT=1 COMPOSE_DOCKER_CLI_BUILD=1
make deploy-fast
```

### Способ 2: Ручное развертывание

```bash
cd /opt/xr2

# 1. Подготовка
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

# 2. Остановка старых контейнеров (если есть)
docker compose --env-file .env.prod -f docker-compose.prod.yml down

# 3. Очистка старых образов
docker system prune -f

# 4. Сборка образов
docker compose --env-file .env.prod -f docker-compose.prod.yml build --no-cache

# 5. Запуск сервисов
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d

# 6. Проверка статуса
docker compose --env-file .env.prod -f docker-compose.prod.yml ps
```

### Способ 3: Развертывание с локальной машины

```bash
# На вашей локальной машине в директории проекта:
./deploy-to-server.sh root@your-server-ip /opt/xr2
```

---

## ✅ Проверка работы

### 1. Проверка статуса контейнеров

```bash
cd /opt/xr2
docker compose --env-file .env.prod -f docker-compose.prod.yml ps

# Все контейнеры должны быть в статусе "Up" или "healthy"
```

### 2. Проверка логов

```bash
# Все логи
docker compose --env-file .env.prod -f docker-compose.prod.yml logs -f

# Логи конкретного сервиса
docker compose --env-file .env.prod -f docker-compose.prod.yml logs -f app
docker compose --env-file .env.prod -f docker-compose.prod.yml logs -f frontend
docker compose --env-file .env.prod -f docker-compose.prod.yml logs -f nginx
docker compose --env-file .env.prod -f docker-compose.prod.yml logs -f postgres
```

### 3. Проверка здоровья сервисов

```bash
# Health check
curl http://localhost/health
# Должен вернуть: healthy

# API health
curl http://localhost:8000/health
# Должен вернуть: {"status":"ok"}

# Проверка базы данных
docker exec xr2_postgres_prod pg_isready -U xr2_user
# Должен вернуть: postgres:5432 - accepting connections

# Проверка Redis
docker exec xr2_redis_prod redis-cli ping
# Должен вернуть: PONG
```

### 4. Проверка доступности сервисов через браузер

Откройте в браузере:

- **Главная страница**: https://auth.ps.kz
- **API документация**: https://auth.ps.kz/docs
- **Admin панель**: https://auth.ps.kz/admin
- **Admin API документация**: https://auth.ps.kz/admin-docs

### 5. Тестовый вход в админку

1. Перейдите на https://auth.ps.kz/admin
2. Войдите с учетными данными из `.env.prod`:
   - **Username**: значение `ADMIN_USERNAME`
   - **Password**: значение `ADMIN_PASSWORD`

---

## 📊 Мониторинг и обслуживание

### 1. Просмотр логов

```bash
# Все логи (в реальном времени)
make logs

# Логи приложения
make logs-app

# Логи nginx
make logs-nginx

# Логи базы данных
make logs-db

# Логи frontend
make logs-frontend
```

### 2. Статус сервисов

```bash
make status
```

### 3. Перезапуск сервисов

```bash
# Перезапуск всех сервисов
make restart

# Перезапуск конкретного сервиса
docker compose --env-file .env.prod -f docker-compose.prod.yml restart app
docker compose --env-file .env.prod -f docker-compose.prod.yml restart frontend
docker compose --env-file .env.prod -f docker-compose.prod.yml restart nginx
```

### 4. Обновление приложения

```bash
cd /opt/xr2

# Получить последние изменения
git pull

# Пересобрать и перезапустить
make rebuild
make up
```

### 5. Мониторинг ресурсов

```bash
# Использование ресурсов контейнерами
docker stats

# Использование диска
df -h
docker system df

# Память
free -h

# CPU и процессы
htop
# или
top
```

### 6. Логирование

Логи приложения сохраняются в `/opt/xr2/logs/`:

```bash
# Просмотр логов приложения
tail -f /opt/xr2/logs/app.log

# Логи nginx
docker compose --env-file .env.prod -f docker-compose.prod.yml logs nginx

# Логи базы данных
docker compose --env-file .env.prod -f docker-compose.prod.yml logs postgres
```

---

## 💾 Резервное копирование

### 1. Создание бэкапа базы данных

```bash
cd /opt/xr2

# Автоматическое создание бэкапа
make db-backup

# Бэкап сохраняется в backups/backup_YYYYMMDD_HHMMSS.sql
```

### 2. Восстановление из бэкапа

```bash
cd /opt/xr2

# Восстановить из последнего бэкапа
make db-restore

# Или восстановить из конкретного файла
docker exec -i xr2_postgres_prod psql -U xr2_user xr2_db < backups/backup_20240101_120000.sql
```

### 3. Настройка автоматического бэкапа

Создайте cron job для регулярных бэкапов:

```bash
# Открыть crontab
crontab -e

# Добавить задачу (бэкап каждый день в 2:00 ночи)
0 2 * * * cd /opt/xr2 && make db-backup >> /var/log/xr2-backup.log 2>&1

# Сохранить и выйти
```

### 4. Бэкап всей директории проекта

```bash
# Создать архив
tar -czf xr2-backup-$(date +%Y%m%d).tar.gz /opt/xr2 --exclude=/opt/xr2/logs --exclude=/opt/xr2/.git

# Или использовать rsync для копирования на другой сервер
rsync -avz /opt/xr2/ backup-server:/backups/xr2/
```

---

## 🛠️ Troubleshooting

### Проблема 1: Контейнер постоянно перезапускается

**Проверка:**
```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml ps
docker compose --env-file .env.prod -f docker-compose.prod.yml logs <service-name>
```

**Решение:**
- Проверьте логи контейнера
- Убедитесь, что все переменные окружения правильно установлены в `.env.prod`
- Проверьте, что база данных запущена и доступна

### Проблема 2: Ошибка "Out of memory" при сборке frontend

**Решение:**
```bash
# Увеличить swap
sudo swapoff /swapfile
sudo fallocate -l 8G /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Или использовать скрипт подготовки
./prepare-server.sh

# Использовать оптимизированную сборку
make deploy-fast
```

### Проблема 3: SSL сертификат не работает

**Проверка:**
```bash
# Проверить наличие сертификатов
ls -la /opt/xr2/nginx/ssl/

# Проверить конфигурацию nginx
docker compose --env-file .env.prod -f docker-compose.prod.yml exec nginx nginx -t
```

**Решение:**
```bash
# Переполучить сертификат
sudo certbot --nginx -d auth.ps.kz --force-renewal

# Скопировать сертификаты
sudo cp /etc/letsencrypt/live/auth.ps.kz/fullchain.pem /opt/xr2/nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/auth.ps.kz/privkey.pem /opt/xr2/nginx/ssl/key.pem

# Перезапустить nginx
docker compose --env-file .env.prod -f docker-compose.prod.yml restart nginx
```

### Проблема 4: База данных недоступна

**Проверка:**
```bash
# Проверить статус
docker compose --env-file .env.prod -f docker-compose.prod.yml ps postgres

# Проверить логи
docker compose --env-file .env.prod -f docker-compose.prod.yml logs postgres

# Проверить соединение
docker exec xr2_postgres_prod pg_isready -U xr2_user
```

**Решение:**
```bash
# Перезапустить базу данных
docker compose --env-file .env.prod -f docker-compose.prod.yml restart postgres

# Если не помогло, пересоздать контейнер
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --force-recreate postgres
```

### Проблема 5: Недостаточно места на диске

**Проверка:**
```bash
df -h
docker system df
```

**Решение:**
```bash
# Очистить неиспользуемые Docker ресурсы
docker system prune -a --volumes

# Удалить старые логи
sudo truncate -s 0 /opt/xr2/logs/*.log

# Удалить старые бэкапы (оставить последние 7)
cd /opt/xr2/backups
ls -t | tail -n +8 | xargs rm -f
```

### Проблема 6: 502 Bad Gateway

**Возможные причины:**
- Backend не запущен или недоступен
- Nginx не может подключиться к backend

**Решение:**
```bash
# Проверить статус backend
docker compose --env-file .env.prod -f docker-compose.prod.yml ps app

# Проверить логи backend
docker compose --env-file .env.prod -f docker-compose.prod.yml logs app

# Перезапустить backend и nginx
docker compose --env-file .env.prod -f docker-compose.prod.yml restart app nginx
```

### Проблема 7: CORS ошибки

**Решение:**
```bash
# Проверить CORS_ORIGINS в .env.prod
nano .env.prod

# Убедитесь что указаны правильные домены:
CORS_ORIGINS=https://auth.ps.kz,https://www.ps.kz

# Перезапустить приложение
docker compose --env-file .env.prod -f docker-compose.prod.yml restart app
```

---

## 📞 Поддержка

При возникновении проблем:

1. **Проверьте логи**: `make logs` или `make logs-app`
2. **Проверьте статус**: `make status`
3. **Проверьте здоровье**: `make health`
4. **Проверьте конфигурацию**: убедитесь, что `.env.prod` правильно настроен
5. **Проверьте ресурсы**: `docker stats`, `free -h`, `df -h`

---

## 📝 Чек-лист развертывания

- [ ] Сервер соответствует минимальным требованиям
- [ ] Установлен Docker и Docker Compose
- [ ] Настроен swap (минимум 4GB)
- [ ] Настроены DNS записи для домена
- [ ] Получен SSL сертификат
- [ ] Создан и настроен `.env.prod` с безопасными паролями
- [ ] Настроен `nginx.prod.conf` с вашим доменом
- [ ] Настроен `docker-compose.prod.yml` с правильным API URL
- [ ] Развернуто приложение
- [ ] Все контейнеры запущены и здоровы
- [ ] Сайт доступен по HTTPS
- [ ] Вход в админку работает
- [ ] Настроено автоматическое обновление SSL
- [ ] Настроено автоматическое резервное копирование
- [ ] Настроен мониторинг

---

## 🎉 Готово!

Ваше приложение xR2 Platform успешно развернуто на production сервере!

**Доступ:**
- 🌐 Главная: https://auth.ps.kz
- 📚 API Docs: https://auth.ps.kz/docs
- 🔐 Admin: https://auth.ps.kz/admin

**Не забудьте:**
- Сменить все пароли по умолчанию
- Настроить регулярные бэкапы
- Настроить мониторинг
- Обновлять SSL сертификаты

---

**Создано**: $(date +%Y-%m-%d)
**Версия**: 1.0.0
