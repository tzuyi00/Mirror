/*
  Warnings:

  - The values [PENDING,DONE,FAILED] on the enum `ExtractionStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."ExtractionStatus_new" AS ENUM ('ANSWERED', 'INVALID', 'ASKED');
ALTER TABLE "public"."activity_answers" ALTER COLUMN "ExtractionStatus" DROP DEFAULT;
ALTER TABLE "public"."activity_answers" ALTER COLUMN "ExtractionStatus" TYPE "public"."ExtractionStatus_new" USING ("ExtractionStatus"::text::"public"."ExtractionStatus_new");
ALTER TYPE "public"."ExtractionStatus" RENAME TO "ExtractionStatus_old";
ALTER TYPE "public"."ExtractionStatus_new" RENAME TO "ExtractionStatus";
DROP TYPE "public"."ExtractionStatus_old";
COMMIT;

-- AlterTable
ALTER TABLE "public"."activity_answers" ALTER COLUMN "ExtractionStatus" DROP DEFAULT;
