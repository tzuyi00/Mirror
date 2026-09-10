---
name: profile-generation
description: Generate and manage user profiles from collected memories and conversation data. Create comprehensive views of user skills, experience, and profile sections.
---

# 👤 Profile Generation Skill

## Overview
The profile generation system synthesizes collected memories into comprehensive user profiles. It generates, updates, and retrieves profile sections that represent the user's skills, experience, and information.

## Core Responsibilities

### 1. Profile Retrieval
- **Get Profile View**: `GET /api/profile-views/{userId}`
  - Retrieves complete profile composite view
  - Returns sections with optional memories
  - Use query parameter `include=memories` to fetch associated memories
  - Returns structured profile data

### 2. Profile Generation
- **Generate Profile**: `POST /api/profile/generate`
  - Triggers AI-based profile generation
  - Processes accumulated memories
  - Creates profile sections
  - Saves to database
  - Returns generated profile metadata

### 3. Profile Auto-Update
- **Trigger Auto-Update**: `POST /api/profile/trigger-auto-update`
  - Initiates profile refresh after memory operations
  - Uses `successCount` to determine update threshold
  - Returns triggered status and updated profile data

### 4. Profile Evaluation
- **Get G-Eval Score**: `POST /api/profile/g-eval`
  - Evaluates profile quality using LLM-based scoring
  - Returns evaluation score
  - Used to assess profile completeness

## Data Models

### GenerateProfileRequest
```json
{
  "userId": "string (optional)"
}
```

### TriggerAutoUpdateRequest
```json
{
  "userId": "string (required)",
  "successCount": "number (required, count of successful memory operations)"
}
```

### GEvalRequest
```json
{
  "userId": "string (required)"
}
```

### ProfileView
```json
{
  "userId": "string",
  "sections": [
    {
      "id": "string",
      "title": "string (e.g., 'Professional Skills', 'Experience')",
      "description": "string",
      "content": "string"
    }
  ],
  "memories": ["string (optional, memory IDs)"],
  "metadata": {
    "generatedAt": "string (ISO 8601)",
    "gEvalScore": "number",
    "lastUpdatedAt": "string (ISO 8601)"
  }
}
```

## Workflow Instructions

### Profile Generation Flow
1. Collect sufficient memories (typically 5+ memories)
2. Call `POST /api/profile/generate` with userId
3. AI server processes memories
4. Generates profile sections (skills, experience, goals, etc.)
5. Stores sections in database
6. Return profile metadata

### Auto-Update Trigger Flow
1. After successful chat operations via `/api/chat/generate`
2. Count successful memory operations
3. When successCount reaches threshold (typically 3-5)
4. Call `POST /api/profile/trigger-auto-update`
5. Profile regenerates with new memories
6. Return updated profile and status

### Profile Evaluation Flow
1. Profile exists and has been generated
2. Call `POST /api/profile/g-eval` to score quality
3. Receive G-Eval score (typically 0-100)
4. Use score to determine if additional profiling needed

### Profile Sections (Typical)
- **Professional Skills**: Technical and domain expertise
- **Work Experience**: Past roles, companies, achievements
- **Education**: Formal training and certifications
- **Interests & Hobbies**: Personal preferences and activities
- **Career Goals**: Aspirations and objectives
- **Communication Style**: Preferred interaction modes
- **Strengths & Weaknesses**: Self-assessment data

## Best Practices
- Generate initial profile after collecting 5+ memories
- Trigger auto-updates after every 3-5 successful memory operations
- Evaluate profile quality regularly with G-Eval
- Preserve profile history for tracking changes
- Handle concurrent profile updates gracefully

## Integration Points
- **Memory System**: Uses memories as generation input
- **Chat Operations**: Triggered after memory processing
- **AI Server**: Calls AI endpoints for profile generation and evaluation
- **Activity Management**: Profiles may be activity-specific

## Error Handling
- **400 Bad Request**: Missing userId or invalid parameters
- **500 Internal Error**: AI service or database failures
- Return clear error messages for user feedback
