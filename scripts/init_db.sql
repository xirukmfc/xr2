-- Инициализация базы данных xR2 Platform
-- ==========================================

-- Создание базы данных (если не существует)
-- CREATE DATABASE xr2_db;

-- Подключение к базе данных
\c xr2_db;

-- Создание пользователя (если не существует)
-- CREATE USER xr2_user WITH PASSWORD 'xr2_secure_password_2024';

-- Предоставление прав
-- GRANT ALL PRIVILEGES ON DATABASE xr2_db TO xr2_user;
-- GRANT ALL PRIVILEGES ON SCHEMA public TO xr2_user;

-- Создание расширений
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Настройки для производительности
-- Commented out - requires pg_stat_statements extension to be loaded first
-- ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET track_activity_query_size = 2048;
-- ALTER SYSTEM SET pg_stat_statements.track = 'all';
ALTER SYSTEM SET log_min_duration_statement = 1000;
ALTER SYSTEM SET log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h ';

-- Перезагрузка конфигурации
SELECT pg_reload_conf();

-- Создание индексов для производительности (будут созданы Alembic миграциями)
-- Эти индексы будут добавлены автоматически при запуске приложения

-- Логирование успешной инициализации
DO $$
BEGIN
    RAISE NOTICE 'xR2 Database initialized successfully!';
END $$;

