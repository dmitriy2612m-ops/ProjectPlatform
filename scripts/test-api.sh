#!/bin/bash
set -e

echo "🔍 Testing API..."

# Ждем запуска API
echo "⏳ Waiting for API to start..."
sleep 10

# Проверяем health endpoint
echo "📊 Checking /health endpoint..."
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health || echo "000")

if [ "$HEALTH_RESPONSE" = "200" ]; then
    echo "✅ Health check passed (200)"
else
    echo "❌ Health check failed (status: $HEALTH_RESPONSE)"
    exit 1
fi

# Проверяем root endpoint
echo "📊 Checking / endpoint..."
ROOT_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/ || echo "000")

if [ "$ROOT_RESPONSE" = "200" ]; then
    echo "✅ Root endpoint check passed (200)"
else
    echo "❌ Root endpoint check failed (status: $ROOT_RESPONSE)"
    exit 1
fi

# Проверяем /vehicles endpoint
echo "📊 Checking /vehicles endpoint..."
VEHICLES_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/vehicles || echo "000")

if [ "$VEHICLES_RESPONSE" = "200" ] || [ "$VEHICLES_RESPONSE" = "503" ]; then
    echo "✅ Vehicles endpoint check passed (status: $VEHICLES_RESPONSE)"
else
    echo "❌ Vehicles endpoint check failed (status: $VEHICLES_RESPONSE)"
    exit 1
fi

echo "✅ All tests passed!"
exit 0

