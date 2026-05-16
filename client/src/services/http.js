import axios from 'axios'
import { useToastStore } from '@/stores/toast'
import { normalizeMediaUrlsDeep, toMediaProxyUrlFromKey } from '@/utils/mediaUrl'

const API_BASE_URL =
  import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3006/api' : '/api')

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor de Requisição (Ida)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// Fila para evitar múltiplos refreshes simultâneos (race condition que desloga o usuário)
let isRefreshing = false
let refreshQueue = []

const processRefreshQueue = (error, token = null) => {
  refreshQueue.forEach((cb) => (error ? cb.reject(error) : cb.resolve(token)))
  refreshQueue = []
}

// Interceptor de Resposta (Volta)
api.interceptors.response.use(
  (response) => {
    const responseType = response?.config?.responseType
    if (responseType !== 'blob' && responseType !== 'arraybuffer') {
      response.data = normalizeMediaUrlsDeep(response.data)
    }
    return response
  }, // Sucesso (200), repassa a resposta
  async (error) => {
    const originalRequest = error.config
    const requestUrl = originalRequest?.url || ''

    // Flags para identificar o tipo de requisição
    const isLoginRoute = requestUrl.includes('/auth/login')
    const isRefreshRoute = requestUrl.includes('/auth/refresh')

    // Instancia o ToastStore de forma segura
    let toastStore
    try {
      toastStore = useToastStore()
    } catch {
      // Pinia pode não estar pronto em edge cases
    }

    // --- 1. Tratamento de Erro de Autenticação (401) ---
    if (error.response?.status === 401) {
      // Se for um erro no endpoint de login, NÃO faz refresh e apenas repassa o erro
      // para o componente (ex: LoginView) exibir o feedback correto (Credenciais inválidas)
      if (isLoginRoute) {
        return Promise.reject(error)
      }

      // Se o erro for na própria tentativa de refresh token, significa que o token de
      // renovação também expirou/é inválido. Desloga sumariamente.
      if (isRefreshRoute) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
        return Promise.reject(error)
      }

      // Se um refresh já está em andamento, enfileira esta requisição para retentar depois
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest._retry = true
            originalRequest.headers.Authorization = `Bearer ${token}`
            return api(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      // Se não for rota de login/refresh e for a primeira tentativa de erro (não tentamos _retry),
      // dispara o fluxo de Silent Refresh Token
      if (!originalRequest._retry) {
        originalRequest._retry = true
        isRefreshing = true

        try {
          const refreshToken = localStorage.getItem('refreshToken')
          if (!refreshToken) throw new Error('No refresh token available')

          // Tenta renovar chamando axios puro (sem o interceptor para não dar loop infinito)
          const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          })

          // Salva os novos tokens
          localStorage.setItem('accessToken', data.accessToken)
          localStorage.setItem('refreshToken', data.refreshToken)

          processRefreshQueue(null, data.accessToken)

          // Atualiza o cabeçalho da requisição original com o novo token e refaz
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`
          return api(originalRequest)
        } catch (refreshError) {
          processRefreshQueue(refreshError)

          const status = refreshError.response?.status
          
          // Se o servidor disser que o Refresh Token é inválido ou expirou (401/403),
          // não há como recuperar a sessão sem um novo login manual.
          if (status === 401 || status === 403) {
            localStorage.removeItem('accessToken')
            localStorage.removeItem('refreshToken')
            localStorage.removeItem('userRole')
            localStorage.removeItem('userName')
            
            if (toastStore) {
              toastStore.error('Sua sessão expirou ou foi revogada. Faça login novamente.')
            }
            window.location.href = '/login'
          } else {
            // Outros erros (ex: rede fora do ar), apenas avisamos mas mantemos o refreshToken salvo
            localStorage.removeItem('accessToken')
            if (toastStore) {
              toastStore.error('Conexão instável. Verifique sua internet.')
            }
          }

          return Promise.reject(refreshError)
        } finally {
          isRefreshing = false
        }
      }
    }

    // --- 2. Tratamento Genérico de Outros Erros (400, 403, 404, 500) ---
    // Exibimos um Toast global para qualquer outro erro da API,
    // EXCETO para rotas de login (porque o LoginView já faz o tratamento visual/inline por conta própria)
    if (toastStore && !isLoginRoute && error.response?.status !== 401) {
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Ocorreu um erro inesperado no servidor.'
      toastStore.error(errorMessage)
    }

    return Promise.reject(error)
  },
)

// --- SERVICES ---
export const login = (payload) => api.post('/auth/login', payload)

export const AuthService = {
  login(email, password) {
    return api.post('/auth/login', { email, password })
  },
  loginPin(pin) {
    return api.post('/auth/login/pin', { pin })
  },
  forgotPassword(email) {
    return api.post('/auth/forgot-password', { email })
  },
  resetPassword(id, token, password) {
    return api.post('/auth/reset-password', { id, token, password })
  },
  logout() {
    return api.post('/auth/logout').finally(() => {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('userRole')
      localStorage.removeItem('userName')
      window.location.href = '/login'
    })
  },
  getMe() {
    return api.get('/auth/me')
  },
  setTokens(accessToken, refreshToken, role = null, name = null) {
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    if (role) localStorage.setItem('userRole', role)
    if (name) localStorage.setItem('userName', name)
  },
  getRole() {
    return localStorage.getItem('userRole') || null
  },
  getName() {
    return localStorage.getItem('userName') || null
  },
  getDefaultRoute() {
    const role = this.getRole()
    const routes = {
      SUPER_ADMIN: 'dashboard',
      MANAGER: 'dashboard',
      CASHIER: 'pdv',
      DELIVERY: 'delivery',
    }
    return routes[role] || 'pdv' // Fallback seguro
  },
  isAuthenticated() {
    // Consideramos autenticado se houver pelo menos o refreshToken, 
    // pois o interceptor cuidará de renovar o accessToken se necessário.
    return !!localStorage.getItem('refreshToken')
  },
}

export const CatalogService = {
  getCategories(params = {}) {
    return api.get('/categories', { params })
  },
  createCategory(data) {
    return api.post('/categories', data)
  },
  updateCategory(id, data) {
    return api.put(`/categories/${id}`, data)
  },
  deleteCategory(id) {
    return api.delete(`/categories/${id}`)
  },
  reorderCategories(order) {
    return api.put('/categories/reorder', { order })
  },

  getProducts(params = {}) {
    return api.get('/products', { params })
  },
  getProduct(id, params = {}, config = {}) {
    return api.get(`/products/${id}`, { params, ...config })
  },
  createProduct(data) {
    return api.post('/products', data)
  },
  updateProduct(id, data) {
    return api.put(`/products/${id}`, data)
  },
  deleteProduct(id) {
    return api.delete(`/products/${id}`)
  },
}

export const AdditionalService = {
  getGroups() {
    return api.get('/additionals/groups')
  },
  createGroup(data) {
    return api.post('/additionals/groups', data)
  },
  updateGroup(id, data) {
    return api.put(`/additionals/groups/${id}`, data)
  },
  deleteGroup(id) {
    return api.delete(`/additionals/groups/${id}`)
  },
  assignGroup(groupId, productId) {
    return api.post(`/additionals/groups/${groupId}/assign`, { productId })
  },
  unassignGroup(groupId, productId) {
    return api.delete(`/additionals/groups/${groupId}/assign/${productId}`)
  },
  reorderGroups(productId, order) {
    return api.patch(`/additionals/groups/reorder/${productId}`, { order })
  },

  createItem(data) {
    return api.post('/additionals/items', data)
  },
  updateItem(id, data) {
    return api.put(`/additionals/items/${id}`, data)
  },
  deleteItem(id) {
    return api.delete(`/additionals/items/${id}`)
  },
}

export const ImportService = {
  exportCatalog() {
    return api.get('/import/export')
  },
  importCatalog(data) {
    return api.post('/import', data)
  },
  deduplicateGroups() {
    return api.post('/import/deduplicate-groups')
  },
}

export const OrderService = {
  getOrders({ status = '', dateFrom = '', dateTo = '' } = {}) {
    const params = {}
    if (status) params.status = status
    if (dateFrom) params.dateFrom = dateFrom
    if (dateTo) params.dateTo = dateTo
    return api.get('/orders', { params })
  },
  getOrder(id) {
    return api.get(`/orders/${id}`)
  },
  createOrder(orderData) {
    return api.post('/orders', orderData)
  },
  createPublicOrder(orderData) {
    // Rota pública para pedidos feitos pelo cliente via celular, sem necessidade de Auth
    return api.post('/orders/public', orderData)
  },
  cancelPublicOrder(trackingCode) {
    return api.patch(`/orders/track/${trackingCode}/cancel`)
  },
  optOutWhatsappByTracking(trackingCode) {
    return api.patch(`/orders/track/${trackingCode}/whatsapp-optout`)
  },
  confirmDelivery(trackingCode) {
    return api.patch(`/orders/track/${trackingCode}/confirm`)
  },
  trackPublicOrder(trackingCode) {
    // Rota pública para consultar status do pedido por código
    return api.get(`/orders/track/${trackingCode}`)
  },
  updateOrderStatus(id, status, paymentStatus, paymentMethod) {
    const payload = {};
    if (status) payload.status = status;
    if (paymentStatus) payload.paymentStatus = paymentStatus;
    if (paymentMethod) payload.paymentMethod = paymentMethod;

    return api.patch(`/orders/${id}/status`, payload)
  },
  cancelOrder(id) {
    return api.patch(`/orders/${id}/cancel`)
  },
}

export const GeocodeService = {
  reverseGeocode(lat, lon) {
    return api.get('/geocode/reverse', { params: { lat, lon } })
  },
}

export const DashboardService = {
  getMetrics(period = 'today', customRange = null) {
    const params = { period }
    if (period === 'custom' && customRange?.start && customRange?.end) {
      params.start = customRange.start
      params.end = customRange.end
    }
    return api.get('/dashboard', { params })
  },
}

export const CustomerService = {
  getCustomers() {
    return api.get('/customers')
  },
  getCustomer(id) {
    return api.get(`/customers/${id}`)
  },
  createCustomer(data) {
    return api.post('/customers', data)
  },
  updateCustomer(id, data) {
    return api.put(`/customers/${id}`, data)
  },
  deleteCustomer(id) {
    return api.delete(`/customers/${id}`)
  },
}

export const WhatsAppService = {
  getStatus() { return api.get('/whatsapp/status') },
  getQRCode() { return api.get('/whatsapp/qrcode') },
  createInstance() { return api.post('/whatsapp/instance') },
  disconnect() { return api.post('/whatsapp/disconnect') },
  reconnect() { return api.post('/whatsapp/reconnect') },
  getMessages() { return api.get('/whatsapp/messages') },
  updateMessages(data) { return api.put('/whatsapp/messages', data) },
}

export const SettingService = {
  getSettings() {
    return api.get('/settings')
  },
  saveSettings(data) {
    return api.put('/settings', data)
  }
}

export const UserService = {
  getUsers() {
    return api.get('/users')
  },
  getUser(id) {
    return api.get(`/users/${id}`)
  },
  createUser(data) {
    return api.post('/users', data)
  },
  updateUser(id, data) {
    return api.put(`/users/${id}`, data)
  },
  deleteUser(id) {
    return api.delete(`/users/${id}`)
  },
  resendInvite(id) {
    return api.post(`/users/${id}/invite`)
  },
}

export const R2Service = {
  listFiles(params = {}) {
    return api.get('/r2/files', { params })
  },
  getProxyUrl(key) {
    return toMediaProxyUrlFromKey(key)
  },
  getFileBlob(key) {
    return api.get('/r2/files/proxy', {
      params: { key },
      responseType: 'blob',
    })
  },
  uploadFile({ file, prefix = '' }, config = {}) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('prefix', prefix)

    return api.post('/r2/files', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      ...config,
    })
  },
  deleteFile(key) {
    return api.delete('/r2/files', { data: { key } })
  },
  moveFile(sourceKey, destinationKey) {
    return api.patch('/r2/files/move', { sourceKey, destinationKey })
  },
}

export default api
