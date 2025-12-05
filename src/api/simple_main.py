from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import socket
import redis
import os
from datetime import datetime

app = FastAPI(title="ProjectPlatform API", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Redis (будет работать когда настроим)
try:
    redis_client = redis.Redis(host="redis", port=6379, decode_responses=True)
    redis_connected = redis_client.ping()
except:
    redis_connected = False

# Модели
class Vehicle(BaseModel):
    id: int
    license_plate: str
    model: str
    status: str

# Тестовые данные
vehicles = [
    {"id": 1, "license_plate": "А123БВ77", "model": "ГАЗель NEXT", "status": "active"},
    {"id": 2, "license_plate": "В456ГД78", "model": "Камаз 54901", "status": "active"},
    {"id": 3, "license_plate": "Е789ЖЗ79", "model": "Volvo FH", "status": "maintenance"},
]

@app.get("/")
async def root():
    return {
        "service": "ProjectPlatform API",
        "version": "1.0.0",
        "status": "running",
        "container": socket.gethostname(),
        "replicas": "2"
    }

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "services": {
            "api": "running",
            "database": "postgres:5432",
            "redis": "connected" if redis_connected else "disconnected"
        },
        "container_id": socket.gethostname()
    }

@app.get("/vehicles", response_model=List[Vehicle])
async def get_vehicles():
    return vehicles

@app.get("/vehicles/{vehicle_id}")
async def get_vehicle(vehicle_id: int):
    vehicle = next((v for v in vehicles if v["id"] == vehicle_id), None)
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return vehicle

@app.get("/metrics")
async def get_metrics():
    return {
        "total_vehicles": len(vehicles),
        "active_vehicles": len([v for v in vehicles if v["status"] == "active"]),
        "requests_served": 0,
        "uptime": "running"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)