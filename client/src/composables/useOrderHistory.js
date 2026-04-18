import { ref } from 'vue'

const STORAGE_KEY = 'qbombom_historico'
const CONSENT_KEY = 'qbombom_cookie_consent'
const MAX_ORDERS = 3

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

  return { consentimento, aceitarCookies, recusarCookies, getHistorico, salvarPedido }
}
