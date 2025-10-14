# xR2 Prompt Management Platform

A comprehensive prompt management and analytics platform built with FastAPI, PostgreSQL, and modern web technologies.

## 🚀 Quick Start

### 🖥️ Для сервера (Production)

Запустить ВСЁ в Docker (backend + frontend):

```bash
make up
```

**Готово!** Откройте http://localhost

---

### 💻 Для локальной разработки

Автоматический запуск (backend в Docker + frontend локально):

```bash
./start.sh
```

Или вручную:

```bash
# Терминал 1: Backend в Docker
make up-local

# Терминал 2: Frontend локально
cd prompt-editor && pnpm dev
```

**Готово!** Откройте http://localhost

---

### ⚙️ Основные команды

```bash
make help        # Показать справку
make up          # Запустить ВСЁ для сервера (production)
make up-local    # Запустить только backend для разработки
make down        # Остановить всё
make status      # Показать статус
make logs        # Показать логи
make health      # Проверить здоровье
```

**Полный список команд**: `make help`

---

### 🌐 Доступные URL

- **http://localhost** - Главная страница (пользовательский интерфейс)
- **http://localhost/admin** - Админ панель
- **http://localhost/docs** - API документация
- **http://localhost/admin-docs** - Полное API для админов

---

### 🔐 Учетные данные

- **Username**: `admin`
- **Password**: `admin_secure_password_2024`

⚠️ **ВАЖНО**: Измените пароли в `.env` перед production деплоем!

---

### 📦 Сервисы

| Сервис | Порт | Описание |
|--------|------|----------|
| PostgreSQL | 5432 | База данных |
| Redis | 6379 | Кэш и очереди |
| FastAPI | 8000 | Backend API |
| Next.js | 3000 | Frontend |
| Nginx | 80, 443 | Reverse proxy |

## 🚀 Features

- **Prompt Management**: Create, edit, delete, and version AI prompts
- **Multi-tenancy**: Workspace-based organization for teams
- **Analytics**: Track API usage, performance metrics, and user behavior
- **Admin Interface**: Built-in admin panel for system management
- **REST API**: Comprehensive API for integration
- **Modern UI**: Responsive web interface inspired by PromptLayer

## 🏗️ Architecture

- **Backend**: FastAPI with async/await support
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Admin**: FastAPI Admin with authentication
- **Frontend**: Modern responsive web interface
- **Authentication**: JWT-based security
- **API Documentation**: Automatic OpenAPI/Swagger docs

## 📋 Prerequisites

- Python 3.11+
- PostgreSQL 12+
- Redis 6+ (for caching and background tasks)

## 🛠️ Local Development Setup

### 1. Clone and Setup Environment

```bash
# Clone the repository
git clone <repository-url>
cd xR2

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# On macOS/Linux:
source .venv/bin/activate
# On Windows:
.venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Database Setup

#### Install PostgreSQL

**macOS (using Homebrew):**
```bash
brew install postgresql
brew services start postgresql
brew services stop postgresql
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### Create Database and User

```bash
# Connect to PostgreSQL
sudo -u postgres psql

# In PostgreSQL prompt:
CREATE USER xr2_user WITH PASSWORD 'zvgfoizhQEDN6A6k7WAk08eN';
CREATE DATABASE xr2_db OWNER xr2_user;
GRANT ALL PRIVILEGES ON DATABASE xr2_db TO xr2_user;
\q
```

### 3. Redis Setup (Optional)

**macOS (using Homebrew):**
```bash
brew install redis
brew services start redis
```

**Ubuntu/Debian:**
```bash
sudo apt install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

### 4. Environment Configuration

Create a `.env` file in the project root:

```env
# Database
DATABASE_URL=postgresql+asyncpg://xr2_user:zvgfoizhQEDN6A6k7WAk08eN@localhost:5432/xr2_db

# Security
SECRET_KEY=your-super-secret-key-change-in-production-please
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Admin Credentials
ADMIN_USERNAME=www
ADMIN_PASSWORD=LHaoawJOpxhYfGmP2mHX
ADMIN_EMAIL=admin@xr2.com

# Application
PROJECT_NAME=xR2 Platform
VERSION=1.0.0
DEBUG=true

# Redis
REDIS_URL=redis://localhost:6379/0
```

### 5. Initialize Database

The database will be automatically initialized when you start the application for the first time. Tables will be created and the default admin user will be set up.

### 6. Run the Application

```bash
# Start the development server
python main.py

# Or use uvicorn directly:
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## 📁 Project Structure

```
xR2/
├── app/
│   ├── __init__.py
│   ├── admin/
│   │   ├── __init__.py
│   │   └── admin.py          # FastAPI Admin configuration
│   ├── api/
│   │   ├── __init__.py
│   │   └── prompts.py        # Prompt API endpoints
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py         # Application settings
│   │   ├── database.py       # Database configuration
│   │   └── security.py       # Authentication utilities
│   └── models/
│       ├── __init__.py
│       ├── api_request.py    # API request tracking model
│       ├── prompt.py         # Prompt and version models
│       ├── user.py           # User model
│       └── workspace.py      # Workspace model
├── static/                   # Static files (CSS, JS, images)
├── templates/
│   └── index.html           # Main frontend interface
├── main.py                  # Application entry point
├── requirements.txt         # Python dependencies
├── .env                     # Environment variables
└── README.md               # This file
```

## 🔧 API Usage

### Authentication

Most API endpoints require authentication. The system uses JWT tokens for authentication.

### Prompt Management

#### Create a Prompt

```bash
curl -X POST "http://localhost:8000/internal/prompts/" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Customer Support Assistant",
    "description": "AI assistant for customer support",
    "template": "You are a helpful customer support assistant. Help the user with: {{user_question}}",
    "variables": ["user_question"],
    "category": "chat",
    "tags": ["support", "assistant"],
    "workspace_id": "your-workspace-id"
  }'
```

#### Get All Prompts

```bash
curl "http://localhost:8000/internal/prompts/"
```

#### Get Specific Prompt

```bash
curl "http://localhost:8000/internal/prompts/{prompt_id}"
```

#### Update Prompt

```bash
curl -X PUT "http://localhost:8000/internal/prompts/{prompt_id}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Prompt Name",
    "description": "Updated description"
  }'
```

#### Delete Prompt

```bash
curl -X DELETE "http://localhost:8000/internal/prompts/{prompt_id}"
```

## 🎨 Frontend Features

The web interface provides:

- **Dashboard**: Overview of prompts and usage
- **Prompt Library**: Browse, search, and filter prompts
- **Prompt Editor**: Create and edit prompts with syntax highlighting
- **Version History**: Track prompt changes over time
- **Analytics**: View usage statistics and performance metrics

### Frontend Technology Stack

- **Styling**: Tailwind CSS for responsive design
- **Icons**: Font Awesome for iconography
- **JavaScript**: Vanilla JavaScript for interactivity
- **Design**: Inspired by PromptLayer's clean, modern interface

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Bcrypt for secure password storage
- **Row-Level Security**: Multi-tenant data isolation
- **CORS Configuration**: Configurable cross-origin requests
- **Input Validation**: Pydantic models for data validation

## 📊 Database Schema

### Core Models

1. **Users**: User accounts and authentication
2. **Workspaces**: Multi-tenant organization units
3. **Prompts**: AI prompts with versioning
4. **Prompt Versions**: Historical versions of prompts
5. **API Requests**: Usage tracking and analytics

### Relationships

- Users can belong to multiple workspaces
- Workspaces contain prompts
- Prompts have multiple versions
- API requests track prompt usage

## 🚀 Deployment

### Production Setup

1. **Environment Variables**: Update `.env` with production values
2. **Database**: Use production PostgreSQL instance
3. **Security**: Change default admin credentials
4. **HTTPS**: Configure SSL/TLS certificates
5. **Process Manager**: Use Gunicorn or similar for production

### Docker Deployment (Optional)

```bash
# Build Docker image
docker build -t xr2-platform .

# Run with Docker Compose
docker-compose up -d
```

## 🧪 Testing

```bash
# Run tests (when test suite is added)
pytest

# Run with coverage
pytest --cov=app
```

## 📝 API Documentation

Once the server is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Troubleshooting

### Common Issues

**Database Connection Error:**
- Verify PostgreSQL is running
- Check database credentials in `.env`
- Ensure database and user exist

**Import Errors:**
- Activate virtual environment
- Install dependencies: `pip install -r requirements.txt`

**Admin Login Issues:**
- Check admin credentials in `.env`
- Verify admin user was created during initialization

**Port Already in Use:**
- Change port in `main.py` or use different port:
  ```bash
  uvicorn main:app --port 8001
  ```

### Support

For support and questions, please open an issue in the repository or contact the development team.

## 🔄 Updates and Changelog

### Version 1.0.0
- Initial release
- Core prompt management features
- Admin interface
- REST API
- Modern web UI
- Multi-tenancy support