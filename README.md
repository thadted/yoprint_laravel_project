# Yoprint Laravel Project

## Getting Started

### 1. Clone the repository
```bash
# Clone this repo and cd into the project directory
$ git clone <your-repo-url>
$ cd yoprint_laravel_project/app
```

### 2. Install dependencies
```bash
# Install PHP dependencies
$ composer install

# Install Node dependencies (if using frontend assets)
$ npm install
```

### 3. Environment setup
- Copy `.env.example` to `.env` and configure your database and other environment variables as needed.
- Generate application key:
```bash
$ php artisan key:generate
```

### 4. Database setup
```bash
# Run migrations and seeders
$ php artisan migrate --seed
```

### 5. Start the application
```bash
# Start the Laravel development server
$ php artisan serve

# Start the queue worker (for file processing, status updates, etc.)
$ php artisan queue:work

# Start Laravel Reverb (for real-time broadcasting)
$ php artisan reverb:start
```

### 6. Build frontend assets (if needed)
```bash
# For development
$ npm run dev
# For production
$ npm run build
```

---

## Default Admin Login
- **Email:** `admin@yoprint.com`
- **Password:** `password`

---

