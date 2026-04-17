<template>
  <aside
    class="w-64 h-screen bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 flex flex-col transition-all duration-300 z-20"
  >
    <!-- Logo Area -->
    <div class="h-16 flex items-center px-6 border-b border-neutral-100 dark:border-neutral-800/50">
      <div class="flex items-center gap-3">
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="32" height="32" rx="8" class="fill-red-600" />
          <text
            x="16"
            y="22"
            font-size="16"
            font-weight="900"
            fill="white"
            text-anchor="middle"
            font-family="system-ui, sans-serif"
          >
            Q
          </text>
        </svg>
        <span class="font-bold text-lg text-neutral-900 dark:text-neutral-100 tracking-tight"
          >QbomBom</span
        >
      </div>
    </div>

    <!-- Navigation Links -->
    <nav class="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-6 custom-scrollbar">
      <div v-for="group in filteredMenuGroups" :key="group.title">
        <h3 class="px-3 mb-2 text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
          {{ group.title }}
        </h3>
        <div class="flex flex-col gap-1">
          <RouterLink
            v-for="item in group.items"
            :key="item.path"
            :to="item.path"
            :exact-active-class="item.path === '/app/dashboard' ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-500' : ''"
            active-class="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-500"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
          >
            <component :is="item.icon" class="w-5 h-5" />
            {{ item.name }}
          </RouterLink>
        </div>
      </div>
    </nav>

    <!-- Bottom Actions -->
    <div class="p-4 border-t border-neutral-100 dark:border-neutral-800/50">
      <RouterLink
        v-if="['SUPER_ADMIN', 'MANAGER'].includes(currentUserRole)"
        to="/app/configuracoes"
        class="flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 mb-2"
        active-class="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-500"
      >
        <Settings class="w-5 h-5" />
        Configurações
      </RouterLink>

      <div class="mb-4">
        <ThemeSwitcher />
      </div>

      <button
        @click="fazerLogout"
        class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors text-neutral-600 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-500"
      >
        <LogOut class="w-5 h-5" />
        Sair
      </button>
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { AuthService } from '@/services/http'
import ThemeSwitcher from './ThemeSwitcher.vue'
import {
  LayoutDashboard,
  Package,
  List,
  ShoppingBag,
  ShoppingCart,
  Users,
  Settings,
  LogOut,
  Bike
} from 'lucide-vue-next'

const currentUserRole = AuthService.getRole() || 'CASHIER'

const menuGroups = [
  {
    title: 'Geral',
    items: [
      { name: 'Dashboard', path: '/app/dashboard', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'MANAGER'] }
    ]
  },
  {
    title: 'Operação',
    items: [
      { name: 'Frente de Caixa', path: '/pdv', icon: ShoppingCart, roles: ['SUPER_ADMIN', 'MANAGER', 'CASHIER'] },
      { name: 'Pedidos', path: '/app/pedidos', icon: ShoppingBag, roles: ['SUPER_ADMIN', 'MANAGER', 'CASHIER'] },
      { name: 'Entregas', path: '/delivery', icon: Bike, roles: ['SUPER_ADMIN', 'MANAGER', 'CASHIER', 'DELIVERY'] }
    ]
  },
  {
    title: 'Gerenciamento',
    items: [
      { name: 'Categorias', path: '/app/categorias', icon: List, roles: ['SUPER_ADMIN', 'MANAGER'] },
      { name: 'Produtos', path: '/app/produtos', icon: Package, roles: ['SUPER_ADMIN', 'MANAGER'] },
      { name: 'Equipe', path: '/app/usuarios', icon: Users, roles: ['SUPER_ADMIN', 'MANAGER'] },
      { name: 'Clientes', path: '/app/clientes', icon: Users, roles: ['SUPER_ADMIN', 'MANAGER', 'CASHIER'] }
    ]
  }
]

const filteredMenuGroups = computed(() => {
  return menuGroups
    .map((group) => {
      const filteredItems = group.items.filter((item) => {
        if (!item.roles || item.roles.length === 0) return true
        return item.roles.includes(currentUserRole)
      })
      return { ...group, items: filteredItems }
    })
    .filter((group) => group.items.length > 0)
})

const fazerLogout = async () => {
  try {
    await AuthService.logout()
  } catch (error) {
    console.error('Erro ao fazer logout', error)
  }
}
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(209, 213, 219, 0);
  border-radius: 4px;
}
aside:hover .custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(209, 213, 219, 0.8);
}
.dark aside:hover .custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(82, 82, 91, 0.8);
}
</style>