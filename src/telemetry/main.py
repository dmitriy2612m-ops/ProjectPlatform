"""
Сервис телеметрии для мониторинга состояния транспортных средств
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import random
import socket

app = FastAPI(title="Telemetry Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Модель телеметрии
class TelemetryData(BaseModel):
    vehicle_id: int
    latitude: float
    longitude: float
    speed: float
    fuel_level: float
    engine_temp: float
    timestamp: Optional[datetime] = None

class TelemetryResponse(BaseModel):
    vehicle_id: int
    status: str
    location: dict
    metrics: dict
    last_update: datetime

# Хранилище телеметрии (в реальности - БД)
telemetry_store = {}

@app.get("/")
async def root():
    return {
        "service": "Telemetry Service",
        "version": "1.0.0",
        "status": "operational",
        "container": socket.gethostname(),
        "description": "Мониторинг состояния транспортных средств в реальном времени"
    }

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "vehicles_monitored": len(telemetry_store),
        "container_id": socket.gethostname()
    }

@app.post("/telemetry", response_model=TelemetryResponse)
async def submit_telemetry(data: TelemetryData):
    """Прием данных телеметрии от транспортного средства"""
    if not data.timestamp:
        data.timestamp = datetime.now()
    
    telemetry_store[data.vehicle_id] = {
        "vehicle_id": data.vehicle_id,
        "latitude": data.latitude,
        "longitude": data.longitude,
        "speed": data.speed,
        "fuel_level": data.fuel_level,
        "engine_temp": data.engine_temp,
        "timestamp": data.timestamp
    }
    
    # Определяем статус на основе метрик
    status = "normal"
    if data.fuel_level < 10:
        status = "low_fuel"
    if data.engine_temp > 95:
        status = "overheating"
    if data.speed > 120:
        status = "overspeed"
    
    return TelemetryResponse(
        vehicle_id=data.vehicle_id,
        status=status,
        location={"lat": data.latitude, "lon": data.longitude},
        metrics={
            "speed": data.speed,
            "fuel_level": data.fuel_level,
            "engine_temp": data.engine_temp
        },
        last_update=data.timestamp
    )

@app.get("/telemetry/{vehicle_id}", response_model=TelemetryResponse)
async def get_telemetry(vehicle_id: int):
    """Получение телеметрии для конкретного транспортного средства"""
    if vehicle_id not in telemetry_store:
        raise HTTPException(status_code=404, detail="Telemetry data not found")
    
    data = telemetry_store[vehicle_id]
    
    status = "normal"
    if data["fuel_level"] < 10:
        status = "low_fuel"
    if data["engine_temp"] > 95:
        status = "overheating"
    if data["speed"] > 120:
        status = "overspeed"
    
    return TelemetryResponse(
        vehicle_id=data["vehicle_id"],
        status=status,
        location={"lat": data["latitude"], "lon": data["longitude"]},
        metrics={
            "speed": data["speed"],
            "fuel_level": data["fuel_level"],
            "engine_temp": data["engine_temp"]
        },
        last_update=data["timestamp"]
    )

@app.get("/telemetry", response_model=List[TelemetryResponse])
async def get_all_telemetry():
    """Получение телеметрии для всех транспортных средств"""
    results = []
    for vehicle_id, data in telemetry_store.items():
        status = "normal"
        if data["fuel_level"] < 10:
            status = "low_fuel"
        if data["engine_temp"] > 95:
            status = "overheating"
        if data["speed"] > 120:
            status = "overspeed"
        
        results.append(TelemetryResponse(
            vehicle_id=data["vehicle_id"],
            status=status,
            location={"lat": data["latitude"], "lon": data["longitude"]},
            metrics={
                "speed": data["speed"],
                "fuel_level": data["fuel_level"],
                "engine_temp": data["engine_temp"]
            },
            last_update=data["timestamp"]
        ))
    
    return results

@app.get("/metrics")
async def get_metrics():
    """Метрики для Prometheus"""
    total_vehicles = len(telemetry_store)
    alerts = sum(1 for data in telemetry_store.values() 
                 if data["fuel_level"] < 10 or data["engine_temp"] > 95)
    
    return {
        "total_vehicles_monitored": total_vehicles,
        "alerts_count": alerts,
        "avg_speed": sum(d["speed"] for d in telemetry_store.values()) / total_vehicles if total_vehicles > 0 else 0,
        "avg_fuel_level": sum(d["fuel_level"] for d in telemetry_store.values()) / total_vehicles if total_vehicles > 0 else 0
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)


