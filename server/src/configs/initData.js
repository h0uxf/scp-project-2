const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');

async function initializeData() {
  try {
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
        activityName: 'Quiz',
        description: 'Complete the quiz to test your knowledge.',
        points: 10,
      },
      {
        activityName: 'Word Search',
        description: 'Find all the words in the word search puzzle.',
        points: 5,
      },
      {
        activityName: 'Clue Hunt',
        description: 'Solve clues to find hidden locations.',
        points: 15,
      },
    ];

    // --- 5. Create Quiz Questions ---
    const quizQuestions = [
      {
        questionText: 'When was School of Computing (SoC) established?',
        options: [
          { optionText: '1965', isCorrect: false },
          { optionText: '1954', isCorrect: false },
          { optionText: '1980', isCorrect: true },
          { optionText: '2000', isCorrect: false },
        ],
      },
      {
        questionText: 'How many courses does SoC offer?',
        options: [
          { optionText: '3', isCorrect: true },
          { optionText: '4', isCorrect: false },
          { optionText: '5', isCorrect: false },
          { optionText: '6', isCorrect: false },
        ],
      },
      {
        questionText: 'Which of the following is NOT a course offered by SoC?',
        options: [
          { optionText: 'Diploma of Computer Science', isCorrect: false },
          { optionText: 'Diploma of Cybersecurity and Digital Forensics', isCorrect: false },
          { optionText: 'Diploma of Arts', isCorrect: true },
          { optionText: 'Diploma of Applied AI and Analytics', isCorrect: false },
        ],
      },
      {
        questionText: 'What is the main focus of the Diploma of Cybersecurity and Digital Forensics?',
        options: [
          { optionText: 'Web development', isCorrect: false },
          { optionText: 'Data analysis', isCorrect: false },
          { optionText: 'Cybersecurity and digital forensics', isCorrect: true },
          { optionText: 'Game development', isCorrect: false },
        ],
      },
      {
        questionText: 'How many Special Interest Groups (SIGs) does SoC have?',
        options: [
          { optionText: '2', isCorrect: false },
          { optionText: '3', isCorrect: false },
          { optionText: '4', isCorrect: false },
          { optionText: '5', isCorrect: true },
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
              create: q.options,
            },
          },
        });
        console.log(`Quiz question created: ${created.questionText}`);
      } else {
        console.log(`Quiz question '${q.questionText}' already exists, skipping.`);
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