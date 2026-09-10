-- AlterTable
ALTER TABLE "public"."activity_answers" ADD COLUMN     "threadId" UUID;

-- AddForeignKey
ALTER TABLE "public"."activity_answers" ADD CONSTRAINT "activity_answers_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "public"."threads"("id") ON DELETE SET NULL ON UPDATE CASCADE;
