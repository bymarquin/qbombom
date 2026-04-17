<template>
  <aside
    :class="[
      'relative h-screen bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 flex flex-col transition-all duration-300 z-20',
      collapsed ? 'w-16' : 'w-64',
    ]"
  >
    <!-- Logo Area -->
    <div
      class="h-16 flex items-center border-b border-neutral-100 dark:border-neutral-800/50 group/logo"
      :class="collapsed ? 'justify-center px-0 cursor-pointer' : 'px-4'"
      @click="collapsed ? (collapsed = false) : null"
    >
      <!-- Expandido: logo + nome + botão recolher -->
      <template v-if="!collapsed">
        <div class="flex items-center gap-3 flex-1 min-w-0">
          <svg
            width="32"
            height="32"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            class="shrink-0"
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
          <span
            class="font-bold text-lg text-neutral-900 dark:text-neutral-100 tracking-tight whitespace-nowrap overflow-hidden"
            >Qbombom Sorvetes Sorvetes</span
          >
        </div>
        <button
          @click.stop="collapsed = true"
          title="Recolher menu"
          class="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors shrink-0"
        >
          <PanelLeftClose class="w-4 h-4" />
        </button>
      </template>

      <!-- Colapsado: logo com hover mostrando ícone de expandir -->
      <template v-else>
        <div class="relative w-8 h-8">
          <svg
            width="32"
            height="32"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            class="transition-opacity group-hover/logo:opacity-0"
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
          <div
            class="absolute inset-0 flex items-center justify-center opacity-0 group-hover/logo:opacity-100 transition-opacity"
          >
            <PanelLeftOpen class="w-5 h-5 text-neutral-500 dark:text-neutral-400" />
          </div>
        </div>
      </template>
    </div>

    <!-- Navigation Links -->
    <nav
      class="flex-1 overflow-y-auto py-4 flex flex-col gap-6 custom-scrollbar"
      :class="collapsed ? 'px-2' : 'px-3'"
    >
      <div v-for="group in filteredMenuGroups" :key="group.title">
        <h3
          v-show="!collapsed"
          class="px-3 mb-2 text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500"
        >
          {{ group.title }}
        </h3>
        <div v-show="collapsed" class="mb-2 border-t border-neutral-100 dark:border-neutral-800" />
        <div class="flex flex-col gap-1">
          <RouterLink
            v-for="item in group.items"
            :key="item.path"
            :to="item.path"
            :title="collapsed ? item.name : undefined"
            :exact-active-class="
              item.path === '/app/dashboard'
                ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-500'
                : ''
            "
            active-class="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-500"
            :class="[
              'flex items-center rounded-lg font-medium transition-colors text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100',
              collapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2.5',
            ]"
          >
            <component :is="item.icon" class="w-5 h-5 shrink-0" />
            <span v-show="!collapsed">{{ item.name }}</span>
          </RouterLink>
        </div>
      </div>
    </nav>

    <!-- User Footer -->
    <div
      class="border-t border-neutral-100 dark:border-neutral-800/50"
      :class="collapsed ? 'p-2' : 'p-3'"
      v-click-outside="() => (dropdownOpen = false)"
    >
      <!-- Dropdown -->
      <Transition name="dropdown">
        <div
          v-if="dropdownOpen"
          :class="[
            'absolute bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-lg overflow-hidden z-50 w-56',
            collapsed ? 'left-full bottom-4 ml-2' : 'bottom-16 left-2 right-2',
          ]"
        >
          <div class="p-1 flex flex-col gap-0.5">
            <RouterLink
              v-if="['SUPER_ADMIN', 'MANAGER'].includes(currentUserRole)"
              to="/app/configuracoes"
              @click="dropdownOpen = false"
              class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
            >
              <Settings class="w-4 h-4 shrink-0" />
              Configurações
            </RouterLink>

            <ThemeSwitcher />

            <div class="border-t border-neutral-100 dark:border-neutral-700 my-0.5" />

            <button
              @click="fazerLogout"
              class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-500 transition-colors w-full text-left"
            >
              <LogOut class="w-4 h-4 shrink-0" />
              Sair
            </button>
          </div>
        </div>
      </Transition>

      <!-- Avatar trigger -->
      <button
        @click="dropdownOpen = !dropdownOpen"
        :title="collapsed ? currentUserName || 'Usuário' : undefined"
        :class="[
          'w-full flex items-center rounded-xl transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800',
          collapsed ? 'justify-center p-1.5' : 'gap-3 px-2 py-2',
          dropdownOpen ? 'bg-neutral-100 dark:bg-neutral-800' : '',
        ]"
      >
        <div
          class="w-8 h-8 rounded-full bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center font-bold text-sm border border-red-200 dark:border-red-500/30 shrink-0"
        >
          {{ userInitial }}
        </div>
        <div v-if="!collapsed" class="flex-1 min-w-0 text-left">
          <p
            class="text-sm font-semibold text-neutral-800 dark:text-neutral-200 truncate leading-tight"
          >
            {{ currentUserName || "Usuário" }}
          </p>
          <p class="text-xs text-neutral-400 dark:text-neutral-500 truncate leading-tight">
            {{ roleLabel }}
          </p>
        </div>
        <ChevronsUpDown v-if="!collapsed" class="w-4 h-4 text-neutral-400 shrink-0" />
      </button>
    </div>
  </aside>
</template>

<script setup>
import { ref, computed } from "vue";
import { AuthService } from "@/services/http";
import ThemeSwitcher from "./ThemeSwitcher.vue";
import {
  LayoutDashboard,
  Package,
  List,
  ShoppingBag,
  ShoppingCart,
  Users,
  Settings,
  LogOut,
  Bike,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronsUpDown,
} from "lucide-vue-next";

const vClickOutside = {
  mounted(el, binding) {
    el._clickOutside = (e) => {
      if (!el.contains(e.target)) binding.value(e);
    };
    document.addEventListener("mousedown", el._clickOutside);
  },
  unmounted(el) {
    document.removeEventListener("mousedown", el._clickOutside);
  },
};

const collapsed = ref(false);
const dropdownOpen = ref(false);
const currentUserRole = AuthService.getRole() || "CASHIER";
const currentUserName = AuthService.getName();

const userInitial = computed(() => (currentUserName?.[0] ?? "U").toUpperCase());

const roleLabel = computed(
  () =>
    ({
      SUPER_ADMIN: "Super Admin",
      MANAGER: "Gerente",
      CASHIER: "Caixa",
      DELIVERY: "Entregador",
      VIEWER: "Visualizador",
    })[currentUserRole] ?? currentUserRole,
);

const menuGroups = [
  {
    title: "Geral",
    items: [
      {
        name: "Dashboard",
        path: "/app/dashboard",
        icon: LayoutDashboard,
        roles: ["SUPER_ADMIN", "MANAGER"],
      },
    ],
  },
  {
    title: "Operação",
    items: [
      {
        name: "Frente de Caixa",
        path: "/pdv",
        icon: ShoppingCart,
        roles: ["SUPER_ADMIN", "MANAGER", "CASHIER"],
      },
      {
        name: "Pedidos",
        path: "/app/pedidos",
        icon: ShoppingBag,
        roles: ["SUPER_ADMIN", "MANAGER", "CASHIER"],
      },
      {
        name: "Entregas",
        path: "/delivery",
        icon: Bike,
        roles: ["SUPER_ADMIN", "MANAGER", "CASHIER", "DELIVERY"],
      },
    ],
  },
  {
    title: "Gerenciamento",
    items: [
      {
        name: "Categorias",
        path: "/app/categorias",
        icon: List,
        roles: ["SUPER_ADMIN", "MANAGER"],
      },
      { name: "Produtos", path: "/app/produtos", icon: Package, roles: ["SUPER_ADMIN", "MANAGER"] },
      { name: "Equipe", path: "/app/usuarios", icon: Users, roles: ["SUPER_ADMIN", "MANAGER"] },
      {
        name: "Clientes",
        path: "/app/clientes",
        icon: Users,
        roles: ["SUPER_ADMIN", "MANAGER", "CASHIER"],
      },
    ],
  },
];

const filteredMenuGroups = computed(() => {
  return menuGroups
    .map((group) => {
      const filteredItems = group.items.filter((item) => {
        if (!item.roles || item.roles.length === 0) return true;
        return item.roles.includes(currentUserRole);
      });
      return { ...group, items: filteredItems };
    })
    .filter((group) => group.items.length > 0);
});

const fazerLogout = async () => {
  try {
    await AuthService.logout();
  } catch (error) {
    console.error("Erro ao fazer logout", error);
  }
};
</script>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(4px) scale(0.98);
}

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
