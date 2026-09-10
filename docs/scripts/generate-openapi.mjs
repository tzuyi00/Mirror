import { generateFiles } from 'fumadocs-openapi';
import { createOpenAPI } from 'fumadocs-openapi/server';

/**
 * Generate API documentation from OpenAPI specifications
 * This script generates MDX files for both public and private API docs
 *
 * Backend APIs: Uses pre-categorized public-backend.json and private-backend.json
 * AI Server APIs: All go to Private
 *
 * NOTE: paths below are kept relative to this script's cwd (docs/, since it's
 * run via `npm run generate:openapi`) rather than resolved to absolute paths.
 * fumadocs-openapi embeds the input path string verbatim into the generated
 * .mdx files' `document` prop, so an absolute path would bake the local
 * machine's directory structure into committed files.
 */

const publicBackendPath = './openapi/public-backend.json';
const privateBackendPath = './openapi/private-backend.json';

// ============================================
//  Generate Public API Documentation
// ============================================
const publicOpenAPI = createOpenAPI({
  input: [publicBackendPath],
});

await generateFiles({
  input: publicOpenAPI,
  output: './content/public/api-reference',
  per: 'operation',
});

console.log('✅ Public API documentation generated!\n');

// ============================================
//  Generate Private API Documentation
// ============================================
const privateOpenAPI = createOpenAPI({
  input: [
    privateBackendPath, // Private backend APIs
    './openapi/ai-openapi.json', // All AI Server APIs
  ],
});

await generateFiles({
  input: privateOpenAPI,
  output: './content/private/api-reference',
  per: 'operation',
});

console.log('✅ Private API documentation generated!\n');

