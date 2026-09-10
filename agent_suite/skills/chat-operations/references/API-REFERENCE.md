# Chat Operations API Reference

## Overview

The Chat Operations skill provides a unified endpoint for chat interactions:

- **POST /api/chat/generate** - Send message, get AI reply, and save to databases (all in one call)

This single endpoint handles message sending, AI response generation, and data persistence in an atomic operation.

## Unified Chat Flow

### POST /api/chat/generate
```
User Message
    ↓
API /api/chat/generate
    ↓
[AI Processing] + [Save to Product DB] + [Save to Derived DB]
    ↓
AI Reply + Metadata (all in one response)
```

**Responsibilities:**
- Receives user message and optional threadId
- Auto-creates threadId if not provided
- Saves user message to Product DB (messages table)
- Saves user message to Derived DB (conversation_event table)
- Calls AI backend for response generation
- Saves AI reply to Product DB (messages table)
- Saves AI reply to Derived DB (conversation_event table)
- Executes any memory operations (if enabled)
- Returns complete response with reply and operation results

**Advantages:**
- Single API call for entire operation
- Automatic database synchronization
- Atomic consistency across dual database systems
- Simpler client implementation
- No orphaned data possible

## Error Codes and Handling

### POST /api/chat/generate Errors
| Code | HTTP | Meaning | Recovery |
|------|------|---------|----------|
| `invalid_input` | 400 | Missing userId or message | Validate input and retry |
| `generate_failed` | 502 | AI service error or database write failure | Check server status, retry |

## Request/Response Contracts

### POST /api/chat/generate Request
```json
{
  "userId": "string (required)",
  "message": "string (required)",
  "threadId": "string (optional - auto-created if missing)"
}
```

### POST /api/chat/generate Response
```json
{
  "ok": true,
  "reply": "AI response text here",
  "operationResults": [],
  "error": null,
  "meta": {
    "userId": "user123",
    "threadId": "thread456",
    "messageId": "msg789",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

## Implementation Notes

### Atomic Operation

The /api/chat/generate endpoint performs all operations atomically:

1. **Message Writes** - User message saved to both databases
2. **AI Processing** - Response generated from AI backend
3. **Reply Writes** - AI message saved to both databases
4. **Memory Operations** - Any enabled operations executed
5. **Single Response** - All results returned together

**Important:**
- If any step fails, the entire operation is rolled back
- Both Product DB and Derived DB writes must succeed
- Client receives complete outcome in single response
- No partial/orphaned data possible

### Dual Database System

The /api/chat/generate endpoint writes to two databases:

1. **Product DB** (messages table)
   - Standard messages table
   - Used for main application logic
   - Tracks userId, threadId, role, content

2. **Derived DB** (conversation_event table)
   - Event-sourced format
   - Used for analytics and audit
   - Tracks metadata and operation results

Both writes occur atomically within the single API call.

### Currently Disabled Features

The following features are implemented but currently disabled (commented out):

1. **Memory Extraction**
   - AI analysis of response for extractable facts
   - Automatic memory creation
   - To be re-enabled in future version

2. **Profile Auto-Update**
   - Automatic profile regeneration after memory operations
   - To be re-enabled in future version

3. **Feedback to AI Server**
   - Sending operation results back to AI backend for learning
   - To be re-enabled in future version

These features can be re-enabled by uncommenting code in ChatController.generate()

## Best Practices

### Client Implementation

**DO:**
- ✅ Use /api/chat/generate for all chat interactions
- ✅ Include required fields: userId and message
- ✅ Handle both success and error responses
- ✅ Log operations for debugging
- ✅ Retry failed operations with exponential backoff
- ✅ Check the `ok` field in response before using data

**DON'T:**
- ❌ Skip error checking
- ❌ Assume operation succeeded without verifying response
- ❌ Hardcode assumptions about threadId auto-creation
- ❌ Ignore operation results
- ❌ Make concurrent calls without thread safety

### Example Client Code

```typescript
// Single unified API call
const response = await fetch('/api/chat/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'user123',
    message: 'Hello AI',
    threadId: 'thread456'  // optional
  })
});

const data = await response.json();

if (!data.ok) {
  console.error('Chat failed:', data.error);
  return;
}

// All processing complete - use reply directly
console.log('AI Reply:', data.reply);
console.log('Metadata:', data.meta);
console.log('Operation Results:', data.operationResults);
```

## Success Rate Monitoring

Monitor these metrics for chat health:

| Metric | Target | Action |
|--------|--------|--------|
| Chat operation success | >99% | Alert if below target |
| Average latency | <3s | Optimize if above target |
| Database write latency | <500ms | Monitor for degradation |
| Error frequency by type | <1% | Investigate error spikes |
| Atomic consistency | 100% | Critical if degraded |

## Future Enhancements

When memory extraction and profile auto-update are re-enabled:

1. **Memory Operations**
   - Extract facts from AI response
   - Automatically create memories
   - Return created memory IDs

2. **Profile Auto-Update**
   - Track memory operation count
   - Trigger profile regeneration at threshold
   - Return profile update status

3. **AI Feedback Loop**
   - Send operation results to AI backend
   - Enable AI learning from successful operations
   - Improve future response quality
