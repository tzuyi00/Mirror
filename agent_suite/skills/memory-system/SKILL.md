---
name: memory-system
description: Create, retrieve, update, and manage user memories. Store facts, insights, and experiences that form the foundation of user profiles and personalization.
---

# 🧠 Memory System Skill

## Overview
The memory system is the core knowledge repository for each user. It stores extracted facts, insights, and information from conversations, forming the basis for user profile generation and personalized interactions.

## Core Responsibilities

### 1. Memory Retrieval
- **Get User Memories**: `GET /api/memories/user/{userId}`
  - Fetches all memories for a specific user
  - Optional parameter to include soft-deleted memories
  - Returns array of memory objects

### 2. Memory Creation
- **Create Memory**: `POST /api/memories`
  - Creates a new memory record
  - Supports user-generated or AI-extracted memories
  - Automatically categorizes information
  - Associates with profile sections

### 3. Memory Updates
- **Update Memory**: `PATCH /api/memories/{memoryId}`
  - Modifies content of existing memory
  - Updates categories and source
  - Maintains audit trail

### 4. Memory Deletion
- **Delete Memory**: `DELETE /api/memories/{memoryId}`
  - Supports soft delete (marks as deleted)
  - Supports hard delete (completely removes)
  - Default is soft delete for recovery

## Data Models

### CreateMemoryRequest
```json
{
  "userId": "string (required)",
  "type": "string (required, 'user' | 'ai')",
  "content": "string (required)",
  "source": "string (optional, e.g., 'chat', 'interview', 'manual')",
  "categories": ["string (optional, e.g., 'skill', 'experience', 'preference')"],
  "sectionIds": ["string (optional, profile section IDs)"]
}
```

### UpdateMemoryRequest
```json
{
  "content": "string (optional)",
  "source": "string (optional)",
  "categories": ["string (optional)"]
}
```

### Memory Object
```json
{
  "id": "string",
  "userId": "string",
  "type": "string",
  "content": "string",
  "source": "string",
  "categories": ["string"],
  "sectionIds": ["string"],
  "createdAt": "string (ISO 8601)",
  "updatedAt": "string (ISO 8601)",
  "deletedAt": "string (ISO 8601, null if not deleted)"
}
```

## Workflow Instructions

### Memory Creation Flow
1. AI or user identifies new information
2. Extract key facts and insights
3. Determine appropriate categories (skills, experience, preferences, etc.)
4. Map to relevant profile sections
5. Create memory record via `POST /api/memories`

### Memory Lifecycle
1. **Creation**: Capture from conversations or manual input
2. **Categorization**: Organize by type and section
3. **Retrieval**: Use for profile generation and personalization
4. **Updates**: Refine as new information arrives
5. **Archival**: Soft delete for recovery, hard delete for permanent removal

### Categorization Guidelines
- **skills**: Technical or professional capabilities
- **experience**: Past roles, projects, achievements
- **preferences**: Likes, dislikes, working style
- **personality**: Traits, values, communication style
- **goals**: Aspirations and objectives
- **context**: Background information and circumstances

### Best Practices
- Always include source for traceability
- Use consistent category naming
- Link to profile sections when possible
- Avoid duplicate memories by checking existing records
- Preserve soft-deleted memories for audit purposes

## Integration Points
- **Chat Operations**: Automatically creates memories from conversations
- **Profile Generation**: Uses memories as input for profile creation
- **Activity Management**: Associates memories with specific activities
- **Interview Conductor**: Extracts memories from interview responses

## Error Handling
- **400 Bad Request**: Missing required fields or invalid data
- **404 Not Found**: Memory or user not found
- **500 Internal Error**: Database issues
