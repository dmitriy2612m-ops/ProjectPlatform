from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from pydantic import BaseModel
from datetime import datetime
import os
import redis
import httpx
from prometheus_client import Counter, Gauge, generate_latest, CONTENT_TYPE_LATEST

# Prometheus метрики
http_requests_total = Counter('http_requests_total', 'Total HTTP requests', ['method', 'endpoint'])
vehicles_count_gauge = Gauge('vehicles_total', 'Total number of vehicles')
active_vehicles_gauge = Gauge('vehicles_active', 'Number of active vehicles')

# Настройка приложения
app = FastAPI(title="Autopark API", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключение к БД
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://admin:admin123@postgres:5432/autopark_db")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Подключение к Redis
redis_client = redis.Redis(
    host=os.getenv("REDIS_HOST", "redis"),
    port=6379,
    decode_responses=True
)

# Модель БД
class VehicleDB(Base):
    __tablename__ = "vehicles"
    id = Column(Integer, primary_key=True, index=True)
    license_plate = Column(String, unique=True, index=True)
    model = Column(String)
    year = Column(Integer)
    fuel_type = Column(String)
    status = Column(String, default="active")
    created_at = Column(DateTime, default=datetime.utcnow)

# Pydantic модель
class Vehicle(BaseModel):
    license_plate: str
    model: str
    year: int = None
    fuel_type: str = None

    class Config:
        from_attributes = True

# Создание таблиц
@app.on_event("startup")
def startup():
    try:
        Base.metadata.create_all(bind=engine)
        print("Database tables created")
    except Exception as e:
        print(f"Warning: Could not create database tables: {e}")
        print("API will continue, but database features may not work")

# Эндпоинты
@app.get("/")
async def root():
    return {
        "service": "Autopark Management Platform",
        "version": "1.0.0",
        "status": "operational",
        "containers": 6,
        "description": "Docker-based cloud platform for fleet management",
        "services": ["api", "dashboard", "postgres", "redis", "nginx", "prometheus"]
    }

@app.get("/health")
async def health_check():
    # Проверка БД
    db_status = "unknown"
    try:
        from sqlalchemy import text
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        db_status = "healthy"
    except:
        db_status = "unhealthy"
    
    # Проверка Redis
    redis_status = "unknown"
    try:
        redis_status = "healthy" if redis_client.ping() else "unhealthy"
    except:
        redis_status = "unreachable"
    
    return {
        "status": "ok",
        "timestamp": datetime.utcnow().isoformat(),
        "services": {
            "database": db_status,
            "redis": redis_status,
            "api": "running"
        },
        "container_count": 6
    }

@app.get("/vehicles")
async def get_vehicles():
    http_requests_total.labels(method='GET', endpoint='/vehicles').inc()
    try:
        db = SessionLocal()
        vehicles = db.query(VehicleDB).all()
        db.close()
        
        # Кэшируем в Redis и обновляем метрики
        try:
            vehicles_count = len(vehicles)
            redis_client.set("vehicles:count", vehicles_count)
            vehicles_count_gauge.set(vehicles_count)
            active_count = len([v for v in vehicles if v.status == "active"])
            active_vehicles_gauge.set(active_count)
        except:
            pass
        
        return vehicles
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Database unavailable: {str(e)}")

@app.post("/vehicles")
async def create_vehicle(vehicle: Vehicle):
    http_requests_total.labels(method='POST', endpoint='/vehicles').inc()
    try:
        db = SessionLocal()
        vehicle_dict = vehicle.dict()
        # Убираем None значения
        vehicle_dict = {k: v for k, v in vehicle_dict.items() if v is not None}
        db_vehicle = VehicleDB(**vehicle_dict)
        db.add(db_vehicle)
        db.commit()
        db.refresh(db_vehicle)
        db.close()
        
        # Обновляем метрики
        try:
            db = SessionLocal()
            vehicles_count = db.query(VehicleDB).count()
            db.close()
            redis_client.set("vehicles:count", vehicles_count)
            vehicles_count_gauge.set(vehicles_count)
        except:
            pass
        
        return {"message": "Vehicle created", "id": db_vehicle.id}
    except Exception as e:
        error_msg = str(e)
        # Проверяем на дубликат гос.номера
        if "unique constraint" in error_msg.lower() or "duplicate" in error_msg.lower():
            raise HTTPException(status_code=400, detail="Транспортное средство с таким гос. номером уже существует")
        raise HTTPException(status_code=503, detail=f"Database unavailable: {error_msg}")

@app.get("/metrics")
async def get_metrics(response: Response):
    """Prometheus метрики в формате text/plain"""
    # Обновляем метрики из Redis
    try:
        vehicles_count = int(redis_client.get("vehicles:count") or 0)
        vehicles_count_gauge.set(vehicles_count)
    except:
        pass
    
    # Возвращаем метрики в формате Prometheus
    return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)

@app.get("/api/metrics")
async def get_api_metrics():
    """JSON метрики для API (совместимость)"""
    return {
        "total_requests": redis_client.get("total_requests") or "0",
        "vehicles_count": redis_client.get("vehicles:count") or "0",
        "uptime": "running"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)