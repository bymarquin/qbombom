import { ref } from 'vue'

const STORAGE_KEY = 'qbombom_historico'
const ACTIVE_ORDERS_KEY = 'qbombom_pedidos_ativos'
const CONSENT_KEY = 'qbombom_cookie_consent'
const MAX_ORDERS = 3
const MAX_ACTIVE_ORDERS = 5
const FINAL_STATUSES = new Set(['cancelado', 'finalizado'])

export function useOrderHistory() {
  const consentimento = ref(localStorage.getItem(CONSENT_KEY))

  const aceitarCookies = () => {
    localStorage.setItem(CONSENT_KEY, 'aceito')
    consentimento.value = 'aceito'
  }

  const recusarCookies = () => {
    localStorage.setItem(CONSENT_KEY, 'recusado')
    consentimento.value = 'recusado'
  }

  const getHistorico = () => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    } catch {
      return []
    }
  }

  const salvarPedido = (pedido, carrinhoItems, checkoutData, total) => {
    if (consentimento.value !== 'aceito') return

    const historico = getHistorico()

    const entrada = {
      id: pedido.id,
      trackingCode: pedido.trackingCode,
      date: new Date().toISOString(),
      total,
      tipo: checkoutData.tipo,
      checkout: {
        nome: checkoutData.nome,
        telefone: checkoutData.telefone,
        tipo: checkoutData.tipo,
        pagamento: checkoutData.pagamento,
        endereco: checkoutData.endereco,
      },
      items: carrinhoItems.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        variationId: item.variationId,
        variationName: item.variationName,
        quantity: item.quantity,
        totalPrice: item.totalPrice,
        selectedAdditionals: item.selectedAdditionals,
        observation: item.observation,
      })),
    }

    // Insere no início e mantém só os últimos MAX_ORDERS
    historico.unshift(entrada)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(historico.slice(0, MAX_ORDERS)))
  }

  const getPedidosAtivos = () => {
    try {
      const pedidos = JSON.parse(localStorage.getItem(ACTIVE_ORDERS_KEY) || '[]')
      return Array.isArray(pedidos) ? pedidos : []
    } catch {
      return []
    }
  }

  const salvarPedidoAtivo = (pedido) => {
    if (consentimento.value !== 'aceito') return
    if (!pedido?.trackingCode) return
    if (FINAL_STATUSES.has(pedido.status)) {
      removerPedidoAtivo(pedido.trackingCode)
      return
    }

    const pedidos = getPedidosAtivos().filter((item) => item.trackingCode !== pedido.trackingCode)
    pedidos.unshift({
      id: pedido.id,
      trackingCode: pedido.trackingCode,
      status: pedido.status,
      paymentStatus: pedido.paymentStatus,
      total: pedido.total,
      date: pedido.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    localStorage.setItem(ACTIVE_ORDERS_KEY, JSON.stringify(pedidos.slice(0, MAX_ACTIVE_ORDERS)))
  }

  const atualizarPedidoAtivo = (pedido) => {
    if (consentimento.value !== 'aceito') return
    if (!pedido?.trackingCode) return
    if (FINAL_STATUSES.has(pedido.status)) {
      removerPedidoAtivo(pedido.trackingCode)
      return
    }

    const pedidos = getPedidosAtivos()
    const index = pedidos.findIndex((item) => item.trackingCode === pedido.trackingCode)
    if (index === -1) return

    pedidos[index] = {
      ...pedidos[index],
      status: pedido.status ?? pedidos[index].status,
      paymentStatus: pedido.paymentStatus ?? pedidos[index].paymentStatus,
      updatedAt: new Date().toISOString(),
    }
    localStorage.setItem(ACTIVE_ORDERS_KEY, JSON.stringify(pedidos))
  }

  const removerPedidoAtivo = (trackingCode) => {
    if (!trackingCode) return
    const pedidos = getPedidosAtivos().filter((item) => item.trackingCode !== trackingCode)
    localStorage.setItem(ACTIVE_ORDERS_KEY, JSON.stringify(pedidos))
  }

  return {
    consentimento,
    aceitarCookies,
    recusarCookies,
    getHistorico,
    salvarPedido,
    getPedidosAtivos,
    salvarPedidoAtivo,
    atualizarPedidoAtivo,
    removerPedidoAtivo,
  }
}
