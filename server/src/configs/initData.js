  require('dotenv').config();
  console.log('DATABASE_URL:', process.env.DATABASE_URL);

  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  const bcrypt = require('bcrypt');

  async function initializeData() {
    try {
      await prisma.rolePermission.deleteMany({});
      await prisma.userRole.deleteMany({});
      await prisma.role.deleteMany({});
      await prisma.permission.deleteMany({});
      await prisma.user.deleteMany({});
      await prisma.activity.deleteMany({});
      await prisma.quizResult.deleteMany({});
      await prisma.userResult.deleteMany({});
      await prisma.personalityType.deleteMany({});
      await prisma.option.deleteMany({});
      await prisma.question.deleteMany({});
      await prisma.userPuzzleProgress.deleteMany({});
      await prisma.puzzleWord.deleteMany({});
      await prisma.crosswordPuzzle.deleteMany({});
      await prisma.wordClue.deleteMany({});
      await prisma.clue.deleteMany({});
      await prisma.word.deleteMany({});
      await prisma.location.deleteMany({});

      // --- 1. Initialize Permissions ---
      const permissionsToCreate = [
        { permissionName: 'access_app', description: 'Basic access to the application features' },
        { permissionName: 'view_content', description: 'Ability to view content (words, clues, questions, locations, activities)' },
        { permissionName: 'view_users', description: 'Ability to view user accounts' },
        { permissionName: 'view_roles', description: 'Ability to view roles and permissions' },
        { permissionName: 'view_logs', description: 'Ability to view system logs' },
        { permissionName: 'view_reports', description: 'Ability to view system reports' },
        { permissionName: 'manage_words', description: 'Ability to manage words' },
        { permissionName: 'manage_clues', description: 'Ability to manage clues' },
        { permissionName: 'manage_questions', description: 'Ability to manage questions' },
        { permissionName: 'manage_activities', description: 'Ability to manage activities' },
        { permissionName: 'manage_locations', description: 'Ability to manage locations' },
        { permissionName: 'manage_all_content', description: 'Ability to create, edit, and delete content (words, clues, questions, locations, activities)' },
        { permissionName: 'manage_users', description: 'Ability to manage user accounts' },
        { permissionName: 'manage_admin_users', description: 'Ability to manage admin user accounts' },
        { permissionName: 'manage_roles', description: 'Ability to manage roles and permissions' },
        { permissionName: 'manage_settings', description: 'Ability to manage application settings' },
      ];

      const createdPermissions = {};
      for (const perm of permissionsToCreate) {
        let permission = await prisma.permission.findUnique({ where: { permissionName: perm.permissionName } });
        if (!permission) {
          permission = await prisma.permission.create({ data: perm });
          console.log(`Permission '${perm.permissionName}' created.`);
        } else {
          console.log(`Permission '${perm.permissionName}' already exists, skipping.`);
        }
        createdPermissions[perm.permissionName] = permission;
      }

      // --- 2. Initialize Roles ---
      const rolesToCreate = [
        {
          roleName: 'user',
          description: 'Basic user role with limited permissions',
          permissions: [
            'access_app', 
            'view_content', 
            'view_users'
          ],
        },
        {
          roleName: 'content_manager',
          description: 'Content manager role with permissions to manage all content',
          permissions: [
            'access_app',
            'view_content',
            'view_users',
            'manage_words',
            'manage_clues',
            'manage_questions',
            'manage_activities',
            'manage_locations',
            'manage_all_content',
          ],
        },
        {
          roleName: 'moderator',
          description: 'Moderator role with permissions to manage users and content',
          permissions: [
            'access_app',
            'view_content',
            'view_users',
            'manage_users',
            'manage_roles',
            'manage_settings',
            'manage_all_content',
          ],
        },
        {
          roleName: 'admin',
          description: 'Administrator role with full access to manage users, content, and settings',
          permissions: [
            'access_app',
            'view_content',
            'view_users',
            'manage_users',
            'manage_roles',
            'manage_settings',
            'manage_all_content',
          ],
        },
        {
          roleName: 'super_admin',
          description: 'Super administrator role with all permissions',
          permissions: [
            'access_app',
            'view_content',
            'view_users',
            'manage_users',
            'manage_admin_users',
            'manage_roles',
            'manage_settings',
            'manage_all_content',
          ],
        },
      ];

      const createdRoles = {};
      for (const roleData of rolesToCreate) {
        let role = await prisma.role.findUnique({ where: { roleName: roleData.roleName } });
        if (!role) {
          role = await prisma.role.create({
            data: {
              roleName: roleData.roleName,
              description: roleData.description,
            },
          });
          console.log(`Role '${role.roleName}' created.`);
        } else {
          console.log(`Role '${role.roleName}' already exists, skipping.`);
        }
        createdRoles[roleData.roleName] = role;

        // Assign permissions
        for (const permName of roleData.permissions) {
          const permission = createdPermissions[permName];
          const existing = await prisma.rolePermission.findUnique({
            where: {
              roleId_permissionId: {
                roleId: role.roleId,
                permissionId: permission.permissionId,
              },
            },
          });
          if (!existing) {
            await prisma.rolePermission.create({
              data: {
                roleId: role.roleId,
                permissionId: permission.permissionId,
              },
            });
            console.log(`Assigned permission '${permName}' to role '${role.roleName}'.`);
          } else {
            console.log(`Permission '${permName}' already assigned to role '${role.roleName}', skipping.`);
          }
        }
      }

      // --- 3. Create Admin User ---
      const existingAdminUser = await prisma.user.findFirst({
        where: { username: 'admin' },
      });

      if (!existingAdminUser) {
        const password = process.env.ADMIN_PASSWORD || 'Admin@123';
        const hashedPassword = await bcrypt.hash(password, 10);

        const adminRole = await prisma.role.findUnique({
          where: { roleName: 'super_admin' },
        });

        const newUser = await prisma.user.create({
          data: {
            username: 'admin',
            passwordHash: hashedPassword,
            points: 0,
            userRole: {
              create: {
                roleId: adminRole.roleId,
              },
            },
          },
        });

        console.log('Admin user created:', newUser.username);
      } else {
        console.log('Admin user already exists, skipping creation.');
      }

      // --- 4. Create Activities --- 
      const activitiesToCreate = [
        {
          name: 'NPC Interation (Introduction)',
          description: 'Learn more about the game and how to play.',
        },
        {
          name: 'Computing Crash Course',
          description: 'A quick introduction to computing concepts.'
        },
        {
          name: 'Crossword Puzzle',
          description: 'Solve a crossword puzzle to test your knowledge of computing terms.'
        },
        {
          name: 'SoC Personality Quiz',
          description: 'Take a quiz to discover your most suitable SoC diploma based on your personality.',
          route: '/quiz'
        },
        {
          name: 'AR Selfie Challenge',
          description: 'Take a selfie with an AR filter and share it on social media.',
          route: '/face-filter'
        }
      ];

      for (const a of activitiesToCreate) {
        const existing = await prisma.activity.findFirst({
          where: { name: a.name },
        });
        if (!existing) {
          const created = await prisma.activity.create({
            data: {
              name: a.name,
              description: a.description,
              route: a.route
            },
          });
          console.log(`Activity created: ${created.name}`);
        } else {
          console.log(`Activity ${a.name} already exists, skipping.`);
        }
      }

    const personalityTypes = [
      {
        code: 'DAAA',
        name: 'Diploma in Applied AI and Analytics',
        description: 'You have a sharp eye for patterns and enjoy making sense of complex information. You’re naturally curious and driven to uncover insights through data.',
      },
      {
        code: 'DCDF',
        name: 'Diploma in Cybersecurity and Digital Forensics',
        description: 'You’re detail-oriented, cautious, and enjoy solving mysteries. You take pride in protecting others and ensuring systems remain secure and resilient.',
      },
      {
        code: 'DCS',
        name: 'Diploma in Computer Science',
        description: 'You enjoy building things from the ground up and thinking logically to solve problems. You’re inventive, hands-on, and love creating solutions that make an impact.',
      },  
    ];

    for (const p of personalityTypes) {
      const existing = await prisma.personalityType.findUnique({
        where: { code: p.code },
      });

      if (!existing) {
        const created = await prisma.personalityType.create({
          data: {
            code: p.code,
            name: p.name,
            description: p.description,
          },
        });
        console.log(`Personality type created: ${created.name}`);
      } else {
        console.log(`Personality type '${p.name}' already exists, skipping.`);
      }
    }

    const personalityMap = {};
    const personalityRecords = await prisma.personalityType.findMany();
    for (const record of personalityRecords) {
      personalityMap[record.code] = record.id;
    }

    const quizQuestions = [
      {
        questionText: 'When working on a project, what do you enjoy the most?',
        options: [
          { optionText: 'Understanding patterns and making sense of information', personalityCode: 'DAAA' },
          { optionText: 'Creating something new and building things from scratch', personalityCode: 'DCS' },
          { optionText: 'Keeping things safe and solving problems that protect others', personalityCode: 'DCDF' },
        ],
      },
      {
        questionText: 'What kind of tasks do you prefer?',
        options: [
          { optionText: 'Exploring data and spotting trends', personalityCode: 'DAAA' },
          { optionText: 'Designing and making plans for new ideas', personalityCode: 'DCS' },
          { optionText: 'Finding solutions to keep things secure and protected', personalityCode: 'DCDF' },
        ],
      },
      {
        questionText: 'How do you like to spend your free time?',
        options: [
          { optionText: 'Reading about new discoveries and learning how things work', personalityCode: 'DAAA' },
          { optionText: 'Making or fixing things, like DIY projects or crafts', personalityCode: 'DCS' },
          { optionText: 'Playing detective games or puzzles that involve solving mysteries', personalityCode: 'DCDF' },
        ],
      },
      {
        questionText: 'What kind of teamwork do you enjoy?',
        options: [
          { optionText: 'Collaborating to analyze information and make decisions', personalityCode: 'DAAA' },
          { optionText: 'Working together to build or develop something tangible', personalityCode: 'DCS' },
          { optionText: 'Joining forces to guard and protect important things', personalityCode: 'DCDF' },
        ],
      },
      {
        questionText: 'What motivates you?',
        options: [
          { optionText: 'Learning new things and understanding the “why” behind them', personalityCode: 'DAAA' },
          { optionText: 'Creating and building useful things that people can use', personalityCode: 'DCS' },
          { optionText: 'Helping keep people safe and solving problems that matter', personalityCode: 'DCDF' },
        ],
      },
      {
        questionText: 'How do you approach problems?',
        options: [
          { optionText: 'I try to understand all the facts before deciding', personalityCode: 'DAAA' },
          { optionText: 'I like to try different ideas until something works', personalityCode: 'DCS' },
          { optionText: 'I look for weaknesses or risks and try to fix them', personalityCode: 'DCDF' },
        ],
      },
      {
        questionText: 'What kind of stories or movies do you prefer?',
        options: [
          { optionText: 'Stories about discoveries and innovations', personalityCode: 'DAAA' },
          { optionText: 'Adventures where characters build or invent something new', personalityCode: 'DCS' },
          { optionText: 'Thrillers or mysteries involving secrets and investigations', personalityCode: 'DCDF' },
        ],
      },
      {
        questionText: 'If you had to choose, which sounds most interesting?',
        options: [
          { optionText: 'Finding useful patterns in everyday information', personalityCode: 'DAAA' },
          { optionText: 'Designing and building a new tool or app', personalityCode: 'DCS' },
          { optionText: 'Tracking down a mystery or stopping a bad actor', personalityCode: 'DCDF' },
        ],
      },
      {
        questionText: 'What skill would you like to get better at?',
        options: [
          { optionText: 'Understanding data and how to use it wisely', personalityCode: 'DAAA' },
          { optionText: 'Creating and building new things', personalityCode: 'DCS' },
          { optionText: 'Protecting others and solving tricky problems', personalityCode: 'DCDF' },
        ],
      },
      {
        questionText: 'What’s your preferred way to learn?',
        options: [
          { optionText: 'By analyzing facts and figures', personalityCode: 'DAAA' },
          { optionText: 'By making and doing hands-on projects', personalityCode: 'DCS' },
          { optionText: 'By practicing real-life problem solving and investigation', personalityCode: 'DCDF' },
        ],
      },
    ];

    for (const q of quizQuestions) {
      const existing = await prisma.question.findFirst({
        where: { questionText: q.questionText },
      });

      if (!existing) {
        const created = await prisma.question.create({
          data: {
            questionText: q.questionText,
            options: {
              create: q.options.map(opt => ({
                optionText: opt.optionText,
                personalityId: personalityMap[opt.personalityCode],
              })),
            },
          },
        });
        console.log(`Quiz question created: ${created.questionText}`);
      } else {
        console.log(`Quiz question '${q.questionText}' already exists, skipping.`);
      }
    }

      // --- Create Location Information ---
      const locationsToCreate = [
        {
          name: 'Applied AI and Analytics Lab',
          description: 'A state-of-the-art lab for AI and data analytics projects, with advanced powered computing resources.',
          code: 'T2134',
          points: 10,
        },
        {
          name: 'Cyber Wargame Center',
          description: 'A lab for cybersecurity training and digital forensics exercises, equipped with a custom server for simulations.',
          code: 'T2035',
          points: 10,
        },
      ];

      for (const loc of locationsToCreate) {
        const existing = await prisma.location.findFirst({
          where: { code: loc.code },
        });
        if (!existing) {
          const created = await prisma.location.create({
            data: {
              name: loc.name,
              description: loc.description,
              code: loc.code,
              points: loc.points,
            },
          });
          console.log(`Location created: ${created.name}`);
        } else {
          console.log(`Location ${loc.name} already exists, skipping.`);
        }
      }

      // --- 5. Initialize Crossword Data ---
      console.log('Starting crossword data initialization...');

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
      console.log('Creating crossword words...');
      const createdWords = [];
      for (const wordData of wordsData) {
        const existing = await prisma.word.findFirst({
          where: { wordText: wordData.wordText },
        });
        
        if (!existing) {
          const word = await prisma.word.create({
            data: {
              wordText: wordData.wordText,
              wordLength: wordData.wordText.length,
              difficulty: wordData.difficulty,
              category: wordData.category,
            },
          });
          createdWords.push(word);
          console.log(`Word created: ${wordData.wordText}`);
        } else {
          createdWords.push(existing);
          console.log(`Word ${wordData.wordText} already exists, skipping.`);
        }
      }

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
      console.log('Creating crossword clues...');
      const createdClues = [];
      for (const clueData of cluesData) {
        const existing = await prisma.clue.findFirst({
          where: { clueText: clueData.clueText },
        });

        if (!existing) {
          const clue = await prisma.clue.create({
            data: clueData,
          });
          createdClues.push(clue);
          console.log(`Clue created: ${clueData.clueText}`);
        } else {
          createdClues.push(existing);
          console.log(`Clue already exists, skipping.`);
        }
      }

      // Create word-clue relationships
      console.log('Creating word-clue relationships...');
      for (let i = 0; i < createdWords.length && i < createdClues.length; i++) {
        const existing = await prisma.wordClue.findUnique({
          where: {
            wordId_clueId: {
              wordId: createdWords[i].wordId,
              clueId: createdClues[i].clueId,
            },
          },
        });

        if (!existing) {
          await prisma.wordClue.create({
            data: {
              wordId: createdWords[i].wordId,
              clueId: createdClues[i].clueId,
              gridNumber: i + 1,
              isActive: true,
            },
          });
          console.log(`Word-clue relationship created for ${createdWords[i].wordText}`);
        } else {
          console.log(`Word-clue relationship already exists for ${createdWords[i].wordText}, skipping.`);
        }
      }

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
        const existing = await prisma.crosswordPuzzle.findFirst({
          where: { title: puzzleData.title },
        });

        if (!existing) {
          const puzzle = await prisma.crosswordPuzzle.create({
            data: puzzleData,
          });
          createdPuzzles.push(puzzle);
          console.log(`Puzzle created: ${puzzleData.title}`);
        } else {
          createdPuzzles.push(existing);
          console.log(`Puzzle ${puzzleData.title} already exists, skipping.`);
        }
      }

      // Create sample puzzle words (simplified grid layout)
      console.log('Creating puzzle word placements...');
      const puzzleWordsData = [
        // Programming Basics puzzle (Easy words)
        { puzzleIndex: 0, wordIndex: 0, clueIndex: 0, startRow: 1, startCol: 1, direction: 'ACROSS', clueNumber: 1 },
        { puzzleIndex: 0, wordIndex: 1, clueIndex: 1, startRow: 3, startCol: 2, direction: 'DOWN', clueNumber: 2 },
        { puzzleIndex: 0, wordIndex: 2, clueIndex: 2, startRow: 5, startCol: 1, direction: 'ACROSS', clueNumber: 3 },
        { puzzleIndex: 0, wordIndex: 3, clueIndex: 3, startRow: 2, startCol: 6, direction: 'DOWN', clueNumber: 4 },
        { puzzleIndex: 0, wordIndex: 4, clueIndex: 4, startRow: 7, startCol: 3, direction: 'ACROSS', clueNumber: 5 },

        // Computer Hardware puzzle (Medium words)
        { puzzleIndex: 1, wordIndex: 11, clueIndex: 11, startRow: 1, startCol: 1, direction: 'ACROSS', clueNumber: 1 },
        { puzzleIndex: 1, wordIndex: 12, clueIndex: 12, startRow: 3, startCol: 2, direction: 'DOWN', clueNumber: 2 },
        { puzzleIndex: 1, wordIndex: 13, clueIndex: 13, startRow: 5, startCol: 1, direction: 'ACROSS', clueNumber: 3 },
        { puzzleIndex: 1, wordIndex: 8, clueIndex: 8, startRow: 2, startCol: 8, direction: 'DOWN', clueNumber: 4 },

        // Advanced Computing puzzle (Hard words)
        { puzzleIndex: 2, wordIndex: 20, clueIndex: 20, startRow: 1, startCol: 1, direction: 'ACROSS', clueNumber: 1 },
        { puzzleIndex: 2, wordIndex: 21, clueIndex: 21, startRow: 3, startCol: 3, direction: 'DOWN', clueNumber: 2 },
        { puzzleIndex: 2, wordIndex: 22, clueIndex: 22, startRow: 8, startCol: 1, direction: 'ACROSS', clueNumber: 3 },
      ];

      for (const puzzleWordData of puzzleWordsData) {
        if (createdPuzzles[puzzleWordData.puzzleIndex] && 
            createdWords[puzzleWordData.wordIndex] && 
            createdClues[puzzleWordData.clueIndex]) {
          
          const existing = await prisma.puzzleWord.findUnique({
            where: {
              puzzleId_wordId_clueId: {
                puzzleId: createdPuzzles[puzzleWordData.puzzleIndex].puzzleId,
                wordId: createdWords[puzzleWordData.wordIndex].wordId,
                clueId: createdClues[puzzleWordData.clueIndex].clueId,
              },
            },
          });

          if (!existing) {
            await prisma.puzzleWord.create({
              data: {
                puzzleId: createdPuzzles[puzzleWordData.puzzleIndex].puzzleId,
                wordId: createdWords[puzzleWordData.wordIndex].wordId,
                clueId: createdClues[puzzleWordData.clueIndex].clueId,
                startRow: puzzleWordData.startRow,
                startCol: puzzleWordData.startCol,
                direction: puzzleWordData.direction,
                clueNumber: puzzleWordData.clueNumber,
              },
            });
            console.log(`Puzzle word placement created for ${createdWords[puzzleWordData.wordIndex].wordText} in ${createdPuzzles[puzzleWordData.puzzleIndex].title}`);
          } else {
            console.log(`Puzzle word placement already exists, skipping.`);
          }
        }
      }

      console.log('✅ Crossword data initialization completed!');
      console.log(`- Words: ${createdWords.length}`);
      console.log(`- Clues: ${createdClues.length}`);
      console.log(`- Puzzles: ${createdPuzzles.length}`);
      console.log(`- Puzzle word placements: ${puzzleWordsData.length}`);

      // Populate data into UserActivities table 
      console.log('Populating UserActivities for userId: 1...');
      const user = await prisma.user.findUnique({
        where: { userId: 1 },
      });
      if (!user) {
        console.error('User with userId: 1 does not exist. Cannot populate UserActivities.');
        return;
      }

      for (const a of activitiesToCreate) {
        const existing = await prisma.activity.findFirst({
          where: { name: a.name },
        });
        if (existing) {
          const existingUserActivity = await prisma.userActivities.findFirst({
            where: {
              userId: 1,
              activityId: existing.activityId,
              points: 0
            },
          });
          if (!existingUserActivity) {
            await prisma.userActivities.create({
              data: {
                userId: 1,
                activityId: existing.activityId,
                points: 0
              },
            });
            console.log(`UserActivities entry created for userId: 1 and activity: ${existing.name}`);
          } else {
            console.log(`UserActivities entry for userId: 1 and activity: ${existing.name} already exists, skipping.`);
          }
        } else {
          console.log(`Activity ${a.name} not found, skipping UserActivities entry.`);
        }
      }
    } catch (error) {
      console.error('Error initializing data:', error);
      process.exit(1);
    } finally {
      await prisma.$disconnect();
    }
  }

  (async () => {
    console.log('Starting data initialization...');
    await initializeData();
    console.log('Data initialization complete.');
  })();