.PHONY: help up up-local down restart logs status clean health

# Цвета для вывода
GREEN := \033[0;32m
YELLOW := \033[1;33m
RED := \033[0;31m
NC := \033[0m # No Color

help: ## Показать эту справку
	@echo "$(GREEN)xR2 Platform - Makefile Commands$(NC)"
	@echo "=================================="
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "$(YELLOW)%-20s$(NC) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(YELLOW)Для локальной разработки используйте:$(NC) ./start.sh"

##@ Основные команды

up: ## Запустить ВСЕ (для сервера/production) - backend + frontend в Docker
	@echo "$(GREEN)🚀 Запуск xR2 Platform (Production - все в Docker)$(NC)"
	@echo ""
	@echo "$(YELLOW)Проверка .env.prod файла...$(NC)"
	@if [ ! -f .env.prod ]; then \
		echo "$(RED)❌ Файл .env.prod не найден!$(NC)"; \
		echo "$(YELLOW)Создайте файл .env.prod на основе env.example$(NC)"; \
		exit 1; \
	fi
	@echo "$(YELLOW)Сборка frontend образа...$(NC)"
	@docker build -t xr2-frontend:latest ./prompt-editor
	@echo ""
	@echo "$(YELLOW)Запуск всех сервисов...$(NC)"
	@docker-compose --env-file .env.prod -f docker-compose.prod.yml -p xr2-platform up -d
	@sleep 10
	@docker-compose --env-file .env.prod -f docker-compose.prod.yml -p xr2-platform ps
	@echo ""
	@echo "$(GREEN)✅ Платформа запущена!$(NC)"
	@echo "$(YELLOW)Приложение: http://localhost$(NC)"
	@echo "$(YELLOW)Admin: http://localhost/admin$(NC)"
	@echo "$(YELLOW)API Docs: http://localhost/docs$(NC)"

up-local: ## Запустить для локальной разработки (только backend в Docker)
	@echo "$(GREEN)🛠️  Запуск backend для локальной разработки$(NC)"
	@docker-compose -p xr2-platform up -d
	@echo ""
	@echo "$(GREEN)✅ Backend запущен!$(NC)"
	@echo "$(YELLOW)Теперь запустите frontend:$(NC)"
	@echo "  cd prompt-editor && pnpm dev"
	@echo ""
	@echo "$(YELLOW)Или используйте:$(NC) ./start.sh (автоматически запустит и backend и frontend)"

down: ## Остановить все сервисы
	@echo "$(RED)🛑 Остановка сервисов...$(NC)"
	@docker-compose -p xr2-platform down 2>/dev/null || true
	@docker-compose --env-file .env.prod -f docker-compose.prod.yml -p xr2-platform down 2>/dev/null || true
	@pkill -f "next dev" || true
	@echo "$(GREEN)✅ Сервисы остановлены$(NC)"

restart: ## Перезапустить сервисы
	@docker-compose -p xr2-platform restart 2>/dev/null || docker-compose -f docker-compose.prod.yml -p xr2-platform restart
	@echo "$(GREEN)✅ Сервисы перезапущены$(NC)"

##@ Мониторинг

status: ## Показать статус сервисов
	@echo "$(GREEN)Development сервисы:$(NC)"
	@docker-compose -p xr2-platform ps 2>/dev/null || echo "  Не запущены"
	@echo ""
	@echo "$(GREEN)Production сервисы:$(NC)"
	@docker-compose --env-file .env.prod -f docker-compose.prod.yml -p xr2-platform ps 2>/dev/null || echo "  Не запущены"
	@echo ""
	@ps aux | grep "next dev" | grep -v grep > /dev/null && echo "$(GREEN)✅ Frontend (local):$(NC) Running" || echo "$(YELLOW)❌ Frontend (local):$(NC) Not running"

logs: ## Показать логи всех сервисов
	@docker-compose -p xr2-platform logs -f 2>/dev/null || docker-compose --env-file .env.prod -f docker-compose.prod.yml -p xr2-platform logs -f

logs-app: ## Показать логи приложения
	@docker-compose -p xr2-platform logs -f app 2>/dev/null || docker-compose --env-file .env.prod -f docker-compose.prod.yml -p xr2-platform logs -f app

logs-nginx: ## Показать логи nginx
	@docker-compose -p xr2-platform logs -f nginx 2>/dev/null || docker-compose --env-file .env.prod -f docker-compose.prod.yml -p xr2-platform logs -f nginx

logs-db: ## Показать логи базы данных
	@docker-compose -p xr2-platform logs -f postgres 2>/dev/null || docker-compose --env-file .env.prod -f docker-compose.prod.yml -p xr2-platform logs -f postgres

logs-frontend: ## Показать логи frontend (production)
	@docker-compose --env-file .env.prod -f docker-compose.prod.yml -p xr2-platform logs -f frontend

health: ## Проверить здоровье сервисов
	@echo "$(GREEN)🏥 Проверка здоровья сервисов...$(NC)"
	@echo ""
	@curl -s http://localhost/health 2>/dev/null | grep -q "healthy" && echo "$(GREEN)✅ Nginx: OK$(NC)" || echo "$(RED)❌ Nginx: FAIL$(NC)"
	@curl -s http://localhost:8000/health 2>/dev/null | grep -q "healthy" && echo "$(GREEN)✅ API: OK$(NC)" || echo "$(RED)❌ API: FAIL$(NC)"
	@docker exec xr2_postgres pg_isready -U xr2_user > /dev/null 2>&1 && echo "$(GREEN)✅ PostgreSQL: OK$(NC)" || echo "$(RED)❌ PostgreSQL: FAIL$(NC)"
	@docker exec xr2_redis redis-cli ping > /dev/null 2>&1 && echo "$(GREEN)✅ Redis: OK$(NC)" || echo "$(RED)❌ Redis: FAIL$(NC)"
	@curl -s http://localhost:3000 > /dev/null 2>&1 && echo "$(GREEN)✅ Frontend: OK$(NC)" || echo "$(YELLOW)⚠️  Frontend: Not accessible$(NC)"

##@ Обслуживание

clean: ## Очистить все ресурсы (volumes, networks, images)
	@echo "$(RED)⚠️  ВНИМАНИЕ: Это удалит все данные!$(NC)"
	@read -p "Продолжить? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker-compose -p xr2-platform down -v 2>/dev/null || true; \
		docker-compose --env-file .env.prod -f docker-compose.prod.yml -p xr2-platform down -v 2>/dev/null || true; \
		echo "$(GREEN)✅ Ресурсы очищены$(NC)"; \
	fi

rebuild: ## Пересобрать все образы
	@echo "$(YELLOW)🔨 Пересборка образов...$(NC)"
	@docker-compose build --no-cache
	@docker-compose --env-file .env.prod -f docker-compose.prod.yml build --no-cache
	@docker build --no-cache -t xr2-frontend:latest ./prompt-editor
	@echo "$(GREEN)✅ Образы пересобраны$(NC)"

##@ База данных

db-shell: ## Подключиться к PostgreSQL
	@docker exec -it xr2_postgres psql -U xr2_user -d xr2_db 2>/dev/null || docker exec -it xr2_postgres_prod psql -U xr2_user -d xr2_db

db-backup: ## Создать бэкап базы данных
	@echo "$(GREEN)📦 Создание бэкапа...$(NC)"
	@mkdir -p backups
	@docker exec xr2_postgres pg_dump -U xr2_user xr2_db > backups/backup_$$(date +%Y%m%d_%H%M%S).sql 2>/dev/null || \
	 docker exec xr2_postgres_prod pg_dump -U xr2_user xr2_db > backups/backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "$(GREEN)✅ Бэкап создан в backups/$(NC)"

db-restore: ## Восстановить из последнего бэкапа
	@echo "$(YELLOW)📥 Восстановление из бэкапа...$(NC)"
	@BACKUP=$$(ls -t backups/*.sql | head -1); \
	if [ -z "$$BACKUP" ]; then \
		echo "$(RED)❌ Бэкапы не найдены$(NC)"; \
	else \
		docker exec -i xr2_postgres psql -U xr2_user xr2_db < "$$BACKUP" 2>/dev/null || \
		docker exec -i xr2_postgres_prod psql -U xr2_user xr2_db < "$$BACKUP"; \
		echo "$(GREEN)✅ Восстановлено из $$BACKUP$(NC)"; \
	fi
