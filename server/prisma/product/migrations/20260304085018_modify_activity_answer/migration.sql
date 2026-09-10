/*
  Warnings:

  - You are about to drop the column `answerText` on the `activity_answers` table. All the data in the column will be lost.
  - Added the required column `answerMessageId` to the `activity_answers` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."ActivityQuestionType" AS ENUM ('STANDARD', 'FOLLOW_UP');

-- DropForeignKey
ALTER TABLE "public"."activity_answers" DROP CONSTRAINT "activity_answers_questionId_fkey";

-- AlterTable
ALTER TABLE "public"."activity_answers" DROP COLUMN "answerText",
ADD COLUMN     "activityId" UUID,
ADD COLUMN     "answerMessageId" UUID NOT NULL,
ADD COLUMN     "followUpQuestionText" TEXT,
ADD COLUMN     "questionMessageId" UUID,
ADD COLUMN     "questionType" "public"."ActivityQuestionType" NOT NULL DEFAULT 'STANDARD',
ALTER COLUMN "questionId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."activity_answers" ADD CONSTRAINT "activity_answers_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "public"."activity_questions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."activity_answers" ADD CONSTRAINT "activity_answers_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "public"."activities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."activity_answers" ADD CONSTRAINT "activity_answers_questionMessageId_fkey" FOREIGN KEY ("questionMessageId") REFERENCES "public"."messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."activity_answers" ADD CONSTRAINT "activity_answers_answerMessageId_fkey" FOREIGN KEY ("answerMessageId") REFERENCES "public"."messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
