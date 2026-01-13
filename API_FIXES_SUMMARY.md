# Сводка исправлений API в проекте

## Найденные проблемы

### 1. ✅ ИСПРАВЛЕНО: test-modal.tsx
- **Проблема**: Использовался прямой `fetch` вместо `apiClient.request()`
- **Исправление**: Заменен на `apiClient.request('/llm/test-run', ...)`
- **Файл**: `prompt-editor/components/test-modal.tsx`

### 2. ✅ ИСПРАВЛЕНО: ROIAnalysis.tsx
- **Проблема**: Использовался прямой `fetch` на `/internal/analytics/roi`
- **Исправление**: Заменен на `apiClient.request('/analytics/roi/...')`
- **Файл**: `prompt-editor/components/analytics/ROIAnalysis.tsx`

### 3. ✅ ИСПРАВЛЕНО: ABTestManager.tsx
- **Проблема**: Использовался прямой `fetch` на `/internal/ab-tests`, но такого эндпоинта нет
- **Исправление**: Заменен на `apiClient.request()` с правильными путями `/ab-tests-simple/test`
- **Изменения**:
  - `GET /internal/ab-tests` → `GET /ab-tests-simple/test`
  - `POST /internal/ab-tests/{id}/start` → `POST /ab-tests-simple/test/{id}/start`
  - `POST /internal/ab-tests/{id}/stop` → `POST /ab-tests-simple/test/{id}/stop`
- **Файл**: `prompt-editor/components/analytics/ABTestManager.tsx`

## Правильная структура API

### Публичные API (для внешних клиентов)
- **Префикс**: `/api/v1/`
- **Примеры**: 
  - `/api/v1/get-prompt`
  - `/api/v1/events`
  - `/api/v1/check-api-key`

### Внутренние API (для фронтенда)
- **Префикс**: `/internal/`
- **Примеры**:
  - `/internal/prompts/`
  - `/internal/llm/test-run`
  - `/internal/analytics/roi/{prompt_id}`
  - `/internal/ab-tests-simple/test`

### Next.js API Routes (прокси на бэкенд)
- **Префикс**: `/api/`
- **Примеры**:
  - `/api/tokenize/precise` → проксирует на `/internal/llm/tokenize/precise`
  - `/api/tokenize/quick` → проксирует на `/internal/llm/tokenize/quick`
  - `/api/share/{token}` → проксирует на `/share/{token}`

## Конфигурация

### Frontend API Base URL
- **Переменная**: `NEXT_PUBLIC_API_URL`
- **Значение на проде**: `https://xr2.uk/internal`
- **Использование**: В `prompt-editor/lib/api.ts`

### Backend URL для Next.js API Routes
- **Переменные**: `BACKEND_URL` или `FASTAPI_URL`
- **Значение на проде**: `http://app:8000` (внутри Docker)
- **Использование**: В `prompt-editor/app/api/*/route.ts`

## Nginx конфигурация

### Правила проксирования:
1. `/api/share/` → Next.js фронтенд
2. `/api/tokenize/` → Next.js фронтенд
3. `/api/` → FastAPI бэкенд (общее правило)
4. `/internal/` → FastAPI бэкенд
5. `/api/v1/` → FastAPI бэкенд (публичный API)

## Файлы для деплоя

После исправлений нужно задеплоить:
1. `prompt-editor/components/test-modal.tsx`
2. `prompt-editor/components/analytics/ROIAnalysis.tsx`
3. `prompt-editor/components/analytics/ABTestManager.tsx`
4. `prompt-editor/lib/api.ts` (исправлен тип метода request)
5. `nginx/nginx.prod.conf` (уже исправлен ранее)

## Компоненты, использующие правильный API

✅ Все компоненты используют `apiClient.request()`:
- `SimpleABTestManager.tsx` - использует `/ab-tests-simple/test`
- `ConversionsManager.tsx` - использует `apiClient.request()`
- `EventDefinitionBuilder.tsx` - использует `apiClient.request()`
- `FunnelAnalysis.tsx` - использует `apiClient.request()`
- `AnalyticsDashboard.tsx` - использует `apiClient.request()`
- `NewEventModal.tsx` - использует `apiClient.request()`
- `NewConversionModal.tsx` - использует `apiClient.request()`
- `left-panel.tsx` - использует `apiClient.request()`
