const { User } = require('../models');

exports.index = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password', 'refreshToken'] },
      order: [['createdAt', 'DESC']]
    });
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.show = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password', 'refreshToken'] }
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, email, password, pin, role, status } = req.body;
    
    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(400).json({ error: 'Email already in use' });

    if (pin) {
      const existingPin = await User.findOne({ where: { pin } });
      if (existingPin) return res.status(400).json({ error: 'PIN already in use' });
    }

    const user = await User.create({ name, email, password, pin, role, status });
    
    const userWithoutPwd = user.toJSON();
    delete userWithoutPwd.password;
    delete userWithoutPwd.refreshToken;
    
    res.status(201).json(userWithoutPwd);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.update = async (req, res) => {
  try {
    const { name, email, password, pin, role, status } = req.body;
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (email && email !== user.email) {
      const existing = await User.findOne({ where: { email } });
      if (existing) return res.status(400).json({ error: 'Email already in use' });
    }

    if (pin && pin !== user.pin) {
      const existingPin = await User.findOne({ where: { pin } });
      if (existingPin) return res.status(400).json({ error: 'PIN already in use' });
    }

    user.name = name !== undefined ? name : user.name;
    if (email) user.email = email;
    if (password) user.password = password; // Hook will hash
    if (pin !== undefined) user.pin = pin;
    if (role) user.role = role;
    if (status !== undefined) user.status = status;

    await user.save();
    
    const userWithoutPwd = user.toJSON();
    delete userWithoutPwd.password;
    delete userWithoutPwd.refreshToken;

    res.json(userWithoutPwd);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.destroy = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    // Evitar que o usuário exclua a si mesmo
    if (user.id === req.userId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    await user.destroy();
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};