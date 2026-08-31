# Secure Authentication System

A production-oriented authentication and session management backend built with Node.js, Express.js, MongoDB, and JWT. Designed to demonstrate modern security best practices and scalable architecture patterns.

## Overview

This project implements a complete authentication system with advanced features including JWT-based access and refresh tokens, refresh token rotation, session management, and role-based access control (RBAC). It serves as a reference implementation for secure backend authentication.

## Features

### Authentication
- **JWT-based Authentication**: Industry-standard JSON Web Token (JWT) implementation
- **Access & Refresh Tokens**: Short-lived access tokens paired with long-lived refresh tokens
- **Refresh Token Rotation**: Automatic token rotation on refresh to prevent token reuse attacks
- **HTTP-only Cookies**: Secure storage of tokens in HTTP-only cookies (XSS protection)

### Session Management
- **Session Tracking**: User sessions tracked in MongoDB with creation and expiration timestamps
- **Session Lifecycle**: Automatic session management with configurable expiration
- **Multi-device Support**: Users can maintain multiple active sessions

### Security
- **Password Hashing**: bcrypt for secure password storage (salted hashing)
- **Token Secrets**: Configurable strong secrets for token signing
- **Error Handling**: Custom error types prevent information leakage
- **Async Error Wrapper**: Global error handling middleware catches async errors
- **RBAC**: Role-based access control implementation for authorization

### Code Quality
- **Modular Architecture**: Separation of concerns with controllers, services, models, and middleware
- **Global Error Middleware**: Centralized error handling
- **Async Handler**: Middleware wrapper for cleaner async error handling
- **Validation Middleware**: Request validation layer

## Tech Stack

### Runtime & Framework
- **Node.js**: JavaScript runtime
- **Express.js 5.2.1**: Web framework

### Database & ODM
- **MongoDB**: NoSQL database (Atlas cloud-hosted)
- **Mongoose 9.7.4**: MongoDB Object Data Modeling library

### Authentication & Security
- **jsonwebtoken 9.0.3**: JWT creation and verification
- **bcrypt 6.0.0**: Password hashing and salting
- **cookie-parser 1.4.7**: Cookie parsing and handling
- **dotenv 17.4.2**: Environment variable management

### Development
- **nodemon**: Auto-restart development server

## Architecture

### Project Structure

```
authSystem/
├── server.js                      # Application entry point
├── package.json                   # Dependencies and scripts
├── .env                          # Environment variables (git-ignored)
├── .env.example                  # Template for environment setup
├── .gitignore                    # Git security rules
│
└── src/
    ├── app.js                    # Express app configuration
    │
    ├── config/
    │   └── db.js                 # MongoDB connection setup
    │
    ├── controllers/              # HTTP request handlers
    │   ├── auth.controller.js
    │   └── user.controller.js
    │
    ├── models/                   # Mongoose schemas
    │   ├── user.model.js
    │   └── session.model.js
    │
    ├── services/                 # Business logic layer
    │   ├── auth.service.js
    │   ├── user.service.js
    │   ├── token.service.js
    │   └── session.service.js
    │
    ├── routes/                   # API endpoints
    │   ├── auth.route.js
    │   └── user.route.js
    │
    ├── middlewares/              # Express middleware
    │   ├── auth.middleware.js    # JWT verification
    │   ├── error.middleware.js   # Global error handler
    │   ├── validate.middleware.js # Request validation
    │   └── asyncHandler.js       # Async error wrapper
    │
    ├── errors/                   # Custom error classes
    │   ├── ApiError.js
    │   ├── ConflictError.js
    │   └── UnauthorizedError.js
    │
    └── utils/                    # Utility functions
```

### Layer Responsibilities

| Layer | Purpose | Responsibility |
|-------|---------|-----------------|
| **Controller** | HTTP handlers | Parse request, call service, format response |
| **Service** | Business logic | Authentication flow, validation, token generation |
| **Model** | Data schema | MongoDB document structure, validation |
| **Middleware** | Cross-cutting | Auth check, error handling, validation |
| **Error** | Error handling | Type-specific error responses |

## Authentication Flow

### User Registration

```
1. Client sends: { email, password, name }
   ↓
2. Controller receives request
   ↓
3. Service layer:
   - Validate input
   - Check email uniqueness
   - Hash password with bcrypt
   - Create user document
   ↓
4. Return success response
```

### User Login

```
1. Client sends: { email, password }
   ↓
2. Controller receives request
   ↓
3. Service layer:
   - Find user by email
   - Compare password with bcrypt
   - Generate access token (15m expiration)
   - Generate refresh token (30d expiration)
   - Create session document
   - Store tokens in HTTP-only cookies
   ↓
4. Return authenticated response
```

### Protected Route Access

```
1. Client sends request with cookie
   ↓
2. Auth middleware:
   - Extract token from cookie
   - Verify JWT signature
   - Check token expiration
   - Attach user info to request
   ↓
3. If valid: proceed to controller
   If invalid: return 401 Unauthorized
```

### Token Refresh

```
1. Client sends: { refreshToken }
   ↓
2. Service layer:
   - Verify refresh token
   - Check if token was already rotated (prevent reuse)
   - Mark old token as used
   - Generate new access token
   - Generate new refresh token
   ↓
3. Return new tokens
   ↓
4. If attempted reuse detected: revoke all sessions
```

## Access & Refresh Tokens

### Access Token
- **Purpose**: Authenticate API requests
- **Expiration**: 15 minutes (configurable)
- **Storage**: HTTP-only cookie
- **Risk**: Moderate (short lifespan limits exposure)

### Refresh Token
- **Purpose**: Obtain new access tokens without re-login
- **Expiration**: 30 days (configurable)
- **Storage**: HTTP-only cookie + Database
- **Risk**: Requires rotation to prevent reuse attacks

### Token Payload (JWT Claims)

```javascript
{
  userId: ObjectId,
  email: string,
  iat: timestamp,     // issued at
  exp: timestamp      // expiration
}
```

## Refresh Token Rotation

Implements a secure refresh token rotation strategy:

1. **First Refresh**: User exchanges refresh token for new access + refresh tokens
2. **Rotation**: Old refresh token marked as "rotated" in database
3. **Reuse Detection**: If old token presented again, indicates compromise
4. **Response**: Invalidate all sessions for that user (force re-login)

**Benefits**:
- Detects and prevents token replay attacks
- Limits window of exposure if token is stolen
- Forces attacker detection when reuse is attempted

**Trade-off**:
- Cannot use same token twice (by design)
- Valid if user legitimately needs multiple simultaneous refreshes (rare)

## Session Management

### Session Document (MongoDB)

```javascript
{
  userId: ObjectId,
  refreshToken: string,
  rotated: boolean,
  createdAt: timestamp,
  expiresAt: timestamp
}
```

### Session Lifecycle

1. **Creation**: Created when user logs in
2. **Validation**: Checked on every refresh token use
3. **Rotation**: Marked as rotated during refresh
4. **Expiration**: Automatically deleted by MongoDB TTL index

### Multi-Device Behavior

- Each login creates a separate session
- User can have multiple active sessions across devices
- Each refresh uses that session's refresh token
- Logging out invalidates only that session

## RBAC (Role-Based Access Control)

Roles control what operations a user can perform.

### Supported Roles

- **user**: Standard user permissions
- **admin**: Administrative privileges

### Implementation

**User Model**:
```javascript
{
  email: string,
  role: "user" | "admin",
  ...
}
```

**Middleware Protection**:
```javascript
app.get('/api/admin/users', requireRole('admin'), handler);
```

### Authorization Strategy

Each protected route specifies required role(s). Middleware checks user's role before granting access.

**Planned Enhancement**: Implement fine-grained permissions (create, read, update, delete per resource).

## Security Decisions

### Why HTTP-only Cookies?

- **XSS Protection**: JavaScript cannot access HTTP-only cookies, preventing theft via DOM manipulation
- **CSRF Protection**: Cookies automatically included in requests from same origin only
- **Storage**: More secure than localStorage (vulnerable to XSS)

### Why Refresh Token Rotation?

- **Replay Prevention**: Reusing a rotated token triggers account lockout
- **Limited Exposure**: Stolen tokens can only be used once
- **Attack Detection**: Administrators alerted when rotation reuse detected

### Why JWT?

- **Stateless**: Server doesn't need to store all tokens (scales horizontally)
- **Self-contained**: Token carries user info, reduces database lookups
- **Standard**: Wide ecosystem and cross-platform compatibility
- **Note**: Still store refresh tokens in database for rotation tracking

### Why Separate Access + Refresh?

- **Security**: Access token short-lived (limits damage if compromised)
- **UX**: User doesn't re-login while refresh token valid
- **Control**: Server can invalidate all tokens by rotating refresh token

## API Endpoints

### Authentication Routes

#### `POST /api/v1/auth/register`
Register a new user.

**Request**:
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": "ObjectId",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

#### `POST /api/v1/auth/login`
Login and receive tokens.

**Request**:
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response** (200 OK, sets HTTP-only cookies):
```json
{
  "success": true,
  "message": "User logged in successfully",
  "user": {
    "id": "ObjectId",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

**Cookies Set**:
- `accessToken`: JWT with 15m expiration
- `refreshToken`: JWT with 30d expiration

#### `POST /api/v1/auth/refresh`
Get new access token using refresh token.

**Request**:
Automatically includes `refreshToken` cookie

**Response** (200 OK, sets new cookies):
```json
{
  "success": true,
  "message": "Token refreshed successfully"
}
```

#### `POST /api/v1/auth/logout`
Logout and invalidate session.

**Request**:
Automatically includes cookies

**Response** (200 OK):
```json
{
  "success": true,
  "message": "User logged out successfully"
}
```

### User Routes

#### `GET /api/v1/users/profile`
Get authenticated user's profile.

**Request**:
Automatically includes `accessToken` cookie

**Response** (200 OK):
```json
{
  "success": true,
  "user": {
    "id": "ObjectId",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user"
  }
}
```

#### `PUT /api/v1/users/profile`
Update user profile.

**Request**:
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "user": { ... }
}
```

#### `POST /api/v1/users/change-password`
Change user password.

**Request**:
```json
{
  "oldPassword": "current...",
  "newPassword": "secure..."
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

## Environment Variables

### Required Variables

Create a `.env` file in the project root (see `.env.example`):

```env
# MongoDB Connection
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/authSystem

# JWT Secrets (generate strong random strings)
ACCESS_TOKEN_SECRET=your_access_token_secret_here
REFRESH_TOKEN_SECRET=your_refresh_token_secret_here

# Token Expiration
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=30d

# Environment
NODE_ENV=development
```

### Environment-Specific Configuration

**Development** (`NODE_ENV=development`):
- Detailed error logging
- MongoDB connection string to dev cluster
- Relaxed CORS settings

**Production** (`NODE_ENV=production`):
- Minimal error logging (security)
- MongoDB connection to production cluster
- Strict CORS configuration
- Enhanced cookie security (Secure, SameSite)

### Generating Secrets

Generate cryptographically secure secrets:

```bash
# macOS/Linux
openssl rand -hex 32

# Windows PowerShell
[Convert]::ToHexString([byte[]](1..32 | ForEach-Object {Get-Random -Max 256}))

# Node.js (any platform)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Installation

### Prerequisites

- Node.js 16+ 
- MongoDB (local or Atlas cloud)
- npm or yarn

### Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/adityaBahekar/secure-authentication-system.git
   cd secure-authentication-system
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your MongoDB URI and secrets
   ```

4. **Verify setup**:
   ```bash
   npm run dev
   # Server should start on http://localhost:3000
   ```

## Running Locally

### Development Server

Start with auto-reload on file changes:

```bash
npm run dev
```

Output:
```
Server is running on port 3000
```

### Production Build

```bash
NODE_ENV=production node server.js
```

### Testing the API

Use Postman, cURL, or REST Client:

```bash
# Register
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","name":"Test User"}'

# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'

# Get profile
curl -X GET http://localhost:3000/api/v1/users/profile \
  -H "Cookie: accessToken=<your_token_here>"
```

## Project Structure

Key files and their responsibilities:

| File | Purpose |
|------|---------|
| `server.js` | Node.js process entry point |
| `src/app.js` | Express app setup, middleware registration |
| `src/config/db.js` | MongoDB connection |
| `src/models/user.model.js` | User schema and validation |
| `src/models/session.model.js` | Session schema and TTL index |
| `src/services/auth.service.js` | Authentication business logic |
| `src/services/token.service.js` | JWT token generation and verification |
| `src/services/session.service.js` | Session lifecycle management |
| `src/middlewares/auth.middleware.js` | JWT validation middleware |
| `src/middlewares/error.middleware.js` | Global error handler |
| `src/controllers/auth.controller.js` | Auth endpoint handlers |
| `src/errors/ApiError.js` | Base error class |

## Future Improvements

### Security Enhancements
- [ ] Rate limiting on login attempts
- [ ] Account lockout after failed attempts
- [ ] Email verification on registration
- [ ] Two-factor authentication (2FA)
- [ ] Helmet.js for HTTP security headers
- [ ] CORS hardening for production

### Features
- [ ] User profile picture support
- [ ] Email change verification flow
- [ ] Password reset via email
- [ ] Social login (OAuth: GitHub, Google)
- [ ] API key authentication for service accounts
- [ ] Audit logging for security events

### Testing
- [ ] Unit tests (Jest)
- [ ] Integration tests
- [ ] End-to-end tests
- [ ] Security test suite

### Operations
- [ ] Docker containerization
- [ ] Kubernetes deployment configuration
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Monitoring and alerting
- [ ] Database backup automation

### Code Quality
- [ ] TypeScript migration
- [ ] API documentation (OpenAPI/Swagger)
- [ ] Input sanitization library
- [ ] Request validation library
- [ ] Performance optimization and caching

## Learning Resources

This project demonstrates:
- RESTful API design patterns
- Layered application architecture
- Secure token management
- MongoDB/Mongoose best practices
- Express.js middleware patterns
- Error handling strategies
- Authentication flow implementation

## License

ISC

## Author

Aditya Bahekar

---

**Last Updated**: September 2026  
**Repository**: https://github.com/adityaBahekar/secure-authentication-system  
**Status**: Active Development
