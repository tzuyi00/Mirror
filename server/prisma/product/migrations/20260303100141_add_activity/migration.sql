-- CreateTable
CREATE TABLE "public"."activities" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."activity_questions" (
    "id" UUID NOT NULL,
    "activityId" UUID NOT NULL,
    "questionText" TEXT NOT NULL,

    CONSTRAINT "activity_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."activity_answers" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "questionId" UUID NOT NULL,
    "answerText" TEXT NOT NULL,
    "memoryExtracted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_answers_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."activity_questions" ADD CONSTRAINT "activity_questions_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "public"."activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."activity_answers" ADD CONSTRAINT "activity_answers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."activity_answers" ADD CONSTRAINT "activity_answers_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "public"."activity_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
