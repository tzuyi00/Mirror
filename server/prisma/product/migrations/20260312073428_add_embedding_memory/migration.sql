CREATE EXTENSION IF NOT EXISTS vector;
-- AlterTable
ALTER TABLE "public"."memories" ADD COLUMN     "contentEmbedding" vector(1536),
ADD COLUMN     "question" TEXT;
