import axios from 'axios'
import { useToastStore } from '@/stores/toast'

const API_BASE_URL =
  import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3000/api' : '/api')

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

// Interceptor de Resposta (Volta)
api.interceptors.response.use(
  (response) => response, // Sucesso (200), repassa a resposta
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

      // Se não for rota de login/refresh e for a primeira tentativa de erro (não tentamos _retry),
      // dispara o fluxo de Silent Refresh Token
      if (!originalRequest._retry) {
        originalRequest._retry = true

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

          // Atualiza o cabeçalho da requisição original com o novo token e refaz
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`
          return api(originalRequest)
        } catch (refreshError) {
          // Falha catastrófica no refresh (token revogado ou expirado), limpa a casa e desloga
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')

          if (toastStore) {
            toastStore.error('Sua sessão expirou. Faça login novamente.')
          }

          window.location.href = '/login'
          return Promise.reject(refreshError)
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
      window.location.href = '/login'
    })
  },
  getMe() {
    return api.get('/auth/me')
  },
  setTokens(accessToken, refreshToken, role = null) {
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    if (role) {
      localStorage.setItem('userRole', role)
    }
  },
  getRole() {
    return localStorage.getItem('userRole') || null
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
    return !!localStorage.getItem('accessToken')
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

  getProducts(params = {}) {
    return api.get('/products', { params })
  },
  getProduct(id, params = {}) {
    return api.get(`/products/${id}`, { params })
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
  createGroup(data) {
    return api.post('/additionals/groups', data)
  },
  updateGroup(id, data) {
    return api.put(`/additionals/groups/${id}`, data)
  },
  deleteGroup(id) {
    return api.delete(`/additionals/groups/${id}`)
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

export const OrderService = {
  getOrders(status = '') {
    const params = status ? { status } : {}
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
  uploadReceipt(trackingCode, payload) {
    return api.post(`/orders/track/${trackingCode}/receipt`, payload)
  },
  cancelPublicOrder(trackingCode) {
    return api.patch(`/orders/track/${trackingCode}/cancel`)
  },
  trackPublicOrder(trackingCode) {
    // Rota pública para consultar status do pedido por código
    return api.get(`/orders/track/${trackingCode}`)
  },
  updateOrderStatus(id, status, paymentStatus) {
    const payload = {};
    if (status) payload.status = status;
    if (paymentStatus) payload.paymentStatus = paymentStatus;
    
    return api.patch(`/orders/${id}/status`, payload)
  },
}

export const DashboardService = {
  getMetrics(period = 'today') {
    return api.get('/dashboard', { params: { period } })
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
}

export default api
