# xR2 Platform - Docker Deployment Guide

## 🚀 Быстрый старт

### 1. Клонирование и подготовка
```bash
git clone <your-repo>
cd xR2
cp env.example .env
# Отредактируйте .env файл с вашими настройками
```

### 2. Запуск через Makefile
```bash
# Сборка и запуск всех сервисов
make dev

# Или пошагово:
make build
make up
```

### 3. Проверка статуса
```bash
make status
make health
```

## 📋 Доступные команды Makefile

| Команда | Описание |
|---------|----------|
| `make help` | Показать справку |
| `make build` | Собрать Docker образы |
| `make up` | Запустить все сервисы |
| `make down` | Остановить все сервисы |
| `make restart` | Перезапустить сервисы |
| `make logs` | Показать логи всех сервисов |
| `make logs-app` | Показать логи приложения |
| `make status` | Показать статус сервисов |
| `make health` | Проверить здоровье сервисов |
| `make clean` | Очистить все ресурсы |
| `make backup-db` | Создать бэкап БД |
| `make monitor` | Показать использование ресурсов |

## 🔧 Конфигурация

### Переменные окружения (.env файл)

**ВАЖНО**: Измените все пароли перед развертыванием в production!

```bash
# Database
POSTGRES_PASSWORD=your_secure_password
DATABASE_URL=postgresql://xr2_user:password@postgres:5432/xr2_db

# Redis
REDIS_PASSWORD=your_redis_password
REDIS_URL=redis://:password@redis:6379/0

# Security
SECRET_KEY=your_super_secret_key_minimum_32_chars
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_admin_password

# Rate Limiting
RATE_LIMIT_PER_MINUTE=60
MAX_REQUESTS_PER_IP_PER_MINUTE=100
MAX_REQUESTS_PER_API_KEY_PER_MINUTE=1000

# Environment
ENVIRONMENT=production
DEBUG=false
```

## 🛡️ Безопасность

### Встроенная защита от атак:

1. **Rate Limiting** - ограничение запросов по IP и API ключам
2. **DDoS Protection** - блокировка подозрительных IP
3. **Request Filtering** - фильтрация подозрительных запросов
4. **Security Headers** - защитные HTTP заголовки
5. **Nginx Protection** - дополнительная защита на уровне прокси

### Настройки безопасности:

- **API Rate Limit**: 60 запросов/минуту по умолчанию
- **IP Block Duration**: 5 минут при превышении лимитов
- **Suspicious Request Detection**: автоматическая блокировка
- **Bot Protection**: блокировка известных ботов и сканеров

## 📊 Мониторинг

### Доступные сервисы:

- **Приложение**: http://localhost
- **API Docs**: http://localhost/docs
- **Admin Panel**: http://localhost/admin
- **Admin Docs**: http://localhost/admin-docs

### Метрики мониторинга:

- HTTP запросы и ответы
- Использование ресурсов
- Статус базы данных
- Redis производительность
- Nginx статистика

## 🗄️ База данных

### Бэкап и восстановление:

```bash
# Создание бэкапа
make backup-db

# Восстановление из бэкапа
make restore-db BACKUP_FILE=backup_20241209_143022.sql
```

### Подключение к БД:

```bash
# Через Docker
make db-shell

# Прямое подключение
psql -h localhost -p 5432 -U xr2_user -d xR2_db
```

## 🔄 Обновление

### Обновление сервисов:

```bash
# Обновить и перезапустить
make update

# Или полная пересборка
make clean
make build
make up
```

## 🐛 Отладка

### Просмотр логов:

```bash
# Все сервисы
make logs

# Конкретный сервис
make logs-app
make logs-nginx
make logs-db
```

### Подключение к контейнерам:

```bash
# Приложение
make shell

# База данных
make db-shell
```

## 📈 Production развертывание

### 1. Подготовка сервера:

```bash
# Установка Docker и Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Установка Make (если не установлен)
sudo apt-get install make
```

### 2. Настройка SSL:

```bash
# Создание SSL сертификатов
mkdir -p nginx/ssl
# Поместите ваши сертификаты в nginx/ssl/
```

### 3. Развертывание:

```bash
# Production развертывание
make deploy-prod
```

### 4. Настройка файрвола:

```bash
# Разрешить только необходимые порты
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 22
sudo ufw enable
```

## 🔧 Troubleshooting

### Частые проблемы:

1. **Порт уже используется**:
   ```bash
   sudo lsof -i :8000
   sudo kill -9 <PID>
   ```

2. **Проблемы с правами**:
   ```bash
   sudo chown -R $USER:$USER .
   ```

3. **Очистка Docker**:
   ```bash
   make clean
   docker system prune -a
   ```

### Проверка здоровья:

```bash
# Проверка всех сервисов
make health

# Проверка конкретного сервиса
curl http://localhost/health
curl http://localhost/internal/health
```

## 📞 Поддержка

При возникновении проблем:

1. Проверьте логи: `make logs`
2. Проверьте статус: `make status`
3. Проверьте здоровье: `make health`
4. Очистите и пересоберите: `make clean && make build && make up`

---

**Удачного развертывания! 🚀**
