-- CreateEnum
CREATE TYPE "public"."AnnotationDomain" AS ENUM ('GLOBAL', 'Work', 'Family', 'Social', 'Crisis', 'Other');

-- CreateEnum
CREATE TYPE "public"."AnnotationStakes" AS ENUM ('GLOBAL', 'low', 'medium', 'high');

-- CreateTable
CREATE TABLE "public"."message_annotations" (
    "id" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "messageId" UUID NOT NULL,
    "userId" UUID,
    "domain" "public"."AnnotationDomain" NOT NULL,
    "stakes" "public"."AnnotationStakes" NOT NULL,
    "tagsJson" JSONB,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1.0,

    CONSTRAINT "message_annotations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_statistics" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "domain" "public"."AnnotationDomain" NOT NULL,
    "stakes" "public"."AnnotationStakes" NOT NULL,
    "statisticData" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_statistics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "message_annotations_messageId_createdAt_idx" ON "public"."message_annotations"("messageId", "createdAt");

-- CreateIndex
CREATE INDEX "message_annotations_domain_stakes_idx" ON "public"."message_annotations"("domain", "stakes");

-- CreateIndex
CREATE INDEX "message_annotations_userId_idx" ON "public"."message_annotations"("userId");

-- CreateIndex
CREATE INDEX "user_statistics_userId_idx" ON "public"."user_statistics"("userId");

-- CreateIndex
CREATE INDEX "user_statistics_domain_stakes_idx" ON "public"."user_statistics"("domain", "stakes");

-- AddForeignKey
ALTER TABLE "public"."message_annotations" ADD CONSTRAINT "message_annotations_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "public"."messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_statistics" ADD CONSTRAINT "user_statistics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
