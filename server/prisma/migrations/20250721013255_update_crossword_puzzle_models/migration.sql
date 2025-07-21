-- AlterTable
ALTER TABLE "Clue" ADD COLUMN     "category" TEXT,
ADD COLUMN     "difficulty" TEXT;

-- AlterTable
ALTER TABLE "Word" ADD COLUMN     "category" TEXT,
ADD COLUMN     "difficulty" TEXT;

-- AlterTable
ALTER TABLE "WordClue" ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "grid_number" DROP NOT NULL;

-- CreateTable
CREATE TABLE "CrosswordPuzzle" (
    "puzzle_id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "grid_size" INTEGER NOT NULL,
    "created_by" INTEGER,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrosswordPuzzle_pkey" PRIMARY KEY ("puzzle_id")
);

-- CreateTable
CREATE TABLE "PuzzleWord" (
    "puzzle_id" INTEGER NOT NULL,
    "word_id" INTEGER NOT NULL,
    "clue_id" INTEGER NOT NULL,
    "start_row" INTEGER NOT NULL,
    "start_col" INTEGER NOT NULL,
    "direction" TEXT NOT NULL,
    "clue_number" INTEGER NOT NULL,

    CONSTRAINT "PuzzleWord_pkey" PRIMARY KEY ("puzzle_id","word_id","clue_id")
);

-- CreateTable
CREATE TABLE "UserPuzzleProgress" (
    "user_id" INTEGER NOT NULL,
    "puzzle_id" INTEGER NOT NULL,
    "current_grid" TEXT,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMP(3),
    "time_spent" INTEGER,
    "hints_used" INTEGER NOT NULL DEFAULT 0,
    "score" INTEGER,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPuzzleProgress_pkey" PRIMARY KEY ("user_id","puzzle_id")
);

-- AddForeignKey
ALTER TABLE "PuzzleWord" ADD CONSTRAINT "PuzzleWord_puzzle_id_fkey" FOREIGN KEY ("puzzle_id") REFERENCES "CrosswordPuzzle"("puzzle_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PuzzleWord" ADD CONSTRAINT "PuzzleWord_word_id_fkey" FOREIGN KEY ("word_id") REFERENCES "Word"("word_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PuzzleWord" ADD CONSTRAINT "PuzzleWord_clue_id_fkey" FOREIGN KEY ("clue_id") REFERENCES "Clue"("clue_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPuzzleProgress" ADD CONSTRAINT "UserPuzzleProgress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPuzzleProgress" ADD CONSTRAINT "UserPuzzleProgress_puzzle_id_fkey" FOREIGN KEY ("puzzle_id") REFERENCES "CrosswordPuzzle"("puzzle_id") ON DELETE CASCADE ON UPDATE CASCADE;
