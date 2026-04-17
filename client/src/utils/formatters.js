export const formatarMoeda = (valor) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    Number(valor) || 0,
  )
}

export const formatarTempo = (dateString) => {
  if (!dateString) return ''
  const agora = new Date()
  const pedidoData = new Date(dateString)
  const diffMs = agora - pedidoData
  const diffMinutos = Math.floor(diffMs / 60000)

  if (diffMinutos < 1) return 'Agora'
  if (diffMinutos < 60) return `${diffMinutos} min`
  
  const diffHoras = Math.floor(diffMinutos / 60)
  return `${diffHoras} h`
}
