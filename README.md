# Laboratory Information System (LIS)

A comprehensive Laboratory Information Management System built with Laravel, React, and Inertia.js for modern medical laboratories and diagnostic centers.

## Overview

This LIS provides end-to-end management of laboratory operations: patient registration, sample collection and tracking, test ordering, result reporting, billing, inventory management, and external integrations. The system is organized around Domain-Driven Design principles and is designed for production deployment in regulated healthcare environments.

## Key Features

### Patient & Reception
- Patient registration, profile management, and family relationship tracking
- Test order (acceptance) creation with multi-patient support
- Barcode-based sample collection and tracking
- Sample pooling support

### Laboratory Operations
- Test catalog and panel management with method-level granularity
- Multi-step configurable workflow engine per test section
- Section and department organization
- Quality control approval mechanisms

### Reporting
- Customizable report templates with parameter-based outputs
- Multi-level approval workflow: Report → Approve → Publish
- Digital signatures and stamps
- Batch reporting

### Billing & Finance
- Flexible pricing models: Fixed, Formulated, and Conditional
- Invoice generation with VAT and discount support
- Multiple payment methods and daily cash reporting
- Offer and pricing package management

### Inventory Management
- Item and unit management with conversion rules
- FIFO stock tracking with lot-level traceability
- Supplier and supplier-item pricing catalog
- Purchase request and receipt workflow
- Expiry tracking and reorder alerts
- Bulk import via Excel templates

### Consultation
- Consultant management and appointment scheduling
- Time slot configuration and booking
- Consultation session tracking

### Referrer & External Integration
- External doctor/clinic referrer management
- REST API for external order placement
- Sample collection request tracking
- Material and consumable assignment

### Monitoring
- Mocreo sensor node integration for environmental monitoring
- Temperature and humidity sample recording
- Section-level sensor assignment

### Notifications
- WhatsApp messaging via Twilio
- SMS via Omantel
- Report delivery and appointment reminders

### Security & Compliance
- Role-based access control via Spatie Laravel Permission
- Comprehensive audit logging via user activity records
- Document management system

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Laravel 12.x, PHP 8.2+ |
| Frontend | React 18, Inertia.js 2.0, Material-UI 6 |
| Build | Vite 6 |
| Database | MySQL 8.0+ / PostgreSQL 13+ |
| Auth | Laravel Sanctum 4 |
| Permissions | Spatie Laravel Permission 6 |
| Charts | Recharts 3 |
| Export | Maatwebsite Excel 3.1, PHPOffice PhpWord 1.3 |
| Barcodes | Milon Barcode 12 |
| Messaging | Twilio SDK 8.5 (WhatsApp), Omantel SMS |
| Debugging | Laravel Telescope 5.5 |
| Containers | Docker (PHP 8.2 Alpine, multi-stage build) |

## Requirements

- PHP >= 8.2
- Composer
- Node.js >= 18
- MySQL >= 8.0 or PostgreSQL >= 13

## Installation

### 1. Clone and install dependencies

```bash
git clone <repository-url>
cd lis-2
composer install
npm install
```

### 2. Environment setup

```bash
cp .env.example .env
```

Edit `.env` with your database and service credentials:

```env
APP_NAME="Lab System"
APP_ENV=local
APP_KEY=

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=lis
DB_USERNAME=your_username
DB_PASSWORD=your_password

SESSION_DRIVER=database
QUEUE_CONNECTION=database
CACHE_STORE=database

# Admin account (used by seeder)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=P@ssw0rd

# WhatsApp (optional)
TWILIO_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_FROM=

# SMS (optional)
OMANTEL_API_URL=
OMANTEL_USERNAME=
OMANTEL_PASSWORD=
```

### 3. Generate key and run migrations

```bash
php artisan key:generate
php artisan migrate --seed
```

### 4. Start the development server

Run all services together:

```bash
composer dev
```

This starts `artisan serve`, `queue:listen`, `pail` (log viewer), and `npm run dev` concurrently.

Or start them individually:

```bash
php artisan serve       # App server on :8000
npm run dev             # Vite dev server
php artisan queue:listen
```

### 5. Default login

- **Email**: as set in `ADMIN_EMAIL` (default: `admin@example.com`)
- **Password**: as set in `ADMIN_PASSWORD` (default: `P@ssw0rd`)

## Docker Deployment

The included `Dockerfile` produces a multi-stage production image. The entrypoint supports three container roles via `CONTAINER_ROLE`.

### Build

```bash
docker build -t lis:latest .
```

### Run

**App server:**
```bash
docker run --env-file .env \
  -e CONTAINER_ROLE=app \
  -e MIGRATE_ON_STARTUP=true \
  -p 8000:8000 lis:latest
```

**Queue worker:**
```bash
docker run --env-file .env -e CONTAINER_ROLE=queue lis:latest
```

**Scheduler:**
```bash
docker run --env-file .env -e CONTAINER_ROLE=scheduler lis:latest
```

### Key Docker environment variables

| Variable | Default | Description |
|---|---|---|
| `CONTAINER_ROLE` | `app` | `app`, `queue`, or `scheduler` |
| `MIGRATE_ON_STARTUP` | `false` | Run `migrate` before starting |
| `CLEAR_CACHES_ON_STARTUP` | `false` | Clear all Laravel caches on start |

### Production optimization (non-Docker)

```bash
composer install --optimize-autoloader --no-dev
npm run build
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan queue:work
```

## Project Structure

```
app/
├── Domains/
│   ├── Auth/           # Authentication services and DTOs
│   ├── Billing/        # Invoices, payments, statements
│   ├── Consultation/   # Consultants, appointments, time slots
│   ├── Dashboard/      # KPI aggregation
│   ├── Document/       # File storage and management
│   ├── Inventory/      # Items, stock, suppliers, purchase requests
│   ├── Laboratory/     # Tests, sections, workflows, templates
│   ├── Monitoring/     # Environmental sensor nodes
│   ├── Notification/   # WhatsApp and SMS messaging
│   ├── Reception/      # Patients, acceptances, samples, reports
│   ├── Referrer/       # External doctors, orders, collection
│   ├── Setting/        # System configuration
│   ├── System/         # System-level policies
│   └── User/           # Users, roles, audit log
├── Http/
│   └── Controllers/    # 170+ HTTP controllers
resources/
├── js/
│   ├── Components/     # Shared React components
│   ├── Layouts/        # Page layouts
│   ├── Pages/          # Inertia page components (per domain)
│   └── Services/       # API client helpers
database/
├── migrations/         # 137+ migrations
└── seeders/
routes/
├── web.php             # All web and internal API routes
└── auth.php            # Authentication routes
docker/
├── entrypoint.sh       # Role-based startup script
└── php/                # PHP configuration (OPCache, limits)
```

## Configuration

| File | Purpose |
|---|---|
| `config/permission.php` | Spatie RBAC settings |
| `config/telescope.php` | Debugging tool (disable in production) |
| `config/barcode.php` | Barcode generation settings |
| `.env` | All runtime environment variables |

System settings (VAT rate, discount limits, default services) are stored in the database and editable through the Settings UI.

## Testing

```bash
php artisan test
```

---

**Note**: This is a medical software system. Ensure compliance with applicable healthcare regulations and data protection laws (HIPAA, GDPR, etc.) before deploying in a production environment.
