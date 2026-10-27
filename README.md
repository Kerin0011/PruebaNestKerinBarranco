# FleetCore API — Vehicle Fleet Maintenance Management System

> **Performance Assessment — Module 6.2 NestJS**  
> **Author:** Kerin Barranco Martinez  
> **Clan:** NodePM  
> **GitHub Repository:** [https://github.com/Kerin0011/PruebaNestKerinBarranco](https://github.com/Kerin0011/PruebaNestKerinBarranco)

---

## 1. Project Overview

**FleetCore** is a comprehensive RESTful API built with **NestJS 12**, **TypeScript** (Strict ESM), **TypeORM**, and **PostgreSQL 17** designed to manage the entire lifecycle of enterprise vehicle fleet maintenances. 

This solution replaces spreadsheets and manual records with an automated, transactional, and secure backend supporting:
- Fleet vehicle inventory management and availability tracking.
- Mechanics and authorized repair workshops directory.
- Preventive and corrective maintenance scheduling with mechanic and workshop allocation.
- Maintenance lifecycle status transitions (`SCHEDULED` ➔ `IN_PROGRESS` ➔ `COMPLETED` / `CANCELLED`).
- Automatic synchronization of vehicle availability based on ongoing interventions.
- Work completion logs: description, odometer mileage, final cost, and completion date.
- Vehicle maintenance history queries (by UUID or license plate).
- Role-Based Access Control (**RBAC**) for `ADMIN` and `TECHNICIAN` roles using JWT authentication and password hashing with **bcryptjs**.
- External system integration protected via **API Key** headers.

---

## 2. Technology Stack

- **Framework:** NestJS 12 (Modular Architecture, ECMAScript Modules - ESM, Strict Mode TypeScript).
- **Database & ORM:** PostgreSQL 17 with TypeORM.
- **Authentication & Security:**
  - JWT Authentication via `@nestjs/jwt`.
  - Password hashing with **bcryptjs** (10 salt rounds).
  - RBAC authorization with `@Roles()`, `RolesGuard`, and `JwtAuthGuard`.
  - External system authentication via `x-api-key` header (`ApiKeyGuard`).
  - Security headers with **helmet** and **CORS** enabled.
- **Validation & Transformation:**
  - Runtime environment validation with **Zod** (`envSchema`).
  - DTO validation and casting with **class-validator** and **class-transformer**.
- **API Documentation:** Interactive Swagger UI at `/docs`.
- **Testing:** Automated unit and end-to-end (E2E) testing with **Vitest** and **Supertest**.
- **Containerization:** Docker Compose setup with isolated development and testing databases.

---

## 3. Prerequisites

- **Node.js**: v24.15+ LTS (or Node 26)
- **Docker Desktop / Docker Compose**: Running for PostgreSQL databases
- **Git**

---

## 4. Installation & Getting Started

### Step 1: Clone the repository
```bash
git clone https://github.com/Kerin0011/PruebaNestKerinBarranco.git
cd PruebaNestKerinBarranco
```

### Step 2: Configure Environment Variables
```bash
cp .env.example .env
```
Ensure your database credentials and ports match your local environment:
- `DB_PORT`: Default PostgreSQL port (`5433`)
- `DB_NAME`: Database name (`prueba_db`)

### Step 3: Start PostgreSQL with Docker
```bash
docker compose up -d db
```

### Step 4: Install Dependencies
```bash
npm install
```

### Step 5: Run Database Seeder (Initial Data)
```bash
npm run seed
```

### Step 6: Start the Development Server
```bash
npm run start:dev
```

- **Base API URL:** `http://localhost:3000/api`
- **Interactive Swagger Documentation:** `http://localhost:3000/docs`

---

## 5. Seeded Test Credentials

The database comes pre-populated with idempotent test data:

| Role | Email | Password | Description |
|---|---|---|---|
| **ADMIN** | `admin@fleetcore.com` | `Admin12345!` | Full administrative privileges |
| **TECHNICIAN** | `tech1@fleetcore.com` | `Tech12345!` | Technician Carlos Gómez (Linked to Mechanic 1) |
| **TECHNICIAN** | `tech2@fleetcore.com` | `Tech12345!` | Technician Jorge Rivas (Linked to Mechanic 2) |

### External Integration API Key
- **Header:** `x-api-key: fleetcore-secret-api-key-2026`
- **Protected Endpoints:** `/api/integrations/fleet-status` and `/api/integrations/active-maintenances`

### Initial Seed Data Summary
- **Mechanics (3):**
  - Carlos Gómez (`ACTIVE`, linked to `tech1@fleetcore.com`, Specialty: Diesel Engines).
  - Jorge Rivas (`ACTIVE`, linked to `tech2@fleetcore.com`, Specialty: Brakes & Suspension).
  - Pedro Méndez (`INACTIVE`, Specialty: Automotive Electricity).
- **Workshops (2):**
  - Central Workshop FleetCore (`ACTIVE`).
  - North Workshop FleetCore (`INACTIVE`).
- **Vehicles (4):**
  - `AAA111` (Toyota Hilux, 45,000 km, status: `AVAILABLE`).
  - `BBB222` (Kenworth T680, 120,000 km, status: `AVAILABLE`).
  - `CCC333` (Chevrolet FVR, 85,000 km, status: `IN_MAINTENANCE` with active `IN_PROGRESS` maintenance).
  - `DDD444` (Volvo FH, 250,000 km, status: `INACTIVE`).
- **Maintenances:**
  - 1 in `IN_PROGRESS` status for vehicle `CCC333`.
  - 1 in `COMPLETED` status for vehicle `AAA111` with full intervention history.

---

## 6. API Endpoints & Requirement Mapping

### Vehicles (`/api/vehicles`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/vehicles` | `ADMIN` | Register a new vehicle in the fleet |
| `GET` | `/api/vehicles` | Authenticated | List vehicles with search, status filters, and pagination |
| `GET` | `/api/vehicles/:term` | Authenticated | Get vehicle by UUID or license plate (includes maintenances) |
| `GET` | `/api/vehicles/:term/maintenances` | Authenticated | Query maintenance history for a specific vehicle |
| `PATCH` | `/api/vehicles/:id` | `ADMIN` | Update vehicle details |
| `DELETE` | `/api/vehicles/:id` | `ADMIN` | Soft delete / inactivate vehicle |

### Mechanics (`/api/mechanics`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/mechanics` | `ADMIN` | Register a new mechanic |
| `GET` | `/api/mechanics` | Authenticated | List mechanics with specialty, status filters, and pagination |
| `GET` | `/api/mechanics/:id` | Authenticated | Get mechanic details by ID |
| `PATCH` | `/api/mechanics/:id` | `ADMIN` | Update mechanic information |
| `PATCH` | `/api/mechanics/:id/toggle-status` | `ADMIN` | Toggle mechanic status (`ACTIVE` / `INACTIVE`) |

### Workshops (`/api/workshops`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/workshops` | `ADMIN` | Register an authorized repair workshop |
| `GET` | `/api/workshops/active` | Authenticated | List only active workshops available for scheduling |
| `GET` | `/api/workshops` | Authenticated | List all workshops with pagination and filters |
| `GET` | `/api/workshops/:id` | Authenticated | Get workshop by ID |
| `PATCH` | `/api/workshops/:id` | `ADMIN` | Update workshop information |
| `PATCH` | `/api/workshops/:id/toggle-status` | `ADMIN` | Toggle workshop status (`ACTIVE` / `INACTIVE`) |

### Maintenances (`/api/maintenances`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/maintenances` | `ADMIN` | Create maintenance (`PREVENTIVE` / `CORRECTIVE`), allocate mechanic and workshop |
| `GET` | `/api/maintenances` | Authenticated | List maintenances with pagination, status, and vehicle filters |
| `GET` | `/api/maintenances/active` | Authenticated | Query active maintenances (`SCHEDULED` or `IN_PROGRESS`) |
| `GET` | `/api/maintenances/my-assigned` | `TECHNICIAN`, `ADMIN` | Query maintenances assigned to the currently logged-in technician |
| `GET` | `/api/maintenances/vehicle/:term` | Authenticated | Query full maintenance history of a vehicle by UUID or license plate |
| `GET` | `/api/maintenances/mechanic/:id` | Authenticated | Query maintenances assigned to a specific mechanic |
| `GET` | `/api/maintenances/:id` | Authenticated | Get maintenance details by ID |
| `PATCH` | `/api/maintenances/:id` | `ADMIN` | Update scheduled maintenance data before execution |
| `PATCH` | `/api/maintenances/:id/status` | `ADMIN`, `TECHNICIAN` | Transition status (`IN_PROGRESS`, `COMPLETED`, `CANCELLED`). Updates vehicle availability |
| `DELETE` | `/api/maintenances/:id` | `ADMIN` | Cancel maintenance and release vehicle |

### Authentication & Users (`/api/auth`, `/api/users`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register new technician user |
| `POST` | `/api/auth/login` | Public | Authenticate user and obtain JWT Bearer token |
| `GET` | `/api/users/me` | Authenticated | Retrieve current user profile |
| `GET` | `/api/users` | `ADMIN` | List all system users |

### External Integrations (`/api/integrations`)
| Method | Endpoint | Header | Description |
|---|---|---|---|
| `GET` | `/api/integrations/fleet-status` | `x-api-key` | Fleet vehicle availability summary for external ERP systems |
| `GET` | `/api/integrations/active-maintenances` | `x-api-key` | Active ongoing maintenance interventions |

---

## 7. Business Rules & Lifecycle Logic

1. **Scheduling Constraints:**
   - Inactive vehicles (`INACTIVE`) cannot be scheduled for maintenance.
   - A vehicle cannot have two concurrent active maintenances (`SCHEDULED` or `IN_PROGRESS`).
   - The initial recorded mileage cannot be lower than the current vehicle odometer.
   - Assigned mechanics and workshops must exist and be in `ACTIVE` status.
   - Mechanics cannot have overlapping active assignments.

2. **State Machine & Vehicle Availability Synchronization:**
   - Transition to `IN_PROGRESS`: Automatically changes vehicle status to `IN_MAINTENANCE` (Unavailable).
   - Transition to `COMPLETED`: Automatically updates vehicle status back to `AVAILABLE` and updates the odometer mileage.
   - Transition to `CANCELLED`: If the vehicle was `IN_MAINTENANCE`, releases it back to `AVAILABLE`.
   - Terminal states: Interventions in `COMPLETED` or `CANCELLED` status cannot be moved back to previous states.

3. **Completion Validation:**
   - Transitioning to `COMPLETED` requires all 4 completion fields: `workDone` (or `description`), `finalCost` (or `cost`), `completedDate`, and `finalMileage` (or `mileage`).
   - The final mileage cannot be lower than the starting maintenance mileage.

---

## 8. Automated Testing (Vitest)

```bash
# Run all unit tests
npm run test

# Run tests with coverage report
npm run test:cov

# Run End-to-End (E2E) integration tests
npm run test:e2e
```

---

## 9. Postman Collection

Import the included file:
```
postman_collection.json
```
The collection includes pre-configured environment variables (`baseUrl`, `token`, `apiKey`) and test scripts that automatically capture and inject the JWT token into subsequent requests.
