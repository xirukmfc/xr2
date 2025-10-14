# 🚀 Quick Start Guide - xR2 Platform

## 🖥️ На сервере (Production)

```bash
make up
```

**Готово!** Откройте http://localhost

---

## 💻 Локально (Development)

### Автоматически:
```bash
./start.sh
```

### Или вручную:

**Терминал 1:** Backend
```bash
make up-local
```

**Терминал 2:** Frontend
```bash
cd prompt-editor && pnpm dev
```

**Готово!** Откройте http://localhost

---

## Учетные данные

- **Username**: `admin`
- **Password**: `***REMOVED_ADMIN_PWD***`

---

## Полезные команды

```bash
make help        # Все доступные команды
make status      # Статус сервисов
make logs        # Логи
make health      # Проверка здоровья
make down        # Остановить все
```

---

## Возникли проблемы?

### 1. Порт занят
```bash
lsof -i :8000    # Проверить кто использует порт
lsof -i :3000
lsof -i :80
```

### 2. Frontend не запускается
```bash
cd prompt-editor
pnpm install     # Установить зависимости
pnpm dev         # Запустить вручную
```

### 3. Backend не работает
```bash
make logs-app    # Посмотреть логи
make restart     # Перезапустить
```

### 4. Полная перезагрузка
```bash
make down
make clean       # Удалит все данные!
make dev-backend
```

---

## Что куда смотрит?

| URL | Описание | Статус |
|-----|----------|--------|
| http://localhost | Frontend (Next.js) | ✅ |
| http://localhost/admin | SQLAdmin панель | ✅ |
| http://localhost/docs | Публичное API | ✅ |
| http://localhost/admin-docs | Полное API | ✅ |
| http://localhost:8000 | Прямой доступ к API | ✅ |
| http://localhost:3000 | Frontend (development) | ✅ |

---

**Удачи! 🎉**
