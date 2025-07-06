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

const rolesToCreate = [
    {
        roleName: 'user',
        description: 'Basic user role with limited permissions',
        permissions: [
            'access_app',
            'view_content',
            'view_users',
        ],
    },
    // can add roles that only have manage permissions for specific content types if needed
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