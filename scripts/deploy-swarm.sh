#!/bin/bash
echo "🚀 Deploying Autopark Platform to Docker Swarm..."

# 1. Инициализируем Swarm (если еще не инициализирован)
if ! docker node ls &> /dev/null; then
    echo "Initializing Docker Swarm..."
    docker swarm init
else
    echo "Swarm already initialized"
fi

# 2. Собираем образы
echo "Building Docker images..."
docker build -t autopark-api ./src/api
docker build -t autopark-dashboard ./src/dashboard

# 3. Деплоим стек
echo "Deploying stack..."
docker stack deploy -c docker-stack.yml autopark

# 4. Проверяем
echo "Checking services..."
sleep 10
docker service ls

echo "✅ Deployment complete!"
echo "📊 Open: http://localhost"
echo "📈 Monitor: http://localhost:9090"