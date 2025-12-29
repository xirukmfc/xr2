#!/bin/bash

echo "🔍 Диагностика сервера"
echo "====================="
echo ""

echo "📊 RAM и CPU:"
free -h
echo ""
top -bn1 | head -n 20
echo ""

echo "💾 Место на диске:"
df -h
echo ""

echo "🐳 Docker информация:"
docker system df
echo ""

echo "🔧 Docker BuildKit:"
docker version | grep -i buildkit || echo "BuildKit статус неизвестен"
echo ""

echo "💿 Swap:"
swapon --show
free -h | grep Swap
echo ""

echo "🏃 Запущенные Docker контейнеры:"
docker ps
echo ""

echo "🗑️  Docker кэш (можно очистить):"
docker system df -v | grep -A 5 "Build Cache"
