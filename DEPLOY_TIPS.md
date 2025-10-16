# 🚀 Советы по ускорению деплоя Frontend

## Проблема
Frontend с Monaco Editor и тяжелыми зависимостями (~590MB) долго собирается в Docker (15+ минут).

## ✅ Что мы исправили

### 1. Оптимизирован Dockerfile
- ✅ Увеличен memory limit для Node.js: `NODE_OPTIONS="--max-old-space-size=4096"`
- ✅ Добавлены таймауты для pnpm: `network-timeout 600000`
- ✅ Использование `corepack` вместо глобальной установки pnpm
- ✅ Добавлен `--prefer-offline` для ускорения установки зависимостей

### 2. Оптимизирован docker-compose.prod.yml
- ✅ Увеличены лимиты памяти: 4GB max, 2GB reserved
- ✅ Увеличен shared memory: `shm_size: 2gb`
- ✅ Включен BuildKit cache: `BUILDKIT_INLINE_CACHE: 1`
- ✅ Увеличен `start_period` healthcheck до 60s

## 🎯 Как использовать

### Вариант 1: Быстрый деплой (рекомендуется)
```bash
./deploy-optimized.sh
```

### Вариант 2: Ручной деплой с мониторингом
```bash
# Включить BuildKit
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

# Собрать только frontend с выводом прогресса
docker compose --env-file .env.prod -f docker-compose.prod.yml build --progress=plain frontend

# Запустить все сервисы
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d
```

### Вариант 3: Пересобрать без кэша (если есть проблемы)
```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml build --no-cache frontend
```

## 📊 Мониторинг сборки

### Просмотр логов frontend в реальном времени
```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml logs -f frontend
```

### Проверка использования ресурсов
```bash
docker stats xr2_frontend_prod
```

### Проверка статуса сборки
```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml ps
```

## ⚡ Дополнительные оптимизации

### На сервере с ограниченными ресурсами:

1. **Собрать локально и загрузить на сервер:**
```bash
# На локальной машине
docker compose --env-file .env.prod -f docker-compose.prod.yml build frontend
docker save -o frontend-image.tar xr2-frontend_prod
scp frontend-image.tar your-server:/path/

# На сервере
docker load -i frontend-image.tar
```

2. **Увеличить swap на сервере** (если мало RAM):
```bash
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

3. **Освободить место в Docker:**
```bash
docker system prune -a --volumes
```

## 🐛 Решение проблем

### Если сборка зависает на "pnpm install"
- Проверьте интернет-соединение на сервере
- Увеличьте timeout: `pnpm config set network-timeout 900000`
- Попробуйте использовать другое зеркало: `pnpm config set registry https://registry.npmjs.org/`

### Если сборка падает с "out of memory"
- Увеличьте лимиты в docker-compose.prod.yml (memory: 6G)
- Добавьте swap на сервере
- Уменьшите количество параллельных build workers в next.config.mjs

### Если сборка успешна, но контейнер не стартует
- Проверьте логи: `docker logs xr2_frontend_prod`
- Проверьте healthcheck: `docker inspect xr2_frontend_prod | grep -A 10 Health`

## 📈 Ожидаемое время сборки

- **С кэшем:** 3-5 минут
- **Без кэша (первая сборка):** 8-12 минут
- **С медленным интернетом:** до 15 минут

## 💡 Важно

- После первой успешной сборки последующие будут быстрее благодаря кэшу
- BuildKit значительно ускоряет сборку
- Убедитесь, что на сервере достаточно свободного места (минимум 5GB)
