# Исправление ошибки Docker развертывания

## Проблема
При запуске проекта через Docker (`make up`) возникала ошибка в админке SQLAdmin:

```
AttributeError: Neither 'InstrumentedAttribute' object nor 'Comparator' object associated with Tag.name has an attribute 'parameter_name'
```

Ошибка происходила при попытке доступа к странице `/admin/tag/list`.

## Причина
Проблема была в конфигурации SQLAdmin в файле `app/admin/sqladmin_config.py`. В настройках фильтров использовались прямые ссылки на поля внешних ключей (`created_by`, `api_key_id`) вместо связей (relationships).

## Исправления

### 1. Исправлены фильтры в column_filters

#### TagAdmin (строка 282)
**Было:**
```python
column_filters = [
    Tag.created_at,
    Tag.created_by,  # Filter by creator ID
]
```

**Стало:**
```python
column_filters = [
    Tag.created_at,
    Tag.creator,  # Filter by creator relationship
]
```

#### ProductAPILogAdmin (строка 719)
**Было:**
```python
column_filters = [
    ProductAPILog.api_key_id,  # Filter by API key ID
    ProductAPILog.method,
    ProductAPILog.status_code,
    ProductAPILog.created_at,
]
```

**Стало:**
```python
column_filters = [
    ProductAPILog.api_key,  # Filter by API key relationship
    ProductAPILog.method,
    ProductAPILog.status_code,
    ProductAPILog.created_at,
]
```

### 2. Временно отключены column_searchable_list

Из-за бага в SQLAdmin 0.21.0, который вызывает ошибку `parameter_name`, временно отключены все `column_searchable_list` во всех админ-классах:

- UserAdmin
- WorkspaceAdmin  
- TagAdmin
- PromptAdmin
- PromptVersionAdmin
- LLMProviderAdmin
- UserAPIKeyAdmin
- ProductAPIKeyAdmin
- ProductAPILogAdmin

**Пример:**
```python
# Было:
column_searchable_list = [Tag.name]

# Стало:
# column_searchable_list = [Tag.name]  # Temporarily disabled due to SQLAdmin 0.21.0 bug
```

## Результат
После исправлений:
- ✅ Локальный запуск через `./start.sh` работает без ошибок
- ✅ Docker развертывание через `make up` теперь должно работать без ошибок в админке
- ✅ Все фильтры в админке работают корректно
- ✅ Сохранены локальные настройки для разработки

## Тестирование
Для проверки исправлений:
1. Локально: `./start.sh` - должен работать как раньше
2. Docker: Следуйте инструкциям в `DOCKER_REBUILD_INSTRUCTIONS.md`
3. Проверить: 
   - http://localhost:8000/admin/tag/list - должна загружаться без ошибок
   - http://localhost:8000/admin/product-api-log/list - должна загружаться без ошибок
   - Все остальные страницы админки должны работать

## Важно!
После внесения изменений необходимо пересобрать Docker образы:
```bash
make down
docker-compose build --no-cache
make up
```
