#!/usr/bin/env node
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');

async function initializeData() {
  try {
    // --- 1. Initialize Roles ---
    const rolesToCreate = [
      { roleName: 'admin', description: 'Administrator with full access' },
      { roleName: 'user', description: 'Standard application user' },
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
      { permissionName: 'manage_users', description: 'Ability to manage user accounts' },
      { permissionName: 'manage_roles', description: 'Ability to manage roles and permissions' },
      { permissionName: 'manage_content', description: 'Ability to create, edit, and delete content (words, clues, questions, locations, activities)' },
      { permissionName: 'view_reports', description: 'Ability to view system reports' },
      { permissionName: 'access_app', description: 'Basic access to the application features' },
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
