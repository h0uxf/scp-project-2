/*
  Warnings:

  - You are about to alter the column `option_text` on the `Option` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - You are about to alter the column `name` on the `PersonalityType` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - You are about to alter the column `question_text` on the `Question` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - A unique constraint covering the columns `[name]` on the table `PersonalityType` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."Option" ALTER COLUMN "option_text" SET DATA TYPE VARCHAR(50);

-- AlterTable
ALTER TABLE "public"."PersonalityType" ALTER COLUMN "name" SET DATA TYPE VARCHAR(50);

-- AlterTable
ALTER TABLE "public"."Question" ALTER COLUMN "question_text" SET DATA TYPE VARCHAR(50);

-- CreateIndex
CREATE UNIQUE INDEX "PersonalityType_name_key" ON "public"."PersonalityType"("name");
