/*
  Warnings:

  - You are about to drop the column `memoryExtracted` on the `activity_answers` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."ExtractionStatus" AS ENUM ('PENDING', 'DONE', 'FAILED');

-- AlterTable
ALTER TABLE "public"."activity_answers" DROP COLUMN "memoryExtracted",
ADD COLUMN     "ExtractionStatus" "public"."ExtractionStatus" NOT NULL DEFAULT 'PENDING';
