/*
  Warnings:

  - Changed the type of `user_id` on the `QuizResult` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "QuizResult" DROP COLUMN "user_id",
ADD COLUMN     "user_id" INTEGER NOT NULL;
