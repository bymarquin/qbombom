'use strict';

const { User } = require('../models');
const { sanitizeUser } = require('../utils/sanitize');

const SAFE_ATTRIBUTES = { exclude: ['password', 'refreshToken'] };

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
    const { name, email, password, pin, role, status } = req.body;

    const emailTaken = await User.findOne({ where: { email } });
    if (emailTaken) return res.status(400).json({ error: 'Email already in use' });

    if (pin) {
      const pinTaken = await User.findOne({ where: { pin } });
      if (pinTaken) return res.status(400).json({ error: 'PIN already in use' });
    }

    const user = await User.create({ name, email, password, pin, role, status });
    res.status(201).json(sanitizeUser(user));
  } catch (error) {
    console.error('[users.create]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.update = async (req, res) => {
  try {
    const { name, email, password, pin, role, status } = req.body;
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
    if (password) user.password = password;
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
