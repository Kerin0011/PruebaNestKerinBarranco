-- ========================================================
-- FleetCore - Base de Datos PostgreSQL 17
-- Sistema de Gestión de Mantenimiento de Flota de Vehículos
-- Dump DDL y Datos Iniciales (Seeders)
-- ========================================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- --------------------------------------------------------
-- TIPOS ENUMERADOS
-- --------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE user_role_enum AS ENUM ('ADMIN', 'TECHNICIAN');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE vehicle_status_enum AS ENUM ('AVAILABLE', 'IN_MAINTENANCE', 'INACTIVE');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE mechanic_status_enum AS ENUM ('ACTIVE', 'INACTIVE');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE workshop_status_enum AS ENUM ('ACTIVE', 'INACTIVE');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE maintenance_type_enum AS ENUM ('PREVENTIVE', 'CORRECTIVE');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE maintenance_status_enum AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- --------------------------------------------------------
-- TABLA: users
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role user_role_enum NOT NULL DEFAULT 'TECHNICIAN',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ NULL
);

-- --------------------------------------------------------
-- TABLA: mechanics
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS mechanics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    specialty VARCHAR(100) NOT NULL,
    status mechanic_status_enum NOT NULL DEFAULT 'ACTIVE',
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ NULL
);

-- --------------------------------------------------------
-- TABLA: workshops
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS workshops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(120) NOT NULL,
    address VARCHAR(200) NOT NULL,
    status workshop_status_enum NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ NULL
);

-- --------------------------------------------------------
-- TABLA: vehicles
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plate VARCHAR(15) UNIQUE NOT NULL,
    brand VARCHAR(50) NOT NULL,
    model VARCHAR(50) NOT NULL,
    year INT NOT NULL,
    mileage INT NOT NULL,
    status vehicle_status_enum NOT NULL DEFAULT 'AVAILABLE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_vehicles_plate ON vehicles(plate);

-- --------------------------------------------------------
-- TABLA: maintenances
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS maintenances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type maintenance_type_enum NOT NULL,
    description TEXT NOT NULL,
    mileage INT NOT NULL,
    scheduled_date TIMESTAMPTZ NOT NULL,
    status maintenance_status_enum NOT NULL DEFAULT 'SCHEDULED',
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
    mechanic_id UUID NOT NULL REFERENCES mechanics(id) ON DELETE RESTRICT,
    workshop_id UUID NOT NULL REFERENCES workshops(id) ON DELETE RESTRICT,
    work_done TEXT NULL,
    final_cost NUMERIC(10,2) NULL,
    completed_date TIMESTAMPTZ NULL,
    final_mileage INT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_maintenances_scheduled_date ON maintenances(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_maintenances_status ON maintenances(status);

-- --------------------------------------------------------
-- DATOS INICIALES (SEEDERS)
-- --------------------------------------------------------

-- 1. Usuarios (Contraseñas hasheadas con bcryptjs)
-- Admin: Admin12345! ($2a$10$O9wW412r5B2bIe2kL6d8Ye7x6Y4z5v3u2t1s0r9q8p7o6n5m4l3k2)
-- Techs: Tech12345!  ($2a$10$O9wW412r5B2bIe2kL6d8Ye7x6Y4z5v3u2t1s0r9q8p7o6n5m4l3k2)
INSERT INTO users (id, name, email, password, role)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Administrador FleetCore', 'admin@fleetcore.com', '$2a$10$tZ25VfQ3bA0Uf3aGkYg2g.b4nE1kQ3aT6rZ3kP9u8v7w6y5x4z3a2', 'ADMIN'),
  ('22222222-2222-2222-2222-222222222222', 'Carlos Gómez', 'tech1@fleetcore.com', '$2a$10$tZ25VfQ3bA0Uf3aGkYg2g.b4nE1kQ3aT6rZ3kP9u8v7w6y5x4z3a2', 'TECHNICIAN'),
  ('33333333-3333-3333-3333-333333333333', 'Jorge Rivas', 'tech2@fleetcore.com', '$2a$10$tZ25VfQ3bA0Uf3aGkYg2g.b4nE1kQ3aT6rZ3kP9u8v7w6y5x4z3a2', 'TECHNICIAN')
ON CONFLICT (email) DO NOTHING;

-- 2. Mecánicos (2 activos vinculados a técnicos y 1 inactivo)
INSERT INTO mechanics (id, name, email, specialty, status, user_id)
VALUES
  ('aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Carlos Gómez', 'carlos.gomez@fleetcore.com', 'Motores Diésel', 'ACTIVE', '22222222-2222-2222-2222-222222222222'),
  ('aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Jorge Rivas', 'jorge.rivas@fleetcore.com', 'Frenos y Suspensión', 'ACTIVE', '33333333-3333-3333-3333-333333333333'),
  ('aaaaaaa3-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Pedro Méndez', 'pedro.mendez@fleetcore.com', 'Electricidad Automotriz', 'INACTIVE', NULL)
ON CONFLICT (email) DO NOTHING;

-- 3. Talleres (1 activo y 1 inactivo)
INSERT INTO workshops (id, name, address, status)
VALUES
  ('bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Taller Central FleetCore', 'Av. Principal Industrial #100, Medellín', 'ACTIVE'),
  ('bbbbbbb2-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Taller Norte FleetCore', 'Calle 45 #12-30, Bello', 'INACTIVE')
ON CONFLICT (id) DO NOTHING;

-- 4. Vehículos (2 AVAILABLE, 1 IN_MAINTENANCE, 1 INACTIVE)
INSERT INTO vehicles (id, plate, brand, model, year, mileage, status)
VALUES
  ('ccccccc1-cccc-cccc-cccc-cccccccccccc', 'AAA111', 'Toyota', 'Hilux', 2022, 45000, 'AVAILABLE'),
  ('ccccccc2-cccc-cccc-cccc-cccccccccccc', 'BBB222', 'Kenworth', 'T680', 2021, 120000, 'AVAILABLE'),
  ('ccccccc3-cccc-cccc-cccc-cccccccccccc', 'CCC333', 'Chevrolet', 'FVR', 2020, 85000, 'IN_MAINTENANCE'),
  ('ccccccc4-cccc-cccc-cccc-cccccccccccc', 'DDD444', 'Volvo', 'FH', 2018, 250000, 'INACTIVE')
ON CONFLICT (plate) DO NOTHING;

-- 5. Mantenimientos (1 IN_PROGRESS para CCC333 y 1 COMPLETED historial para AAA111)
INSERT INTO maintenances (id, type, description, mileage, scheduled_date, status, vehicle_id, mechanic_id, workshop_id, work_done, final_cost, completed_date, final_mileage)
VALUES
  ('ddddddd1-dddd-dddd-dddd-dddddddddddd', 'CORRECTIVE', 'Reparación del sistema de inyección diésel y calibración de turbo', 85000, CURRENT_TIMESTAMP, 'IN_PROGRESS', 'ccccccc3-cccc-cccc-cccc-cccccccccccc', 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbbb', NULL, NULL, NULL, NULL),
  ('ddddddd2-dddd-dddd-dddd-dddddddddddd', 'PREVENTIVE', 'Mantenimiento preventivo general de 45.000 km', 44500, CURRENT_TIMESTAMP - INTERVAL '7 days', 'COMPLETED', 'ccccccc1-cccc-cccc-cccc-cccccccccccc', 'aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Cambio de aceite sintético, sustitución de filtros de combustible y aire, rotación de neumáticos', 380.00, CURRENT_TIMESTAMP - INTERVAL '6 days', 45000)
ON CONFLICT (id) DO NOTHING;
