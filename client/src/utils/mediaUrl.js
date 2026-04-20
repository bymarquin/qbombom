const R2_HOST_SUFFIXES = ['.r2.dev', '.r2.cloudflarestorage.com']

function getApiBasePath() {
  const base = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3006/api' : '/api')
  return String(base || '/api').replace(/\/+$/, '')
}

function isR2Host(hostname = '') {
  const host = String(hostname || '').toLowerCase()
  return R2_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix))
}

function extractR2KeyFromUrl(value) {
  if (typeof value !== 'string' || !value.startsWith('http')) return null

  try {
    const url = new URL(value)
    if (!isR2Host(url.hostname)) return null

    const key = decodeURIComponent(url.pathname.replace(/^\/+/, ''))
    return key || null
  } catch {
    return null
  }
}

export function toMediaProxyUrl(urlOrPath) {
  if (typeof urlOrPath !== 'string' || !urlOrPath) return urlOrPath

  if (urlOrPath.includes('/r2/files/proxy?key=')) {
    return urlOrPath
  }

  const r2Key = extractR2KeyFromUrl(urlOrPath)
  if (!r2Key) return urlOrPath

  return `${getApiBasePath()}/r2/files/proxy?key=${encodeURIComponent(r2Key)}`
}

export function toMediaProxyUrlFromKey(key) {
  const normalizedKey = String(key || '').replace(/^\/+/, '')
  if (!normalizedKey) return ''
  return `${getApiBasePath()}/r2/files/proxy?key=${encodeURIComponent(normalizedKey)}`
}

export function normalizeMediaUrlsDeep(payload, seen = new WeakSet()) {
  if (typeof payload === 'string') {
    return toMediaProxyUrl(payload)
  }

  if (!payload || typeof payload !== 'object') {
    return payload
  }

  if (payload instanceof Blob || payload instanceof File || payload instanceof Date || payload instanceof ArrayBuffer) {
    return payload
  }

  if (seen.has(payload)) {
    return payload
  }

  seen.add(payload)

  if (Array.isArray(payload)) {
    for (let i = 0; i < payload.length; i += 1) {
      payload[i] = normalizeMediaUrlsDeep(payload[i], seen)
    }
    return payload
  }

  for (const key of Object.keys(payload)) {
    payload[key] = normalizeMediaUrlsDeep(payload[key], seen)
  }

  return payload
}
