const verifyRole = (allowedRoleNames) => {
  return (req, res, next) => {
    const roleName = res.locals.role_name; 
    
    if (!roleName) {
      return res.status(403).json({
        message: 'Role not found in token',
      });
    }

    if (!allowedRoleNames.includes(roleName)) {
      return res.status(403).json({
        message: 'You do not have this permission',
      });
    }

    next();
  };
};

module.exports = verifyRole;