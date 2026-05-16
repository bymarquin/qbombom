<template>
  <div class="h-full flex flex-col font-sans">
    <!-- Header -->
    <header
      class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 shrink-0"
    >
      <div>
        <h1 class="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
          Visão Geral
        </h1>
        <p class="text-sm text-neutral-500 dark:text-neutral-500 mt-1">
          Acompanhe o desempenho da Qbombom.
        </p>
      </div>

      <div class="flex items-center gap-3">
      <!-- Botão ocultar valores -->
      <button
        @click="valoresVisiveis = !valoresVisiveis"
        class="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-100 transition-colors text-sm font-medium shadow-sm"
        :title="valoresVisiveis ? 'Ocultar valores' : 'Mostrar valores'"
      >
        <EyeOff v-if="valoresVisiveis" class="w-4 h-4" />
        <Eye v-else class="w-4 h-4" />
      </button>

      <!-- Filtro -->
      <div
        class="flex bg-white dark:bg-neutral-900 rounded-lg shadow-sm dark:shadow-none border border-neutral-200 dark:border-neutral-800 p-1"
      >
        <button
          @click="changePeriod('today')"
          :class="
            period === 'today'
              ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 dark:text-neutral-100'
          "
          class="px-4 py-1.5 text-sm font-semibold rounded-md transition-colors"
        >
          Hoje
        </button>
        <button
          @click="changePeriod('3days')"
          :class="
            period === '3days'
              ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 dark:text-neutral-100'
          "
          class="px-4 py-1.5 text-sm font-medium rounded-md transition-colors"
        >
          3 Dias
        </button>
        <button
          @click="changePeriod('week')"
          :class="
            period === 'week'
              ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 dark:text-neutral-100'
          "
          class="px-4 py-1.5 text-sm font-medium rounded-md transition-colors"
        >
          7 Dias
        </button>
        <button
          @click="changePeriod('year')"
          :class="
            period === 'year'
              ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 dark:text-neutral-100'
          "
          class="px-4 py-1.5 text-sm font-medium rounded-md transition-colors"
        >
          Ano
        </button>
      </div>
      </div>
    </header>

    <div v-if="loading" class="flex flex-1 items-center justify-center">
      <div
        class="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin"
      ></div>
    </div>

    <template v-else>
      <!-- Grid KPIs -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 shrink-0">
        <!-- Card Faturamento -->
        <div
          class="bg-white dark:bg-neutral-900 p-6 rounded-2xl shadow-xl dark:shadow-none shadow-red-900/5 border border-neutral-100 dark:border-neutral-800/50 flex flex-col"
        >
          <div class="flex justify-between items-start mb-4">
            <div
              class="w-10 h-10 bg-neutral-50 dark:bg-neutral-950 rounded-lg flex items-center justify-center text-neutral-600 dark:text-neutral-400 border border-neutral-100 dark:border-neutral-800/50"
            >
              <DollarSign class="w-5 h-5" />
            </div>
          </div>
          <h3 class="text-sm font-medium text-neutral-500 dark:text-neutral-500 mb-1">
            Faturamento
          </h3>
          <p class="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
            <span v-if="valoresVisiveis">{{ formatarMoeda(metrics.revenue) }}</span>
            <span v-else class="tracking-widest text-neutral-400 dark:text-neutral-600">••••••</span>
          </p>
        </div>

        <!-- Card Pedidos -->
        <div
          class="bg-white dark:bg-neutral-900 p-6 rounded-2xl shadow-xl dark:shadow-none shadow-red-900/5 border border-neutral-100 dark:border-neutral-800/50 flex flex-col"
        >
          <div class="flex justify-between items-start mb-4">
            <div
              class="w-10 h-10 bg-neutral-50 dark:bg-neutral-950 rounded-lg flex items-center justify-center text-neutral-600 dark:text-neutral-400 border border-neutral-100 dark:border-neutral-800/50"
            >
              <ShoppingBag class="w-5 h-5" />
            </div>
          </div>
          <h3 class="text-sm font-medium text-neutral-500 dark:text-neutral-500 mb-1">
            Total de Pedidos
          </h3>
          <p class="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
            {{ metrics.totalOrders }}
          </p>
        </div>

        <!-- Card Ticket Médio -->
        <div
          class="bg-white dark:bg-neutral-900 p-6 rounded-2xl shadow-xl dark:shadow-none shadow-red-900/5 border border-neutral-100 dark:border-neutral-800/50 flex flex-col"
        >
          <div class="flex justify-between items-start mb-4">
            <div
              class="w-10 h-10 bg-neutral-50 dark:bg-neutral-950 rounded-lg flex items-center justify-center text-neutral-600 dark:text-neutral-400 border border-neutral-100 dark:border-neutral-800/50"
            >
              <Receipt class="w-5 h-5" />
            </div>
          </div>
          <h3 class="text-sm font-medium text-neutral-500 dark:text-neutral-500 mb-1">
            Ticket Médio
          </h3>
          <p class="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
            <span v-if="valoresVisiveis">{{ formatarMoeda(metrics.averageTicket) }}</span>
            <span v-else class="tracking-widest text-neutral-400 dark:text-neutral-600">••••••</span>
          </p>
        </div>

        <!-- Card Cancelamentos -->
        <div
          class="bg-white dark:bg-neutral-900 p-6 rounded-2xl shadow-xl dark:shadow-none shadow-red-900/5 border border-neutral-100 dark:border-neutral-800/50 flex flex-col"
        >
          <div class="flex justify-between items-start mb-4">
            <div
              class="w-10 h-10 bg-neutral-50 dark:bg-neutral-950 rounded-lg flex items-center justify-center text-neutral-600 dark:text-neutral-400 border border-neutral-100 dark:border-neutral-800/50"
            >
              <TrendingDown class="w-5 h-5" />
            </div>
          </div>
          <h3 class="text-sm font-medium text-neutral-500 dark:text-neutral-500 mb-1">
            Cancelamentos
          </h3>
          <p class="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
            {{ metrics.cancellations }}
          </p>
          <p class="text-xs text-neutral-500 dark:text-neutral-500 mt-1">{{ metrics.cancellationRate }}% do total</p>
        </div>
      </div>

      <!-- Operação ao Vivo -->
      <div
        class="bg-white dark:bg-neutral-900 p-5 rounded-2xl shadow-xl dark:shadow-none shadow-red-900/5 border border-neutral-100 dark:border-neutral-800/50 mb-6 shrink-0"
      >
        <div class="flex items-center justify-between gap-3 mb-4">
          <div class="flex items-center gap-2">
            <Activity class="w-4 h-4 text-red-600" />
            <h2 class="text-base font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
              Operação ao Vivo
            </h2>
          </div>
          <span
            class="px-2.5 py-1 rounded-md text-xs font-medium bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-500/20"
          >
            Tempo Real
          </span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div class="flex items-center justify-between rounded-xl border border-orange-100 dark:border-orange-500/20 bg-orange-50/60 dark:bg-orange-500/10 px-3 py-2">
            <div class="flex items-center gap-2 min-w-0">
              <span class="w-2 h-2 rounded-full bg-orange-500 shrink-0"></span>
              <span class="text-sm font-medium text-neutral-700 dark:text-neutral-300 truncate">Aguardando PIX</span>
            </div>
            <span class="px-2 py-0.5 rounded-md text-xs font-bold bg-white dark:bg-neutral-950 text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-500/20">
              {{ activeOrders.aguardando_pagamento || 0 }}
            </span>
          </div>

          <div class="flex items-center justify-between rounded-xl border border-red-100 dark:border-red-500/20 bg-red-50/60 dark:bg-red-500/10 px-3 py-2">
            <div class="flex items-center gap-2 min-w-0">
              <span class="w-2 h-2 rounded-full bg-red-500 shrink-0" :class="(activeOrders.novo || 0) > 0 ? 'animate-pulse' : ''"></span>
              <span class="text-sm font-medium text-neutral-700 dark:text-neutral-300 truncate">Novos</span>
            </div>
            <span class="px-2 py-0.5 rounded-md text-xs font-bold bg-white dark:bg-neutral-950 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-500/20">
              {{ activeOrders.novo || 0 }}
            </span>
          </div>

          <div class="flex items-center justify-between rounded-xl border border-yellow-100 dark:border-yellow-500/20 bg-yellow-50/60 dark:bg-yellow-500/10 px-3 py-2">
            <div class="flex items-center gap-2 min-w-0">
              <span class="w-2 h-2 rounded-full bg-yellow-500 shrink-0"></span>
              <span class="text-sm font-medium text-neutral-700 dark:text-neutral-300 truncate">Em Preparo</span>
            </div>
            <span class="px-2 py-0.5 rounded-md text-xs font-bold bg-white dark:bg-neutral-950 text-yellow-700 dark:text-yellow-400 border border-yellow-100 dark:border-yellow-500/20">
              {{ activeOrders.em_preparo || 0 }}
            </span>
          </div>

          <div class="flex items-center justify-between rounded-xl border border-green-100 dark:border-green-500/20 bg-green-50/60 dark:bg-green-500/10 px-3 py-2">
            <div class="flex items-center gap-2 min-w-0">
              <span class="w-2 h-2 rounded-full bg-green-500 shrink-0"></span>
              <span class="text-sm font-medium text-neutral-700 dark:text-neutral-300 truncate">Prontos</span>
            </div>
            <span class="px-2 py-0.5 rounded-md text-xs font-bold bg-white dark:bg-neutral-950 text-green-700 dark:text-green-400 border border-green-100 dark:border-green-500/20">
              {{ activeOrders.pronto || 0 }}
            </span>
          </div>

          <div class="flex items-center justify-between rounded-xl border border-violet-100 dark:border-violet-500/20 bg-violet-50/60 dark:bg-violet-500/10 px-3 py-2">
            <div class="flex items-center gap-2 min-w-0">
              <span class="w-2 h-2 rounded-full bg-violet-500 shrink-0"></span>
              <span class="text-sm font-medium text-neutral-700 dark:text-neutral-300 truncate">Em Rota</span>
            </div>
            <span class="px-2 py-0.5 rounded-md text-xs font-bold bg-white dark:bg-neutral-950 text-violet-700 dark:text-violet-400 border border-violet-100 dark:border-violet-500/20">
              {{ activeOrders.em_rota || 0 }}
            </span>
          </div>
        </div>
      </div>

      <!-- Pagamentos e Tipos -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 shrink-0">
        <div
          class="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl dark:shadow-none shadow-red-900/5 border border-neutral-100 dark:border-neutral-800/50 overflow-hidden"
        >
          <div class="px-6 py-5 border-b border-neutral-100 dark:border-neutral-800/50 flex items-center gap-2">
            <CreditCard class="w-4 h-4 text-red-600" />
            <h2 class="text-base font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
              Formas de Pagamento
            </h2>
          </div>

          <div class="p-6">
            <div v-if="paymentMethods.length === 0" class="text-sm text-neutral-500 dark:text-neutral-500">
              Nenhum dado no período.
            </div>
            <ul v-else class="space-y-4">
              <li v-for="item in paymentMethods" :key="item.method" class="space-y-1.5">
                <div class="flex items-center justify-between gap-3 text-sm">
                  <span class="font-medium text-neutral-900 dark:text-neutral-100">{{ item.method }}</span>
                  <span class="text-neutral-500 dark:text-neutral-400">
                    {{ item.count }} •
                    <span v-if="valoresVisiveis">{{ formatarMoeda(item.revenue) }}</span>
                    <span v-else class="tracking-widest text-neutral-400 dark:text-neutral-600">•••••</span>
                  </span>
                </div>
                <div class="h-2 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                  <div
                    class="h-full bg-red-500 dark:bg-red-400 rounded-full transition-all"
                    :style="{ width: `${paymentBarWidth(item.count)}%` }"
                  ></div>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div
          class="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl dark:shadow-none shadow-red-900/5 border border-neutral-100 dark:border-neutral-800/50 overflow-hidden"
        >
          <div class="px-6 py-5 border-b border-neutral-100 dark:border-neutral-800/50 flex items-center gap-2">
            <Utensils class="w-4 h-4 text-red-600" />
            <h2 class="text-base font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
              Tipos de Pedido
            </h2>
          </div>

          <div class="p-6">
            <div v-if="orderTypes.length === 0" class="text-sm text-neutral-500 dark:text-neutral-500">
              Nenhum dado no período.
            </div>
            <ul v-else class="space-y-4">
              <li v-for="item in orderTypes" :key="item.type" class="space-y-1.5">
                <div class="flex items-center justify-between gap-3 text-sm">
                  <span class="font-medium text-neutral-900 dark:text-neutral-100">{{ item.type }}</span>
                  <span class="text-neutral-500 dark:text-neutral-400">{{ item.count }}</span>
                </div>
                <div class="h-2 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                  <div
                    class="h-full bg-neutral-700 dark:bg-neutral-300 rounded-full transition-all"
                    :style="{ width: `${orderTypeBarWidth(item.count)}%` }"
                  ></div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        <!-- Tabela Pedidos -->
        <div
          class="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-2xl shadow-xl dark:shadow-none shadow-red-900/5 border border-neutral-100 dark:border-neutral-800/50 flex flex-col overflow-hidden"
        >
          <div
            class="px-6 py-5 border-b border-neutral-100 dark:border-neutral-800/50 flex justify-between items-center"
          >
            <h2 class="text-base font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
              Pedidos Recentes
            </h2>
            <RouterLink
              to="/app/pedidos"
              class="text-sm font-medium text-red-600 hover:text-red-700 hover:underline transition-colors"
              >Ver Todos</RouterLink
            >
          </div>

          <div class="flex-1 overflow-y-auto">
            <table class="w-full text-left text-sm whitespace-nowrap">
              <thead
                class="bg-neutral-50/50 dark:bg-neutral-800/30 text-neutral-500 dark:text-neutral-400 font-medium sticky top-0"
              >
                <tr>
                  <th
                    class="px-6 py-3 border-b border-neutral-100 dark:border-neutral-800/50 font-medium"
                  >
                    Pedido
                  </th>
                  <th
                    class="px-6 py-3 border-b border-neutral-100 dark:border-neutral-800/50 font-medium"
                  >
                    Cliente/Origem
                  </th>
                  <th
                    class="px-6 py-3 border-b border-neutral-100 dark:border-neutral-800/50 font-medium"
                  >
                    Status
                  </th>
                  <th
                    class="px-6 py-3 border-b border-neutral-100 dark:border-neutral-800/50 font-medium"
                  >
                    Valor
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800/50">
                <tr v-if="recentOrders.length === 0">
                  <td
                    colspan="4"
                    class="px-6 py-8 text-center text-neutral-500 dark:text-neutral-500"
                  >
                    <div class="flex flex-col items-center gap-2">
                      <ClipboardList class="w-8 h-8 opacity-50" />
                      Nenhum pedido recente.
                    </div>
                  </td>
                </tr>
                <tr
                  v-for="order in recentOrders"
                  :key="order.id"
                  class="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors"
                >
                  <td class="px-6 py-4 font-medium text-neutral-900 dark:text-neutral-100">
                    #{{ order.trackingCode || order.id }}
                  </td>
                  <td class="px-6 py-4 text-neutral-600 dark:text-neutral-400">
                    <div>{{ order.customerName || 'Cliente' }}</div>
                    <div class="text-xs text-neutral-400 mt-0.5">{{ order.type }}</div>
                  </td>
                  <td class="px-6 py-4">
                    <span
                      class="px-2.5 py-1 rounded-md text-xs font-medium border"
                      :class="statusClass(order.status)"
                    >
                      {{ statusLabel(order.status) }}
                    </span>
                  </td>
                  <td class="px-6 py-4 font-medium text-neutral-900 dark:text-neutral-100">
                    <span v-if="valoresVisiveis">{{ formatarMoeda(order.total) }}</span>
                    <span v-else class="tracking-widest text-neutral-400 dark:text-neutral-600">•••••</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Top Produtos -->
        <div
          class="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl dark:shadow-none shadow-red-900/5 border border-neutral-100 dark:border-neutral-800/50 flex flex-col overflow-hidden"
        >
          <div class="px-6 py-5 border-b border-neutral-100 dark:border-neutral-800/50">
            <h2 class="text-base font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
              Top Produtos
            </h2>
          </div>

          <div class="flex-1 overflow-y-auto p-6">
            <div
              v-if="topProducts.length === 0"
              class="text-center text-neutral-500 dark:text-neutral-500 py-4 text-sm"
            >
              Nenhum produto vendido neste período.
            </div>
            <ul v-else class="space-y-4">
              <li v-for="(prod, idx) in topProducts" :key="prod.id" class="flex items-center gap-4">
                <div
                  class="w-8 h-8 rounded-lg flex items-center justify-center font-medium text-xs border shrink-0"
                  :class="
                    idx === 0
                      ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-500 border-red-100 dark:border-red-500/20'
                      : 'bg-neutral-50 dark:bg-neutral-950 text-neutral-600 dark:text-neutral-400 border-neutral-100 dark:border-neutral-800/50'
                  "
                >
                  {{ idx + 1 }}º
                </div>
                <div class="flex-1 min-w-0">
                  <h4 class="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                    {{ prod.name || 'Produto Excluído' }}
                  </h4>
                  <p class="text-xs text-neutral-500 dark:text-neutral-500">
                    {{ prod.quantity }} vendas
                  </p>
                </div>
                <div class="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  <span v-if="valoresVisiveis">{{ formatarMoeda(prod.revenue) }}</span>
                  <span v-else class="tracking-widest text-neutral-400 dark:text-neutral-600">•••••</span>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { DollarSign, ShoppingBag, Receipt, ClipboardList, TrendingDown, Activity, CreditCard, Utensils, Eye, EyeOff } from 'lucide-vue-next'
import { DashboardService } from '@/services/http'
import { useToastStore } from '@/stores/toast'
import { formatarMoeda } from '@/utils/formatters'
import { useOrderStatus } from '@/composables/useOrderStatus'

const toast = useToastStore()
const loading = ref(true)
const period = ref('today')
const valoresVisiveis = ref(false)

const metrics = ref({
  revenue: 0,
  totalOrders: 0,
  averageTicket: 0,
  cancellations: 0,
  cancellationRate: 0,
})
const recentOrders = ref([])
const topProducts = ref([])
const activeOrders = ref({})
const paymentMethods = ref([])
const orderTypes = ref([])

const loadDashboard = async () => {
  loading.value = true
  try {
    const res = await DashboardService.getMetrics(period.value)
    metrics.value = res.data.metrics
    recentOrders.value = res.data.recentOrders
    topProducts.value = res.data.topProducts
    activeOrders.value = res.data.activeOrders || {}
    paymentMethods.value = res.data.paymentMethods || []
    orderTypes.value = res.data.orderTypes || []
  } catch (error) {
    console.error(error)
    toast.error('Erro ao carregar dados do dashboard.')
  } finally {
    loading.value = false
  }
}

const changePeriod = (newPeriod) => {
  period.value = newPeriod
  loadDashboard()
}

const { statusLabel, statusClass } = useOrderStatus()

const paymentBarWidth = (count) => {
  const max = Math.max(...paymentMethods.value.map((item) => Number(item.count) || 0), 0)
  if (max <= 0) return 0
  return Math.round(((Number(count) || 0) / max) * 100)
}

const orderTypeBarWidth = (count) => {
  const max = Math.max(...orderTypes.value.map((item) => Number(item.count) || 0), 0)
  if (max <= 0) return 0
  return Math.round(((Number(count) || 0) / max) * 100)
}

onMounted(loadDashboard)
</script>
