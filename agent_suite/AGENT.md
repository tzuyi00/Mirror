# AGENT.md

**Read this first before working on this project.**

---

## What This Project Does

AI Townhall is a comprehensive platform for:
- **User Authentication**: Sign up, login, credential verification via NextAuth
- **Conversation Management**: Thread-based chat system with AI responses
- **Memory System**: Extract and store user facts/insights from conversations
- **Profile Generation**: Synthesize comprehensive user profiles from collected memories
- **Structured Interviews**: Dynamic Q&A sessions for deep user understanding
- **Activity Management**: Track user progress through questionnaires and activities

**Scale**: 18 API endpoints organized into 7 skill modules.

**Architecture**: Node.js/Express backend + Python AI server + dual-database pattern (Product DB + event-sourced Derived DB).

---

## 🔴 CRITICAL: Chat API Pattern

**You MUST understand this before implementing chat.**

The chat system uses a **unified single-call pattern**:

```
POST /api/chat/generate
├─ Send: { userId, message, threadId? }
├─ Server processes: save user msg → call AI → save AI reply → execute operations
├─ Return: { reply, meta, operationResults, ... }
└─ All database writes (Product DB + Derived DB) complete atomically
```

**Key Points:**
- Single API call handles entire operation
- Auto-creates threadId if not provided
- Automatic dual-database synchronization
- Atomic: all succeed or all fail together
- No orphaned data possible

**Why this design?**
- **Simplicity**: One call instead of multiple
- **Consistency**: No sync issues between databases
- **Reliability**: All-or-nothing semantics
- **Atomicity**: No partial states possible

See `chat-operations/SKILL.md` for detailed implementation.

---

## Project Structure

```
.claude/skills/
├── AGENT.md                          ← You are here
├── README.md                         ← System overview (read next)
│
├── external-integration/             ← NEW: For external projects
│   └── SKILL.md
│
├── thread-management/
│   └── SKILL.md
│
├── user-authentication/
│   └── SKILL.md
│
├── chat-operations/
│   ├── SKILL.md
│   └── references/
│       └── API-REFERENCE.md
│
├── memory-system/
│   ├── SKILL.md
│   └── references/
│       └── MEMORY-CATEGORIES.md
│
├── profile-generation/
│   ├── SKILL.md
│   └── references/
│       └── PROFILE-STRATEGY.md
│
├── interview-conductor/
│   ├── SKILL.md
│   └── scripts/
│       └── INTERVIEW-LOGIC.md
│
└── activity-management/
    └── SKILL.md
```

---

## How to Get Started (AI Agent Workflow)

### Phase 1: Understand the System (5-10 min)

1. **Read this file** (AGENT.md) — you're doing it now ✓
2. **Read README.md** — high-level overview of all 7 skills and 18 endpoints
3. **Understand the unified chat API** — it's the foundation of everything

### Phase 2: Identify Your Task (2-3 min)

Look at your task and find the matching skill:

| Task | Skill | File |
|------|-------|------|
| User login/signup | user-authentication | `user-authentication/SKILL.md` |
| Create conversation thread | thread-management | `thread-management/SKILL.md` |
| Send chat message & get reply | chat-operations | `chat-operations/SKILL.md` |
| Extract/manage memories | memory-system | `memory-system/SKILL.md` |
| Generate user profile | profile-generation | `profile-generation/SKILL.md` |
| Conduct interview | interview-conductor | `interview-conductor/SKILL.md` |
| Activity questionnaire | activity-management | `activity-management/SKILL.md` |

### Phase 3: Deep Dive (10-20 min)

1. **Open the relevant SKILL.md**
2. **Read the "Overview" section** — understand what the skill does
3. **Review "Core Responsibilities"** — what endpoints are involved
4. **Check "Data Models"** — what JSON fields are required/optional
5. **Follow "Workflow Instructions"** — step-by-step guide

### Phase 4: Implementation (varies)

- **For simple changes**: SKILL.md is enough
- **For complex implementation**: check `references/` or `scripts/` subdirectories
- **For error handling**: see "Error Handling" section in SKILL.md
- **For chat implementation**: see `chat-operations/references/API-REFERENCE.md` for examples

---

## The 7 Skills at a Glance

| # | Skill | Endpoints | Purpose |
|---|-------|-----------|---------|
| 0 | **external-integration** | N/A | Setup guide for external projects using this skills folder |
| 1 | **thread-management** | 2 | Create/retrieve conversation threads |
| 2 | **user-authentication** | 2 | Signup, credential verification |
| 3 | **chat-operations** | 1 | Unified chat API (send message, get reply, save to DB) |
| 4 | **memory-system** | 4 | CRUD user memories/facts |
| 5 | **profile-generation** | 4 | Generate profiles from memories |
| 6 | **interview-conductor** | 2 | Dynamic Q&A sessions |
| 7 | **activity-management** | 2 | Activity tracking & progress |
| | **TOTAL** | **18** | All endpoints |

---

## Key System Concepts

### Thread (Conversation Container)
- Unique conversation session between user and AI
- Each user can have multiple threads
- Stores all messages (user + AI responses)
- Required field for almost every operation
- `threadId` is UUID

### Message
- Individual user or AI message within a thread
- Contains: `text`, `role` (user/assistant), `timestamp`
- Created and persisted by `/api/chat/generate` in single operation

### Memory
- Individual fact, insight, or piece of user information extracted from conversation
- Fields: `type`, `content`, `categories`, `source`, `createdAt`
- Forms the raw material for profile generation
- **Note**: Auto-extraction from chat is currently **disabled** (code exists, just commented out)

### Profile
- Synthesized user overview generated from memories
- Contains sections: skills, experience, goals, personality, education, etc.
- Quality-scored with G-Eval (0-100 scale)
- **Note**: Auto-update is currently **disabled** (will re-enable when feature activates)

### Activity
- Structured questionnaire or task for user
- User progress tracked: `not_started`, `in_progress`, `completed`
- Stores: total questions, answered questions, completion percentage

### Interview
- Dynamic Q&A session linked to an activity
- AI generates questions based on previous answers
- **Note**: Memory auto-extraction from interview answers is **disabled**

### Dual Database Architecture
- **Product DB**: Standard relational DB (messages, users, memories, profiles)
  - Used for: main app logic, transactions, real-time queries
- **Derived DB**: Event-sourced format (conversation_event table)
  - Used for: audit trail, analytics, event replay

**Critical**: Both writes must succeed, or operation fails. If one DB write fails, the entire operation is rolled back.

---

## Do's and Don'ts

### ✅ DO:

- ✅ **Use /api/chat/generate for chat** — single unified endpoint
- ✅ **Include all required fields** — check SKILL.md data models
- ✅ **Handle errors gracefully** — check response.ok and error codes
- ✅ **Implement retry logic** for failures (502 errors) with exponential backoff
- ✅ **Validate field types** — `userId` is required, message is required
- ✅ **Use timestamps** — all timestamps are ISO 8601 format
- ✅ **Think in terms of skills** — don't mix concerns, use the relevant skill's workflow

### ❌ DON'T:

- ❌ **Use /api/chat/reply or /api/chat/process-memory separately** — use /api/chat/generate instead
- ❌ **Assume database writes succeeded** — always verify `ok: true` in response
- ❌ **Ignore error codes** — they guide recovery strategy
- ❌ **Make concurrent calls with same `threadId`** — can cause race conditions
- ❌ **Use hardcoded IDs** — always get IDs from API responses
- ❌ **Try to enable disabled features yourself** — memory extraction, auto-update (code is there but intentionally commented)
- ❌ **Forget about both databases** — Product DB + Derived DB writes are automatic

---

## Common Scenarios

### "I need to implement chat"
```
1. Open: chat-operations/SKILL.md
2. Understand: POST /api/chat/generate (unified endpoint)
3. Check: chat-operations/references/API-REFERENCE.md for error codes
4. Code: Single API call with userId, message, optional threadId
5. Deploy: Automatic DB sync, no multi-step coordination needed
```

### "I need to create/update a memory"
```
1. Open: memory-system/SKILL.md
2. Understand: POST /api/memories (create), PATCH /api/memories/{id} (update)
3. Reference: memory-system/references/MEMORY-CATEGORIES.md for categorization
4. Note: Auto-extraction from chat is disabled
```

### "I need to generate a user profile"
```
1. Open: profile-generation/SKILL.md
2. Understand: Profiles synthesized from memories using G-Eval scoring
3. Reference: profile-generation/references/PROFILE-STRATEGY.md
4. Note: Auto-update is disabled; trigger manually with POST /api/profile/trigger-auto-update
```

### "I need to run an interview"
```
1. Open: interview-conductor/SKILL.md
2. Understand: Two-step interview flow (start-interview → interview)
3. Reference: interview-conductor/scripts/INTERVIEW-LOGIC.md for state machine
4. Note: Memory auto-extraction from answers is disabled
```

---

## Disabled Features

The following features are **implemented in code but intentionally disabled** (commented out):

| Feature | Location | Status | Re-enablement |
|---------|----------|--------|---------------|
| Memory Extraction | ChatController.processMemory() | Disabled | Uncomment code, ensure AI server ready |
| Profile Auto-Update | ChatController.processMemory() | Disabled | Uncomment code, trigger after memory ops |
| AI Feedback Loop | ChatController.processMemory() | Disabled | Uncomment code, ensure Python server ready |

These features **must not be enabled** without explicit approval. When they are re-enabled, documentation will be updated.

---

## Error Handling Strategy

When an API call fails:

1. **Check the HTTP status code** → see SKILL.md error section
2. **Check the error message** → specific error code (e.g., "INVALID_THREAD_ID")
3. **Determine if retryable** → 5xx errors retry, 4xx errors usually don't
4. **Implement recovery** → see error handling table in relevant SKILL.md
5. **Log for debugging** → include error code, endpoint, status code

Common errors:
- **400 Bad Request** — missing or invalid field (don't retry)
- **401 Unauthorized** — invalid credentials (don't retry)
- **409 Conflict** — race condition or duplicate (may retry with backoff)
- **502 Bad Gateway** — database unavailable (retry with exponential backoff)
- **503 Service Unavailable** — server overloaded (retry with exponential backoff)

---

## Environment Configuration (Critical for Scripts)

### ⚠️ Important: Always Load .env in Scripts

When creating any TypeScript/JavaScript script that uses the API client, **you MUST import dotenv at the very top**:

```typescript
// ✅ CORRECT - First line of your script
import 'dotenv/config';
import apiClient from '../src/apiClient';

async function main() {
  // Your code here
}
```

**Why?** 
- `.env.local` file contains `API_BASE_URL` and other configuration
- Without loading dotenv, `process.env.API_BASE_URL` will be `undefined`
- The API client will fall back to default `http://localhost:3000`
- You'll get connection errors or test with wrong server

**Common mistake:**
```typescript
// ❌ WRONG - This will use localhost instead of .env URL
import apiClient from '../src/apiClient';

async function main() {
  // API_BASE_URL not loaded!
}
```

**Expected error if dotenv not imported:**
```
✓ API Client initialized: http://localhost:3000  ← Should show your .env URL
```

---

## Database & Backend Notes

### This is Skills Documentation, Not Backend Code

- Backend code lives in: `server/src/controllers/`, `server/src/services/`, etc.
- Python AI server code lives in: `ai_server/`
- These skills describe **what the APIs do and how to use them**, not implementation details

### Database Requirements

- **Product DB**: Required for all operations (messages, users, memories, profiles)
- **Derived DB**: Required for conversation_event table (audit/analytics)
- **Both must be running** before any chat operations

### API Requirements

- **Base URL**: Determined by deployment (development, staging, production)
  - Configured in `.env.local` → `API_BASE_URL`
  - **Important**: Script must import `'dotenv/config'` to load this
- **Authentication**: NextAuth session cookie required for most endpoints
- **Response Format**: All responses are JSON
- **Timestamps**: ISO 8601 UTC format

---

## 🌐 External Integration (Using This Skills Folder Externally)

If this `skills` folder is **used externally** (outside of the main AI Townhall project), read this section.

### Architecture Overview

When external systems use this skills folder, they connect back to the main project:

```
External AI Agent / System
         ↓ (HTTPS)
         ↓
AI Townhall Main Project API (pre-configured)
         ↓
Product DB + Derived DB
```

### What's Already Prepared for External Use

When you copy this `skills` folder to your external project, the setup comes pre-configured:

✅ **Environment is ready** — `.env.local` already configured
✅ **API client is ready** — all methods implemented in `src/apiClient.ts`
✅ **Examples are ready** — 7 working examples in `src/examples.ts`
✅ **Connection verified** — just call the API

### How to Use This Skills Folder Externally

1. **Read the external guide** — it explains what's already configured
   ```bash
   cat your-project/skills/external-integration/SKILL.md
   ```

2. **Use the pre-built API client** — import and start calling APIs
   ```typescript
   import apiClient from './src/apiClient';
   await apiClient.chatGenerate(userId, message);
   ```

3. **Reference the skills** — when you need specific functionality
   ```bash
   # e.g., chat operations
   cat skills/chat-operations/SKILL.md
   ```

### Key Points for External Use

- **Everything is pre-configured** — focus on using the APIs, not setting them up
- **See `external-integration/SKILL.md`** — for connection details and troubleshooting
- **Use `src/apiClient.ts`** — all 18 endpoints are methods
- **Follow `src/examples.ts`** — working code you can learn from
- **Change API URL if needed** — update `.env.local` if moving to different server

---

## Before You Start

**Checklist:**

- [ ] I have read AGENT.md (this file)
- [ ] I understand the unified chat API pattern
- [ ] I know which skill my task relates to
- [ ] I've opened the relevant SKILL.md
- [ ] I understand required vs. optional fields
- [ ] I know where to find error handling info
- [ ] I understand disabled features won't work
- [ ] I'm aware of dual-database requirement
- [ ] ⚠️ **For scripts: I will add `import 'dotenv/config';` as first line**
- [ ] (If external) I've read `external-integration/SKILL.md`
- [ ] (If external) I've configured `.env.local` correctly

---

## Quick Reference: What to Read

| Situation | File | Time |
|-----------|------|------|
| Understanding system | README.md | 10 min |
| Implementing feature X | `[skill]/SKILL.md` | 15-20 min |
| Fixing error in chat | `chat-operations/references/API-REFERENCE.md` | 5 min |
| Learning memory categories | `memory-system/references/MEMORY-CATEGORIES.md` | 10 min |
| Profile generation details | `profile-generation/references/PROFILE-STRATEGY.md` | 15 min |
| Interview state machine | `interview-conductor/scripts/INTERVIEW-LOGIC.md` | 15 min |
| Chat implementation | `chat-operations/references/API-REFERENCE.md` | 10 min |

---

## Summary

**AI Townhall** is a well-structured, skills-based platform with clear separation of concerns. Each skill has one job, and each API endpoint belongs to exactly one skill.

**The one thing you MUST remember**: Chat uses a unified `/api/chat/generate` API. It handles message sending, AI reply generation, and database persistence in a single atomic operation. Everything else flows from understanding that.

**Start here**:
1. ✓ Read AGENT.md (you're done)
2. → Read README.md
3. → Choose your skill
4. → Open the relevant SKILL.md
5. → Follow the workflow instructions

