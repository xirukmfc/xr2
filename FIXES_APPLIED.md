# ✅ Исправления применены

## 1. Исправлена команда `make status`

**Проблема:** Команда показывала что сервисы не запущены, хотя они работали.

**Решение:** Убран флаг `-p xr2-platform` из production команды в `Makefile:76`.

**Проверка:**
```bash
make status
```

---

## 2. Добавлена авторизация для /admin-docs/

**Проблема:** https://xr2.uk/admin-docs/ был доступен всем без авторизации.

**Решение:** Добавлена HTTP Basic Authentication в nginx.

### Файлы изменены:
- ✅ `nginx/nginx.prod.conf` - добавлен `auth_basic` для `/admin-docs` (строка 185-186)
- ✅ `docker-compose.prod.yml` - добавлен volume для `.htpasswd` (строка 181)
- ✅ `scripts/generate-htpasswd.sh` - скрипт для генерации файла паролей
- ✅ `Makefile` - добавлена команда `make setup-admin-auth` (строка 124)
- ✅ `.gitignore` - добавлен `.htpasswd` чтобы не коммитить пароли

---

## 🚀 Применение изменений на сервере

### Вариант 1: Автоматически через git (рекомендуется)

На локальной машине:
```bash
cd /Users/pavelkuzko/Documents/channeler/xR2

# Закоммитить и запушить изменения
git add .
git commit -m "Fix make status and add auth to admin-docs"
git push
```

На сервере:
```bash
cd /opt/xr2

# Подтянуть изменения
git pull

# Настроить авторизацию (создаст .htpasswd из ADMIN_USERNAME и ADMIN_PASSWORD в .env.prod)
make setup-admin-auth

# Готово! Nginx автоматически перезапустится
```

### Вариант 2: Ручное копирование файлов

Если git не настроен на сервере, скопируйте файлы:

```bash
# На локальной машине
scp Makefile root@your-server:/opt/xr2/
scp nginx/nginx.prod.conf root@your-server:/opt/xr2/nginx/
scp docker-compose.prod.yml root@your-server:/opt/xr2/
scp scripts/generate-htpasswd.sh root@your-server:/opt/xr2/scripts/
scp .gitignore root@your-server:/opt/xr2/

# На сервере
cd /opt/xr2
chmod +x scripts/generate-htpasswd.sh
make setup-admin-auth
```

### Вариант 3: Ручная настройка на сервере

Если скрипт не работает:

```bash
# На сервере
cd /opt/xr2

# Убедитесь что .env.prod содержит ADMIN_USERNAME и ADMIN_PASSWORD
cat .env.prod | grep ADMIN

# Создать .htpasswd вручную (замените admin и password на свои)
sudo apt-get install apache2-utils -y  # если нет htpasswd
htpasswd -c nginx/.htpasswd admin
# Введите пароль когда попросит

# Или используя openssl:
echo "admin:$(openssl passwd -apr1 'your_password')" > nginx/.htpasswd

# Перезапустить nginx
docker compose --env-file .env.prod -f docker-compose.prod.yml restart nginx
```

---

## 🧪 Проверка

### 1. Проверить make status
```bash
make status
```
Должно показать список запущенных production сервисов.

### 2. Проверить авторизацию admin-docs
```bash
# Без авторизации - должно вернуть 401
curl -I https://xr2.uk/admin-docs/

# С авторизацией - должно вернуть 200
curl -I -u admin:password https://xr2.uk/admin-docs/
```

Или откройте в браузере: https://xr2.uk/admin-docs/
Должно появиться окно ввода логина и пароля.

### 3. Проверить что .htpasswd создан
```bash
ls -la nginx/.htpasswd
cat nginx/.htpasswd
```

---

## 📝 Важные заметки

1. **Файл .htpasswd не должен коммититься в git** - он добавлен в `.gitignore`

2. **При изменении ADMIN_PASSWORD** в `.env.prod`, запустите:
   ```bash
   make setup-admin-auth
   ```

3. **Логин и пароль берутся из .env.prod:**
   - `ADMIN_USERNAME` - логин (по умолчанию: admin)
   - `ADMIN_PASSWORD` - пароль (по умолчанию: ***REMOVED_ADMIN_PWD***)

4. **make status теперь показывает правильный статус** для production сервисов

---

## 🔐 Безопасность

- `/admin-docs/` защищен HTTP Basic Authentication
- `/admin` (админ-панель FastAPI) - защищена через сессии FastAPI
- `/docs` (публичная документация API) - остается открытым

---

## 🆘 Troubleshooting

### make status всё ещё не работает
```bash
# Проверить что контейнеры запущены
docker ps

# Если запущены, проблема в Makefile - проверьте что изменения применены
grep "docker compose --env-file" Makefile | grep status
```

### admin-docs не требует авторизацию
```bash
# Проверить что .htpasswd существует
ls -la nginx/.htpasswd

# Проверить что nginx перезапустился
docker logs xr2_nginx_prod --tail 20

# Перезапустить nginx вручную
docker compose --env-file .env.prod -f docker-compose.prod.yml restart nginx
```

### Ошибка "No such file or directory: nginx/.htpasswd"
```bash
# Создать файл вручную
make setup-admin-auth

# Или:
./scripts/generate-htpasswd.sh
docker compose --env-file .env.prod -f docker-compose.prod.yml restart nginx
```
