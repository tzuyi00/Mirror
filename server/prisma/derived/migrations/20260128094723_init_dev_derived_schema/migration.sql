-- CreateEnum
CREATE TYPE "public"."MessageRole" AS ENUM ('user', 'ai', 'system');

-- CreateTable
CREATE TABLE "public"."message_label" (
    "id" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "role" "public"."MessageRole" NOT NULL,
    "data" JSONB,
    "threadId" UUID NOT NULL,

    CONSTRAINT "message_label_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "message_label_threadId_createdAt_idx" ON "public"."message_label"("threadId", "createdAt");
