'use strict';

const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { sendTemplateEmail } = require('../services/mailer');
const { SECRET, REFRESH_SECRET } = require('../config/jwt');
const { sanitizeUser } = require('../utils/sanitize');

function generateTokens(user) {
  const accessToken = jwt.sign({ id: user.id, role: user.role }, SECRET, { expiresIn: '1h' });
  const refreshToken = jwt.sign({ id: user.id }, REFRESH_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
}

function verifyRefreshToken(token) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, REFRESH_SECRET, (err, decoded) => {
      if (err) reject(err);
      else resolve(decoded);
    });
  });
}

exports.register = async (req, res) => {
  try {
    const { name, email, password, role, pin } = req.body;

    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(400).json({ error: 'User already exists' });

    const user = await User.create({ name, email, password, role, pin });
    res.status(201).json(sanitizeUser(user));
  } catch (error) {
    console.error('[auth.register]', error);
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
    await user.update({ refreshToken });

    res.json({ user: sanitizeUser(user), accessToken, refreshToken });
  } catch (error) {
    console.error('[auth.login]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

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

    res.json({ user: sanitizeUser(user), accessToken, refreshToken });
  } catch (error) {
    console.error('[auth.loginPin]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ error: 'Refresh token required' });

    const decoded = await verifyRefreshToken(refreshToken).catch(() => null);
    if (!decoded) return res.status(403).json({ error: 'Invalid refresh token' });

    const user = await User.findByPk(decoded.id);
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({ error: 'Refresh token has been revoked' });
    }

    const tokens = generateTokens(user);
    await user.update({ refreshToken: tokens.refreshToken });

    res.json(tokens);
  } catch (error) {
    console.error('[auth.refreshToken]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.logout = async (req, res) => {
  try {
    const user = await User.findByPk(req.userId);
    if (user) await user.update({ refreshToken: null });
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('[auth.logout]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.me = async (req, res) => {
  try {
    const user = await User.findByPk(req.userId, {
      attributes: { exclude: ['password', 'refreshToken'] }
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    console.error('[auth.me]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const genericResponse = { message: 'If this email exists in our system, a recovery link will be sent.' };

    const user = await User.findOne({ where: { email } });
    if (!user) return res.json(genericResponse);

    // Secret tied to the user's current password hash so it auto-invalidates after reset
    const resetSecret = SECRET + user.password;
    const token = jwt.sign({ id: user.id, email: user.email }, resetSecret, { expiresIn: '15m' });

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetLink = `${clientUrl}/auth/reset-password?token=${token}&id=${user.id}`;

    await sendTemplateEmail(user.email, 'Recuperação de Senha - Qbombom', 'forgot-password', {
      name: user.name,
      resetLink
    });

    return res.json(genericResponse);
  } catch (error) {
    console.error('[auth.forgotPassword]', error);
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
    if (!user) return res.status(400).json({ error: 'Invalid link' });

    const resetSecret = SECRET + user.password;
    try {
      jwt.verify(token, resetSecret);
    } catch {
      return res.status(400).json({ error: 'Link is invalid or has expired' });
    }

    user.password = password;
    await user.save();

    res.json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('[auth.resetPassword]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
