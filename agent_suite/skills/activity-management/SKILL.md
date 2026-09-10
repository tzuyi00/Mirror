---
name: activity-management
description: Manage user activities and questionnaires. Retrieve activities, questions, track user progress, and manage activity completion status.
---

# 📋 Activity Management Skill

## Overview
The activity management system organizes structured questionnaires and activities. It tracks which activities users have completed, are in progress, or haven't started, enabling progression through the platform.

## Core Responsibilities

### 1. Activity Retrieval
- **Get All Activities**: `GET /api/activities`
  - Returns all available activities
  - Includes associated questions for each activity
  - Used for activity listing and discovery

### 2. Activity Status Tracking
- **Get Activity Status**: `GET /api/activities/status/{userId}`
  - Retrieves status for all activities for a specific user
  - Status values: `not_started`, `in_progress`, `completed`
  - Enables progress tracking and resume functionality

## Data Models

### Activity Object
```json
{
  "id": "string",
  "title": "string (activity name)",
  "description": "string (activity purpose)",
  "questions": [
    {
      "id": "string",
      "text": "string (question text)",
      "type": "string (e.g., 'open-ended', 'multiple-choice', 'rating')",
      "order": "number (question sequence)"
    }
  ]
}
```

### ActivityStatus
```json
{
  "activityId": "string",
  "title": "string",
  "status": "string (not_started | in_progress | completed)",
  "progress": {
    "questionsTotal": "number",
    "questionsAnswered": "number",
    "completionPercentage": "number (0-100)"
  },
  "startedAt": "string (ISO 8601, nullable)",
  "completedAt": "string (ISO 8601, nullable)"
}
```

### ActivityStatusResponse
```json
{
  "userId": "string",
  "activities": [
    {
      "activityId": "string",
      "title": "string",
      "status": "string",
      "progress": {
        "questionsTotal": "number",
        "questionsAnswered": "number",
        "completionPercentage": "number"
      },
      "startedAt": "string (ISO 8601, nullable)",
      "completedAt": "string (ISO 8601, nullable)"
    }
  ]
}
```

## Workflow Instructions

### Activity Discovery Flow
1. Call `GET /api/activities` to retrieve all activities
2. Display activity list to user
3. Show activity descriptions and question count
4. User selects activity to start
5. Call thread creation with selected activityId

### Activity Progress Flow
1. User selects activity
2. Call `GET /api/activities/status/{userId}` to check progress
3. If `not_started`: Begin from first question
4. If `in_progress`: Resume from current question
5. If `completed`: Show completion or allow restart

### Status Transitions
```
not_started
    ↓ (user starts activity)
in_progress
    ↓ (user answers all questions)
completed
```

### Question Types (Examples)
- **open-ended**: Free text responses
- **multiple-choice**: Select from options
- **rating**: Scale-based feedback
- **text-input**: Structured input fields

## Best Practices
- Cache activity list for performance
- Update activity status after each response
- Preserve in-progress state for session resumption
- Track timestamps for analytics
- Show progress indicator to user
- Allow activity restart for iterative feedback

## Integration Points
- **Thread Management**: Activities create activity-specific threads
- **Interview Conductor**: Structured interviews follow activity flow
- **Chat Operations**: Message exchanges within activity context
- **Memory System**: Activity responses generate memories
- **Profile Generation**: Activity data feeds profile generation
- **User Authentication**: Status tied to authenticated userId

## Error Handling
- **400 Bad Request**: Invalid userId
- **404 Not Found**: Activity or user not found
- **500 Internal Error**: Database failures
- Gracefully handle missing status data

## Activity Metadata
- **activityId**: Unique identifier
- **title**: Display name
- **description**: Purpose and context
- **questions**: Associated question list
- **questionOrder**: Sequence for multi-question activities

## Progress Calculation
```
completionPercentage = (questionsAnswered / questionsTotal) * 100
```

### Status Determination Rules
- **not_started**: questionsAnswered = 0, startedAt = null
- **in_progress**: questionsAnswered > 0 AND questionsAnswered < questionsTotal
- **completed**: questionsAnswered = questionsTotal, completedAt != null
