import { PrismaClient as ProductPrismaClient } from '../generated/product/index.js'
import { PrismaClient as DerivedPrismaClient } from '../generated/derived/index.js'

/**
 * Prisma Database Singleton
 * 
 * This file provides a centralized Prisma client instance for the entire application.
 * It prevents too many database connections during development hot reload.
 * 
 * Configuration:
 * - In development: Shows warn/error logs by default
 * - To see SQL queries in dev: Set env var PRISMA_LOG_QUERIES=true
 * - In production: Only shows error logs
 * 
 * Usage:
 * Import prisma from this file in service layer modules:
 * - memoryService.ts
 * - profileService.ts
 * - chatService.ts
 * 
 * Note: Route handlers should NOT import prisma directly.
 * Use service layer functions instead for proper separation of concerns.
 */

const g = globalThis as unknown as {
  productPrisma?: ProductPrismaClient
  derivedPrisma?: DerivedPrismaClient
}

export const productPrisma =
  g.productPrisma ??
  new ProductPrismaClient({
    log:
      process.env.NODE_ENV !== 'production'
        ? (process.env.PRISMA_LOG_QUERIES ? ['query', 'info', 'warn', 'error'] : ['warn', 'error'])
        : ['error'],
  })

export const derivedPrisma =
  g.derivedPrisma ??
  new DerivedPrismaClient({
    log:
      process.env.NODE_ENV !== 'production'
        ? (process.env.PRISMA_LOG_QUERIES ? ['query', 'info', 'warn', 'error'] : ['warn', 'error'])
        : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  g.productPrisma = productPrisma
  g.derivedPrisma = derivedPrisma
}