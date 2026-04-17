const { User } = require('../models');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { sendTemplateEmail } = require('../services/mailer');

const SECRET = process.env.JWT_SECRET || 'qbombom_super_secret_key_2026';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'qbombom_refresh_secret_long_lived_2026';

// Helper: Gera os 2 tokens e retorna
const generateTokens = (user) => {
  // Access Token de curto tempo (1 hora)
  const accessToken = jwt.sign({ id: user.id, role: user.role }, SECRET, { expiresIn: '1h' });
  // Refresh Token de longo tempo (7 dias)
  const refreshToken = jwt.sign({ id: user.id }, REFRESH_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, role, pin } = req.body;
    const userExists = await User.findOne({ where: { email } });
    if (userExists) return res.status(400).json({ error: 'User already exists' });

    const user = await User.create({ name, email, password, role, pin });
    user.password = undefined;
    
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user || !user.checkPassword(password)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const { accessToken, refreshToken } = generateTokens(user);
    // Salva o refreshToken no banco para poder invalidá-lo no futuro
    await user.update({ refreshToken });

    user.password = undefined;
    res.json({ user, accessToken, refreshToken });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// LOGIN RÁPIDO DO FRENTE DE CAIXA
exports.loginPin = async (req, res) => {
  try {
    const { pin } = req.body;
    if (!pin) return res.status(400).json({ error: 'PIN is required' });

    const user = await User.findOne({ where: { pin } });
    if (!user || !user.status) {
      return res.status(401).json({ error: 'Invalid PIN or disabled user' });
    }

    const { accessToken, refreshToken } = generateTokens(user);
    await user.update({ refreshToken });

    user.password = undefined;
    res.json({ user, accessToken, refreshToken });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// TROCA O REFRESH TOKEN POR UM NOVO ACCESS TOKEN
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ error: 'Refresh Token required' });

    // Verifica se a assinatura do Refresh Token bate
    jwt.verify(refreshToken, REFRESH_SECRET, async (err, decoded) => {
      if (err) return res.status(403).json({ error: 'Invalid Refresh Token' });

      // Verifica se o Token ainda é o mesmo que está no Banco de Dados
      const user = await User.findByPk(decoded.id);
      if (!user || user.refreshToken !== refreshToken) {
        return res.status(403).json({ error: 'Refresh Token has been revoked' });
      }

      // Gera uma nova dupla de tokens e atualiza o banco
      const tokens = generateTokens(user);
      await user.update({ refreshToken: tokens.refreshToken });

      res.json(tokens);
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.logout = async (req, res) => {
  try {
    // req.userId vem do authMiddleware
    const user = await User.findByPk(req.userId);
    if (user) {
      // Invalida o token apagando do banco
      await user.update({ refreshToken: null });
    }
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const user = await User.findOne({ where: { email } });
    if (!user) {
      // Don't reveal that the user does not exist for security reasons
      return res.json({ message: 'If this email exists in our system, a recovery link will be sent.' });
    }

    // Secret is specific to the user (incorporates password hash) so it invalidates after reset
    const resetSecret = SECRET + user.password;
    const token = jwt.sign({ id: user.id, email: user.email }, resetSecret, { expiresIn: '15m' });

    // Client URL to reset password
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetLink = `${clientUrl}/auth/reset-password?token=${token}&id=${user.id}`;

    // Send the email using the template
    await sendTemplateEmail(user.email, 'Recuperação de Senha - QbomBom', 'forgot-password', {
      name: user.name,
      resetLink: resetLink
    });

    return res.json({ message: 'If this email exists in our system, a recovery link will be sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.me = async (req, res) => {
  try {
    const user = await User.findByPk(req.userId, { attributes: { exclude: ['password', 'refreshToken'] } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { id, token, password } = req.body;

    if (!id || !token || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(400).json({ error: 'Invalid link or user does not exist' });
    }

    const resetSecret = SECRET + user.password;

    try {
      // Verify token
      const decoded = jwt.verify(token, resetSecret);
      
      // Update password (the 'beforeSave' hook in Sequelize model handles bcrypt hashing)
      user.password = password;
      await user.save();

      return res.json({ message: 'Password has been reset successfully' });
    } catch (err) {
      return res.status(400).json({ error: 'Link is invalid or has expired' });
    }

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

