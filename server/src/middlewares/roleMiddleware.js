const verifyRole = (allowedRoleIds) => {
  return (req, res, next) => {
    const roleId = res.locals.role_id; 
    
    if (!roleId) {
      return res.status(403).json({
        message: 'Role not found in token',
      });
    }

    if (!allowedRoleIds.includes(roleId)) {
      return res.status(403).json({
        message: 'You do not have this permission',
      });
    }

    next();
  };
};

module.exports = verifyRole;