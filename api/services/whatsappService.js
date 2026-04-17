const axios = require('axios')
const { Setting } = require('../models')

const BASE_URL = process.env.EVOLUTION_API_URL || 'http://localhost:8080'
const API_KEY = process.env.EVOLUTION_API_KEY || 'qbombom_evolution_key'
const INSTANCE = process.env.EVOLUTION_INSTANCE || 'qbombom'
const CONSENT_KEY = 'whatsapp_consent'

const MIN_SEND_INTERVAL_MS = Number(process.env.WHATSAPP_MIN_SEND_INTERVAL_MS || 90_000)
const JITTER_MIN_MS = Number(process.env.WHATSAPP_JITTER_MIN_MS || 3_000)
const JITTER_MAX_MS = Number(process.env.WHATSAPP_JITTER_MAX_MS || 12_000)

const lastSentAtByPhone = new Map()
const sentStatusByOrder = new Set()
let sendQueue = Promise.resolve()

const client = axios.create({
  baseURL: BASE_URL,
  headers: { apikey: API_KEY },
  timeout: 8000,
})

const DEFAULT_MESSAGES = {
  em_preparo: '🍧 Seu pedido está sendo preparado! Em breve ficará pronto.',
  pronto: '✅ Seu pedido está pronto! Pode retirar ou aguardar a entrega.',
  em_rota: '🛵 Seu pedido saiu para entrega! Acompanhe e confirme o recebimento pelo link abaixo:',
  finalizado: '🎉 Pedido finalizado. Obrigado pela preferência! Volte sempre 😊',
  cancelado: '❌ Seu pedido foi cancelado. Entre em contato se tiver dúvidas.',
}

const formatPhone = (phone) => {
  const digits = String(phone || '').replace(/\D/g, '')
  if (!digits) return ''
  return digits.startsWith('55') ? digits : `55${digits}`
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

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

exports.sendStatusMessage = async (phone, status, orderNumber, trackingUrl = null, orderId = null) => {
  if (!phone) return
  const normalizedPhone = formatPhone(phone)
  if (!normalizedPhone) return

  if (!(await canSendToPhone(normalizedPhone))) {
    return
  }

  let messages = DEFAULT_MESSAGES
  try {
    const setting = await Setting.findOne({ where: { key: 'whatsapp_messages' } })
    if (setting?.value) messages = { ...DEFAULT_MESSAGES, ...setting.value }
  } catch {}
  const message = messages[status]
  if (!message) return

  let text = `*Qbombom Sorvetes* — Pedido #${orderNumber}\n\n${message}`
  if (trackingUrl) text += `\n${trackingUrl}`

  const statusKey = `${orderId || orderNumber}:${status}`
  if (sentStatusByOrder.has(statusKey)) return

  try {
    await enqueueSend(async () => {
      const lastSentAt = lastSentAtByPhone.get(normalizedPhone) || 0
      if (Date.now() - lastSentAt < MIN_SEND_INTERVAL_MS) {
        return
      }

      await client.post(`/message/sendText/${INSTANCE}`, {
        number: normalizedPhone,
        text,
      })

      lastSentAtByPhone.set(normalizedPhone, Date.now())
      sentStatusByOrder.add(statusKey)
    })
  } catch (error) {
    // Falha no WhatsApp não deve derrubar a operação principal
    console.error('[WhatsApp] Erro ao enviar mensagem:', error.message)
  }
}

exports.getInstance = async () => {
  const { data } = await client.get(`/instance/fetchInstances`)
  return data
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
