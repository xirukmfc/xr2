# xR2 Platform - Security Configuration Guide

## 🛡️ Комплексная защита от атак

### 1. Защита от DDoS атак

#### Nginx Level Protection:
- **Rate Limiting**: 10 запросов/секунду для API, 1 запрос/секунду для админки
- **Connection Limiting**: максимум 20 соединений с одного IP
- **Request Size Limits**: максимум 10MB на запрос
- **Timeout Protection**: таймауты для всех соединений

#### Application Level Protection:
- **IP Blocking**: автоматическая блокировка IP при превышении лимитов
- **Request Filtering**: блокировка подозрительных запросов
- **Bot Detection**: блокировка известных ботов и сканеров
- **Suspicious Pattern Detection**: обнаружение атак по паттернам

### 2. Rate Limiting Configuration

```bash
# В .env файле
RATE_LIMIT_PER_MINUTE=60                    # Общий лимит
MAX_REQUESTS_PER_IP_PER_MINUTE=100         # Лимит по IP
MAX_REQUESTS_PER_API_KEY_PER_MINUTE=1000   # Лимит по API ключу
```

#### Уровни защиты:
- **API Endpoints**: 10 req/s с burst 20
- **Admin Endpoints**: 1 req/s с burst 5
- **General Endpoints**: 30 req/s с burst 20
- **Login Endpoints**: 1 req/s с burst 3

### 3. Security Headers

Все ответы содержат защитные заголовки:
```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Strict-Transport-Security: max-age=31536000; includeSubDomains (HTTPS)
```

### 4. Request Filtering

#### Блокируемые паттерны:
- **Suspicious User-Agents**: sqlmap, nikto, nmap, masscan, zap, burp
- **Empty User-Agent**: пустые или отсутствующие User-Agent
- **Suspicious Paths**: /.env, /config, /admin, /wp-admin, /.git
- **File Extensions**: .php, .asp, .aspx, .jsp

#### Bot Detection:
```nginx
if ($http_user_agent ~* (bot|crawler|spider|scraper)) {
    return 403;
}
```

### 5. IP Blocking System

#### Автоматическая блокировка:
- **Duration**: 5 минут блокировки
- **Triggers**: превышение rate limit, подозрительные запросы
- **Storage**: Redis + локальное кэширование
- **Cleanup**: автоматическая очистка каждую минуту

### 6. Database Security

#### PostgreSQL Configuration:
```sql
-- Ограничения подключений
max_connections = 100

-- Таймауты
statement_timeout = 30s
idle_in_transaction_session_timeout = 60s

-- Логирование
log_min_duration_statement = 1000
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
```

### 7. Redis Security

#### Configuration:
```redis
# Пароль для доступа
requirepass ***REMOVED_REDIS_PWD***_change_me

# Отключение опасных команд
rename-command FLUSHDB ""
rename-command FLUSHALL ""
rename-command DEBUG ""

# Ограничения памяти
maxmemory 256mb
maxmemory-policy allkeys-lru
```

### 8. SSL/TLS Configuration

#### Nginx SSL Settings:
```nginx
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
ssl_prefer_server_ciphers off;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;
ssl_session_tickets off;
```

### 9. Monitoring & Alerting

#### Prometheus Metrics:
- HTTP request rates
- Error rates
- Response times
- Active connections
- Blocked IPs count

#### Grafana Dashboards:
- Security overview
- Rate limiting status
- Blocked IPs monitoring
- Performance metrics

### 10. Production Security Checklist

#### ✅ Обязательные настройки:

1. **Изменить все пароли**:
   ```bash
   POSTGRES_PASSWORD=your_secure_password
   REDIS_PASSWORD=your_redis_password
   SECRET_KEY=your_32_char_secret_key
   ADMIN_PASSWORD=your_admin_password
   ```

2. **Настроить SSL сертификаты**:
   ```bash
   # Поместить в nginx/ssl/
   cert.pem
   key.pem
   ```

3. **Ограничить CORS**:
   ```bash
   CORS_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
   ```

4. **Настроить файрвол**:
   ```bash
   sudo ufw allow 80
   sudo ufw allow 443
   sudo ufw allow 22
   sudo ufw enable
   ```

5. **Регулярные бэкапы**:
   ```bash
   # Автоматический бэкап
   make backup-db
   ```

### 11. Advanced Security Features

#### Fail2Ban Integration (опционально):
```bash
# Установка fail2ban
sudo apt-get install fail2ban

# Конфигурация для xR2
sudo nano /etc/fail2ban/jail.local
```

#### Cloudflare Integration:
- DDoS protection
- Bot management
- Rate limiting
- Geographic blocking

### 12. Security Monitoring Commands

```bash
# Проверка заблокированных IP
docker-compose exec redis redis-cli KEYS "blocked_ip:*"

# Мониторинг логов безопасности
docker-compose logs nginx | grep "403\|429\|444"

# Проверка активных соединений
docker-compose exec nginx nginx -s reload

# Статистика rate limiting
docker-compose exec redis redis-cli KEYS "rate_limit:*"
```

### 13. Incident Response

#### При обнаружении атаки:

1. **Немедленные действия**:
   ```bash
   # Проверить логи
   make logs-nginx
   
   # Проверить заблокированные IP
   docker-compose exec redis redis-cli KEYS "blocked_ip:*"
   
   # Увеличить лимиты (временно)
   # Изменить в .env и перезапустить
   ```

2. **Анализ атаки**:
   ```bash
   # Анализ логов
   docker-compose logs nginx | grep "$(date +%Y-%m-%d)"
   
   # Статистика запросов
   docker-compose exec redis redis-cli KEYS "rate_limit:*"
   ```

3. **Восстановление**:
   ```bash
   # Перезапуск сервисов
   make restart
   
   # Очистка кэша
   docker-compose exec redis redis-cli FLUSHDB
   ```

---

**🔒 Помните: безопасность - это процесс, а не одноразовая настройка!**




