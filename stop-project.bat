@echo off
echo 🛑 Stopping ProjectPlatform...
echo.
echo [1/3] Removing Docker Swarm stack...
docker stack rm autopark 2>nul
timeout 3

echo [2/3] Stopping Docker Compose...
docker-compose down 2>nul
timeout 2

echo [3/3] Cleaning up...
docker rm -f $(docker ps -aq) 2>nul
docker system prune -f 2>nul

echo.
echo ✅ Project stopped!
echo Current containers:
docker ps
echo.
pause