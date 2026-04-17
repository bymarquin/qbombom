const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'qbombom_super_secret_key_2026';

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Token not provided' });
  }

  const parts = authHeader.split(' ');

  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ error: 'Token error' });
  }

  jwt.verify(parts[1], SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Token invalid' });
    }

    req.userId = decoded.id;
    // Salva o Role do usuário para podermos verificar as permissões depois
    req.userRole = decoded.role;
    
    return next();
  });
};
