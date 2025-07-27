/*
  Warnings:

  - Changed the type of `qr_token` on the `Reward` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Reward" DROP COLUMN "qr_token",
ADD COLUMN     "qr_token" UUID NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Reward_qr_token_key" ON "Reward"("qr_token");
