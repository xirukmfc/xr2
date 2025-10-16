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

deploy: ## 🚀 Деплой на production (без контейнерного nginx)
	@echo "$(GREEN)🚀 Деплой xR2 Platform на Production$(NC)"
	@echo ""
	@echo "$(YELLOW)Проверка .env.prod файла...$(NC)"
	@if [ ! -f .env.prod ]; then \
		echo "$(RED)❌ Файл .env.prod не найден!$(NC)"; \
		echo "$(YELLOW)Создаю из .env.example...$(NC)"; \
		cp .env.example .env.prod; \
		echo "$(RED)⚠️  ВАЖНО: Отредактируйте .env.prod с production паролями!$(NC)"; \
	fi
	@echo "$(YELLOW)Сборка и запуск сервисов (без nginx)...$(NC)"
	@docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build redis postgres db-init app frontend --remove-orphans
	@echo ""
	@echo "$(YELLOW)Ожидание запуска сервисов...$(NC)"
	@sleep 15
	@docker compose --env-file .env.prod -f docker-compose.prod.yml ps
	@echo ""
	@echo "$(GREEN)✅ Платформа развернута!$(NC)"
	@echo "$(YELLOW)🌐 Приложение: https://xr2.uk$(NC)"
	@echo "$(YELLOW)📚 API Docs:   https://xr2.uk/docs$(NC)"
	@echo "$(YELLOW)🔐 Admin:      https://xr2.uk/admin$(NC)"

deploy-fast: ## ⚡ Быстрый деплой с оптимизациями (BuildKit, увеличенная память)
	@export DOCKER_BUILDKIT=1 COMPOSE_DOCKER_CLI_BUILD=1 && ./deploy-optimized.sh

up: ## Запустить production (все в Docker)
	@echo "$(GREEN)🚀 Запуск xR2 Platform$(NC)"
	@docker compose --env-file .env.prod -f docker-compose.prod.yml up -d
	@echo "$(GREEN)✅ Запущено!$(NC)"

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
	@docker compose --env-file .env.prod -f docker-compose.prod.yml down 2>/dev/null || true
	@docker compose down 2>/dev/null || true
	@echo "$(GREEN)✅ Сервисы остановлены$(NC)"

restart: ## Перезапустить сервисы
	@echo "$(YELLOW)🔄 Перезапуск сервисов...$(NC)"
	@docker compose --env-file .env.prod -f docker-compose.prod.yml restart
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
	@docker compose --env-file .env.prod -f docker-compose.prod.yml build --no-cache
	@echo "$(GREEN)✅ Образы пересобраны$(NC)"
	@echo "$(YELLOW)Для применения изменений выполните:$(NC) make up"

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
