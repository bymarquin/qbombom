<template>
  <div class="h-full flex flex-col font-sans">
    <header class="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4 shrink-0">
      <div>
        <h1 class="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-1 tracking-tight">
          Painel de Pedidos
        </h1>
        <p class="text-sm text-neutral-500 dark:text-neutral-500">
          Gerencie e acompanhe o fluxo de pedidos da loja em tempo real.
        </p>
      </div>
      <div class="flex gap-2">
        <button
          @click="loadData"
          class="flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg text-sm font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors shadow-sm"
        >
          <RefreshCw class="w-4 h-4" :class="loadingData ? 'animate-spin' : ''" />
          Atualizar
        </button>
      </div>
    </header>

    <!-- KANBAN BOARD -->
    <div class="flex-1 overflow-x-auto overflow-y-hidden pb-4">
      <div class="flex h-full gap-4 min-w-full items-start">
        <!-- Coluna 1: Novos & Pendentes -->
        <div
          class="flex flex-col flex-1 min-w-[300px] max-h-full bg-neutral-100/50 dark:bg-neutral-900/50 rounded-2xl border border-neutral-200/50 dark:border-neutral-800/50 p-4"
        >
          <div class="flex items-center justify-between mb-4 px-1 shrink-0">
            <h2 class="font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
              <div class="w-2 h-2 rounded-full bg-blue-500"></div>
              Entrando
            </h2>
            <span
              class="bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-xs font-bold px-2 py-1 rounded-full"
            >
              {{ colNovos.length }}
            </span>
          </div>

          <div class="flex-1 overflow-y-auto no-scrollbar space-y-3 pr-1">
            <div v-if="colNovos.length === 0" class="flex flex-col items-center py-10 gap-2 text-sm text-neutral-400">
              <Inbox class="w-8 h-8 opacity-50" />
              Nenhum pedido novo.
            </div>

            <div
              v-for="order in colNovos"
              :key="order.id"
              class="bg-white dark:bg-neutral-900 p-4 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800 transition-all hover:shadow-md cursor-pointer group"
              @click="router.push({ name: 'pedido-detalhe', params: { id: order.id } })"
            >
              <div class="flex justify-between items-start mb-2">
                <span class="text-xs font-bold text-neutral-500"
                  >#{{ order.trackingCode || order.id.slice(0, 8) }}</span
                >
                <span class="text-xs font-medium text-neutral-400">{{
                  formatDateOnlyTime(order.createdAt)
                }}</span>
              </div>
              <h3 class="font-bold text-neutral-900 dark:text-neutral-100 truncate">
                {{ order.customerName || "Cliente Balcão" }}
              </h3>
              <p class="text-sm text-neutral-600 dark:text-neutral-400 mb-3">{{ order.type }}</p>

              <div class="flex items-center gap-2 mb-4">
                <span
                  class="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded text-xs font-semibold text-neutral-700 dark:text-neutral-300"
                >
                  {{ formatMoney(order.total) }}
                </span>
                <span
                  :class="
                    order.paymentStatus === 'pago'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                  "
                  class="px-2 py-1 rounded text-xs font-semibold"
                >
                  {{ order.paymentStatus === "pago" ? "Pago" : "Pendente" }} ({{
                    order.paymentMethod
                  }})
                </span>
              </div>

              <!-- Quick Actions -->
              <div class="flex flex-col gap-2" @click.stop>
                <div
                  v-if="order.status === 'aguardando_pagamento'"
                  class="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-900/50 rounded-lg p-2 flex flex-col gap-2"
                >
                  <span
                    class="text-xs font-bold text-orange-700 dark:text-orange-400 text-center uppercase tracking-wider animate-pulse"
                    >Aguardando PIX</span
                  >
                  <button
                    v-if="order.receiptUrl"
                    @click="router.push({ name: 'pedido-detalhe', params: { id: order.id } })"
                    class="w-full py-1.5 bg-orange-600 text-white rounded-md text-xs font-bold hover:bg-orange-700 transition"
                  >
                    Conferir Comprovante
                  </button>
                </div>

                <button
                  v-if="order.status === 'novo'"
                  @click="printAndMoveToPrep(order)"
                  class="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2"
                >
                  <Printer class="w-4 h-4" /> Imprimir e Preparar
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Coluna 2: Em Preparo -->
        <div
          class="flex flex-col flex-1 min-w-[300px] max-h-full bg-neutral-100/50 dark:bg-neutral-900/50 rounded-2xl border border-neutral-200/50 dark:border-neutral-800/50 p-4"
        >
          <div class="flex items-center justify-between mb-4 px-1 shrink-0">
            <h2 class="font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
              <div class="w-2 h-2 rounded-full bg-yellow-500"></div>
              Cozinha / Preparando
            </h2>
            <span
              class="bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-xs font-bold px-2 py-1 rounded-full"
            >
              {{ colPreparo.length }}
            </span>
          </div>

          <div class="flex-1 overflow-y-auto no-scrollbar space-y-3 pr-1">
            <div v-if="colPreparo.length === 0" class="flex flex-col items-center py-10 gap-2 text-sm text-neutral-400">
              <ChefHat class="w-8 h-8 opacity-50" />
              Nenhum pedido na cozinha.
            </div>

            <div
              v-for="order in colPreparo"
              :key="order.id"
              class="bg-white dark:bg-neutral-900 p-4 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800 transition-all hover:shadow-md cursor-pointer group"
              @click="router.push({ name: 'pedido-detalhe', params: { id: order.id } })"
            >
              <div class="flex justify-between items-start mb-2">
                <span class="text-xs font-bold text-neutral-500"
                  >#{{ order.trackingCode || order.id.slice(0, 8) }}</span
                >
                <span class="text-xs font-medium text-neutral-400">{{
                  formatDateOnlyTime(order.createdAt)
                }}</span>
              </div>
              <h3 class="font-bold text-neutral-900 dark:text-neutral-100 truncate">
                {{ order.customerName || "Cliente Balcão" }}
              </h3>
              <p class="text-sm text-neutral-600 dark:text-neutral-400 mb-3">{{ order.type }}</p>

              <div class="flex items-center gap-2 mb-4">
                <span
                  class="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded text-xs font-semibold text-neutral-700 dark:text-neutral-300"
                >
                  {{ formatMoney(order.total) }}
                </span>
                <span
                  v-if="order.paymentStatus === 'pendente'"
                  class="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-semibold"
                  >Pagar na Entrega</span
                >
              </div>

              <!-- Quick Actions -->
              <div class="flex flex-col gap-2" @click.stop>
                <button
                  @click="updateStatusForOrder(order, 'pronto')"
                  class="w-full py-2 bg-yellow-500 text-white rounded-lg text-sm font-bold hover:bg-yellow-600 transition flex items-center justify-center gap-2"
                >
                  <CheckCircle2 class="w-4 h-4" /> Marcar como Pronto
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Coluna 3: Prontos & Entrega -->
        <div
          class="flex flex-col flex-1 min-w-[300px] max-h-full bg-neutral-100/50 dark:bg-neutral-900/50 rounded-2xl border border-neutral-200/50 dark:border-neutral-800/50 p-4"
        >
          <div class="flex items-center justify-between mb-4 px-1 shrink-0">
            <h2 class="font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
              <div class="w-2 h-2 rounded-full bg-green-500"></div>
              Prontos / Entrega
            </h2>
            <span
              class="bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-xs font-bold px-2 py-1 rounded-full"
            >
              {{ colPronto.length }}
            </span>
          </div>

          <div class="flex-1 overflow-y-auto no-scrollbar space-y-3 pr-1">
            <div v-if="colPronto.length === 0" class="flex flex-col items-center py-10 gap-2 text-sm text-neutral-400">
              <Truck class="w-8 h-8 opacity-50" />
              Nenhum pedido aguardando despacho.
            </div>

            <div
              v-for="order in colPronto"
              :key="order.id"
              class="bg-white dark:bg-neutral-900 p-4 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800 transition-all hover:shadow-md cursor-pointer group"
              @click="router.push({ name: 'pedido-detalhe', params: { id: order.id } })"
            >
              <div class="flex justify-between items-start mb-2">
                <span class="text-xs font-bold text-neutral-500"
                  >#{{ order.trackingCode || order.id.slice(0, 8) }}</span
                >
                <span class="text-xs font-medium text-neutral-400">{{
                  formatDateOnlyTime(order.createdAt)
                }}</span>
              </div>
              <h3 class="font-bold text-neutral-900 dark:text-neutral-100 truncate">
                {{ order.customerName || "Cliente Balcão" }}
              </h3>
              <p
                class="text-sm font-semibold mb-3"
                :class="order.type === 'Entrega' ? 'text-indigo-600' : 'text-neutral-600'"
              >
                {{ order.type }}
                <span
                  v-if="order.type === 'Entrega' && order.deliveryAddress"
                  class="font-normal text-xs block truncate text-neutral-500"
                  >{{ order.deliveryAddress.split("-")[0] }}</span
                >
              </p>

              <!-- Quick Actions -->
              <div class="flex flex-col gap-2 mt-4" @click.stop>
                <button
                  v-if="order.type === 'Entrega' && order.status !== 'em_rota'"
                  @click="updateStatusForOrder(order, 'em_rota')"
                  class="w-full py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition flex items-center justify-center gap-2"
                >
                  <Package class="w-4 h-4" /> Saiu para Entrega
                </button>
                <button
                  @click="updateStatusForOrder(order, 'entregue')"
                  class="w-full py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 transition flex items-center justify-center gap-2"
                >
                  <Check class="w-4 h-4" /> Finalizar Pedido
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, shallowRef, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { Printer, CheckCircle2, Package, Check, RefreshCw, Inbox, ChefHat, Truck } from "lucide-vue-next";
import { OrderService } from "@/services/http";
import { useToastStore } from "@/stores/toast";
import { useOrderSocket } from "@/composables/useOrderSocket";
import { useOrderStatus } from "@/composables/useOrderStatus";
import { printReceipt } from "@/utils/printReceipt";

const router = useRouter();
const toast = useToastStore();
const orders = shallowRef([]);
const loadingData = ref(false);

function onOrderCreated(newOrder) {
  const exists = orders.value.some((o) => o.id === newOrder.id);
  if (!exists) {
    orders.value = [newOrder, ...orders.value];
    toast.success(`Novo pedido recebido: #${newOrder.trackingCode || newOrder.id.slice(0, 8)}`);
  }
}

function onOrderUpdated(updated) {
  const idx = orders.value.findIndex(
    (o) => o.id === updated.id || o.trackingCode === updated.trackingCode,
  );

  if (idx !== -1) {
    const newOrders = [...orders.value];
    newOrders[idx] = { ...newOrders[idx], ...updated };
    orders.value = newOrders;
    if (updated.message) toast.info(updated.message);
  } else {
    loadData();
  }
}

const loadData = async () => {
  loadingData.value = true;
  try {
    const res = await OrderService.getOrders();
    orders.value = res.data;
  } catch (error) {
    console.error("Falha ao buscar pedidos", error);
  } finally {
    loadingData.value = false;
  }
};

useOrderSocket({ onCreated: onOrderCreated, onUpdated: onOrderUpdated });

const { statusLabel } = useOrderStatus();

onMounted(loadData);

const colNovos = computed(() => {
  return orders.value.filter((o) => ["novo", "aguardando_pagamento"].includes(o.status));
});

const colPreparo = computed(() => {
  return orders.value.filter((o) => o.status === "em_preparo");
});

const colPronto = computed(() => {
  return orders.value.filter((o) => ["pronto", "em_rota"].includes(o.status));
});

const updateStatusForOrder = async (order, newStatus) => {
  if (!order || order.status === newStatus) return;

  try {
    await OrderService.updateOrderStatus(order.id, newStatus);
    toast.success(
      `Pedido #${order.trackingCode || order.id.slice(0, 8)} atualizado para: ${statusLabel(newStatus)}`,
    );

    const idx = orders.value.findIndex((o) => o.id === order.id);
    if (idx !== -1) {
      const newOrders = [...orders.value];
      newOrders[idx] = { ...newOrders[idx], status: newStatus };
      orders.value = newOrders;
    }
  } catch (error) {
    toast.error("Erro ao atualizar status");
    console.error(error);
  }
};

const executePrint = async (order) => {
  let fullOrder = order;
  if (!fullOrder.items || fullOrder.items.length === 0) {
    try {
      const res = await OrderService.getOrder(order.id);
      fullOrder = res.data;
    } catch {
      toast.error("Erro ao buscar itens para impressão.");
      return;
    }
  }
  await printReceipt(fullOrder);
};

const printAndMoveToPrep = async (order) => {
  await executePrint(order);
  await updateStatusForOrder(order, "em_preparo");
};

const formatMoney = (val) => {
  return Number(val).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

const formatDateOnlyTime = (dateString) => {
  if (!dateString) return "";
  const d = new Date(dateString);
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
};
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
