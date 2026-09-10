---
name: user-authentication
description: Handle user signup and credential verification. Manage user authentication, account creation, and credential validation for secure access.
---

# 🔐 User Authentication Skill

## Overview
The authentication skill manages user account lifecycle including signup, login verification, and credential management. It provides secure access control for the AI Townhall platform.

## Core Responsibilities

### 1. User Signup
- **Create New Account**: `POST /api/auth/signup`
  - Register new user with email and password
  - Optional name parameter
  - Returns created user data
  - Validates email uniqueness
  - Hashes password securely

### 2. Credential Verification
- **Verify Credentials**: `POST /api/auth/verify-credentials`
  - Validates user email and password
  - Used by NextAuth credentials provider
  - Returns user data if valid
  - Returns error if invalid

## Data Models

### SignupRequest
```json
{
  "email": "string (required, must be unique)",
  "password": "string (required)",
  "name": "string (optional)"
}
```

### SignupResponse
```json
{
  "message": "string (confirmation message)",
  "user": {
    "id": "string",
    "name": "string (nullable)",
    "email": "string",
    "image": "string (nullable, user avatar)"
  }
}
```

### VerifyCredentialsRequest
```json
{
  "email": "string (required)",
  "password": "string (required)"
}
```

### VerifyCredentialsResponse
```json
{
  "message": "string (confirmation message)",
  "user": {
    "id": "string",
    "name": "string",
    "email": "string",
    "image": "string"
  }
}
```

### AuthErrorResponse
```json
{
  "error": "string (error description)"
}
```

### AuthUser
```json
{
  "id": "string",
  "name": "string (nullable)",
  "email": "string",
  "image": "string (nullable)"
}
```

## Workflow Instructions

### Signup Flow
1. User submits email, password, and optional name
2. Validate email format
3. Check if email already exists
4. Hash password securely
5. Create user record in database
6. Return created user object
7. User can now login

### Login Verification Flow
1. User submits email and password
2. Find user by email
3. Verify password hash matches
4. Return user object if valid
5. Return error if invalid
6. NextAuth uses for session creation

### Account Creation Best Practices
- Validate email format (RFC 5322)
- Require minimum password strength
- Hash passwords with bcrypt or similar
- Check for duplicate emails before creation
- Generate unique userId

### Credential Verification Best Practices
- Case-insensitive email comparison
- Secure password comparison (constant-time)
- Rate limit verification attempts
- Log failed attempts for security
- Return generic errors to prevent email enumeration

## Error Handling

### Signup Errors
- **400 Bad Request**: 
  - Invalid email format
  - Email already exists
  - Password too weak
  - Missing required fields
- **500 Internal Server Error**: Database or crypto failures

### Verification Errors
- **400 Bad Request**:
  - User not found (generic: "Invalid credentials")
  - Password incorrect (generic: "Invalid credentials")
  - Missing email or password
- **500 Internal Server Error**: Database or verification failures

## Integration Points
- **NextAuth**: Credentials provider integration
- **Thread Management**: Uses userId from auth for thread creation
- **Chat Operations**: Requires authenticated userId
- **Memory System**: Stores user-specific memories
- **Profile Generation**: Creates user profiles

## Security Considerations
1. **Password Storage**: Always hash with strong algorithm
2. **Rate Limiting**: Limit login attempts
3. **HTTPS**: Ensure all auth endpoints use HTTPS
4. **CORS**: Restrict origins appropriately
5. **Token Management**: Use secure session tokens
6. **Email Verification**: Optional email confirmation flow
7. **Password Reset**: Implement secure password recovery

## User Lifecycle
```
New User → Signup → Account Created → Login → Session → Authenticated
                                        ↓
                                   Verification
                                        ↓
                                    Access Granted
```
