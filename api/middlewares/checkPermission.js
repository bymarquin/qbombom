const rolePermissions = {
  SUPER_ADMIN: ['*'], // Acesso a tudo
  MANAGER: [
    // Pedidos
    'orders.create', 'orders.update', 'orders.cancel', 'orders.view', 'orders.change_status',
    // Pagamentos
    'payments.create', 'payments.refund',
    // Caixa
    'cashier.open', 'cashier.close', 'cashier.view',
    // Produtos
    'products.create', 'products.update', 'products.toggle_active',
    // Relatórios e Usuários
    'reports.view', 'users.create', 'users.update', 'users.manage'
  ],
  CASHIER: [
    'orders.create', 'orders.update', 'orders.view',
    'payments.create'
  ],
  DELIVERY: [
    'orders.view', 'orders.change_status'
  ]
};

module.exports = (requiredPermission) => {
  return (req, res, next) => {
    // O role vem do token decodificado no middleware 'auth.js'
    const role = req.userRole; 

    if (!role) {
      return res.status(403).json({ error: 'Role not found in token' });
    }

    const permissions = rolePermissions[role.toUpperCase()] || [];

    // Se tiver '*' (Super Admin) ou a permissão exata, libera o acesso
    if (permissions.includes('*') || permissions.includes(requiredPermission)) {
      return next();
    }

    return res.status(403).json({ 
      error: 'Access denied. Insufficient permissions.',
      required: requiredPermission 
    });
  };
};
