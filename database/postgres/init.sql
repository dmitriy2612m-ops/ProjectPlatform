-- Создание таблицы транспортных средств
CREATE TABLE IF NOT EXISTS vehicles (
    id SERIAL PRIMARY KEY,
    license_plate VARCHAR(20) UNIQUE NOT NULL,
    model VARCHAR(100) NOT NULL,
    year INTEGER,
    fuel_type VARCHAR(50),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы телеметрии
CREATE TABLE IF NOT EXISTS telemetry (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER REFERENCES vehicles(id),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    speed DECIMAL(5, 2),
    fuel_level DECIMAL(5, 2),
    engine_temp DECIMAL(5, 2),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Вставка тестовых данных
INSERT INTO vehicles (license_plate, model, year, fuel_type) VALUES
('А123БВ77', 'ГАЗель NEXT', 2022, 'дизель'),
('В456ГД78', 'Камаз 54901', 2023, 'дизель'),
('Е789ЖЗ79', 'Volvo FH', 2021, 'дизель')
ON CONFLICT (license_plate) DO NOTHING;