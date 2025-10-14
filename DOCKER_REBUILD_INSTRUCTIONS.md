# Инструкции по пересборке Docker образов

## Проблема
Docker использует кешированные образы, поэтому исправления в коде не применяются автоматически.

## Решение

### 1. Остановите текущие контейнеры
```bash
make down
# или
docker-compose down
```

### 2. Удалите старые образы (принудительная пересборка)
```bash
# Удалите все образы проекта
docker-compose down --rmi all

# Или удалите конкретные образы
docker rmi xr2_backend xr2_frontend xr2_postgres xr2_redis
```

### 3. Пересоберите образы без кеша
```bash
# Полная пересборка без кеша
docker-compose build --no-cache

# Или используйте Makefile
make build
```

### 4. Запустите проект заново
```bash
make up
# или
docker-compose up -d
```

## Альтернативный способ (более быстрый)

Если хотите пересобрать только backend:

```bash
# Остановите только backend
docker-compose stop backend

# Пересоберите только backend
docker-compose build --no-cache backend

# Запустите заново
docker-compose up -d backend
```

## Проверка

После пересборки проверьте:
1. Логи: `docker-compose logs backend`
2. Админку: http://localhost:8000/admin/tag/list
3. API логи: http://localhost:8000/admin/product-api-log/list

Все страницы должны загружаться без ошибок 500.

## Примечание

Если проблемы продолжаются, проверьте:
- Версию SQLAdmin в requirements.txt (должна быть 0.21.0)
- Что все изменения применились в файле `app/admin/sqladmin_config.py`
