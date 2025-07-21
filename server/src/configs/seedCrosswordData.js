const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedCrosswordData() {
  try {
    console.log('Starting crossword data seeding...');

    // Sample words related to computing and programming
    const wordsData = [
      // Easy level words
      { wordText: 'CODE', difficulty: 'Easy', category: 'Programming' },
      { wordText: 'BYTE', difficulty: 'Easy', category: 'Computing' },
      { wordText: 'LOOP', difficulty: 'Easy', category: 'Programming' },
      { wordText: 'DATA', difficulty: 'Easy', category: 'Computing' },
      { wordText: 'FILE', difficulty: 'Easy', category: 'Computing' },
      { wordText: 'JAVA', difficulty: 'Easy', category: 'Programming' },
      { wordText: 'HTML', difficulty: 'Easy', category: 'Web Development' },
      { wordText: 'WIFI', difficulty: 'Easy', category: 'Networking' },
      { wordText: 'DISK', difficulty: 'Easy', category: 'Hardware' },
      { wordText: 'USER', difficulty: 'Easy', category: 'Computing' },
      
      // Medium level words
      { wordText: 'PYTHON', difficulty: 'Medium', category: 'Programming' },
      { wordText: 'MEMORY', difficulty: 'Medium', category: 'Hardware' },
      { wordText: 'SERVER', difficulty: 'Medium', category: 'Computing' },
      { wordText: 'FUNCTION', difficulty: 'Medium', category: 'Programming' },
      { wordText: 'DATABASE', difficulty: 'Medium', category: 'Data Management' },
      { wordText: 'VARIABLE', difficulty: 'Medium', category: 'Programming' },
      { wordText: 'COMPILER', difficulty: 'Medium', category: 'Programming' },
      { wordText: 'INTERNET', difficulty: 'Medium', category: 'Networking' },
      { wordText: 'SOFTWARE', difficulty: 'Medium', category: 'Computing' },
      { wordText: 'HARDWARE', difficulty: 'Medium', category: 'Computing' },
      
      // Hard level words
      { wordText: 'ALGORITHM', difficulty: 'Hard', category: 'Programming' },
      { wordText: 'JAVASCRIPT', difficulty: 'Hard', category: 'Programming' },
      { wordText: 'ENCRYPTION', difficulty: 'Hard', category: 'Security' },
      { wordText: 'FRAMEWORK', difficulty: 'Hard', category: 'Programming' },
      { wordText: 'DEBUGGING', difficulty: 'Hard', category: 'Programming' },
      { wordText: 'RECURSION', difficulty: 'Hard', category: 'Programming' },
      { wordText: 'PROCESSOR', difficulty: 'Hard', category: 'Hardware' },
      { wordText: 'INTERFACE', difficulty: 'Hard', category: 'Programming' },
      { wordText: 'PROTOCOL', difficulty: 'Hard', category: 'Networking' },
      { wordText: 'OPERATING', difficulty: 'Hard', category: 'Systems' },
    ];

    // Create words
    console.log('Creating words...');
    const createdWords = [];
    for (const wordData of wordsData) {
      const word = await prisma.word.create({
        data: {
          wordText: wordData.wordText,
          wordLength: wordData.wordText.length,
          difficulty: wordData.difficulty,
          category: wordData.category,
        },
      });
      createdWords.push(word);
    }
    console.log(`Created ${createdWords.length} words`);

    // Sample clues for the words
    const cluesData = [
      // Easy clues
      { clueText: 'Instructions written for computers to follow', clueType: 'DEFINITION', difficulty: 'Easy', category: 'Programming' }, // CODE
      { clueText: 'Unit of computer memory equal to 8 bits', clueType: 'DEFINITION', difficulty: 'Easy', category: 'Computing' }, // BYTE
      { clueText: 'Programming structure that repeats instructions', clueType: 'DEFINITION', difficulty: 'Easy', category: 'Programming' }, // LOOP
      { clueText: 'Information stored and processed by computers', clueType: 'DEFINITION', difficulty: 'Easy', category: 'Computing' }, // DATA
      { clueText: 'Collection of information stored on a computer', clueType: 'DEFINITION', difficulty: 'Easy', category: 'Computing' }, // FILE
      { clueText: 'Popular programming language with coffee-inspired name', clueType: 'DEFINITION', difficulty: 'Easy', category: 'Programming' }, // JAVA
      { clueText: 'Markup language for creating web pages', clueType: 'DEFINITION', difficulty: 'Easy', category: 'Web Development' }, // HTML
      { clueText: 'Wireless internet connection technology', clueType: 'DEFINITION', difficulty: 'Easy', category: 'Networking' }, // WIFI
      { clueText: 'Storage device that spins to read data', clueType: 'DEFINITION', difficulty: 'Easy', category: 'Hardware' }, // DISK
      { clueText: 'Person who operates a computer system', clueType: 'DEFINITION', difficulty: 'Easy', category: 'Computing' }, // USER

      // Medium clues
      { clueText: 'Programming language named after a snake', clueType: 'DEFINITION', difficulty: 'Medium', category: 'Programming' }, // PYTHON
      { clueText: 'Computer component that stores running programs', clueType: 'DEFINITION', difficulty: 'Medium', category: 'Hardware' }, // MEMORY
      { clueText: 'Computer that provides services to other computers', clueType: 'DEFINITION', difficulty: 'Medium', category: 'Computing' }, // SERVER
      { clueText: 'Reusable block of code that performs a task', clueType: 'DEFINITION', difficulty: 'Medium', category: 'Programming' }, // FUNCTION
      { clueText: 'Organized collection of structured information', clueType: 'DEFINITION', difficulty: 'Medium', category: 'Data Management' }, // DATABASE
      { clueText: 'Named storage location in programming', clueType: 'DEFINITION', difficulty: 'Medium', category: 'Programming' }, // VARIABLE
      { clueText: 'Program that translates source code to machine code', clueType: 'DEFINITION', difficulty: 'Medium', category: 'Programming' }, // COMPILER
      { clueText: 'Global network connecting computers worldwide', clueType: 'DEFINITION', difficulty: 'Medium', category: 'Networking' }, // INTERNET
      { clueText: 'Computer programs and applications', clueType: 'DEFINITION', difficulty: 'Medium', category: 'Computing' }, // SOFTWARE
      { clueText: 'Physical components of a computer system', clueType: 'DEFINITION', difficulty: 'Medium', category: 'Computing' }, // HARDWARE

      // Hard clues
      { clueText: 'Step-by-step procedure for solving a problem', clueType: 'DEFINITION', difficulty: 'Hard', category: 'Programming' }, // ALGORITHM
      { clueText: 'Scripting language that makes web pages interactive', clueType: 'DEFINITION', difficulty: 'Hard', category: 'Programming' }, // JAVASCRIPT
      { clueText: 'Process of converting data into secret code', clueType: 'DEFINITION', difficulty: 'Hard', category: 'Security' }, // ENCRYPTION
      { clueText: 'Pre-built structure for developing applications', clueType: 'DEFINITION', difficulty: 'Hard', category: 'Programming' }, // FRAMEWORK
      { clueText: 'Process of finding and fixing programming errors', clueType: 'DEFINITION', difficulty: 'Hard', category: 'Programming' }, // DEBUGGING
      { clueText: 'Programming technique where function calls itself', clueType: 'DEFINITION', difficulty: 'Hard', category: 'Programming' }, // RECURSION
      { clueText: 'Central processing unit of a computer', clueType: 'DEFINITION', difficulty: 'Hard', category: 'Hardware' }, // PROCESSOR
      { clueText: 'Boundary between different software components', clueType: 'DEFINITION', difficulty: 'Hard', category: 'Programming' }, // INTERFACE
      { clueText: 'Set of rules for network communication', clueType: 'DEFINITION', difficulty: 'Hard', category: 'Networking' }, // PROTOCOL
      { clueText: 'System software that manages computer resources', clueType: 'DEFINITION', difficulty: 'Hard', category: 'Systems' }, // OPERATING
    ];

    // Create clues
    console.log('Creating clues...');
    const createdClues = [];
    for (const clueData of cluesData) {
      const clue = await prisma.clue.create({
        data: clueData,
      });
      createdClues.push(clue);
    }
    console.log(`Created ${createdClues.length} clues`);

    // Create word-clue relationships
    console.log('Creating word-clue relationships...');
    for (let i = 0; i < createdWords.length && i < createdClues.length; i++) {
      await prisma.wordClue.create({
        data: {
          wordId: createdWords[i].wordId,
          clueId: createdClues[i].clueId,
          gridNumber: i + 1,
          isActive: true,
        },
      });
    }
    console.log('Created word-clue relationships');

    // Create sample crossword puzzles
    const puzzlesData = [
      {
        title: 'Programming Basics',
        difficulty: 'Easy',
        gridSize: 10,
        isPublished: true,
      },
      {
        title: 'Computer Hardware',
        difficulty: 'Medium',
        gridSize: 12,
        isPublished: true,
      },
      {
        title: 'Advanced Computing',
        difficulty: 'Hard',
        gridSize: 15,
        isPublished: true,
      },
      {
        title: 'Web Development Fundamentals',
        difficulty: 'Medium',
        gridSize: 12,
        isPublished: false, // Draft puzzle
      },
    ];

    console.log('Creating crossword puzzles...');
    const createdPuzzles = [];
    for (const puzzleData of puzzlesData) {
      const puzzle = await prisma.crosswordPuzzle.create({
        data: puzzleData,
      });
      createdPuzzles.push(puzzle);
    }
    console.log(`Created ${createdPuzzles.length} puzzles`);

    // Create sample puzzle words (simplified grid layout)
    console.log('Creating puzzle word placements...');
    const puzzleWordsData = [
      // Programming Basics puzzle (Easy words)
      { puzzleId: createdPuzzles[0].puzzleId, wordId: createdWords[0].wordId, clueId: createdClues[0].clueId, startRow: 1, startCol: 1, direction: 'ACROSS', clueNumber: 1 },
      { puzzleId: createdPuzzles[0].puzzleId, wordId: createdWords[1].wordId, clueId: createdClues[1].clueId, startRow: 3, startCol: 2, direction: 'DOWN', clueNumber: 2 },
      { puzzleId: createdPuzzles[0].puzzleId, wordId: createdWords[2].wordId, clueId: createdClues[2].clueId, startRow: 5, startCol: 1, direction: 'ACROSS', clueNumber: 3 },
      { puzzleId: createdPuzzles[0].puzzleId, wordId: createdWords[3].wordId, clueId: createdClues[3].clueId, startRow: 2, startCol: 6, direction: 'DOWN', clueNumber: 4 },
      { puzzleId: createdPuzzles[0].puzzleId, wordId: createdWords[4].wordId, clueId: createdClues[4].clueId, startRow: 7, startCol: 3, direction: 'ACROSS', clueNumber: 5 },

      // Computer Hardware puzzle (Medium words)
      { puzzleId: createdPuzzles[1].puzzleId, wordId: createdWords[11].wordId, clueId: createdClues[11].clueId, startRow: 1, startCol: 1, direction: 'ACROSS', clueNumber: 1 },
      { puzzleId: createdPuzzles[1].puzzleId, wordId: createdWords[12].wordId, clueId: createdClues[12].clueId, startRow: 3, startCol: 2, direction: 'DOWN', clueNumber: 2 },
      { puzzleId: createdPuzzles[1].puzzleId, wordId: createdWords[13].wordId, clueId: createdClues[13].clueId, startRow: 5, startCol: 1, direction: 'ACROSS', clueNumber: 3 },
      { puzzleId: createdPuzzles[1].puzzleId, wordId: createdWords[8].wordId, clueId: createdClues[8].clueId, startRow: 2, startCol: 8, direction: 'DOWN', clueNumber: 4 },

      // Advanced Computing puzzle (Hard words)
      { puzzleId: createdPuzzles[2].puzzleId, wordId: createdWords[20].wordId, clueId: createdClues[20].clueId, startRow: 1, startCol: 1, direction: 'ACROSS', clueNumber: 1 },
      { puzzleId: createdPuzzles[2].puzzleId, wordId: createdWords[21].wordId, clueId: createdClues[21].clueId, startRow: 3, startCol: 3, direction: 'DOWN', clueNumber: 2 },
      { puzzleId: createdPuzzles[2].puzzleId, wordId: createdWords[22].wordId, clueId: createdClues[22].clueId, startRow: 8, startCol: 1, direction: 'ACROSS', clueNumber: 3 },
    ];

    for (const puzzleWordData of puzzleWordsData) {
      await prisma.puzzleWord.create({
        data: puzzleWordData,
      });
    }
    console.log(`Created ${puzzleWordsData.length} puzzle word placements`);

    console.log('✅ Crossword data seeding completed successfully!');
    
    // Display summary
    console.log('\n📊 Summary:');
    console.log(`- Words created: ${createdWords.length}`);
    console.log(`- Clues created: ${createdClues.length}`);
    console.log(`- Puzzles created: ${createdPuzzles.length}`);
    console.log(`- Puzzle word placements: ${puzzleWordsData.length}`);

  } catch (error) {
    console.error('❌ Error seeding crossword data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding function
seedCrosswordData()
  .then(() => {
    console.log('Seeding process completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seeding process failed:', error);
    process.exit(1);
  });
