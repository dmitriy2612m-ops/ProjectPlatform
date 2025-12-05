@echo off
echo [1/6] Cleaning up...
docker-compose down 2>nul
docker stack rm autopark 2>nul
docker swarm leave --force 2>nul

echo [2/6] Building images...
docker build -t autopark-api ./src/api
docker build -t autopark-dashboard ./src/dashboard

echo [3/6] Initializing Swarm...
docker swarm init 2>nul || echo "Swarm already initialized"

echo [4/6] Deploying stack...
docker stack deploy -c docker-stack.yml autopark

echo [5/6] Waiting for services to start...
timeout 10

echo [6/6] Checking status...
echo.
echo === SERVICES ===
docker service ls
echo.
echo === OPEN IN BROWSER ===
echo Dashboard:   http://localhost
echo API Docs:    http://localhost/api/docs
echo Prometheus:  http://localhost:9090
echo.
pause