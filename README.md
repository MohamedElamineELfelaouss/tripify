"# Tripify 🌍

> **Comprehensive Travel Planning Platform with Collaborative Trip Management**

Tripify is a modern travel planning platform that enables users to create, organize, and collaborate on trips with friends. The platform features trip management, collaboration tools, destination discovery, and user authentication with comprehensive security features.

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Git

### Launch in 1 minute

```bash
git clone <repo-url>
cd tripify
docker compose up --build
```

🌐 **API accessible at:** http://localhost:3000  
📊 **Health check:** http://localhost:3000/health  
🧪 **Test API:** Run tests with `npm test` in `/services/api-node`

## ✨ Current Features

### ✅ **Production-Ready API**
- **User Management**: Complete authentication system with JWT
- **Trip Management**: Full CRUD operations with collaboration
- **Security**: Rate limiting, input validation, password hashing
- **Testing**: Comprehensive test suite (7/7 tests passing)
- **Documentation**: Complete API documentation with examples

### ✅ **Trip Collaboration System**
- Create public or private trips
- Invite collaborators by email with role-based permissions
- Real-time trip sharing and editing
- Budget tracking and management
- Public trip discovery and search

### ✅ **Security & Performance**
- JWT-based authentication
- Multi-tier rate limiting
- Input validation and sanitization
- Docker containerization
- MongoDB with Mongoose ODM

## 📁 Architecture

```
tripify/
├── docker-compose.yml           # Complete container orchestration
├── services/
│   ├── api-node/               # ✅ Production-ready REST API
│   │   ├── src/               # Express + Mongoose + JWT
│   │   ├── tests/             # Jest test suite (7/7 passing)
│   │   └── README.md          # Complete API documentation
│   ├── web-react/             # 🔄 Frontend (Planned)
│   └── reco-python/           # 🔄 Recommendation Engine (Planned)
├── contracts/                 # 🔄 OpenAPI / Proto (Planned)
└── scripts/                   # 🔄 Utilities (Planned)
```

## 🔧 API Services (Port 3000)

### ✅ **User Management**
- User registration with validation
- JWT authentication and authorization  
- Password management (reset, change)
- User profile management
- Rate limiting (3 registration attempts per hour)

### ✅ **Trip Management**  
- Complete CRUD operations for trips
- Trip collaboration with role-based permissions
- Public trip search with filtering and pagination
- Privacy controls (private, friends, public)
- Budget tracking and status management

### Current API Endpoints

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| **Health & Auth** |
| GET | `/health` | API health check | ✅ |
| POST | `/api/v1/users/register` | User registration | ✅ |
| POST | `/api/v1/users/login` | User login | ✅ |
| GET | `/api/v1/users/profile` | Get user profile | ✅ |
| PUT | `/api/v1/users/profile` | Update user profile | ✅ |
| POST | `/api/v1/users/reset-password` | Request password reset | ✅ |
| POST | `/api/v1/users/change-password` | Change password | ✅ |
| **Trip Management** |
| POST | `/api/v1/trips` | Create new trip | ✅ |
| GET | `/api/v1/trips` | Get user trips (paginated) | ✅ |
| GET | `/api/v1/trips/:id` | Get specific trip | ✅ |
| PUT | `/api/v1/trips/:id` | Update trip | ✅ |
| DELETE | `/api/v1/trips/:id` | Delete trip | ✅ |
| **Collaboration** |
| POST | `/api/v1/trips/:id/collaborators` | Add collaborator | ✅ |
| DELETE | `/api/v1/trips/:id/collaborators/:email` | Remove collaborator | ✅ |
| **Discovery** |
| GET | `/api/v1/trips/public/search` | Search public trips | ✅ |

## 🧪 Testing & Validation

### Automated Testing
```bash
cd services/api-node
npm test
```
**Current Status:** 7/7 integration tests passing ✅

### Manual Testing with curl

#### Health Check
```bash
curl http://localhost:3000/health
```

#### User Registration
```bash
curl -X POST http://localhost:3000/api/v1/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

#### User Login
```bash
curl -X POST http://localhost:3000/api/v1/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com", 
    "password": "password123"
  }'
```

#### Create a Trip (with JWT token)
```bash
curl -X POST http://localhost:3000/api/v1/trips \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Paris Adventure",
    "description": "Exploring the City of Light",
    "destination": "Paris, France",
    "startDate": "2024-07-15",
    "endDate": "2024-07-22",
    "budget": {"estimated": 2000},
    "isPublic": true
  }'
```

#### Search Public Trips
```bash
curl "http://localhost:3000/api/v1/trips/public/search?destination=Paris&page=1&limit=10"
```

## 🛠 Development Commands

```bash
# Start all services
docker compose up -d

# Rebuild specific service
docker compose up --build api-node

# View real-time logs
docker compose logs -f api-node

# Run tests
cd services/api-node && npm test

# Clean shutdown
docker compose down
```

## 📊 Technical Stack

### Backend (Production Ready)
- **Runtime:** Node.js 18+ with ES modules
- **Framework:** Express.js with comprehensive middleware
- **Database:** MongoDB 7 with Mongoose ODM
- **Authentication:** JWT with bcrypt password hashing
- **Security:** Helmet.js, CORS, multi-tier rate limiting
- **Testing:** Jest with integration test suite
- **Containerization:** Docker & Docker Compose

### Security Features
- ✅ JWT-based authentication with secure token generation
- ✅ Password hashing with bcrypt (10 salt rounds)
- ✅ Rate limiting: 3 registrations/hour, 5 logins/15min, 100 API calls/15min
- ✅ Input validation and sanitization with Mongoose schemas
- ✅ Security headers with Helmet.js
- ✅ CORS configuration for cross-origin requests

## 🎯 Current Status & Roadmap

### ✅ **Phase 1: Core API (COMPLETED)**
- User authentication and management
- Trip CRUD operations with collaboration
- Security implementation
- Testing infrastructure
- Complete documentation

### 🔄 **Phase 2: Enhanced Features (IN PROGRESS)**
- Email verification system
- Destination management endpoints
- Enhanced collaboration workflow (accept/decline invitations)
- Advanced search and filtering

### 📋 **Phase 3: Platform Expansion (PLANNED)**
- Frontend React application with modern UI
- Recommendation engine (Python/FastAPI)
- Mobile optimization
- Payment integration for bookings
- Social features and gamification

### 🚀 **Phase 4: Production Deployment (PLANNED)**
- CI/CD pipeline setup
- Production hosting configuration
- Performance monitoring
- Scaling and optimization

## 📈 Project Metrics

- **API Endpoints:** 10+ fully functional
- **Test Coverage:** 7/7 integration tests passing
- **Security Features:** 5+ implemented
- **Documentation:** Complete with examples
- **Container Health:** All services running successfully

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes with proper testing
4. Update documentation as needed
5. Submit a pull request

## 📝 Documentation

For detailed documentation, see:
- **[API Service README](./services/api-node/README.md)** - Complete endpoint documentation
- **[Development Status](./services/api-node/STATUS.md)** - Current development status and tasks
- **[Database Architecture](./docs/DATABASE_ARCHITECTURE.md)** - MongoDB file structure & production patterns

---

**Developed with ❤️ by the Tripify team**" 
