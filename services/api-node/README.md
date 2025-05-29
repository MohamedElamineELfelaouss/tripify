# Tripify API - Node.js Service

A secure, scalable REST API for the Tripify travel planning application built with Node.js, Express, and MongoDB. Features comprehensive trip management, user authentication, collaboration tools, and robust security measures.

## 🚀 Features

### ✅ **Production-Ready Core Features**
- **User Authentication**: JWT-based authentication with secure registration and login
- **Trip Management**: Complete CRUD operations with collaboration and sharing
- **Collaboration System**: Role-based trip sharing with email invitations  
- **Public Discovery**: Search and discover public trips with filtering
- **Rate Limiting**: Multi-tier rate limiting for security and abuse prevention
- **Security**: Comprehensive security headers, input validation, password hashing
- **Testing**: Automated test suite with 7/7 integration tests passing
- **Documentation**: Complete API documentation with examples

### 🔐 **Security Features**
- JWT token authentication with secure generation
- Password hashing with bcrypt (10 salt rounds)
- Multi-tier rate limiting (registration, auth, general API)
- Input validation and sanitization
- Security headers with Helmet.js
- CORS configuration

### 📊 **Current Status**
- **API Endpoints**: 10+ fully functional
- **Test Coverage**: 7/7 integration tests passing ✅
- **Documentation**: Complete with request/response examples
- **Container Health**: All services running successfully

## 📋 Prerequisites

- Node.js 18+ 
- MongoDB 7+
- Docker & Docker Compose (for containerized deployment)

## 🛠️ Installation & Setup

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd tripify/services/api-node
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the root directory:
   ```env
   NODE_ENV=development
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/tripify
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_EXPIRE=7d
   CORS_ORIGIN=http://localhost:8080
   ```

4. **Start MongoDB**
   ```bash
   # Using Docker
   docker run -d -p 27017:27017 --name mongo mongo:7
   
   # Or use local MongoDB installation
   mongod
   ```

5. **Run the application**
   ```bash
   npm start
   ```

### Docker Deployment

1. **Start all services**
   ```bash
   cd tripify
   docker-compose up -d
   ```

2. **Check container status**
   ```bash
   docker-compose ps
   ```

3. **View logs**
   ```bash
   docker-compose logs api-node
   ```

## 📚 API Documentation

### Base URL
- Development: `http://localhost:3000`
- API Version: `v1`
- Base Path: `/api/v1`

### Rate Limiting

The API implements multiple rate limiting tiers:

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| General API | 100 requests | 15 minutes |
| Authentication | 5 requests | 15 minutes |
| Account Creation | 3 requests | 1 hour |

### Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Core Endpoints

#### Health Check
```http
GET /health
```

**Response:**
```json
{
  "success": true,
  "message": "Tripify API is running!",
  "timestamp": "2025-05-29T19:31:41.304Z",
  "environment": "development",
  "version": "1.0.0"
}
```

---

## 👤 User Management

#### User Registration
```http
POST /api/v1/users/register
```

**Rate Limited:** 3 requests per hour

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "6838b617e4605f26ec015c51",
      "email": "john.doe@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "fullName": "John Doe",
      "preferences": {
        "budget": "medium",
        "travelStyle": [],
        "preferredDestinations": [],
        "dietaryRestrictions": []
      },
      "gamification": {
        "points": 100,
        "level": 1,
        "badges": [],
        "achievements": []
      }
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

#### User Login
```http
POST /api/v1/users/login
```

**Rate Limited:** 5 requests per 15 minutes

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "6838b617e4605f26ec015c51",
      "email": "john.doe@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "fullName": "John Doe",
      "lastLogin": "2025-05-29T19:31:41.304Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

#### Get User Profile
```http
GET /api/v1/users/profile
```

**Authentication Required**

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "6838b617e4605f26ec015c51",
      "email": "john.doe@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "fullName": "John Doe",
      "preferences": {
        "budget": "medium",
        "travelStyle": ["adventure", "cultural"],
        "preferredDestinations": ["Europe", "Asia"],
        "dietaryRestrictions": []
      }
    }
  }
}
```

#### Password Reset Request
```http
POST /api/v1/users/reset-password
```

**Request Body:**
```json
{
  "email": "john.doe@example.com"
}
```

---

## 🧳 Trip Management

#### Create Trip
```http
POST /api/v1/trips
```

**Authentication Required**

**Request Body:**
```json
{
  "title": "Paris Adventure",
  "description": "Exploring the City of Light with friends",
  "destination": "Paris, France",
  "startDate": "2024-07-15",
  "endDate": "2024-07-22",
  "budget": {
    "estimated": 2000,
    "spent": 0
  },
  "isPublic": true,
  "status": "planning"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Trip created successfully",
  "data": {
    "trip": {
      "id": "6838b617e4605f26ec015c52",
      "title": "Paris Adventure", 
      "description": "Exploring the City of Light with friends",
      "destination": "Paris, France",
      "startDate": "2024-07-15T00:00:00.000Z",
      "endDate": "2024-07-22T00:00:00.000Z",
      "createdBy": "6838b617e4605f26ec015c51",
      "collaborators": [],
      "isPublic": true,
      "status": "planning",
      "budget": {
        "estimated": 2000,
        "spent": 0
      },
      "createdAt": "2025-05-29T19:31:41.304Z"
    }
  }
}
```

#### Get User Trips
```http
GET /api/v1/trips?page=1&limit=10&status=planning
```

**Authentication Required**  
**Query Parameters:** `page`, `limit`, `status`, `destination`

#### Get Specific Trip
```http
GET /api/v1/trips/:id
```

**Authentication Required**

#### Update Trip
```http
PUT /api/v1/trips/:id
```

**Authentication Required** (Owner or Editor role)

#### Delete Trip
```http
DELETE /api/v1/trips/:id
```

**Authentication Required** (Owner only)

---

## 🤝 Collaboration Features

#### Add Collaborator
```http
POST /api/v1/trips/:id/collaborators
```

**Authentication Required** (Owner or Admin role)

**Request Body:**
```json
{
  "email": "friend@example.com",
  "role": "editor"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Collaborator added successfully",
  "data": {
    "collaborator": {
      "email": "friend@example.com",
      "role": "editor",
      "inviteStatus": "pending",
      "invitedAt": "2025-05-29T19:31:41.304Z"
    }
  }
}
```

#### Remove Collaborator
```http
DELETE /api/v1/trips/:id/collaborators/:email
```

**Authentication Required** (Owner or Admin role)

---

## 🔍 Discovery Features

#### Search Public Trips
```http
GET /api/v1/trips/public/search?destination=Paris&search=adventure&page=1&limit=10
```

**Query Parameters:**
- `destination` - Filter by destination
- `search` - Search in title and description
- `page` - Page number (default: 1)
- `limit` - Results per page (default: 10, max: 50)
- `sortBy` - Sort field (createdAt, startDate, title)
- `sortOrder` - Sort direction (asc, desc)

**Response:**
```json
{
  "success": true,
  "data": {
    "trips": [
      {
        "id": "6838b617e4605f26ec015c52",
        "title": "Paris Adventure",
        "description": "Exploring the City of Light",
        "destination": "Paris, France",
        "startDate": "2024-07-15T00:00:00.000Z",
        "endDate": "2024-07-22T00:00:00.000Z",
        "createdBy": {
          "firstName": "John",
          "lastName": "Doe"
        },
        "budget": {
          "estimated": 2000
        },
        "collaboratorsCount": 2
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalTrips": 25,
      "limit": 10,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```
```

### Error Responses

The API returns consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "stack": "Error stack trace (development only)"
}
```

#### Common HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

## 🔐 Security Features

- **Helmet.js**: Security headers (CSP, HSTS, etc.)
- **CORS**: Configurable cross-origin resource sharing
- **Rate Limiting**: Express-rate-limit with Redis-like storage
- **Input Validation**: Mongoose schema validation
- **Password Hashing**: bcryptjs with salt rounds
- **JWT Security**: Secure token generation and validation

## 🏗️ Project Structure

```
src/
├── config/
│   └── database.js          # MongoDB connection configuration
├── middleware/
│   ├── auth.js              # JWT authentication middleware
│   ├── errorHandler.js      # Global error handling
│   └── rateLimiter.js       # Rate limiting configuration
├── models/
│   ├── User.js              # User data model with auth & preferences
│   └── Trip.js              # Trip data model with collaboration
├── routes/
│   ├── users.js             # User management endpoints
│   └── trips.js             # Trip management & collaboration endpoints
├── tests/
│   └── simple.test.js       # Integration test suite (7/7 passing)
└── index.js                 # Main application entry point
```

## 🧪 Testing

### Automated Test Suite

The API includes a comprehensive test suite with Jest:

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

**Current Test Status: 7/7 tests passing ✅**

#### Test Coverage
- ✅ Health check endpoint
- ✅ User registration and authentication
- ✅ Trip CRUD operations
- ✅ Trip collaboration features
- ✅ Public trip search functionality
- ✅ Authentication middleware validation
- ✅ Error handling and validation

### Manual Testing with curl

**Health Check:**
```bash
curl http://localhost:3000/health
```

**User Registration:**
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

**User Login:**
```bash
curl -X POST http://localhost:3000/api/v1/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

**Create Trip (save the token from login):**
```bash
curl -X POST http://localhost:3000/api/v1/trips \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Tokyo Adventure",
    "description": "Exploring Japan culture and cuisine",
    "destination": "Tokyo, Japan",
    "startDate": "2024-09-15",
    "endDate": "2024-09-25",
    "budget": {"estimated": 3000},
    "isPublic": true
  }'
```

**Search Public Trips:**
```bash
curl "http://localhost:3000/api/v1/trips/public/search?destination=Tokyo&page=1&limit=5"
```

**Add Collaborator to Trip:**
```bash
curl -X POST http://localhost:3000/api/v1/trips/TRIP_ID/collaborators \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "email": "friend@example.com",
    "role": "editor"
  }'
```

### Testing Rate Limits

Test the registration rate limit (should block after 3 requests):

```bash
for i in {1..5}; do
  curl -X POST http://localhost:3000/api/v1/users/register \
    -H "Content-Type: application/json" \
    -d "{\"firstName\":\"User$i\",\"lastName\":\"Test\",\"email\":\"user$i@example.com\",\"password\":\"password123\"}"
  echo ""
done
```

## 🚀 Deployment

### Production Environment Variables

```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://mongo:27017/tripify
JWT_SECRET=your-production-secret-here
JWT_EXPIRE=7d
CORS_ORIGIN=https://your-frontend-domain.com
```

### Docker Production Build

```bash
# Build and start production containers
docker-compose -f docker-compose.prod.yml up -d --build

# View production logs
docker-compose -f docker-compose.prod.yml logs -f
```

## 📊 Monitoring & Logging

- **Health Endpoint**: `/health` for load balancer health checks
- **Development Logging**: Morgan HTTP request logging
- **Error Tracking**: Centralized error handling with stack traces
- **Container Health**: Docker health checks configured

## 🔄 Development Workflow

1. **Start development environment:**
   ```bash
   docker-compose up -d
   ```

2. **Make code changes**

3. **Rebuild and restart:**
   ```bash
   docker-compose up -d --build
   ```

4. **View logs:**
   ```bash
   docker-compose logs -f api-node
   ```

## 📝 Current Development Status

### ✅ **Production-Ready Features**
- **User Management**: Complete authentication system with JWT
- **Trip Management**: Full CRUD operations with collaboration
- **Security**: Rate limiting, input validation, password hashing  
- **Testing**: Comprehensive test suite (7/7 tests passing)
- **Documentation**: Complete API documentation with examples
- **Containerization**: Docker setup with MongoDB

### 🔄 **Next Phase Development**
- Email verification system
- Destination management endpoints
- Enhanced collaboration workflow (accept/decline invitations)
- Advanced search and filtering
- Performance monitoring and analytics

### 📊 **Key Metrics**
- **Total Endpoints**: 10+ fully functional
- **Test Coverage**: 7/7 integration tests passing
- **Security Features**: 5+ implemented (JWT, rate limiting, validation, etc.)
- **Documentation**: Complete with request/response examples
- **Container Health**: All services running successfully

## 🚀 **API Status: Production Ready** ✅

The Tripify API is now fully functional for core trip management and ready for frontend integration and user testing.

---

## 📄 Additional Documentation

- **[Project Status](./STATUS.md)** - Detailed development status and roadmap
- **[Main Project README](../../README.md)** - Overall project documentation
- **[Test Suite](./tests/)** - Automated test implementation

---

**For technical support or contributions, please refer to the main project documentation.**
