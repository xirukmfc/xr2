# 🚨 СРОЧНОЕ ИСПРАВЛЕНИЕ - Сборка зависла на "Collecting build traces"

## Что делать ПРЯМО СЕЙЧАС на сервере:

### Вариант 1: Остановить зависший деплой и перезапустить
```bash
# Остановить зависший контейнер
docker compose --env-file .env.prod -f docker-compose.prod.yml down

# Удалить зависший образ (если есть)
docker rmi xr2-frontend -f 2>/dev/null || true

# Закоммитить изменения в next.config.mjs (я упростил конфигурацию)
git add prompt-editor/next.config.mjs
git commit -m "Optimize Next.js config for faster build"
git push

# На сервере: подтянуть изменения
git pull

# Пересобрать с новой конфигурацией
make deploy-fast
```

### Вариант 2: Если git pull не работает (есть незакоммиченные изменения)
```bash
# Остановить деплой
docker compose --env-file .env.prod -f docker-compose.prod.yml down

# Удалить зависший образ
docker rmi xr2-frontend -f 2>/dev/null || true

# Вручную обновить next.config.mjs на сервере
nano prompt-editor/next.config.mjs

# Найдите секцию "experimental" (строка ~19) и замените на:
experimental: {
  optimizePackageImports: [
    'lucide-react',
    '@radix-ui/react-dialog',
  ],
  scrollRestoration: true,
},

# Найдите секцию "outputFileTracingExcludes" (строка ~106) и добавьте:
outputFileTracingExcludes: {
  '*': [
    'node_modules/@swc/core-linux-x64-gnu',
    'node_modules/@swc/core-linux-x64-musl',
    'node_modules/@esbuild',
    'node_modules/webpack',
    'node_modules/terser',
  ],
},

# Сохраните (Ctrl+O, Enter, Ctrl+X)

# Пересобрать
make deploy-fast
```

### Вариант 3: Временно отключить standalone (самый быстрый)
```bash
# Остановить деплой
docker compose --env-file .env.prod -f docker-compose.prod.yml down

# Временно закомментировать output: 'standalone'
sed -i "s/output: 'standalone'/\/\/ output: 'standalone'/" prompt-editor/next.config.mjs

# Пересобрать (будет быстрее, но образ больше)
docker compose --env-file .env.prod -f docker-compose.prod.yml build frontend
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d
```

### Вариант 4: Использовать предварительно собранный образ (если вчера работало)
```bash
# Проверить есть ли старый рабочий образ
docker images | grep frontend

# Если есть, использовать его тег
docker tag <старый-образ-id> xr2-frontend:latest

# Запустить без пересборки
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d
```

## Что я изменил (уже в коде):

1. ✅ Упростил `experimental` настройки - убрал лишние оптимизации
2. ✅ Добавил `outputFileTracingExcludes` - пропускает тяжелые зависимости при трейсинге
3. ✅ Упростил webpack splitChunks - меньше чанков = быстрее сборка
4. ✅ Убрал `modularizeImports` для lucide-react

## Если ничего не помогает:

### Собрать локально и загрузить на сервер
```bash
# На локальной машине (Mac)
cd /Users/pavelkuzko/Documents/channeler/xR2
export DOCKER_BUILDKIT=1
docker compose --env-file .env.prod -f docker-compose.prod.yml build frontend

# Сохранить образ
docker save xr2-frontend -o /tmp/xr2-frontend.tar

# Загрузить на сервер
scp /tmp/xr2-frontend.tar root@your-server:/tmp/

# На сервере
docker load -i /tmp/xr2-frontend.tar
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d
```

## Мониторинг

Следите за прогрессом:
```bash
# В отдельном терминале
docker compose --env-file .env.prod -f docker-compose.prod.yml logs -f frontend
```

Ожидаемое время с новыми изменениями: **3-5 минут** вместо зависания.

## Почему это происходит?

`output: 'standalone'` в Next.js анализирует весь граф зависимостей для создания минимального образа.
С Monaco Editor (590MB зависимостей) это может занять 15+ минут или зависнуть.

Мои изменения исключают ненужные файлы из трейсинга и упрощают сборку.
