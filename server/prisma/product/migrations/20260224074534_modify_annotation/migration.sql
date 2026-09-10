-- DropForeignKey
ALTER TABLE "public"."message_annotations" DROP CONSTRAINT "message_annotations_messageId_fkey";

-- AlterTable
ALTER TABLE "public"."message_annotations" ALTER COLUMN "messageId" DROP NOT NULL;
