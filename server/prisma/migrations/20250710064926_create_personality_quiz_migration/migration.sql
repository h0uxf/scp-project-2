/*
  Warnings:

  - You are about to drop the column `is_correct` on the `Option` table. All the data in the column will be lost.
  - You are about to drop the column `is_correct` on the `QuizResult` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Option" DROP COLUMN "is_correct",
ADD COLUMN     "personality_id" INTEGER;

-- AlterTable
ALTER TABLE "QuizResult" DROP COLUMN "is_correct";

-- CreateTable
CREATE TABLE "PersonalityType" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "PersonalityType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserResult" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "personality_id" INTEGER NOT NULL,
    "calculated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PersonalityType_code_key" ON "PersonalityType"("code");

-- AddForeignKey
ALTER TABLE "Option" ADD CONSTRAINT "Option_personality_id_fkey" FOREIGN KEY ("personality_id") REFERENCES "PersonalityType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizResult" ADD CONSTRAINT "QuizResult_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserResult" ADD CONSTRAINT "UserResult_personality_id_fkey" FOREIGN KEY ("personality_id") REFERENCES "PersonalityType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserResult" ADD CONSTRAINT "UserResult_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
