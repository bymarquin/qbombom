'use strict';

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { sendTemplateEmail } = require('../services/mailer');
const { SECRET } = require('../config/jwt');
const { sanitizeUser } = require('../utils/sanitize');

const SAFE_ATTRIBUTES = { exclude: ['password', 'refreshToken'] };

const ROLE_LABELS = {
  SUPER_ADMIN: 'Super Admin',
  MANAGER: 'Gerente',
  CASHIER: 'Caixa',
  DELIVERY: 'Entregador',
};

async function sendInviteEmail(user) {
  // Token atrelado ao hash atual — se o usuário já definiu senha, o link fica inválido automaticamente
  const resetSecret = SECRET + user.password;
  const token = jwt.sign({ id: user.id, email: user.email }, resetSecret, { expiresIn: '24h' });

  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const inviteLink = `${clientUrl}/auth/reset-password?token=${token}&id=${user.id}`;

  await sendTemplateEmail(user.email, 'Convite de Acesso — Qbombom Sorvetes', 'invite-user', {
    name: user.name,
    role: ROLE_LABELS[user.role] || user.role,
    inviteLink,
  });
}

exports.index = async (req, res) => {
  try {
    const users = await User.findAll({ attributes: SAFE_ATTRIBUTES, order: [['createdAt', 'DESC']] });
    res.json(users);
  } catch (error) {
    console.error('[users.index]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.show = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, { attributes: SAFE_ATTRIBUTES });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    console.error('[users.show]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, email, pin, role, status } = req.body;

    const emailTaken = await User.findOne({ where: { email } });
    if (emailTaken) return res.status(400).json({ error: 'Email already in use' });

    if (pin) {
      const pinTaken = await User.findOne({ where: { pin } });
      if (pinTaken) return res.status(400).json({ error: 'PIN already in use' });
    }

    // Senha temporária aleatória — o usuário a substituirá via link de convite
    const tempPassword = crypto.randomBytes(32).toString('hex');
    const user = await User.create({ name, email, password: tempPassword, pin, role, status });

    await sendInviteEmail(user);

    res.status(201).json(sanitizeUser(user));
  } catch (error) {
    console.error('[users.create]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.resendInvite = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    await sendInviteEmail(user);
    res.json({ message: 'Convite reenviado com sucesso.' });
  } catch (error) {
    console.error('[users.resendInvite]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.update = async (req, res) => {
  try {
    const { name, email, pin, role, status } = req.body;
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (email && email !== user.email) {
      const emailTaken = await User.findOne({ where: { email } });
      if (emailTaken) return res.status(400).json({ error: 'Email already in use' });
    }

    if (pin && pin !== user.pin) {
      const pinTaken = await User.findOne({ where: { pin } });
      if (pinTaken) return res.status(400).json({ error: 'PIN already in use' });
    }

    if (name !== undefined) user.name = name;
    if (email) user.email = email;
    if (pin !== undefined) user.pin = pin;
    if (role) user.role = role;
    if (status !== undefined) user.status = status;

    await user.save();
    res.json(sanitizeUser(user));
  } catch (error) {
    console.error('[users.update]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.destroy = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.id === req.userId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    await user.destroy();
    res.status(204).send();
  } catch (error) {
    console.error('[users.destroy]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
