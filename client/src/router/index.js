import { createRouter, createWebHistory } from 'vue-router'
import { AuthService } from '@/services/http'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/app',
      component: () => import('../layout/MainLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: 'dashboard',
          name: 'dashboard',
          component: () => import('../views/DashboardView.vue'),
        },
        {
          path: 'categorias',
          name: 'categorias',
          component: () => import('../views/CategoryListView.vue'),
        },
        {
          path: 'produtos',
          name: 'produtos',
          component: () => import('../views/ProductListView.vue'),
        },
        {
          path: 'pedidos',
          name: 'pedidos',
          component: () => import('../views/OrderListView.vue'),
        },
        {
          path: 'historico',
          name: 'historico',
          component: () => import('../views/HistoricoView.vue'),
        },
        {
          path: 'mesas',
          name: 'mesas',
          component: () => import('../views/MesasView.vue'),
        },
        {
          path: 'clientes',
          name: 'clientes',
          component: () => import('../views/CustomerListView.vue'),
        },
        {
          path: 'configuracoes',
          name: 'configuracoes',
          component: () => import('../views/SettingsView.vue'),
        },
        {
          path: 'usuarios',
          name: 'usuarios',
          component: () => import('../views/UserListView.vue'),
        },
      ],
    },
    {
      path: '/pdv',
      name: 'pdv',
      component: () => import('../views/PdvView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/delivery',
      name: 'delivery',
      component: () => import('../views/DeliveryView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/cardapio',
      name: 'cardapio',
      component: () => import('../views/CustomerMenuView.vue'),
      // Rota pública, não precisa de requiresAuth
    },
    {
      path: '/',
      redirect: '/cardapio',
    },
    {
      path: '/auth/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/login',
      redirect: '/auth/login',
    },
    {
      path: '/auth/forgot-password',
      name: 'forgot-password',
      component: () => import('../views/ForgotPasswordView.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/auth/reset-password',
      name: 'reset-password',
      component: () => import('../views/ResetPasswordView.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/auth/register',
      name: 'register',
      component: () => import('../views/RegisterView.vue'),
      meta: { guestOnly: true },
    },
  ],
})

router.beforeEach((to, _from) => {
  const isAuthenticated = AuthService.isAuthenticated()

  if (to.meta.requiresAuth && !isAuthenticated) {
    return { name: 'login' }
  } else if (to.meta.guestOnly && isAuthenticated) {
    // Busca a rota correta do usuário logado de forma limpa usando o dicionário no AuthService
    const defaultRouteName = AuthService.getDefaultRoute()
    return { name: defaultRouteName }
  }
})

export default router
