# Role

You are a **Senior Backend Architect and OpenAPI Expert**. Your task is to transform a `swagger.json` file into a specific format. This ensures compatibility with documentation tools like **fumadocs-openapi**.

---

## 1. Global Configuration

Every generated JSON file must start with this exact structure:

```json
{
  "openapi": "3.1.0",
  "info": {
    "title": "Me 2 Backend API",
    "description": "Backend Server API endpoints for Me 2 - Node.js/Express",
    "version": "1.0.0"
  },
  "tags": [
    { "name": "Public", "description": "Publicly accessible APIs" },
    { "name": "Private", "description": "Private APIs for internal use" }
  ]
}
```

---

## 2. Target Format Examples

Follow these examples strictly for the **paths structure**, including how **tags, summary, operationId, and responses** are formatted.

### Example A: POST with RequestBody

```json
"/api/chat": {
  "post": {
    "tags": ["Public"],
    "summary": "POST /api/chat",
    "description": "Core AI chat functionality. Send a message and receive an AI response.",
    "operationId": "chatMessage",
    "parameters": [
      {
        "description": "The unique identifier of the user",
        "name": "userId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        },
        "example": "user_123"
      }
    ],
    "requestBody": {
      "description": "The chat request containing userId, message, and optional threadId",
      "required": true,
      "content": {
        "application/json": {
          "schema": {
            "$ref": "#/components/schemas/ChatRequest",
            "description": "Chat request with userId, message, and optional threadId"
          }
        }
      }
    },
    "responses": {
      "200": {
        "description": "Successful response",
        "content": {
          "application/json": {
            "schema": { "$ref": "#/components/schemas/ChatResponse" }
          }
        }
      },
      "400": {
        "description": "Bad Request",
        "content": {
          "application/json": { "schema": { "$ref": "#/components/schemas/ErrorResponse" } }
        }
      }
    }
  }
}
```

---

## 3. Custom API Classification (User Defined)

Please classify the APIs based on the lists below. If an API is not listed, **default it to `Private`**.

### Public APIs (Only in `public-backend.json`)

Example: `/api/profile-views/{userId}`

```
POST /api/chat/generate
POST /api/greeting/generate
POST /api/thread
GET /api/profile-views/:userId
GET /api/memories/:memoryId
```

### Private APIs (Only in `private-backend.json`)

Example: `/api/memories`

```
POST /api/chat/reply
POST /api/chat/process-memory
POST /api/chat/start-interview
POST /api/chat/interview
GET /api/profile-views/:userId
POST /api/profile/generate
POST /api/profile/trigger-auto-update
POST /api/profile/g-eval
GET /api/memories/:memoryId
POST /api/memories
PATCH /api/memories/:memoryId
DELETE /api/memories/:memoryId
POST /api/auth/signup
POST /api/auth/verify-credentials
GET /api/activities
GET /api/activities/status/:userId
```

---

## 4. Transformation Logic & Rules

### A. File Splitting & Tagging Logic

* **If Public Only** → Path appears ONLY in `public-backend.json`. Tags must start with `["Public", ...]`.
* **If Private Only** → Path appears ONLY in `private-backend.json`. Tags must start with `["Private", ...]`.
* **If Both** → Path appears in BOTH files. Tags must start with `["Public", "Private", ...]`.

### B. Property Specifications
* **Metadata Integrity**: You must include ALL existing fields from the source. Specifically:
  * **Descriptions**: Keep description at the endpoint level, inside requestBody, and inside responses.
  * **Flags**: Preserve `required: true/false` for both parameters and requestBody.
  * **Schema Details**: If the source schema has a description, keep it.
* **Responses**: You must map ALL response codes provided in the source (e.g., 200, 400, 401, 403, 404, 500, 502). Do not skip error responses.
* **Summary** must be generated as: `[METHOD] [PATH]` (e.g., `GET /api/users`).
* **Schema Names** DO NOT rename any schemas. Keep them exactly as they appear in the source.
* **Components**: Copy the entire `components.schemas` section from the source to **both output files** without modification.

---

## 5. Final Output Requirements

* Provide **two separate code blocks**:

  * `public-backend.json`
  * `private-backend.json`
* Ensure the output is **valid JSON** (minified or pretty-printed).

---

## 6. User Input - Source Swagger

Please process the following Swagger JSON content provided below:

```
[USER: PASTE YOUR SWAGGER.JSON CONTENT HERE OR ATTACH THE FILE]
```
