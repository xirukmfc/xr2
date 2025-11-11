#!/bin/bash

# Быстрый тест доступности production сервера
# Проверяет основные endpoints без полного автотеста

echo "=========================================="
echo "Быстрый тест xR2 Production"
echo "=========================================="
echo ""

BASE_URL="https://xr2.uk"

# Функция для тестирования endpoint
test_endpoint() {
    local name=$1
    local url=$2
    local expected_code=${3:-200}

    printf "%-40s" "Тест: $name..."

    response=$(curl -s -o /dev/null -w "%{http_code}" -k "$url" 2>/dev/null)

    if [ "$response" = "$expected_code" ]; then
        echo "✅ OK ($response)"
        return 0
    else
        echo "❌ FAIL (ожидалось: $expected_code, получено: $response)"
        return 1
    fi
}

# Счетчик тестов
TOTAL=0
PASSED=0
FAILED=0

# Тест 1: Frontend главная страница
test_endpoint "Frontend главная" "$BASE_URL" 200 && ((PASSED++)) || ((FAILED++))
((TOTAL++))

# Тест 2: Backend health check
test_endpoint "Backend health" "$BASE_URL/health" 200 && ((PASSED++)) || ((FAILED++))
((TOTAL++))

# Тест 3: API docs
test_endpoint "API документация" "$BASE_URL/docs" 200 && ((PASSED++)) || ((FAILED++))
((TOTAL++))

# Тест 4: OpenAPI schema
test_endpoint "OpenAPI schema" "$BASE_URL/openapi.json" 200 && ((PASSED++)) || ((FAILED++))
((TOTAL++))

# Тест 5: Admin panel (может требовать авторизацию)
printf "%-40s" "Тест: Admin panel..."
response=$(curl -s -o /dev/null -w "%{http_code}" -k "$BASE_URL/admin" 2>/dev/null)
if [ "$response" = "200" ] || [ "$response" = "302" ] || [ "$response" = "307" ]; then
    echo "✅ OK ($response)"
    ((PASSED++))
else
    echo "❌ FAIL (получено: $response)"
    ((FAILED++))
fi
((TOTAL++))

# Тест 6: API endpoint (пример)
printf "%-40s" "Тест: API v1..."
response=$(curl -s -o /dev/null -w "%{http_code}" -k "$BASE_URL/api/v1/llm-providers" 2>/dev/null)
if [ "$response" = "200" ] || [ "$response" = "401" ] || [ "$response" = "404" ]; then
    echo "✅ OK ($response)"
    ((PASSED++))
else
    echo "❌ FAIL (получено: $response)"
    ((FAILED++))
fi
((TOTAL++))

# Тест 7: HTTP -> HTTPS redirect
printf "%-40s" "Тест: HTTP -> HTTPS redirect..."
response=$(curl -s -o /dev/null -w "%{http_code}" "http://xr2.uk" 2>/dev/null)
if [ "$response" = "301" ] || [ "$response" = "302" ]; then
    echo "✅ OK ($response)"
    ((PASSED++))
else
    echo "❌ FAIL (получено: $response)"
    ((FAILED++))
fi
((TOTAL++))

# Тест 8: SSL сертификат
printf "%-40s" "Тест: SSL сертификат..."
if timeout 5 openssl s_client -connect xr2.uk:443 -servername xr2.uk </dev/null 2>&1 | grep -q "Verify return code: 0"; then
    echo "✅ OK"
    ((PASSED++))
else
    echo "⚠️  WARNING (сертификат может быть невалидным)"
    ((FAILED++))
fi
((TOTAL++))

# Тест 9: Response time
printf "%-40s" "Тест: Response time..."
time_total=$(curl -o /dev/null -s -w '%{time_total}' -k "$BASE_URL" 2>/dev/null)
if (( $(echo "$time_total < 5.0" | bc -l) )); then
    echo "✅ OK (${time_total}s)"
    ((PASSED++))
else
    echo "⚠️  SLOW (${time_total}s)"
    ((FAILED++))
fi
((TOTAL++))

# Тест 10: Docker контейнеры
printf "%-40s" "Тест: Docker контейнеры..."
if docker ps | grep -q "xr2_nginx_prod\|xr2_app_prod\|xr2_frontend_prod"; then
    running=$(docker ps | grep -c "xr2.*_prod")
    echo "✅ OK ($running контейнеров запущено)"
    ((PASSED++))
else
    echo "❌ FAIL (контейнеры не запущены)"
    ((FAILED++))
fi
((TOTAL++))

# Результаты
echo ""
echo "=========================================="
echo "Результаты"
echo "=========================================="

# Пересчитаем FAILED для корректности
FAILED=$((TOTAL - PASSED))

echo "Всего тестов:   $TOTAL"
echo "Пройдено:       $PASSED ✅"
echo "Провалено:      $FAILED ❌"

if [ "$PASSED" -eq "$TOTAL" ]; then
    SUCCESS_RATE=100
else
    SUCCESS_RATE=$((PASSED * 100 / TOTAL))
fi

echo "Успешность:     ${SUCCESS_RATE}%"
echo ""

if [ $FAILED -eq 0 ]; then
    echo "🎉 Все тесты пройдены успешно!"
    exit 0
else
    echo "⚠️  Некоторые тесты провалены ($FAILED из $TOTAL)"
    exit 1
fi
