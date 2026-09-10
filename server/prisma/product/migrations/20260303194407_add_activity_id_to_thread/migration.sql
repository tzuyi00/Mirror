-- AlterTable
ALTER TABLE "public"."threads" ADD COLUMN     "activityId" UUID;

-- CreateIndex
CREATE INDEX "threads_activityId_idx" ON "public"."threads"("activityId");
