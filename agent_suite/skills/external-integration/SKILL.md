---
name: external-integration
description: Using pre-configured skills folder in external projects (everything ready to use)
---

# External Integration

## Overview

This skill explains how to **use this `skills` folder in external projects** when everything is already pre-configured.

**When to use this:**
- You're copying this `skills` folder to a separate external project
- You want to call AI Townhall APIs from your external system
- You have a pre-configured environment with `.env.local`, API client, and examples

**What's different from normal setup:**
- ✅ `.env.local` is already created (not just `.env.example`)
- ✅ API client is pre-built (`src/apiClient.ts`)
- ✅ Working examples are included (`src/examples.ts`)
- ✅ No setup required — just use what's ready

---

## Architecture

### System Topology

```
┌─────────────────────────────────────────────────────────┐
│ Your External Project                                   │
│ (Separate repo, separate AI agent, etc.)                │
│                                                          │
│  • copies this skills folder                            │
│  • uses pre-built API client                            │
│  • reads from .env.local (pre-configured)               │
│  • calls APIs immediately                               │
└──────────────────────┬──────────────────────────────────┘
                       │
                       │ HTTP/HTTPS
                       │ (localhost, ngrok, or production)
                       ↓
┌─────────────────────────────────────────────────────────┐
│ Main AI Townhall Project                                │
│                                                          │
│  • Express.js API Server                                │
│  • Python AI Server                                     │
│  • Product Database                                     │
│  • Derived Database                                     │
└─────────────────────────────────────────────────────────┘
```

---

## What's Pre-Configured

When you copy this skills folder to your external project, everything is ready:

| Component | Status | Location |
|-----------|--------|----------|
| `.env.local` | ✅ Pre-configured | Root |
| `.env.example` | ✅ Template | Root |
| `.gitignore` | ✅ Setup | Root |
| `src/apiClient.ts` | ✅ All 18 endpoints | Ready to import |
| `src/examples.ts` | ✅ 7 working examples | Ready to run |
| Documentation | ✅ Complete | `skills/` folder |

**You do NOT need to:**
- ❌ Create `.env.local` (it exists)
- ❌ Set `API_BASE_URL` (already configured)
- ❌ Build an API client (pre-built)
- ❌ Write example code (included)

---

## How to Use (Quick Start)

### Step 1: Copy Skills Folder

Everything is already prepared in your external project. The structure is:

```
your-project/
├── scripts/              (execution scripts)
├── src/
│   ├── apiClient.ts      (ready to import)
│   └── examples.ts       (working examples)
├── .env.local            (pre-configured)
├── .env.example          (template)
├── .gitignore
└── skills/               (this skills folder)
```

### Step 2: Verify Connection

Check that the API is reachable:

```typescript
import apiClient from './src/apiClient';

async function verify() {
  try {
    const config = await apiClient.getConfig();
    console.log('✅ Connected to:', config);
  } catch (error) {
    console.error('❌ Connection failed:', error);
  }
}

verify();
```

### Step 3: Start Using APIs

Import the client and start calling:

```typescript
import apiClient from './src/apiClient';

// Create a thread
const thread = await apiClient.createThread(userId);

// Send a message and get reply (unified endpoint)
const result = await apiClient.chatGenerate(userId, message, thread.id);

// Create a memory
const memory = await apiClient.createMemory(userId, content, 'skill');
```

### Step 4: Reference Skills Documentation

When you need specific functionality:

```bash
# Chat operations
skills/chat-operations/SKILL.md

# Memory system
skills/memory-system/SKILL.md

# Profile generation
skills/profile-generation/SKILL.md

# etc.
```

---

## Core Concepts

### Pre-Configured Environment

**What's in `.env.local`:**
```bash
API_BASE_URL=http://localhost:3000
API_TIMEOUT=30000
LOG_LEVEL=debug
```

**Changing the API URL:**

If you need to point to a different server:

```bash
# Local development (default)
API_BASE_URL=http://localhost:3000

# Via ngrok (temporary during development)
API_BASE_URL=https://abc123.ngrok.io

# Production
API_BASE_URL=https://api.yourdomain.com
```

Just edit `.env.local` and restart your application.

### Pre-Built API Client

**Location:** `src/apiClient.ts`

**All 18 endpoints available:**
```typescript
// Authentication
apiClient.signup(email, password, name)
apiClient.verifyCredentials(email, password)

// Thread Management
apiClient.createThread(userId)
apiClient.getMessages(threadId)

// Chat Operations (single unified endpoint)
apiClient.chatGenerate(userId, message, threadId)

// Memory System
apiClient.createMemory(userId, content, type, categories)
apiClient.getMemories(userId)
apiClient.updateMemory(memoryId, content, categories)
apiClient.deleteMemory(memoryId)

// Profile Generation
apiClient.generateProfile(userId)
apiClient.getProfileView(userId)
apiClient.triggerProfileUpdate(userId)
apiClient.getProfileGEval(userId)

// Interview
apiClient.startInterview(userId, activityId)
apiClient.interviewMessage(threadId, userId, answer)

// Activity Management
apiClient.getActivities()
apiClient.getActivityStatus(userId)

// Metadata
apiClient.getConfig()
```

### Working Examples

**Location:** `src/examples.ts`

7 ready-to-run examples:
1. **Health Check** — verify connection
2. **Chat Workflow** — unified chat API call with reply generation
3. **Continue Conversation** — using existing thread
4. **Memory Management** — create, read, update, delete
5. **Profile Generation** — generate and evaluate
6. **Activity Tracking** — list and check progress
7. **Interview Conductor** — start and submit answers

---

## Data Models

### Configuration Response

```json
{
  "apiVersion": "1.0.0",
  "status": "healthy",
  "endpoints": {
    "chat": "/api/chat",
    "memory": "/api/memories",
    "profile": "/api/profile",
    "thread": "/api/thread",
    "activity": "/api/activities",
    "auth": "/api/auth"
  },
  "features": {
    "memoryExtraction": false,
    "profileAutoUpdate": false,
    "aiFeedback": false
  },
  "timestamp": "2026-03-11T12:34:56Z"
}
```

---

## Error Handling

### Common Issues

#### Connection Refused
```
Error: ECONNREFUSED 127.0.0.1:3000
```

**Causes:**
- Main project not running
- API_BASE_URL points to wrong address
- Firewall blocking connection

**Solution:**
1. Check main project is running: `npm run dev`
2. Check `.env.local` has correct API_BASE_URL
3. Check firewall/network

#### 401 Unauthorized
```
Error: API Error 401: Unauthorized
```

**Causes:**
- Missing authentication
- Session expired
- Invalid credentials

**Solution:**
1. Verify endpoint requires authentication
2. Include session cookie/API key
3. Re-authenticate if needed

#### 429 Too Many Requests
```
Error: API Error 429: Rate Limit Exceeded
```

**Causes:**
- Too many requests too quickly
- Rate limiter triggered

**Solution:**
1. Add request throttling
2. Implement exponential backoff retry
3. Contact admin for higher limits

---

## Best Practices

### ✅ DO:

- ✅ **Keep `.env.local` secure** — never commit to git (it's in `.gitignore`)
- ✅ **Use the pre-built API client** — don't create your own
- ✅ **Use /api/chat/generate for chat** — single unified endpoint
- ✅ **Verify connection on startup** — call `getConfig()` to validate
- ✅ **Add retry logic** — handle transient failures gracefully
- ✅ **Log API calls** — helps with debugging
- ✅ **Handle errors properly** — check response status and error codes

### ❌ DON'T:

- ❌ **Hardcode API URLs** — always use `.env.local`
- ❌ **Commit `.env.local` to git** — it contains temporary/sensitive info
- ❌ **Use ngrok URLs in production** — not designed for that
- ❌ **Call old /api/chat/reply or /api/chat/process-memory separately** — use /api/chat/generate instead
- ❌ **Share ngrok URLs publicly** — they provide temporary access
- ❌ **Trust ngrok for security** — always add authentication
- ❌ **Make concurrent requests** without rate limiting

---

## Changing the API Connection

### Scenario 1: Local Development (Default)

Already configured for `localhost:3000`:

```bash
# .env.local (already set)
API_BASE_URL=http://localhost:3000
```

Just start the main project:
```bash
cd ai-townhall
npm run dev
```

### Scenario 2: Development via ngrok

Expose the local project to external access:

```bash
# Terminal 1: Start main project
cd ai-townhall && npm run dev

# Terminal 2: Start ngrok
ngrok http 3000
# Output: Forwarding https://abc123.ngrok.io -> http://localhost:3000

# Terminal 3: Update external project
cd your-project
# Edit .env.local
API_BASE_URL=https://abc123.ngrok.io
```

### Scenario 3: Production Deployment

Deploy main project to public server:

```bash
# Edit .env.local in external project
API_BASE_URL=https://api.yourdomain.com
```

---

## Integration with Other Skills

This skill enables use of **all 7 other skills**:

1. **thread-management** — Create and manage conversation threads
2. **user-authentication** — Handle user signup and login
3. **chat-operations** — Unified chat API (single endpoint for all operations)
4. **memory-system** — Create and manage memories
5. **profile-generation** — Generate profiles from memories
6. **interview-conductor** — Run interview sessions
7. **activity-management** — Track activity progress

### Typical Workflow

```
1. Call user-authentication/verify-credentials
   ↓
2. Call thread-management/create-thread
   ↓
3. Call chat-operations/generate (unified: message + reply + save)
   ↓
4. Call memory-system/create-memory
   ↓
5. Call profile-generation/generate
   ↓
6. Repeat from step 3 or start interview
```

---

## Troubleshooting Checklist

When things don't work:

- [ ] `.env.local` has correct `API_BASE_URL`
- [ ] Main project is running on that URL
- [ ] Called `getConfig()` to verify connection
- [ ] Checked browser/terminal for error messages
- [ ] No firewall blocking the connection
- [ ] `.env.local` is NOT committed to git
- [ ] API timeout is reasonable (default 30s)
- [ ] Implemented retry logic for 5xx errors
- [ ] Not hitting rate limits (wait or implement throttling)

---

## Files in This Skill

```
external-integration/
└── SKILL.md (this file)
```

This is a reference guide. For implementation details, see the specific skill files.

---

## Next Steps

1. **Copy this skills folder** to your external project
2. **Verify connection** — run `getConfig()`
3. **Start using APIs** — import `apiClient` and call methods
4. **Reference skills** — read specific SKILL.md files as needed
5. **Build your feature** — use the client and documentation

Everything is ready. Start coding! 🚀
