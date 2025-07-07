#!/usr/bin/env node
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');

async function initializeData() {
  try {
    // --- 1. Initialize Roles ---
    const rolesToCreate = [
    {
        roleName: 'user',
        description: 'Basic user role with limited permissions',
        
    },
    // can add roles that only have manage permissions for specific content types if needed
    {
        roleName: 'content_manager',
        description: 'Content manager role with permissions to manage all content',

    },
    {
        roleName: 'moderator',
        description: 'Moderator role with permissions to manage users and content',
        
    },
    {
        roleName: 'admin',
        description: 'Administrator role with full access to manage users, content, and settings',
        
    },
    {
        roleName: 'super_admin',
        description: 'Super administrator role with all permissions',
        
    },
];

    const createdRoles = {};
    for (const roleData of rolesToCreate) {
      let role = await prisma.role.findUnique({
        where: { roleName: roleData.roleName },
      });
      if (!role) {
        role = await prisma.role.create({ data: roleData });
        console.log(`Role '${role.roleName}' created.`);
      } else {
        console.log(`Role '${role.roleName}' already exists, skipping creation.`);
      }
      createdRoles[role.roleName] = role;
    }

    // --- 2. Initialize Permissions ---
    const permissionsToCreate = [
        // Basic Access
        { permissionName: 'access_app', description: 'Basic access to the application features' },

        // View Permissions
        { permissionName: 'view_content', description: 'Ability to view content (words, clues, questions, locations, activities)' },
        { permissionName: 'view_users', description: 'Ability to view user accounts' },
        { permissionName: 'view_roles', description: 'Ability to view roles and permissions' },
        { permissionName: 'view_logs', description: 'Ability to view system logs' },
        { permissionName: 'view_reports', description: 'Ability to view system reports' },

        // Manage Content Permissions
        { permissionName: 'manage_words', description: 'Ability to manage words' },
        { permissionName: 'manage_clues', description: 'Ability to manage clues' },
        { permissionName: 'manage_questions', description: 'Ability to manage questions' },
        { permissionName: 'manage_activities', description: 'Ability to manage activities' },
        { permissionName: 'manage_locations', description: 'Ability to manage locations' },
        { permissionName: 'manage_all_content', description: 'Ability to create, edit, and delete content (words, clues, questions, locations, activities)' },

        // Administrative Permissions
        { permissionName: 'manage_users', description: 'Ability to manage user accounts' },
        { permissionName: 'manage_admin_users', description: 'Ability to manage admin user accounts' },
        { permissionName: 'manage_roles', description: 'Ability to manage roles and permissions' },
        { permissionName: 'manage_settings', description: 'Ability to manage application settings' },
    ];

    const createdPermissions = {};
    for (const permData of permissionsToCreate) {
      let permission = await prisma.permission.findUnique({
        where: { permissionName: permData.permissionName },
      });
      if (!permission) {
        permission = await prisma.permission.create({ data: permData });
        console.log(`Permission '${permission.permissionName}' created.`);
      } else {
        console.log(`Permission '${permission.permissionName}' already exists, skipping creation.`);
      }
      createdPermissions[permission.permissionName] = permission;
    }

    // --- 3. Assign Permissions to Roles ---
    const rolePermissionsToCreate = [
    {
        roleName: 'user',
        permissions: [
            'access_app',
            'view_content',
            'view_users'
        ]
    },
    {
        roleName: 'content_manager',
        permissions: [
            'access_app',
            'view_content',
            'view_users',
            'manage_words',
            'manage_clues',
            'manage_questions',
            'manage_activities',
            'manage_locations',
            'manage_all_content'
        ]
    },
    {
        roleName: 'moderator',
        permissions: [
            'access_app',
            'view_content',
            'view_users',
            'manage_users',
            'manage_roles',
            'manage_settings',
            'manage_all_content'
        ]
    },
    {
        roleName: 'admin',
        permissions: [
            'access_app',
            'view_content',
            'view_users',
            'manage_users',
            'manage_roles',
            'manage_settings',
            'manage_all_content'
        ]
    },
    {
        roleName: 'super_admin',
        permissions: [
            'access_app',
            'view_content',
            'view_users',
            'manage_users',
            'manage_admin_users',
            'manage_roles',
            'manage_settings',
            'manage_all_content'
        ]
    }
    ];

    for (const rolePermData of rolePermissionsToCreate) {
        if (!rolePermData.roleName || !rolePermData.permissions || rolePermData.permissions.length === 0) {
            console.error(`Invalid role-permission data: ${JSON.stringify(rolePermData)}. Skipping.`);
            continue;
        }
        const verifyRole = await prisma.role.findUnique({
            where: { roleName: rolePermData.roleName },
        });
        if (!verifyRole) {
            console.error(`Role '${rolePermData.roleName}' not found. Skipping permission assignment.`);

        const verifyPermission = await prisma.permission.findMany({
            where: {
                permissionName: {
                    in: rolePermData.permissions,
                },
            },
        });
        if (!verifyPermission || verifyPermission.length !== rolePermData.permissions.length) {
            console.error(`Some permissions not found for role: ${rolePermData.roleName}. Skipping.`);
            continue;
        }
        
        const existingRolePermission = await prisma.rolePermission.findUnique({
            where: {
                roleId_permissionId: {
                    roleId: role.roleId,
                    permissionId: permission.permissionId,
                },
            },
        });
        if (!existingRolePermission) {
            await prisma.rolePermission.create({
                data: {
                    roleId: role.roleId,
                    permissionId: permission.permissionId,
                },
            });
            console.log(`Assigned permission '${permission.permissionName}' to role '${role.roleName}'.`);
        } else {
            console.log(`Permission '${permission.permissionName}' already assigned to role '${role.roleName}', skipping.`);
        }
      }
    }

    /*    // deprecated assign permissions to roles automatically
    // Admin role gets all permissions
    const adminRole = createdRoles['admin'];
    if (adminRole) {
      for (const permName in createdPermissions) {
        const permission = createdPermissions[permName];
        const existingRolePermission = await prisma.rolePermission.findUnique({
          where: {
            roleId_permissionId: {
              roleId: adminRole.roleId,
              permissionId: permission.permissionId,
            },
          },
        });
        if (!existingRolePermission) {
          await prisma.rolePermission.create({
            data: {
              roleId: adminRole.roleId,
              permissionId: permission.permissionId,
            },
          });
          console.log(`Assigned permission '${permission.permissionName}' to role '${adminRole.roleName}'.`);
        } else {
          console.log(`Permission '${permission.permissionName}' already assigned to role '${adminRole.roleName}', skipping.`);
        }
      }
    } else {
      console.error('Admin role not found after creation/check. Cannot assign permissions.');
    }

    // User role gets basic access permission
    const userRole = createdRoles['user'];
    if (userRole && createdPermissions['access_app']) {
      const existingRolePermission = await prisma.rolePermission.findUnique({
        where: {
          roleId_permissionId: {
            roleId: userRole.roleId,
            permissionId: createdPermissions['access_app'].permissionId,
          },
        },
      });
      if (!existingRolePermission) {
        await prisma.rolePermission.create({
          data: {
            roleId: userRole.roleId,
            permissionId: createdPermissions['access_app'].permissionId,
          },
        });
        console.log(`Assigned permission 'access_app' to role '${userRole.roleName}'.`);
      } else {
        console.log(`Permission 'access_app' already assigned to role '${userRole.roleName}', skipping.`);
      }
    } else {
      console.error('User role or "access_app" permission not found after creation/check. Cannot assign basic access.');
    }
    */

    // --- 4. Create Admin User ---
    const existingAdminUser = await prisma.user.findFirst({
      where: { username: 'admin' },
    });

    if (!existingAdminUser) {
      const password = process.env.ADMIN_PASSWORD;
      const hashedPassword = await bcrypt.hash(password, 10);

      const adminRoleFromDb = await prisma.role.findUnique({
        where: { roleName: 'admin' },
        select: { roleId: true },
      });

      if (!adminRoleFromDb) {
        throw new Error('Admin role not found. This should not happen if roles were initialized correctly.');
      }

      const newUser = await prisma.user.create({
        data: {
          username: 'admin',
          passwordHash: hashedPassword,
          points: 0,
          userRole: {
            create: {
              roleId: adminRoleFromDb.roleId,
            },
          },
        },
        select: {
          userId: true,
          username: true,
          points: true,
          userRole: {
            select: {
              role: {
                select: {
                  roleName: true,
                },
              },
            },
          },
        },
      });

      console.log('Admin user created:', newUser);
    } else {
      console.log('Admin user already exists, skipping creation.');
    }

    // --- 4. Create Quiz Questions ---
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
          { optionText: 'Diploma of Applied AI and Analytics', isCorrect: false }
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
      }
    ];

    for (const questionData of quizQuestions) {
      const existingQuestion = await prisma.question.findUnique({
        where: { questionText: questionData.questionText },
      });

      if (!existingQuestion) {
        const newQuestion = await prisma.question.create({
          data: {
            questionText: questionData.questionText,
            options: {
              create: questionData.options.map(option => ({
                optionText: option.optionText,
                isCorrect: option.isCorrect,
              })),
            },
          },
        });
        console.log(`Quiz question created: ${newQuestion.questionText}`);
      } else {
        console.log(`Quiz question '${existingQuestion.questionText}' already exists, skipping creation.`);
      }
    }
  } catch (error) {
    console.error('Error initializing data:', error);
    process.exit(1); // Ensure the process exits with a non-zero code on failure
  } finally {
    await prisma.$disconnect();
  }
}

(async () => {
  console.log('Starting data initialization...');
  await initializeData();
  console.log('Data initialization complete.');
})();
