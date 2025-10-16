# 🚀 Исправление проблемы сборки на сервере

## Проблема
Локально через Docker работает, на сервере - зависает. Это **100% проблема ресурсов сервера**.

## ✅ Решение (выполнить на сервере)

### Шаг 1: Загрузить скрипты на сервер
```bash
# На локальной машине
scp prepare-server.sh check-server.sh root@your-server:/opt/xr2/

# На сервере
cd /opt/xr2
chmod +x prepare-server.sh check-server.sh
```

### Шаг 2: Подготовить сервер
```bash
# На сервере
cd /opt/xr2
sudo ./prepare-server.sh
```

Этот скрипт:
- ✅ Остановит все контейнеры
- ✅ Очистит Docker кэш (освободит место)
- ✅ Удалит старые образы
- ✅ Создаст 4GB swap (если нет)
- ✅ Включит BuildKit
- ✅ Перезапустит Docker daemon

### Шаг 3: Деплой
```bash
# На сервере
cd /opt/xr2
export DOCKER_BUILDKIT=1 COMPOSE_DOCKER_CLI_BUILD=1
make deploy-fast
```

---

## 🔧 Альтернатива: Ручные команды (если скрипт не работает)

### 1. Остановить и очистить
```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml down
docker system prune -a -f
docker volume prune -f
```

### 2. Проверить ресурсы
```bash
# RAM (нужно хотя бы 2GB свободных)
free -h

# Диск (нужно хотя бы 5GB свободных)
df -h

# Swap (желательно 2-4GB)
swapon --show
```

### 3. Создать swap (если нет или мало)
```bash
sudo swapoff /swapfile 2>/dev/null
sudo rm /swapfile 2>/dev/null

sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Сделать постоянным
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### 4. Перезагрузить Docker
```bash
sudo systemctl restart docker
sleep 5
```

### 5. Деплой с BuildKit
```bash
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

# Собрать только frontend с прогрессом
docker compose --env-file .env.prod -f docker-compose.prod.yml build --progress=plain frontend

# Если всё прошло успешно - запустить всё
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d
```

---

## 🆘 Если всё ещё зависает

### Вариант 1: Перезагрузить сервер
```bash
sudo reboot
```

После перезагрузки:
```bash
cd /opt/xr2
export DOCKER_BUILDKIT=1 COMPOSE_DOCKER_CLI_BUILD=1
make deploy-fast
```

### Вариант 2: Собрать локально и загрузить на сервер
```bash
# На локальной машине (Mac)
cd /Users/pavelkuzko/Documents/channeler/xR2
export DOCKER_BUILDKIT=1

# Собрать образ
docker compose --env-file .env.prod -f docker-compose.prod.yml build frontend

# Сохранить образ в файл
docker save -o /tmp/frontend.tar xr2-frontend

# Загрузить на сервер
scp /tmp/frontend.tar root@your-server:/tmp/

# На сервере
docker load -i /tmp/frontend.tar
cd /opt/xr2
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d
```

### Вариант 3: Временно отключить standalone
```bash
# На сервере - изменить next.config.mjs
cd /opt/xr2/prompt-editor

# Закомментировать строку
sed -i "s/output: 'standalone'/\/\/ output: 'standalone'/" next.config.mjs

# Деплой (образ будет больше, но соберётся быстрее)
cd /opt/xr2
make deploy-fast
```

---

## 📊 Проверка что помогло

После успешного деплоя:
```bash
# Проверить контейнеры
docker ps

# Проверить логи
docker logs xr2_frontend_prod

# Проверить что работает
curl http://localhost:3000
```

---

## ⚙️ Характеристики сервера (минимальные требования)

Для сборки Next.js с Monaco Editor нужно:
- **RAM:** 2GB+ свободных (лучше 4GB)
- **Swap:** 2GB+ (если RAM меньше 4GB)
- **Диск:** 5GB+ свободных
- **CPU:** 2+ ядра

Проверить на сервере:
```bash
./check-server.sh
```
