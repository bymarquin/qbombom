const axios = require('axios')
const { Setting } = require('../models')

const BASE_URL = process.env.EVOLUTION_API_URL || 'http://localhost:8080'
const API_KEY = process.env.EVOLUTION_API_KEY || 'qbombom_evolution_key'
const INSTANCE = process.env.EVOLUTION_INSTANCE || 'qbombom'
const CONSENT_KEY = 'whatsapp_consent'

const MIN_SEND_INTERVAL_MS = Number(process.env.WHATSAPP_MIN_SEND_INTERVAL_MS || 90_000)
const JITTER_MIN_MS = Number(process.env.WHATSAPP_JITTER_MIN_MS || 500)
const JITTER_MAX_MS = Number(process.env.WHATSAPP_JITTER_MAX_MS || 2_000)

const lastSentAtByPhone = new Map()   // phone → timestamp último envio
const sentStatusByOrder = new Map()   // statusKey → timestamp quando foi marcado
let sendQueue = Promise.resolve()

// Purga entradas do rate-limit mais antigas que 2x o intervalo mínimo (1 vez por hora)
setInterval(() => {
  const cutoff = Date.now() - MIN_SEND_INTERVAL_MS * 2
  for (const [phone, ts] of lastSentAtByPhone) {
    if (ts < cutoff) lastSentAtByPhone.delete(phone)
  }
}, 60 * 60 * 1000).unref()

const STATUS_TTL_MS = 24 * 60 * 60 * 1000 // 24h

const markStatusSent = (key) => {
  sentStatusByOrder.set(key, Date.now())
  // Purga entradas antigas para evitar crescimento ilimitado
  if (sentStatusByOrder.size > 2000) {
    const cutoff = Date.now() - STATUS_TTL_MS
    for (const [k, ts] of sentStatusByOrder) {
      if (ts < cutoff) sentStatusByOrder.delete(k)
    }
  }
}

const isStatusSent = (key) => {
  const ts = sentStatusByOrder.get(key)
  if (!ts) return false
  if (Date.now() - ts > STATUS_TTL_MS) {
    sentStatusByOrder.delete(key)
    return false
  }
  return true
}

const client = axios.create({
  baseURL: BASE_URL,
  headers: { apikey: API_KEY },
  timeout: 8000,
})

const requestFirstSuccess = async (candidates) => {
  let lastError = null

  for (const candidate of candidates) {
    const { method, url, data } = candidate
    try {
      const response = await client.request({ method, url, data })
      return response.data
    } catch (error) {
      lastError = error
    }
  }

  throw lastError || new Error('Falha ao executar ação no WhatsApp')
}

const normalizeStatus = (rawStatus) => {
  const value = String(rawStatus || '').toLowerCase()

  if (!value) return 'disconnected'
  if (['open', 'connected', 'online'].some((s) => value.includes(s))) return 'open'
  if (['connecting', 'pairing', 'qrcode', 'qr', 'scan'].some((s) => value.includes(s))) return 'connecting'
  if (['close', 'closed', 'disconnected', 'logout', 'offline'].some((s) => value.includes(s))) {
    return 'disconnected'
  }

  return 'disconnected'
}

const DEFAULT_MESSAGES = {
  aguardando_pagamento: [
    'Para começarmos a preparar seu pedido, realize o pagamento do PIX em até 30 minutos.',
  ],
  novo: [
    'Já recebemos tudo por aqui. Assim que entrar em preparo eu te aviso!',
  ],
  em_preparo: [
    'Estamos preparando seu pedido com todo carinho. Falta pouco!',
  ],
  pronto: {
    Entrega: 'Nosso entregador já está se preparando para levar até você.',
    Viagem: 'Já pode vir buscar aqui no balcão.',
    Mesa: 'Em instantes estaremos levando até sua mesa.',
    default: 'Já pode vir buscar ou aguardar o atendimento.',
  },
  em_rota: [
    'Você pode acompanhar o trajeto ou confirmar o recebimento pelo link abaixo:',
  ],
  entregue: [
    'Esperamos que aproveite cada colherada! Se puder, nos conte o que achou.',
  ],
  finalizado: [
    'Obrigado pela preferência e esperamos te ver em breve!',
  ],
  cancelado: [
    'Se houve algum problema ou se tiver dúvidas, por favor entre em contato conosco.',
  ],
}

const formatPhone = (phone) => {
  const digits = String(phone || '').replace(/\D/g, '')
  if (!digits) return ''
  return digits.startsWith('55') ? digits : `55${digits}`
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)]


const randomDelay = () => {
  const min = Math.max(0, JITTER_MIN_MS)
  const max = Math.max(min, JITTER_MAX_MS)
  return Math.floor(Math.random() * (max - min + 1)) + min
}

const enqueueSend = async (task) => {
  sendQueue = sendQueue
    .then(async () => {
      await sleep(randomDelay())
      return task()
    })
    .catch((error) => {
      console.error('[WhatsApp] Fila de envio falhou:', error.message)
    })

  return sendQueue
}

const loadConsent = async () => {
  try {
    const setting = await Setting.findOne({ where: { key: CONSENT_KEY } })
    const value = setting?.value || {}
    return {
      optInPhones: Array.isArray(value.optInPhones) ? value.optInPhones : [],
      optOutPhones: Array.isArray(value.optOutPhones) ? value.optOutPhones : []
    }
  } catch {
    return { optInPhones: [], optOutPhones: [] }
  }
}

const saveConsent = async (consent) => {
  await Setting.upsert({ key: CONSENT_KEY, value: consent })
}

exports.setPhoneOptIn = async (phone, optedIn) => {
  const normalized = formatPhone(phone)
  if (!normalized) return

  const consent = await loadConsent()
  const optInSet = new Set(consent.optInPhones.map(formatPhone).filter(Boolean))
  const optOutSet = new Set(consent.optOutPhones.map(formatPhone).filter(Boolean))

  if (optedIn) {
    optInSet.add(normalized)
    optOutSet.delete(normalized)
  } else {
    optInSet.delete(normalized)
  }

  await saveConsent({
    optInPhones: [...optInSet],
    optOutPhones: [...optOutSet]
  })
}

exports.setPhoneOptOut = async (phone, optedOut = true) => {
  const normalized = formatPhone(phone)
  if (!normalized) return

  const consent = await loadConsent()
  const optInSet = new Set(consent.optInPhones.map(formatPhone).filter(Boolean))
  const optOutSet = new Set(consent.optOutPhones.map(formatPhone).filter(Boolean))

  if (optedOut) {
    optOutSet.add(normalized)
    optInSet.delete(normalized)
  } else {
    optOutSet.delete(normalized)
  }

  await saveConsent({
    optInPhones: [...optInSet],
    optOutPhones: [...optOutSet]
  })
}

const canSendToPhone = async (phone) => {
  const normalized = formatPhone(phone)
  if (!normalized) return false

  const consent = await loadConsent()
  const optedIn = new Set(consent.optInPhones.map(formatPhone).filter(Boolean))
  const optedOut = new Set(consent.optOutPhones.map(formatPhone).filter(Boolean))

  return optedIn.has(normalized) && !optedOut.has(normalized)
}

exports.sendStatusMessage = async (phone, status, orderNumber, trackingUrl = null, orderId = null, customerName = null, pixExpiresAt = null, orderType = null) => {
  if (!phone) return
  const normalizedPhone = formatPhone(phone)
  if (!normalizedPhone) return

  if (!(await canSendToPhone(normalizedPhone))) {
    console.log(`[WhatsApp] Sem consentimento para ${normalizedPhone}. Ignorando envio.`)
    return
  }

  let messages = DEFAULT_MESSAGES
  try {
    const setting = await Setting.findOne({ where: { key: 'whatsapp_messages' } })
    if (setting?.value) {
      // Suporte a templates salvos como string ou array
      const merged = {}
      for (const key of Object.keys(DEFAULT_MESSAGES)) {
        merged[key] = setting.value[key] ?? DEFAULT_MESSAGES[key]
      }
      messages = merged
    }
  } catch {}

  const pool = messages[status]
  if (!pool) {
    console.warn(`[WhatsApp] Nenhum template encontrado para status: ${status}`)
    return
  }
  
  let messageBody = ''
  if (typeof pool === 'object' && !Array.isArray(pool)) {
    messageBody = pool[orderType] || pool.default || pickRandom(Object.values(pool))
  } else {
    messageBody = pickRandom(Array.isArray(pool) ? pool : [pool])
  }

  const orderKey = String(orderId || orderNumber)
  const isFirstMessage = ![...sentStatusByOrder.keys()].some((k) => k.startsWith(`${orderKey}:`))
  
  const statusLabels = {
    aguardando_pagamento: 'Aguardando Pagamento ⏳',
    novo: 'Pedido Recebido ✅',
    em_preparo: 'Em Preparo 🍧',
    pronto: 'Pedido Pronto! ✨',
    em_rota: 'Saiu para Entrega 🛵',
    entregue: 'Pedido Entregue 🏁',
    finalizado: 'Pedido Finalizado 🎉',
    cancelado: 'Pedido Cancelado ❌',
  }

  const statusTitle = statusLabels[status] || 'Atualização do Pedido'
  const name = (customerName || '').trim().split(/\s+/)[0]
  const header = isFirstMessage && name ? `Olá, ${name}!\n\n` : ''

  const typeLabel = orderType ? ` (${orderType})` : ''

  let text = `*🍦 Qbombom Sorvetes*\n`
  text += `Pedido: *#${orderNumber}*${typeLabel}\n\n`
  text += `${header}*${statusTitle}*\n${messageBody}`

  if (pixExpiresAt) {
    const expiry = new Date(pixExpiresAt)
    if (!Number.isNaN(expiry.getTime())) {
      const hhmm = expiry.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })
      text += `\n\n⏱ O PIX expira às *${hhmm}*.`
    }
  }
  if (trackingUrl) text += `\n\n🔗 *Acompanhe aqui:* ${trackingUrl}`
  
  text += `\n\n_🤖 Mensagem automática — por favor não responda este número._`

  const statusKey = `${orderId || orderNumber}:${status}`
  if (isStatusSent(statusKey)) {
    console.log(`[WhatsApp] Status ${status} para pedido ${orderNumber} ja enviado anteriormente.`)
    return
  }
  // Reserva antes do enqueueSend para bloquear chamadas concorrentes com mesmo statusKey
  markStatusSent(statusKey)

  try {
    console.log(`[WhatsApp] Agendando envio para ${normalizedPhone} (Status: ${status})...`)
    await enqueueSend(async () => {
      const lastSentAt = lastSentAtByPhone.get(normalizedPhone) || 0
      if (Date.now() - lastSentAt < MIN_SEND_INTERVAL_MS) {
        console.warn(`[WhatsApp] Rate-limit ativo para ${normalizedPhone}, mensagem descartada (pedido ${orderNumber} — ${status})`)
        return
      }

      console.log(`[WhatsApp] Enviando texto para ${normalizedPhone}...`)
      const res = await client.post(`/message/sendText/${INSTANCE}`, {
        number: normalizedPhone,
        text,
      })

      console.log(`[WhatsApp] Sucesso! messageId: ${res.data?.key?.id || 'ok'}`)
      lastSentAtByPhone.set(normalizedPhone, Date.now())
    })
  } catch (error) {
    // Falha no WhatsApp não deve derrubar a operação principal
    console.error('[WhatsApp] Erro fatal no envio:', error.message)
    if (error.response) {
      console.error('[WhatsApp] Detalhes API:', error.response.status, error.response.data)
    }
  }
}

exports.getInstance = async () => {
  const { data } = await client.get(`/instance/fetchInstances`)
  return data
}

exports.getConnectionStatus = async () => {
  try {
    const instances = await exports.getInstance()
    const instance = Array.isArray(instances)
      ? instances.find((i) => i.name === INSTANCE)
      : null

    const rawStatus = instance?.connectionStatus || instance?.status || instance?.state || null

    return {
      status: normalizeStatus(rawStatus),
      rawStatus,
      instanceName: INSTANCE,
      instance,
      updatedAt: new Date().toISOString(),
      lastError: null,
    }
  } catch (error) {
    return {
      status: 'error',
      rawStatus: null,
      instanceName: INSTANCE,
      instance: null,
      updatedAt: new Date().toISOString(),
      lastError: error.message,
    }
  }
}

exports.getQRCode = async () => {
  const { data } = await client.get(`/instance/connect/${INSTANCE}`)
  return data
}

exports.createInstance = async () => {
  const { data } = await client.post('/instance/create', {
    instanceName: INSTANCE,
    integration: 'WHATSAPP-BAILEYS',
    qrcode: true,
    groupsIgnore: true,
    rejectCall: true,
    msgCall: 'Não atendemos por chamada. Faça seu pedido pelo nosso cardápio!',
  })
  return data
}

exports.disconnectInstance = async () => {
  const data = await requestFirstSuccess([
    { method: 'post', url: `/instance/logout/${INSTANCE}` },
    { method: 'delete', url: `/instance/logout/${INSTANCE}` },
    { method: 'post', url: `/instance/disconnect/${INSTANCE}` },
  ])

  return data
}

exports.reconnectInstance = async () => {
  const data = await requestFirstSuccess([
    { method: 'get', url: `/instance/connect/${INSTANCE}` },
    { method: 'post', url: `/instance/connect/${INSTANCE}` },
    { method: 'post', url: `/instance/restart/${INSTANCE}` },
  ])

  return data
}
