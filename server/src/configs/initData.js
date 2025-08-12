require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

// Validate environment variables
if (!process.env.DATABASE_URL) {
  console.error("Error: DATABASE_URL is not set in .env file");
  process.exit(1);
}
console.log("DATABASE_URL:", process.env.DATABASE_URL);

const prisma = new PrismaClient();

// Utility function to clear all tables
async function clearTables() {
  try {
    console.log("Clearing all tables...");
    await Promise.all([
      prisma.rolePermission.deleteMany({}),
      prisma.userPuzzleProgress.deleteMany({}),
      prisma.puzzleWord.deleteMany({}),
      prisma.crosswordPuzzle.deleteMany({}),
      prisma.wordClue.deleteMany({}),
      prisma.clue.deleteMany({}),
      prisma.word.deleteMany({}),
      prisma.quizResult.deleteMany({}),
      prisma.userResult.deleteMany({}),
      prisma.personalityType.deleteMany({}),
      prisma.option.deleteMany({}),
      prisma.question.deleteMany({}),
      prisma.userActivities.deleteMany({}),
      prisma.userLocation.deleteMany({}),
      prisma.reward.deleteMany({}),
      prisma.activity.deleteMany({}),
      prisma.location.deleteMany({}),
      prisma.user.deleteMany({}),
      prisma.role.deleteMany({}),
      prisma.permission.deleteMany({}),
    ]);
    console.log("All tables cleared.");
  } catch (error) {
    console.error("Error clearing tables:", error);
    throw error;
  }
}

// Initialize permissions
async function initializePermissions() {
  const permissionsToCreate = [
    { permissionName: "access_app", description: "Basic access to the application features" },
    { permissionName: "view_content", description: "Ability to view content (words, clues, questions, locations, activities)" },
    { permissionName: "view_users", description: "Ability to view user accounts" },
    { permissionName: "view_roles", description: "Ability to view roles and permissions" },
    { permissionName: "view_logs", description: "Ability to view system logs" },
    { permissionName: "view_reports", description: "Ability to view system reports" },
    { permissionName: "manage_words", description: "Ability to manage words" },
    { permissionName: "manage_clues", description: "Ability to manage clues" },
    { permissionName: "manage_questions", description: "Ability to manage questions" },
    { permissionName: "manage_activities", description: "Ability to manage activities" },
    { permissionName: "manage_locations", description: "Ability to manage locations" },
    { permissionName: "manage_all_content", description: "Ability to create, edit, and delete content" },
    { permissionName: "manage_users", description: "Ability to manage user accounts" },
    { permissionName: "manage_admin_users", description: "Ability to manage admin user accounts" },
    { permissionName: "manage_roles", description: "Ability to manage roles and permissions" },
    { permissionName: "manage_settings", description: "Ability to manage application settings" },
  ];

  try {
    console.log("Creating permissions...");
    const existingPermissions = await prisma.permission.findMany();
    const existingNames = new Set(existingPermissions.map(p => p.permissionName));
    const newPermissions = permissionsToCreate.filter(p => !existingNames.has(p.permissionName));

    if (newPermissions.length > 0) {
      await prisma.permission.createMany({ data: newPermissions, skipDuplicates: true });
      console.log(`Created ${newPermissions.length} permissions.`);
    } else {
      console.log("All permissions already exist, skipping creation.");
    }

    return await prisma.permission.findMany();
  } catch (error) {
    console.error("Error initializing permissions:", error);
    throw error;
  }
}

// Initialize roles and assign permissions
async function initializeRoles(permissions) {
  const rolesToCreate = [
    {
      roleName: "user",
      description: "Basic user role with limited permissions",
      permissions: ["access_app", "view_content", "view_users"],
    },
    {
      roleName: "content_manager",
      description: "Content manager role with permissions to manage all content",
      permissions: [
        "access_app", "view_content", "view_users", "manage_words", "manage_clues",
        "manage_questions", "manage_activities", "manage_locations", "manage_all_content",
      ],
    },
    {
      roleName: "moderator",
      description: "Moderator role with permissions to manage users and content",
      permissions: [
        "access_app", "view_content", "view_users", "manage_users", "manage_roles",
        "manage_settings", "manage_all_content",
      ],
    },
    {
      roleName: "admin",
      description: "Administrator role with full access to manage users, content, and settings",
      permissions: [
        "access_app", "view_content", "view_users", "manage_users", "manage_roles",
        "manage_settings", "manage_all_content",
      ],
    },
    {
      roleName: "super_admin",
      description: "Super administrator role with all permissions",
      permissions: [
        "access_app", "view_content", "view_users", "manage_users", "manage_admin_users",
        "manage_roles", "manage_settings", "manage_all_content",
      ],
    },
  ];

  try {
    console.log("Creating roles...");
    const permissionMap = permissions.reduce((map, perm) => {
      map[perm.permissionName] = perm.permissionId;
      return map;
    }, {});

    const existingRoles = await prisma.role.findMany();
    const existingRoleNames = new Set(existingRoles.map(r => r.roleName));
    const newRoles = rolesToCreate.filter(r => !existingRoleNames.has(r.roleName));

    const createdRoles = [];
    for (const roleData of newRoles) {
      const role = await prisma.role.create({
        data: {
          roleName: roleData.roleName,
          description: roleData.description,
        },
      });
      createdRoles.push(role);
      console.log(`Role '${role.roleName}' created.`);

      // Assign permissions
      const rolePermissions = roleData.permissions.map(permName => ({
        roleId: role.roleId,
        permissionId: permissionMap[permName],
      }));
      await prisma.rolePermission.createMany({ data: rolePermissions, skipDuplicates: true });
      console.log(`Assigned ${rolePermissions.length} permissions to role '${role.roleName}'.`);
    }

    return [...existingRoles, ...createdRoles];
  } catch (error) {
    console.error("Error initializing roles:", error);
    throw error;
  }
}

// Initialize users
async function initializeUsers(roles) {
  const roleMap = roles.reduce((map, role) => {
    map[role.roleName] = role.roleId;
    return map;
  }, {});

  const password = process.env.ADMIN_PASSWORD;
  const sampleUsers = [
    { username: "admin", password: password, roleName: "super_admin", points: 0 },
    { username: "alice", password: password, roleName: "user", points: 120 },
    { username: "bob", password: password, roleName: "user", points: 45 },
    { username: "charlie", password: password, roleName: "user", points: 300 },
    { username: "diana", password: password, roleName: "user", points: 80 },
    { username: "evan", password: password, roleName: "user", points: 200 },
    { username: "fay", password: password, roleName: "user", points: 15 },
    { username: "grace", password: password, roleName: "user", points: 500 },
    { username: "henry", password: password, roleName: "user", points: 260 },
    { username: "ivy", password: password, roleName: "user", points: 75 },
    { username: "jack", password: password, roleName: "user", points: 0 },
    { username: "kate", password: password, roleName: "user", points: 350 },
    { username: "leo", password: password, roleName: "user", points: 5 },
    { username: "mia", password: password, roleName: "user", points: 100 },
    { username: "nick", password: password, roleName: "user", points: 180 },
    { username: "olivia", password: password, roleName: "user", points: 420 },
    { username: "peter", password: password, roleName: "user", points: 33 },
    { username: "quinn", password: password, roleName: "user", points: 275 },
    { username: "rachel", password: password, roleName: "user", points: 92 },
    { username: "sam", password: password, roleName: "user", points: 60 },
    { username: "tina", password: password, roleName: "user", points: 310 },
  ];

  try {
    console.log("Creating users...");
    const existingUsers = await prisma.user.findMany();
    const existingUsernames = new Set(existingUsers.map(u => u.username));
    const newUsers = sampleUsers.filter(u => !existingUsernames.has(u.username));

    for (const user of newUsers) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      await prisma.user.create({
        data: {
          username: user.username,
          passwordHash: hashedPassword,
          points: user.points,
          roleId: roleMap[user.roleName],
        },
      });
      console.log(`User '${user.username}' created with role '${user.roleName}'.`);
    }
    console.log(`Created ${newUsers.length} users.`);
  } catch (error) {
    console.error("Error initializing users:", error);
    throw error;
  }
}

// Initialize activities
async function initializeActivities() {
  const activitiesToCreate = [
    { name: "Crossword Puzzle", description: "Solve a crossword puzzle to test your knowledge of computing terms.", route: "/admin/crossword" },
    { name: "SoC Personality Quiz", description: "Take a quiz to discover your most suitable SoC diploma based on your personality.", route: "/quiz" }
  ];

  try {
    console.log("Creating activities...");
    const existingActivities = await prisma.activity.findMany();
    const existingNames = new Set(existingActivities.map(a => a.name));
    const newActivities = activitiesToCreate.filter(a => !existingNames.has(a.name));

    if (newActivities.length > 0) {
      await prisma.activity.createMany({ data: newActivities, skipDuplicates: true });
      console.log(`Created ${newActivities.length} activities.`);
    } else {
      console.log("All activities already exist, skipping creation.");
    }
  } catch (error) {
    console.error("Error initializing activities:", error);
    throw error;
  }
}

// Initialize personality types
async function initializePersonalityTypes() {
  const personalityTypes = [
    {
      code: "DAAA",
      name: "Diploma in Applied AI and Analytics",
      description: "You have a sharp eye for patterns and enjoy making sense of complex information.",
    },
    {
      code: "DCDF",
      name: "Diploma in Cybersecurity and Digital Forensics",
      description: "You’re detail-oriented, cautious, and enjoy solving mysteries.",
    },
    {
      code: "DCS",
      name: "Diploma in Computer Science",
      description: "You enjoy building things from the ground up and thinking logically to solve problems.",
    },
  ];

  try {
    console.log("Creating personality types...");
    const existingTypes = await prisma.personalityType.findMany();
    const existingCodes = new Set(existingTypes.map(t => t.code));
    const newTypes = personalityTypes.filter(t => !existingCodes.has(t.code));

    if (newTypes.length > 0) {
      await prisma.personalityType.createMany({ data: newTypes, skipDuplicates: true });
      console.log(`Created ${newTypes.length} personality types.`);
    } else {
      console.log("All personality types already exist, skipping creation.");
    }

    return await prisma.personalityType.findMany();
  } catch (error) {
    console.error("Error initializing personality types:", error);
    throw error;
  }
}

// Initialize quiz questions
async function initializeQuizQuestions(personalityTypes) {
  const personalityMap = personalityTypes.reduce((map, type) => {
    map[type.code] = type.id;
    return map;
  }, {});

  const quizQuestions = [
      {
        questionText: "When working on a project, what do you enjoy the most?",
        options: [
          {
            optionText:
              "Understanding patterns and making sense of information",
            personalityCode: "DAAA",
          },
          {
            optionText:
              "Creating something new and building things from scratch",
            personalityCode: "DCS",
          },
          {
            optionText:
              "Keeping things safe and solving problems that protect others",
            personalityCode: "DCDF",
          },
        ],
      },
      {
        questionText: "What kind of tasks do you prefer?",
        options: [
          {
            optionText: "Exploring data and spotting trends",
            personalityCode: "DAAA",
          },
          {
            optionText: "Designing and making plans for new ideas",
            personalityCode: "DCS",
          },
          {
            optionText: "Finding solutions to keep things secure and protected",
            personalityCode: "DCDF",
          },
        ],
      },
      {
        questionText: "How do you like to spend your free time?",
        options: [
          {
            optionText:
              "Reading about new discoveries and learning how things work",
            personalityCode: "DAAA",
          },
          {
            optionText: "Making or fixing things, like DIY projects or crafts",
            personalityCode: "DCS",
          },
          {
            optionText:
              "Playing detective games or puzzles that involve solving mysteries",
            personalityCode: "DCDF",
          },
        ],
      },
      {
        questionText: "What kind of teamwork do you enjoy?",
        options: [
          {
            optionText:
              "Collaborating to analyze information and make decisions",
            personalityCode: "DAAA",
          },
          {
            optionText:
              "Working together to build or develop something tangible",
            personalityCode: "DCS",
          },
          {
            optionText: "Joining forces to guard and protect important things",
            personalityCode: "DCDF",
          },
        ],
      },
      {
        questionText: "What motivates you?",
        options: [
          {
            optionText:
              "Learning new things and understanding the “why” behind them",
            personalityCode: "DAAA",
          },
          {
            optionText:
              "Creating and building useful things that people can use",
            personalityCode: "DCS",
          },
          {
            optionText:
              "Helping keep people safe and solving problems that matter",
            personalityCode: "DCDF",
          },
        ],
      },
      {
        questionText: "How do you approach problems?",
        options: [
          {
            optionText: "I try to understand all the facts before deciding",
            personalityCode: "DAAA",
          },
          {
            optionText: "I like to try different ideas until something works",
            personalityCode: "DCS",
          },
          {
            optionText: "I look for weaknesses or risks and try to fix them",
            personalityCode: "DCDF",
          },
        ],
      },
      {
        questionText: "What kind of stories or movies do you prefer?",
        options: [
          {
            optionText: "Stories about discoveries and innovations",
            personalityCode: "DAAA",
          },
          {
            optionText:
              "Adventures where characters build or invent something new",
            personalityCode: "DCS",
          },
          {
            optionText:
              "Thrillers or mysteries involving secrets and investigations",
            personalityCode: "DCDF",
          },
        ],
      },
      {
        questionText: "If you had to choose, which sounds most interesting?",
        options: [
          {
            optionText: "Finding useful patterns in everyday information",
            personalityCode: "DAAA",
          },
          {
            optionText: "Designing and building a new tool or app",
            personalityCode: "DCS",
          },
          {
            optionText: "Tracking down a mystery or stopping a bad actor",
            personalityCode: "DCDF",
          },
        ],
      },
      {
        questionText: "What skill would you like to get better at?",
        options: [
          {
            optionText: "Understanding data and how to use it wisely",
            personalityCode: "DAAA",
          },
          {
            optionText: "Creating and building new things",
            personalityCode: "DCS",
          },
          {
            optionText: "Protecting others and solving tricky problems",
            personalityCode: "DCDF",
          },
        ],
      },
      {
        questionText: "What’s your preferred way to learn?",
        options: [
          {
            optionText: "By analyzing facts and figures",
            personalityCode: "DAAA",
          },
          {
            optionText: "By making and doing hands-on projects",
            personalityCode: "DCS",
          },
          {
            optionText:
              "By practicing real-life problem solving and investigation",
            personalityCode: "DCDF",
          },
        ],
      },
    ];

  try {
    console.log("Creating quiz questions...");
    for (const q of quizQuestions) {
      const existing = await prisma.question.findFirst({
        where: { questionText: q.questionText },
      });

      if (!existing) {
        await prisma.question.create({
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
        console.log(`Quiz question created: ${q.questionText}`);
      } else {
        console.log(`Quiz question '${q.questionText}' already exists, skipping.`);
      }
    }
  } catch (error) {
    console.error("Error initializing quiz questions:", error);
    throw error;
  }
}

// Initialize locations
async function initializeLocations() {
  const locationsToCreate = [
    {
      name: "Applied AI and Analytics Lab",
      description: "A state-of-the-art lab for AI and data analytics projects.",
      code: "T2134",
      points: 10,
    },
    {
      name: "Cyber Wargame Center",
      description: "A lab for cybersecurity training and digital forensics exercises.",
      code: "T2035",
      points: 10,
    },
  ];

  try {
    console.log("Creating locations...");
    const existingLocations = await prisma.location.findMany();
    const existingCodes = new Set(existingLocations.map(l => l.code));
    const newLocations = locationsToCreate.filter(l => !existingCodes.has(l.code));

    if (newLocations.length > 0) {
      await prisma.location.createMany({ data: newLocations, skipDuplicates: true });
      console.log(`Created ${newLocations.length} locations.`);
    } else {
      console.log("All locations already exist, skipping creation.");
    }
  } catch (error) {
    console.error("Error initializing locations:", error);
    throw error;
  }
}

// Initialize crossword data
async function initializeCrosswordData() {
  const wordsData = [
      // Easy level words
      { wordText: "CODE", difficulty: "Easy", category: "Programming" },
      { wordText: "BYTE", difficulty: "Easy", category: "Computing" },
      { wordText: "LOOP", difficulty: "Easy", category: "Programming" },
      { wordText: "DATA", difficulty: "Easy", category: "Computing" },
      { wordText: "FILE", difficulty: "Easy", category: "Computing" },
      { wordText: "JAVA", difficulty: "Easy", category: "Programming" },
      { wordText: "HTML", difficulty: "Easy", category: "Web Development" },
      { wordText: "WIFI", difficulty: "Easy", category: "Networking" },
      { wordText: "DISK", difficulty: "Easy", category: "Hardware" },
      { wordText: "USER", difficulty: "Easy", category: "Computing" },

      // Medium level words
      { wordText: "PYTHON", difficulty: "Medium", category: "Programming" },
      { wordText: "MEMORY", difficulty: "Medium", category: "Hardware" },
      { wordText: "SERVER", difficulty: "Medium", category: "Computing" },
      { wordText: "FUNCTION", difficulty: "Medium", category: "Programming" },
      { wordText: "DATABASE", difficulty: "Medium", category: "Data Management" },
      { wordText: "VARIABLE", difficulty: "Medium", category: "Programming" },
      { wordText: "COMPILER", difficulty: "Medium", category: "Programming" },
      { wordText: "INTERNET", difficulty: "Medium", category: "Networking" },
      { wordText: "SOFTWARE", difficulty: "Medium", category: "Computing" },
      { wordText: "HARDWARE", difficulty: "Medium", category: "Computing" },

      // Hard level words
      { wordText: "ALGORITHM", difficulty: "Hard", category: "Programming" },
      { wordText: "JAVASCRIPT", difficulty: "Hard", category: "Programming" },
      { wordText: "ENCRYPTION", difficulty: "Hard", category: "Security" },
      { wordText: "FRAMEWORK", difficulty: "Hard", category: "Programming" },
      { wordText: "DEBUGGING", difficulty: "Hard", category: "Programming" },
      { wordText: "RECURSION", difficulty: "Hard", category: "Programming" },
      { wordText: "PROCESSOR", difficulty: "Hard", category: "Hardware" },
      { wordText: "INTERFACE", difficulty: "Hard", category: "Programming" },
      { wordText: "PROTOCOL", difficulty: "Hard", category: "Networking" },
      { wordText: "OPERATING", difficulty: "Hard", category: "Systems" },
    ];

    const cluesData = [
      // Easy clues
      {
        clueText: "Instructions written for computers to follow",
        clueType: "DEFINITION",
        difficulty: "Easy",
        category: "Programming",
      }, // CODE
      {
        clueText: "Unit of computer memory equal to 8 bits",
        clueType: "DEFINITION",
        difficulty: "Easy",
        category: "Computing",
      }, // BYTE
      {
        clueText: "Programming structure that repeats instructions",
        clueType: "DEFINITION",
        difficulty: "Easy",
        category: "Programming",
      }, // LOOP
      {
        clueText: "Information stored and processed by computers",
        clueType: "DEFINITION",
        difficulty: "Easy",
        category: "Computing",
      }, // DATA
      {
        clueText: "Collection of information stored on a computer",
        clueType: "DEFINITION",
        difficulty: "Easy",
        category: "Computing",
      }, // FILE
      {
        clueText: "Popular programming language with coffee-inspired name",
        clueType: "DEFINITION",
        difficulty: "Easy",
        category: "Programming",
      }, // JAVA
      {
        clueText: "Markup language for creating web pages",
        clueType: "DEFINITION",
        difficulty: "Easy",
        category: "Web Development",
      }, // HTML
      {
        clueText: "Wireless internet connection technology",
        clueType: "DEFINITION",
        difficulty: "Easy",
        category: "Networking",
      }, // WIFI
      {
        clueText: "Storage device that spins to read data",
        clueType: "DEFINITION",
        difficulty: "Easy",
        category: "Hardware",
      }, // DISK
      {
        clueText: "Person who operates a computer system",
        clueType: "DEFINITION",
        difficulty: "Easy",
        category: "Computing",
      }, // USER

      // Medium clues
      {
        clueText: "Programming language named after a snake",
        clueType: "DEFINITION",
        difficulty: "Medium",
        category: "Programming",
      }, // PYTHON
      {
        clueText: "Computer component that stores running programs",
        clueType: "DEFINITION",
        difficulty: "Medium",
        category: "Hardware",
      }, // MEMORY
      {
        clueText: "Computer that provides services to other computers",
        clueType: "DEFINITION",
        difficulty: "Medium",
        category: "Computing",
      }, // SERVER
      {
        clueText: "Reusable block of code that performs a task",
        clueType: "DEFINITION",
        difficulty: "Medium",
        category: "Programming",
      }, // FUNCTION
      {
        clueText: "Organized collection of structured information",
        clueType: "DEFINITION",
        difficulty: "Medium",
        category: "Data Management",
      }, // DATABASE
      {
        clueText: "Named storage location in programming",
        clueType: "DEFINITION",
        difficulty: "Medium",
        category: "Programming",
      }, // VARIABLE
      {
        clueText: "Program that translates source code to machine code",
        clueType: "DEFINITION",
        difficulty: "Medium",
        category: "Programming",
      }, // COMPILER
      {
        clueText: "Global network connecting computers worldwide",
        clueType: "DEFINITION",
        difficulty: "Medium",
        category: "Networking",
      }, // INTERNET
      {
        clueText: "Computer programs and applications",
        clueType: "DEFINITION",
        difficulty: "Medium",
        category: "Computing",
      }, // SOFTWARE
      {
        clueText: "Physical components of a computer system",
        clueType: "DEFINITION",
        difficulty: "Medium",
        category: "Computing",
      }, // HARDWARE

      // Hard clues
      {
        clueText: "Step-by-step procedure for solving a problem",
        clueType: "DEFINITION",
        difficulty: "Hard",
        category: "Programming",
      }, // ALGORITHM
      {
        clueText: "Scripting language that makes web pages interactive",
        clueType: "DEFINITION",
        difficulty: "Hard",
        category: "Programming",
      }, // JAVASCRIPT
      {
        clueText: "Process of converting data into secret code",
        clueType: "DEFINITION",
        difficulty: "Hard",
        category: "Security",
      }, // ENCRYPTION
      {
        clueText: "Pre-built structure for developing applications",
        clueType: "DEFINITION",
        difficulty: "Hard",
        category: "Programming",
      }, // FRAMEWORK
      {
        clueText: "Process of finding and fixing programming errors",
        clueType: "DEFINITION",
        difficulty: "Hard",
        category: "Programming",
      }, // DEBUGGING
      {
        clueText: "Programming technique where function calls itself",
        clueType: "DEFINITION",
        difficulty: "Hard",
        category: "Programming",
      }, // RECURSION
      {
        clueText: "Central processing unit of a computer",
        clueType: "DEFINITION",
        difficulty: "Hard",
        category: "Hardware",
      }, // PROCESSOR
      {
        clueText: "Boundary between different software components",
        clueType: "DEFINITION",
        difficulty: "Hard",
        category: "Programming",
      }, // INTERFACE
      {
        clueText: "Set of rules for network communication",
        clueType: "DEFINITION",
        difficulty: "Hard",
        category: "Networking",
      }, // PROTOCOL
      {
        clueText: "System software that manages computer resources",
        clueType: "DEFINITION",
        difficulty: "Hard",
        category: "Systems",
      }, // OPERATING
    ];

    // Create sample crossword puzzles
    const puzzlesData = [
      {
        title: "Programming Basics",
        difficulty: "Easy",
        gridSize: 10,
        isPublished: true,
      },
      {
        title: "Computer Hardware",
        difficulty: "Medium",
        gridSize: 12,
        isPublished: true,
      },
      {
        title: "Advanced Computing",
        difficulty: "Hard",
        gridSize: 15,
        isPublished: true,
      },
      {
        title: "Web Development Fundamentals",
        difficulty: "Medium",
        gridSize: 12,
        isPublished: false, // Draft puzzle
      },
    ];

    const puzzleWordsData = [
      // Programming Basics puzzle (Easy words)
      {
        puzzleIndex: 0,
        wordIndex: 0,
        clueIndex: 0,
        startRow: 1,
        startCol: 1,
        direction: "ACROSS",
        clueNumber: 1,
      },
      {
        puzzleIndex: 0,
        wordIndex: 1,
        clueIndex: 1,
        startRow: 3,
        startCol: 2,
        direction: "DOWN",
        clueNumber: 2,
      },
      {
        puzzleIndex: 0,
        wordIndex: 2,
        clueIndex: 2,
        startRow: 5,
        startCol: 1,
        direction: "ACROSS",
        clueNumber: 3,
      },
      {
        puzzleIndex: 0,
        wordIndex: 3,
        clueIndex: 3,
        startRow: 2,
        startCol: 6,
        direction: "DOWN",
        clueNumber: 4,
      },
      {
        puzzleIndex: 0,
        wordIndex: 4,
        clueIndex: 4,
        startRow: 7,
        startCol: 3,
        direction: "ACROSS",
        clueNumber: 5,
      },

      // Computer Hardware puzzle (Medium words)
      {
        puzzleIndex: 1,
        wordIndex: 11,
        clueIndex: 11,
        startRow: 1,
        startCol: 1,
        direction: "ACROSS",
        clueNumber: 1,
      },
      {
        puzzleIndex: 1,
        wordIndex: 12,
        clueIndex: 12,
        startRow: 3,
        startCol: 2,
        direction: "DOWN",
        clueNumber: 2,
      },
      {
        puzzleIndex: 1,
        wordIndex: 13,
        clueIndex: 13,
        startRow: 5,
        startCol: 1,
        direction: "ACROSS",
        clueNumber: 3,
      },
      {
        puzzleIndex: 1,
        wordIndex: 8,
        clueIndex: 8,
        startRow: 2,
        startCol: 8,
        direction: "DOWN",
        clueNumber: 4,
      },

      // Advanced Computing puzzle (Hard words)
      {
        puzzleIndex: 2,
        wordIndex: 20,
        clueIndex: 20,
        startRow: 1,
        startCol: 1,
        direction: "ACROSS",
        clueNumber: 1,
      },
      {
        puzzleIndex: 2,
        wordIndex: 21,
        clueIndex: 21,
        startRow: 3,
        startCol: 3,
        direction: "DOWN",
        clueNumber: 2,
      },
      {
        puzzleIndex: 2,
        wordIndex: 22,
        clueIndex: 22,
        startRow: 8,
        startCol: 1,
        direction: "ACROSS",
        clueNumber: 3,
      },
    ];

  try {
    console.log("Creating crossword words...");
    const existingWords = await prisma.word.findMany();
    const existingWordTexts = new Set(existingWords.map(w => w.wordText));
    const newWords = wordsData.filter(w => !existingWordTexts.has(w.wordText));
    const createdWords = [...existingWords];

    if (newWords.length > 0) {
      const wordsToCreate = newWords.map(w => ({
        wordText: w.wordText,
        wordLength: w.wordText.length,
        difficulty: w.difficulty,
        category: w.category,
      }));
      await prisma.word.createMany({ data: wordsToCreate, skipDuplicates: true });
      createdWords.push(...await prisma.word.findMany({ where: { wordText: { in: newWords.map(w => w.wordText) } } }));
      console.log(`Created ${newWords.length} words.`);
    }

    console.log("Creating crossword clues...");
    const existingClues = await prisma.clue.findMany();
    const existingClueTexts = new Set(existingClues.map(c => c.clueText));
    const newClues = cluesData.filter(c => !existingClueTexts.has(c.clueText));
    const createdClues = [...existingClues];

    if (newClues.length > 0) {
      await prisma.clue.createMany({ data: newClues, skipDuplicates: true });
      createdClues.push(...await prisma.clue.findMany({ where: { clueText: { in: newClues.map(c => c.clueText) } } }));
      console.log(`Created ${newClues.length} clues.`);
    }

    console.log("Creating word-clue relationships...");
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
      }
    }

    console.log("Creating crossword puzzles...");
    const existingPuzzles = await prisma.crosswordPuzzle.findMany();
    const existingPuzzleTitles = new Set(existingPuzzles.map(p => p.title));
    const newPuzzles = puzzlesData.filter(p => !existingPuzzleTitles.has(p.title));
    const createdPuzzles = [...existingPuzzles];

    if (newPuzzles.length > 0) {
      await prisma.crosswordPuzzle.createMany({ data: newPuzzles, skipDuplicates: true });
      createdPuzzles.push(...await prisma.crosswordPuzzle.findMany({ where: { title: { in: newPuzzles.map(p => p.title) } } }));
      console.log(`Created ${newPuzzles.length} puzzles.`);
    }

    console.log("Creating puzzle word placements...");
    for (const puzzleWordData of puzzleWordsData) {
      if (
        createdPuzzles[puzzleWordData.puzzleIndex] &&
        createdWords[puzzleWordData.wordIndex] &&
        createdClues[puzzleWordData.clueIndex]
      ) {
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
          console.log(`Puzzle word placement created for ${createdWords[puzzleWordData.wordIndex].wordText}`);
        }
      }
    }

    console.log("✅ Crossword data initialization completed!");
    console.log(`- Words: ${createdWords.length}`);
    console.log(`- Clues: ${createdClues.length}`);
    console.log(`- Puzzles: ${createdPuzzles.length}`);
    console.log(`- Puzzle word placements: ${puzzleWordsData.length}`);
  } catch (error) {
    console.error("Error initializing crossword data:", error);
    throw error;
  }
}

async function initializeUserActivities(username) {
  try {
    console.log(`Populating UserActivities for username: ${username}...`);
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      console.error(`User with username: ${username} does not exist. Cannot populate UserActivities.`);
      return;
    }

    const activities = await prisma.activity.findMany();
    for (const activity of activities) {
      const existing = await prisma.userActivities.findFirst({
        where: { userId: user.userId, activityId: activity.activityId },
      });

      if (!existing) {
        await prisma.userActivities.create({
          data: {
            userId: user.userId,
            activityId: activity.activityId,
            points: 0,
          },
        });
        console.log(`UserActivities entry created for username: ${username}, activity: ${activity.name}`);
      } else {
        console.log(`UserActivities entry for username: ${username}, activity: ${activity.name} already exists, skipping.`);
      }
    }
    console.log(`UserActivities initialization completed for username: ${username}`);
  } catch (error) {
    console.error(`Error initializing user activities for username: ${username}:`, error);
    throw error;
  }
}

// Function to initialize UserActivities for multiple users
async function initializeMultipleUsers() {
  const usernames = ["admin", "alice"];
  for (const username of usernames) {
    await initializeUserActivities(username);
  }
}

// Main initialization function
async function initializeData() {
  try {
    await clearTables();
    const permissions = await initializePermissions();
    const roles = await initializeRoles(permissions);
    await initializeUsers(roles);
    await initializeActivities();
    const personalityTypes = await initializePersonalityTypes();
    await initializeQuizQuestions(personalityTypes);
    await initializeLocations();
    await initializeCrosswordData();
    await initializeMultipleUsers();
    console.log("Data initialization complete.");
  } catch (error) {
    console.error("Error during data initialization:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

(async () => {
  console.log("Starting data initialization...");
  await initializeData();
})();