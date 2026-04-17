const { Customer } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'qbombom_super_secret_key_2026';

// Cadastro de Cliente por E-mail/Senha
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nome, email e senha são obrigatórios.' });
    }

    // Verifica se já existe um cliente com esse e-mail
    const existingCustomer = await Customer.findOne({ where: { email } });
    if (existingCustomer) {
      return res.status(400).json({ error: 'Este e-mail já está cadastrado.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const customer = await Customer.create({
      name,
      email,
      phone,
      password: hashedPassword,
    });

    // Token do Cliente
    const token = jwt.sign({ id: customer.id, role: 'CUSTOMER' }, SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone
      }
    });
  } catch (error) {
    console.error('Erro no cadastro do cliente:', error);
    res.status(500).json({ error: 'Erro interno no servidor ao cadastrar.' });
  }
};

// Login de Cliente por E-mail/Senha
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
    }

    const customer = await Customer.findOne({ where: { email } });
    
    // Se o cliente não existir ou não tiver senha (só usou googleId)
    if (!customer || !customer.password) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    const isPasswordValid = await bcrypt.compare(password, customer.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    // Token do Cliente
    const token = jwt.sign({ id: customer.id, role: 'CUSTOMER' }, SECRET, { expiresIn: '7d' });

    res.json({
      token,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address
      }
    });
  } catch (error) {
    console.error('Erro no login do cliente:', error);
    res.status(500).json({ error: 'Erro interno no servidor ao fazer login.' });
  }
};
