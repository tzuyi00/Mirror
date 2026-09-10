import dotenv from 'dotenv'
dotenv.config({
  path: process.env.NODE_ENV === 'production'
    ? '.env.production'
    : '.env.development'
})
import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { attachWS } from './ws.js';
import { RegisterRoutes } from './generated/routes.js';
import { requestContextMiddleware } from './middleware/requestContext.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors({ 
  origin: [
    'http://localhost:3000',  // Local development
    'https://unantagonizing-marhta-peakish.ngrok-free.dev'  // Frontend ngrok URL
  ],
  credentials: true 
}));
app.use(express.json({ limit: '2mb' }));

// Add request context middleware to track requests and handle abort signals
app.use(requestContextMiddleware);

const httpServer = http.createServer(app);
attachWS(httpServer); // Attach WebSocket server to the HTTP server

// Load OpenAPI specifications
const swaggerPath = path.join(__dirname, '../swagger.json');
const swaggerSpec = JSON.parse(readFileSync(swaggerPath, 'utf8'));

// Swagger UI setup
app.use('/api-docs', swaggerUi.serve);
app.get('/api-docs', (req, res) => {
  res.send(swaggerUi.generateHTML(swaggerSpec, {
    customSiteTitle: "AI Townhall Backend API Documentation",
    customCss: '.swagger-ui .topbar { display: none }',
  }));
});

// Simple health check endpoints
app.get('/healthz', (_req, res) => res.json({ ok: true }));
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Register TSOA auto-generated routes
RegisterRoutes(app);

// Static file serving
// Serve Next.js 'out' directory as static content
const distDir = path.join(__dirname, '../../out');
app.use(express.static(distDir));

// SPA fallback (serve index.html for non-API routes)
app.use((req, res, next) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/healthz')) return next();
  res.sendFile(path.join(distDir, 'index.html'));
});

// Start the server
const PORT = Number(process.env.PORT) || 3001;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Integrated Server running on http://0.0.0.0:${PORT}`);
  console.log(`Access via: http://192.168.2.80:${PORT}`);
  console.log(`WebSocket: ws://192.168.2.80:${PORT}/ws`);
  console.log(`Swagger UI API Documentation: http://localhost:${PORT}/api-docs`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  httpServer.close(() => process.exit(0));
});