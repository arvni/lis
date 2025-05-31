# Laboratory Information System (LIS)

A comprehensive Laboratory Information Management System built with Laravel, React, and Inertia.js for modern medical laboratories and diagnostic centers.

## 📋 Overview

This LIS provides end-to-end management of laboratory operations, from patient registration through sample collection, testing, reporting, and billing. The system is designed to streamline laboratory workflows, ensure quality control, and improve operational efficiency.

## 🎯 Key Features

### Patient Management
- Complete patient registration and profile management
- Patient relationship tracking (family connections)
- Medical history and metadata storage
- Multi-patient sample processing support

### Laboratory Operations
- **Sample Management**: Barcode-based sample tracking and storage
- **Test Catalog**: Comprehensive test and panel management
- **Workflow Engine**: Customizable multi-step laboratory workflows
- **Quality Control**: Built-in QC processes and approval mechanisms
- **Section Management**: Organize laboratory into logical sections/departments

### Clinical Services
- Consultant management and scheduling
- Appointment booking system
- Time slot management
- Consultation tracking

### Reporting System
- Customizable report templates
- Parameter-based reporting
- Multi-level approval workflow (Report → Approve → Publish)
- Digital signatures and stamps
- Batch reporting capabilities

### Billing & Finance
- Flexible pricing models (Fixed, Formulated, Conditional)
- Invoice generation and management
- Multiple payment method support
- Discount and offer management
- VAT calculation support

### External Integration
- Referrer (external doctors/clinics) management
- API support for external order placement
- WhatsApp notification integration
- Document management system

### Security & Compliance
- Role-based access control (RBAC)
- Comprehensive audit logging
- User activity tracking
- Section-specific permissions

## 🛠️ Tech Stack

- **Backend**: Laravel 11.x
- **Frontend**: React 18.x with Inertia.js
- **Database**: MySQL/PostgreSQL
- **Authentication**: Laravel Sanctum
- **Permissions**: Spatie Laravel Permission
- **Development Tools**: Laravel Telescope for debugging

## 📦 Requirements

- PHP >= 8.2
- Composer
- Node.js >= 18.x
- NPM or Yarn
- MySQL >= 8.0 or PostgreSQL >= 13

## 🚀 Installation

### 1. Clone the repository
```bash
git clone https://github.com/your-username/laboratory-information-system.git
cd laboratory-information-system
```

### 2. Install PHP dependencies
```bash
composer install
```

### 3. Install JavaScript dependencies
```bash
npm install
# or
yarn install
```

### 4. Environment Setup
```bash
cp .env.example .env
```

Configure your database and other settings in the `.env` file:
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=lis_database
DB_USERNAME=your_username
DB_PASSWORD=your_password

# Admin credentials
ADMIN_EMAIL=admin@lis.com
ADMIN_PASSWORD=your_secure_password
```

### 5. Generate application key
```bash
php artisan key:generate
```

### 6. Run database migrations and seeders
```bash
php artisan migrate --seed
```

### 7. Build frontend assets
```bash
npm run build
# or for development
npm run dev
```

### 8. Start the development server
```bash
php artisan serve
```

Visit `http://localhost:8000` in your browser.

## 👤 Default Login

- **Username**: admin
- **Password**: (as set in your .env file, default: P@ssw0rd)

## 📚 Usage

### Quick Start Guide

1. **Initial Setup**
    - Configure laboratory sections and workflows
    - Set up test catalog and pricing
    - Create user accounts and assign roles
    - Configure report templates

2. **Daily Operations**
    - Register new patients
    - Create test orders (acceptances)
    - Collect and process samples
    - Enter test results
    - Approve and publish reports
    - Process payments

3. **Administration**
    - Manage users and permissions
    - Configure billing settings
    - Set up referrers and offers
    - Monitor system activity

## 🏗️ Project Structure

```
├── app/
│   ├── Domains/          # Domain-driven design structure
│   │   ├── Billing/      # Billing and payment logic
│   │   ├── Consultation/ # Consultation management
│   │   ├── Laboratory/   # Core laboratory operations
│   │   ├── Reception/    # Patient reception and orders
│   │   ├── Referrer/     # External referrer management
│   │   ├── Setting/      # System settings
│   │   └── User/         # User management
│   └── Http/
│       ├── Controllers/  # HTTP controllers
│       └── Resources/    # API resources
├── database/
│   ├── migrations/       # Database migrations
│   └── seeders/         # Database seeders
├── resources/
│   ├── js/              # React components
│   └── views/           # Blade templates
└── routes/              # Application routes
```

## 🔧 Configuration

### Key Configuration Files

- `config/permission.php` - Role and permission settings
- `config/telescope.php` - Debugging tool configuration
- `.env` - Environment variables

### Important Settings

The system includes configurable settings for:
- Maximum discount percentage
- Minimum payment requirements
- Consultation scheduling
- VAT rates
- Report templates
- Default services

## 🔌 API Documentation

The system provides RESTful APIs for:
- Patient management
- Test orders
- Sample tracking
- Report generation
- External integrations

API documentation can be accessed at `/api/documentation` (if configured).

## 🧪 Testing

```bash
# Run PHP tests
php artisan test

# Run JavaScript tests
npm run test
```

## 🚢 Deployment

### Production Deployment

1. **Optimize for production**
```bash
composer install --optimize-autoloader --no-dev
npm run build
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

2. **Set up queue workers**
```bash
php artisan queue:work
```

3. **Configure web server** (Nginx/Apache)

4. **Set up SSL certificates**

5. **Configure backup strategies**

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the [MIT License](LICENSE).

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Contact the development team at support@yourdomain.com

## 🙏 Acknowledgments

- Built with [Laravel](https://laravel.com/)
- UI powered by [React](https://reactjs.org/) and [Inertia.js](https://inertiajs.com/)
- Permission management by [Spatie Laravel Permission](https://github.com/spatie/laravel-permission)

---

**Note**: This is a medical software system. Ensure compliance with local healthcare regulations and data protection laws (HIPAA, GDPR, etc.) before deployment in production environments.
