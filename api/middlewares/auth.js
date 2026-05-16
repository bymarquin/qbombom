const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET;
if (!SECRET) throw new Error('JWT_SECRET environment variable is required');

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

    if (decoded.type === 'customer') {
      return res.status(403).json({ error: 'Acesso não permitido.' });
    }

    req.userId = decoded.id;
    // Salva o Role do usuário para podermos verificar as permissões depois
    req.userRole = decoded.role;
    
    return next();
  });
};
