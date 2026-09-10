-- CreateEnum
CREATE TYPE "public"."MessageRole" AS ENUM ('user', 'ai', 'system');

-- CreateEnum
CREATE TYPE "public"."MemoryType" AS ENUM ('user', 'ai');

-- CreateEnum
CREATE TYPE "public"."SectionType" AS ENUM ('progressBar', 'tags', 'timeline', 'spectrum', 'insights', 'metrics');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" UUID NOT NULL,
    "email" TEXT,
    "name" TEXT,
    "title" TEXT,
    "bio" TEXT,
    "memoryOperationCount" INTEGER NOT NULL DEFAULT 0,
    "lastAutoUpdateAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."threads" (
    "id" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" UUID,

    CONSTRAINT "threads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."messages" (
    "id" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "role" "public"."MessageRole" NOT NULL,
    "data" JSONB,
    "threadId" UUID NOT NULL,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."memories" (
    "id" UUID NOT NULL,
    "type" "public"."MemoryType" NOT NULL,
    "content" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "categories" TEXT[],
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "memories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."profile_sections" (
    "id" UUID NOT NULL,
    "type" "public"."SectionType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "metadata" JSONB,
    "order" INTEGER NOT NULL DEFAULT 0,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profile_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."_MemoryToProfileSection" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_MemoryToProfileSection_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE INDEX "threads_userId_idx" ON "public"."threads"("userId");

-- CreateIndex
CREATE INDEX "messages_threadId_createdAt_idx" ON "public"."messages"("threadId", "createdAt");

-- CreateIndex
CREATE INDEX "memories_userId_idx" ON "public"."memories"("userId");

-- CreateIndex
CREATE INDEX "memories_timestamp_idx" ON "public"."memories"("timestamp");

-- CreateIndex
CREATE INDEX "profile_sections_userId_idx" ON "public"."profile_sections"("userId");

-- CreateIndex
CREATE INDEX "profile_sections_order_idx" ON "public"."profile_sections"("order");

-- CreateIndex
CREATE INDEX "_MemoryToProfileSection_B_index" ON "public"."_MemoryToProfileSection"("B");

-- AddForeignKey
ALTER TABLE "public"."threads" ADD CONSTRAINT "threads_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."messages" ADD CONSTRAINT "messages_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "public"."threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."memories" ADD CONSTRAINT "memories_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."profile_sections" ADD CONSTRAINT "profile_sections_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_MemoryToProfileSection" ADD CONSTRAINT "_MemoryToProfileSection_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."memories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_MemoryToProfileSection" ADD CONSTRAINT "_MemoryToProfileSection_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."profile_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
