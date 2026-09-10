---
name: chat-operations
description: Handle AI chat interactions including message replies, memory processing, and response generation. Manages the core conversation flow with AI services.
---

# 💬 Chat Operations Skill

## Overview
This skill manages real-time chat interactions with the AI system. It handles message routing, AI responses, and integration with memory extraction for context-aware conversations.

## Core Responsibilities

### 1. Send Message & Get AI Reply (Combined)
- **Send Message & Get Reply**: `POST /api/chat/generate`
  - Sends user message to AI
  - Gets AI-generated reply text
  - Automatically saves messages to both databases (Product DB + Derived DB)
  - Maintains conversation context
  - Returns GenerateResponse with reply, metadata, and optional error
  - **Note**: This is the primary endpoint to use for chat interactions

## Data Models

### GenerateRequest
```json
{
  "userId": "string (required)",
  "message": "string (required)",
  "threadId": "string (optional)"
}
```

### GenerateResponse
```json
{
  "ok": "boolean",
  "reply": "string (AI response text)",
  "operationResults": [
    {
      "success": "boolean",
      "memoryId": "string (optional)",
      "error": "string (optional)"
    }
  ],
  "error": {
    "code": "string",
    "message": "string"
  },
  "meta": {
    "userId": "string",
    "threadId": "string",
    "messageId": "string",
    "createdAt": "string (ISO 8601)"
  }
}
```

## Workflow Instructions

### Chat Flow (Single API Call)
1. Call `POST /api/chat/generate` with user message
2. Server processes: saves user message, calls AI, saves AI reply, executes memory operations
3. Receive reply, metadata, and operation results in single response
4. All database writes (Product DB + Derived DB) are completed automatically

### Why Single Unified Endpoint?
- **Simplicity**: One API call handles the entire chat operation
- **Consistency**: Automatic dual-database synchronization
- **Reliability**: All operations succeed or fail together
- **Atomic**: No orphaned messages or data inconsistencies
- **Performance**: Optimized single round-trip to server

### Current Implementation Notes
- Memory extraction functionality is currently disabled (commented out)
- Profile auto-update is currently disabled (commented out)
- These features may be re-enabled in future versions
- Current focus: Reliable message persistence across dual database systems

### Error Handling
- **400 Bad Request**: Invalid input parameters (missing userId or message)
- **502 Service Error**: AI service error or database write failures
- Return error details in response for client display

## Integration Points
- **Thread Management**: Uses threadId for conversation continuity (auto-created if not provided)
- **Memory System**: Memory extraction hooks available when re-enabled
- **Message Persistence**: Writes to both Product and Derived databases automatically
- **AI Service**: Calls Python backend for reply generation

## Best Practices
- **Single call pattern**: Use `/api/chat/generate` for all chat interactions
- **Include all required fields**: userId and message are mandatory
- **Handle errors gracefully**: Check response status and error codes
- **Log operations**: Track successful conversations and any errors
- **Monitor success rate**: Ensure chat operations complete successfully
- **Validate responses**: Always check the `ok` field before using reply data

## Documentation
- **`references/API-REFERENCE.md`** - Detailed API contracts and error handling
