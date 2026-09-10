-- CreateEnum
CREATE TYPE "public"."MessageMode" AS ENUM ('impersonation', 'interviewer');

-- AlterTable
ALTER TABLE "public"."messages" ADD COLUMN     "mode" "public"."MessageMode" NOT NULL DEFAULT 'impersonation';
