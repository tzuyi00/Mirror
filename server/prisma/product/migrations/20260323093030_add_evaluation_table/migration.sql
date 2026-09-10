-- CreateTable
CREATE TABLE "public"."evaluation_runs" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "evalType" TEXT,
    "totalQuestions" INTEGER NOT NULL,
    "evaluatedCount" INTEGER NOT NULL,
    "skippedCount" INTEGER NOT NULL,
    "avgScore" DOUBLE PRECISION,
    "avgDimensionScores" JSONB,
    "skippedSummary" JSONB,
    "itemResultsJson" JSONB,
    "suggestSummary" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evaluation_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "evaluation_runs_userId_idx" ON "public"."evaluation_runs"("userId");

-- CreateIndex
CREATE INDEX "evaluation_runs_evalType_idx" ON "public"."evaluation_runs"("evalType");

-- AddForeignKey
ALTER TABLE "public"."evaluation_runs" ADD CONSTRAINT "evaluation_runs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
