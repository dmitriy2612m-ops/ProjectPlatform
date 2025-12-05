#!/bin/bash
echo "🔍 Checking Docker Swarm status..."

echo "Nodes:"
docker node ls

echo -e "\nServices:"
docker service ls

echo -e "\nStack services:"
docker stack services autopark

echo -e "\nContainers:"
docker stack ps autopark

echo -e "\nNetwork:"
docker network ls | grep autopark