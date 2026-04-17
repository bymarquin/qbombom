const requireRoles = (allowedRoles) => {
  return (req, res, next) => {
    if (req.userRole && allowedRoles.includes(req.userRole)) {
      return next();
    }
    return res.status(403).json({ error: 'Forbidden: Insufficient privileges' });
  };
};

module.exports = { requireRoles };
