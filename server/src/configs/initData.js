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