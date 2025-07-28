-- CreateTable
CREATE TABLE "Reward" (
    "reward_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "activity_id" INTEGER NOT NULL,
    "qr_token" TEXT NOT NULL,
    "is_redeemed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "redeemed_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "Reward_pkey" PRIMARY KEY ("reward_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Reward_qr_token_key" ON "Reward"("qr_token");

-- AddForeignKey
ALTER TABLE "Reward" ADD CONSTRAINT "Reward_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reward" ADD CONSTRAINT "Reward_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "Activity"("activity_id") ON DELETE CASCADE ON UPDATE CASCADE;
