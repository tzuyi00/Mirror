-- AlterTable
ALTER TABLE "public"."user_statistics" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "public"."persona_rubrics" (
    "id" UUID NOT NULL,
    "userStatisticId" UUID NOT NULL,
    "rubricJson" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "persona_rubrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "persona_rubrics_userStatisticId_idx" ON "public"."persona_rubrics"("userStatisticId");

-- CreateIndex
CREATE INDEX "persona_rubrics_isActive_idx" ON "public"."persona_rubrics"("isActive");

-- CreateIndex
CREATE INDEX "user_statistics_userId_isActive_idx" ON "public"."user_statistics"("userId", "isActive");

-- AddForeignKey
ALTER TABLE "public"."persona_rubrics" ADD CONSTRAINT "persona_rubrics_userStatisticId_fkey" FOREIGN KEY ("userStatisticId") REFERENCES "public"."user_statistics"("id") ON DELETE CASCADE ON UPDATE CASCADE;
