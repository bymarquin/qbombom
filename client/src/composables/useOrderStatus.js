const STATUS_LABELS = {
  aguardando_pagamento: 'Aguardando Pagamento',
  novo: 'Novo',
  em_preparo: 'Em Preparo',
  pronto: 'Pronto',
  em_rota: 'Em Rota de Entrega',
  entregue: 'Entregue',
  finalizado: 'Finalizado',
  cancelado: 'Cancelado',
}

const STATUS_CLASSES = {
  aguardando_pagamento: 'bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-500/20',
  novo:                 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20',
  em_preparo:           'bg-yellow-50 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-500/20',
  pronto:               'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/20',
  em_rota:              'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20',
  entregue:             'bg-neutral-50 dark:bg-neutral-800/50 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700',
  finalizado:           'bg-neutral-50 dark:bg-neutral-800/50 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700',
  cancelado:            'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20',
}

export function useOrderStatus() {
  const statusLabel = (status) => STATUS_LABELS[status] ?? status
  const statusClass = (status) => STATUS_CLASSES[status] ?? 'bg-neutral-50 text-neutral-600 border-neutral-200'
  return { statusLabel, statusClass }
}
