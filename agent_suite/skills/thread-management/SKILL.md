---
name: thread-management
description: Manage conversation threads for users. Create new threads, retrieve existing threads, and fetch thread messages for chat continuity and context preservation.
---

# 🧵 Thread Management Skill

## Overview
This skill handles the lifecycle of conversation threads in the AI Townhall system. Threads are containers for organizing conversations and maintaining chat history for users.

## Core Responsibilities

### 1. Thread Creation & Retrieval
- **Create Thread**: `POST /api/thread`
  - Creates a new generic thread when body is empty
  - Gets or creates the latest thread for a user if userId is provided
  - Optionally filters by activityId for activity-specific threads
  - Returns `threadId` and `createdAt` timestamp

- **Get Thread Messages**: `GET /api/thread/{threadId}/messages`
  - Retrieves all messages within a specific thread
  - Returns ThreadMessagesResponse with messages array containing role, data, createdAt, and id

## Data Models

### ThreadCreateResponse
```json
{
  "threadId": "string",
  "createdAt": "string (ISO 8601)",
  "activityId": "string (optional)"
}
```

### ThreadMessage
```json
{
  "id": "string",
  "role": "string (user|assistant)",
  "data": "object",
  "createdAt": "string (ISO 8601)"
}
```

## Workflow Instructions

### When to Use
1. **Starting a conversation** - Create a new thread
2. **Resuming a conversation** - Get existing thread for user+activityId
3. **Viewing chat history** - Fetch messages from a specific thread
4. **Activity-specific chats** - Use activityId to maintain separate threads per activity

### Best Practices
- Always store `threadId` for later reference
- Use `userId + activityId` combination for activity-based conversations
- Preserve thread context across API calls
- Handle thread creation idempotently

## Integration Points
- **Chat Operations**: Uses threadId for sending messages
- **Interview Conductor**: Uses threadId to track interview conversations
- **Profile Generation**: References threadId for context-aware profile building
