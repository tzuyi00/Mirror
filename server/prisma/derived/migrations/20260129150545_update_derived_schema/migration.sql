/*
  Warnings:

  - You are about to drop the `message_label` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "public"."message_label";

-- CreateTable
CREATE TABLE "public"."conversation_event" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "refMessageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data" JSONB,
    "threadId" UUID NOT NULL,

    CONSTRAINT "conversation_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."training_sample" (
    "id" UUID NOT NULL,
    "sampleId" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "refMessageId" TEXT,
    "sourceEventId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data" JSONB,
    "threadId" UUID,

    CONSTRAINT "training_sample_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "conversation_event_threadId_createdAt_idx" ON "public"."conversation_event"("threadId", "createdAt");

-- CreateIndex
CREATE INDEX "conversation_event_userId_createdAt_idx" ON "public"."conversation_event"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "conversation_event_refMessageId_idx" ON "public"."conversation_event"("refMessageId");

-- CreateIndex
CREATE UNIQUE INDEX "training_sample_sampleId_key" ON "public"."training_sample"("sampleId");

-- CreateIndex
CREATE INDEX "training_sample_userId_createdAt_idx" ON "public"."training_sample"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "training_sample_threadId_createdAt_idx" ON "public"."training_sample"("threadId", "createdAt");
