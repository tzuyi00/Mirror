---
name: interview-conductor
description: Orchestrate interview sessions with dynamic questions and answer collection. Manage interview state, track progress, and extract insights from responses.
---

# 🎤 Interview Conductor Skill

## Overview
The interview conductor manages structured question-answer sessions. It generates interview questions, collects user responses, evaluates answers, and extracts valuable insights for profile building.

## Core Responsibilities

### 1. Interview Initialization
- **Start Interview**: `POST /api/chat/start-interview`
  - Initializes interview session for an activity
  - Returns first interview question
  - Creates or retrieves pending question if in-progress
  - Maintains interview state in database

### 2. Interview Message Handling
- **Submit Answer & Get Next Question**: `POST /api/chat/interview`
  - User submits answer to current question
  - Server saves answer
  - AI generates next question
  - Returns next question or completion status
  - Updates interview progress

## Data Models

### InterviewStartRequest
```json
{
  "threadId": "string (required)",
  "userId": "string (required)",
  "activityId": "string (required)"
}
```

### InterviewStartResponse
```json
{
  "ok": "boolean",
  "replyQuestion": "string (first question)",
  "questionMessageId": "string (message ID for question)",
  "interviewEnded": "boolean",
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

### InterviewMessage
```json
{
  "userId": "string",
  "message": "string (user's answer to question)",
  "threadId": "string",
  "activityId": "string (required)"
}
```

### InterviewMessageResponse
```json
{
  "ok": "boolean",
  "replyQuestion": "string (next question or completion message)",
  "questionMessageId": "string (message ID for next question)",
  "interviewEnded": "boolean (true when interview completes)",
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

### Interview Session Flow
1. **Initialize**: Call `POST /api/chat/start-interview`
   - Provide threadId, userId, activityId
   - Receive first interview question
   - Display question to user

2. **Question-Answer Loop**:
   - User answers question
   - Call `POST /api/chat/interview` with answer
   - Check if `interviewEnded` is true
   - If false, display next question
   - Repeat until interview ends

3. **Completion**:
   - When `interviewEnded: true`
   - Interview responses saved
   - Memories extracted from answers
   - Profile may auto-update

### Question Strategy
- AI generates questions based on activity and previous answers
- Questions should be open-ended for rich responses
- Adapt follow-up questions based on user responses
- Interview typically 5-10 questions per session

### Answer Evaluation
- Collect full user response
- AI evaluates relevance and quality
- Extract key facts for memory creation
- Generate contextual follow-up questions

### Interview State Management
- Store pending question if session interrupted
- Resume from where left off on restart
- Track total questions and answered count
- Record timestamps for each interaction

## Best Practices
- Always provide threadId for conversation continuity
- Include activityId to contextualize questions
- Save user answers before requesting next question
- Handle interview timeout gracefully
- Extract memories from interview responses
- Provide user feedback on interview progress

## Integration Points
- **Thread Management**: Uses threadId for conversation context
- **Chat Operations**: Uses similar message exchange pattern
- **Memory System**: Automatically extracts memories from answers
- **Profile Generation**: Interview responses feed into profile
- **Activity Management**: Linked to specific activity

## Error Handling
- **400 Bad Request**: Missing required parameters
- **502 Service Error**: AI question generation fails
- Return error details for retry logic
- Preserve interview state on failure

## Interview State Lifecycle
```
Not Started
    ↓
Started (First Question)
    ↓
In Progress (Question-Answer Loop)
    ↓
Completed (interviewEnded: true)
```
