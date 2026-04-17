'use strict';

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Customer } = require('../models');
const { SECRET } = require('../config/jwt');

function generateCustomerToken(customer) {
  return jwt.sign({ id: customer.id, role: 'CUSTOMER' }, SECRET, { expiresIn: '7d' });
}

function formatCustomer(customer) {
  return {
    id: customer.id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    address: customer.address ?? undefined
  };
}

exports.register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nome, email e senha são obrigatórios.' });
    }

    const existing = await Customer.findOne({ where: { email } });
    if (existing) return res.status(400).json({ error: 'Este e-mail já está cadastrado.' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const customer = await Customer.create({ name, email, phone, password: hashedPassword });

    res.status(201).json({ token: generateCustomerToken(customer), customer: formatCustomer(customer) });
  } catch (error) {
    console.error('[customerAuth.register]', error);
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
    }

    const customer = await Customer.findOne({ where: { email } });
    if (!customer?.password) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    const valid = await bcrypt.compare(password, customer.password);
    if (!valid) return res.status(401).json({ error: 'Credenciais inválidas.' });

    res.json({ token: generateCustomerToken(customer), customer: formatCustomer(customer) });
  } catch (error) {
    console.error('[customerAuth.login]', error);
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
};
