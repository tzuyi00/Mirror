## Directory Structure

### Frontend Structure

```
.
├── app/                          # Main Next.js application entry
│   ├── layout.tsx                # Root layout with WebSocket provider
│   ├── page.tsx                  # Home page
│   ├── (main)/                   # Main application routes group
│   │   ├── layout.tsx            # Main layout with Sidebar, ChatBox, ProfileUpdateProvider
│   │   └── profile/              # User profile pages
│   │       ├── page.tsx          # Profile overview page
│   │       └── detail/           # Profile detail pages
│   └── globals.css               # Global styles
│
├── components/                   # Custom React components and UI library
│   ├── ChatBox.tsx               # Chat interface with WebSocket integration
│   ├── Sidebar.tsx               # Navigation sidebar component
│   ├── theme-provider.tsx        # Theme provider for dark/light mode
│   ├── profile/                  # Profile-specific components
│   │   ├── MemoryModal.tsx       # Modal for viewing/editing memories
│   │   ├── cards/                # Profile cards (Insights, Metrics, ProgressBar, Spectrum, Tags, Timeline)
│   │   └── types/                # TypeScript type definitions for profile data
│   └── ui/                       # Reusable UI components (shadcn/ui: accordion, alert, avatar, badge, button, etc.)
│
├── contexts/                     # React Context providers for global state
│   ├── ProfileUpdateContext.tsx  # Manages profile update state
│   └── WebSocketContext.tsx      # Provides WebSocket connection to all components
│
├── hooks/                        # Custom React hooks
│   ├── useWebSocket.ts           # WebSocket connection management
│   ├── use-mobile.ts             # Mobile device detection
│   └── use-toast.ts              # Toast notification hook
│
├── lib/                          # Utility functions and shared logic
│   ├── api.ts                    # API client functions for backend communication
│   ├── profileUtils.ts           # Profile data processing utilities
│   └── utils.ts                  # General utility functions (cn, etc.)
│
├── public/                       # Static assets
│   ├── manifest.json             # PWA manifest
│   ├── sw.js                     # Service worker (auto-generated)
│   └── ...                       # Icons, images, logos, placeholders
│
└── styles/                       # Global CSS styles
    └── globals.css
```

### Backend Structure

```
server/                           # Node.js backend (Express + WebSocket + Prisma)
├── prisma/                       # Database schema and migrations
│   ├── schema.prisma             # Prisma database schema definition
│   └── migrations/               # Database migration files
│
├── src/                          # Backend source code
│   ├── server.ts                 # Main entry point - Express, WebSocket, static file serving
│   ├── ws.ts                     # WebSocket server implementation
│   ├── aiService.ts              # AI service integration (OpenAI/Anthropic)
│   │
│   ├── routes/                   # API route handlers
│   │   ├── chat.ts               # Chat message handling endpoints
│   │   ├── history.ts            # Chat history retrieval endpoints
│   │   ├── memory.ts             # Memory CRUD operations
│   │   └── profile.ts            # Profile view and generation endpoints
│   │
│   ├── services/                 # Business logic services
│   │   ├── db.ts                 # Database operations using Prisma ORM
│   │   ├── chatService.ts        # Chat-related business logic
│   │   ├── memoryService.ts      # Memory management logic
│   │   ├── profileService.ts     # Profile data processing
│   │   └── profileAutoUpdateService.ts  # Automatic profile updates
│   │
│   ├── stubs/                    # Mock data for development/testing
│   │   ├── chatStubs.ts          # Mock chat responses
│   │   ├── memoryStubs.ts        # Mock memory data
│   │   ├── profileStubs.ts       # Mock profile data
│   │   └── index.ts              # Stub exports
│   │
│   └── utils/                    # Backend utility functions
│       └── apiResponse.ts        # API response formatting utilities
│
├── Dockerfile                    # Docker container configuration
├── .env.template                 # Environment variable template
├── package.json                  # Backend dependencies and scripts
└── tsconfig.json                 # TypeScript configuration
```

### Configuration Files

```
.
├── package.json                  # Frontend dependencies and scripts
├── tsconfig.json                 # Frontend TypeScript configuration
├── next.config.mjs               # Next.js configuration (PWA, static export settings)
├── postcss.config.mjs            # PostCSS configuration for Tailwind CSS
├── components.json               # shadcn/ui components configuration
├── docker-compose.yml            # Docker Compose for server + database
├── .env.template                 # Environment variable template
└── README.md                     # Project documentation
```

## Installation & Usage

### Frontend (Next.js)

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Visit [http://localhost:3000](http://localhost:3000) to use the app.

### Backend (Server)

1. Go to the `server` folder:
   ```bash
   cd server
   ```
2. Install backend dependencies:
   ```bash
   npm install
   ```
3. Generate Prisma Clients (Development)
   ```bash
   npm run prisma:generate:dev
   ```
4. Apply Database Migrations (Development)
   ```bash
   npm run db:dev
   ```
5. Start the backend server:
   ```bash
   npm run dev
   ```
4. The server will be available at [http://localhost:3001](http://localhost:3001)

### AI Server

1. Go to the `ai_server` folder:
   ```bash
   cd ai_server
   ```
2. Install Python dependencies (via Poetry):
   ```bash
   poetry install --no-root
   ```
4. Start the AI inference server:
   ```bash
   poetry run python main.py
   ```
6. The AI server will be available at: http://localhost:8000


#### About Migration Files

Migration files in `server/prisma/migrations` track all changes to your database schema. They should be committed to version control so all team members can keep their databases in sync.


## Progressive Web App (PWA)

This project can be run as a Progressive Web App (PWA). To test PWA features, the application must be built and run in production mode.

**Important:** PWA mode is not compatible with static site generation. Before building, make sure the `output: 'export'` line in `next.config.mjs` is commented out.

```bash
# 1. Build the application for production
npm run build

# 2. Start the production server
npm start
```
You can then verify the PWA status and service worker in your browser's developer tools.

## Ngrok Tunnel for Development

For testing and demonstration purposes, you can expose your local backend server to the internet using ngrok. The project includes a convenient script to handle this.

**Important:** The ngrok deployment requires static frontend files to be generated. Before running the deployment command, make sure the `output: 'export'` line in `next.config.mjs` is **uncommented**. This will generate the `out/` directory containing static files that the backend Express server will serve.

The `npm run deploy` command will:
1. Build the frontend application (generates `out/` static files).
2. Install backend dependencies.
3. Concurrently start the backend server and an ngrok tunnel pointing to it.

To use it, simply run:
```bash
npm run deploy
```
This will provide a public URL that you can use to access your local server from anywhere.

## Updating API Documentation

When you add or modify APIs in either the AI Server or Backend Server, follow these steps to regenerate the API documentation.

### AI Server Updates

If you've updated APIs in the AI Server (Python/FastAPI):

1. Export the OpenAPI specification:
   ```bash
   cd ai_server
   poetry run python export_openapi.py
   ```
   This generates `ai-openapi.json`.

2. Copy the generated file to the docs folder:
   ```bash
   cp ai_server/ai-openapi.json docs/openapi/
   ```

### Backend Server Updates

If you've updated APIs in the Backend Server (Node.js/Express):

1. Generate the OpenAPI specification:
   ```bash
   cd server
   npx tsoa spec-and-routes
   ```
   This generates `swagger.json`.

2. Convert the OpenAPI spec into the required format using the API prompt guidelines:
   - Transform `swagger.json` into `private-backend.json` and `public-backend.json` (Backend APIs are split into Public and Private categories)
   - See [`api-prompt.md`](./api-prompt.md) for detailed transformation instructions
   - Save the generated files to the `server/` directory to replace the existing files:
     - `server/private-backend.json`
     - `server/public-backend.json`

3. Copy the generated files from `server/` to the docs folder:
   ```bash
   cp server/private-backend.json docs/openapi/
   cp server/public-backend.json docs/openapi/
   ```

### Regenerate API Documentation

After updating either server's APIs:

1. Generate the documentation pages:
   ```bash
   cd docs
   npm run generate:openapi
   ```

2. Verify the changes locally:
   ```bash
   npm run dev
   ```

The documentation will be generated in the `docs/content/public/api-reference` and `docs/content/private/api-reference` directories.
