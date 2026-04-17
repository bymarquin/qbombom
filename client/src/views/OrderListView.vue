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
          class="flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg text-sm font-semibold hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors shadow-sm"
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
            <div v-if="colNovos.length === 0" class="text-center py-10 text-sm text-neutral-400">
              Nenhum pedido novo.
            </div>

            <div
              v-for="order in colNovos"
              :key="order.id"
              class="bg-white dark:bg-neutral-900 p-4 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800 transition-all hover:shadow-md cursor-pointer group"
              @click="openModal(order)"
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
                    @click="openModal(order)"
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
            <div v-if="colPreparo.length === 0" class="text-center py-10 text-sm text-neutral-400">
              Nenhum pedido na cozinha.
            </div>

            <div
              v-for="order in colPreparo"
              :key="order.id"
              class="bg-white dark:bg-neutral-900 p-4 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800 transition-all hover:shadow-md cursor-pointer group"
              @click="openModal(order)"
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
            <div v-if="colPronto.length === 0" class="text-center py-10 text-sm text-neutral-400">
              Nenhum pedido aguardando despacho.
            </div>

            <div
              v-for="order in colPronto"
              :key="order.id"
              class="bg-white dark:bg-neutral-900 p-4 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800 transition-all hover:shadow-md cursor-pointer group"
              @click="openModal(order)"
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

    <!-- MODAL DETALHES COMPLETO -->
    <div
      v-if="showModal && selectedOrder"
      class="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <div
        class="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-lg shadow-2xl border border-neutral-100 dark:border-neutral-800/50 overflow-hidden max-h-[90vh] flex flex-col transform transition-all"
      >
        <div
          class="px-8 py-6 border-b border-neutral-100 dark:border-neutral-800/50 flex justify-between items-center shrink-0 bg-neutral-50 dark:bg-neutral-950/50"
        >
          <h3 class="text-xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
            Pedido #{{ selectedOrder.trackingCode || selectedOrder.id.slice(0, 8) }}
          </h3>
          <button
            @click="closeModal"
            class="text-neutral-400 hover:text-neutral-600 dark:text-neutral-400 transition-colors rounded-full p-1 hover:bg-neutral-200 dark:bg-neutral-700"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <div class="p-8 overflow-y-auto flex-1">
          <!-- Receipt Viewer Button -->
          <div
            v-if="selectedOrder.paymentMethod === 'PIX' && selectedOrder.receiptUrl"
            class="mb-6 p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30 rounded-xl flex items-center justify-between"
          >
            <div>
              <p class="text-sm font-bold text-blue-800 dark:text-blue-300">
                Comprovante de Pagamento
              </p>
              <p class="text-xs text-blue-600 dark:text-blue-400">
                O cliente enviou um comprovante de PIX.
              </p>
            </div>
            <div class="flex gap-2">
              <a
                :href="getReceiptUrl(selectedOrder.receiptUrl)"
                target="_blank"
                class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition"
                >Ver Foto</a
              >
              <button
                v-if="selectedOrder.paymentStatus === 'pendente'"
                @click="confirmPaymentModal"
                class="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition"
              >
                Confirmar
              </button>
            </div>
          </div>

          <div class="mb-6 grid grid-cols-2 gap-4">
            <div>
              <p class="text-xs text-neutral-500 dark:text-neutral-500 font-medium">Cliente</p>
              <p class="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                {{ selectedOrder.customerName || "Cliente Balcão" }}
              </p>
            </div>
            <div>
              <p class="text-xs text-neutral-500 dark:text-neutral-500 font-medium">Telefone</p>
              <p class="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                {{ selectedOrder.customerPhone || "Não informado" }}
              </p>
            </div>
            <div>
              <p class="text-xs text-neutral-500 dark:text-neutral-500 font-medium">Tipo</p>
              <p class="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                {{ selectedOrder.type }}
              </p>
            </div>
            <div>
              <p class="text-xs text-neutral-500 dark:text-neutral-500 font-medium">
                Status do Pagamento
              </p>
              <p class="text-sm font-semibold text-neutral-900 dark:text-neutral-100 capitalize">
                {{ selectedOrder.paymentStatus }} ({{ selectedOrder.paymentMethod }})
              </p>
            </div>
            <div v-if="selectedOrder.type === 'Entrega'" class="col-span-2">
              <p class="text-xs text-neutral-500 dark:text-neutral-500 font-medium">
                Endereço de Entrega
              </p>
              <p class="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                {{ selectedOrder.deliveryAddress || "Não informado" }}
              </p>
            </div>
          </div>

          <div
            v-if="selectedOrder.observation"
            class="mb-6 bg-orange-50 p-3 rounded-lg border border-orange-100"
          >
            <p class="text-xs text-orange-800 font-medium mb-1">Observação do Pedido:</p>
            <p class="text-sm text-orange-900">{{ selectedOrder.observation }}</p>
          </div>

          <h4
            class="text-sm font-bold text-neutral-900 dark:text-neutral-100 mb-3 border-b border-neutral-100 dark:border-neutral-800/50 pb-2"
          >
            Itens
          </h4>

          <div v-if="loadingItems" class="flex justify-center py-4">
            <div
              class="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin"
            ></div>
          </div>

          <ul v-else class="space-y-3 mb-6">
            <li
              v-for="item in selectedOrder.items"
              :key="item.id"
              class="flex justify-between items-start text-sm"
            >
              <div class="flex-1">
                <span class="font-medium text-neutral-900 dark:text-neutral-100"
                  >{{ item.quantity }}x {{ item.product?.name || "Produto" }}
                  {{ item.variation?.name ? `- ${item.variation.name}` : "" }}</span
                >
                <p
                  v-if="item.observation"
                  class="text-xs text-neutral-500 dark:text-neutral-500 mt-0.5"
                >
                  Obs: {{ item.observation }}
                </p>
                <div
                  v-if="item.selectedAdditionals && item.selectedAdditionals.length > 0"
                  class="mt-1 text-xs text-neutral-500 dark:text-neutral-500"
                >
                  + {{ item.selectedAdditionals.map((a) => a.name).join(", ") }}
                </div>
              </div>
              <span class="font-medium text-neutral-900 dark:text-neutral-100 ml-4">{{
                formatMoney(item.totalPrice)
              }}</span>
            </li>
          </ul>

          <div
            class="flex justify-between items-center border-t border-neutral-100 dark:border-neutral-800/50 pt-4"
          >
            <span class="font-medium text-neutral-500 dark:text-neutral-500">Total</span>
            <span class="text-lg font-bold text-red-600">{{
              formatMoney(selectedOrder.total)
            }}</span>
          </div>
        </div>

        <div
          class="p-6 bg-neutral-50 dark:bg-neutral-950/80 border-t border-neutral-100 dark:border-neutral-800/50 shrink-0 flex flex-col gap-3"
        >
          <button
            @click="printOrderFromModal"
            class="w-full flex items-center justify-center gap-2 py-3 bg-red-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-red-700 active:scale-95 transition-all"
          >
            <Printer class="w-5 h-5" />
            Imprimir Comanda
          </button>

          <!-- Controles completos de status: apenas MANAGER e SUPER_ADMIN -->
          <template v-if="userRole === 'SUPER_ADMIN' || userRole === 'MANAGER'">
            <label
              class="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider mt-2"
              >Alterar Status do Pedido:</label
            >
            <div class="grid grid-cols-2 gap-2 sm:grid-cols-5">
              <button
                @click="updateStatusForOrder(selectedOrder, 'novo')"
                :class="
                  selectedOrder.status === 'novo'
                    ? 'bg-blue-600 text-white ring-2 ring-offset-2 ring-blue-600/30'
                    : 'bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 dark:bg-neutral-950'
                "
                class="px-2 py-2 rounded-lg text-xs font-medium transition-all shadow-sm dark:shadow-none"
              >
                Novo
              </button>
              <button
                @click="updateStatusForOrder(selectedOrder, 'em_preparo')"
                :class="
                  selectedOrder.status === 'em_preparo'
                    ? 'bg-yellow-500 text-white ring-2 ring-offset-2 ring-yellow-500/30'
                    : 'bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 dark:bg-neutral-950'
                "
                class="px-2 py-2 rounded-lg text-xs font-medium transition-all shadow-sm dark:shadow-none"
              >
                Preparo
              </button>
              <button
                @click="updateStatusForOrder(selectedOrder, 'pronto')"
                :class="
                  selectedOrder.status === 'pronto'
                    ? 'bg-green-600 text-white ring-2 ring-offset-2 ring-green-600/30'
                    : 'bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 dark:bg-neutral-950'
                "
                class="px-2 py-2 rounded-lg text-xs font-medium transition-all shadow-sm dark:shadow-none"
              >
                Pronto
              </button>
              <button
                @click="updateStatusForOrder(selectedOrder, 'entregue')"
                :class="
                  selectedOrder.status === 'entregue'
                    ? 'bg-neutral-800 text-white ring-2 ring-offset-2 ring-neutral-800/30'
                    : 'bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 dark:bg-neutral-950'
                "
                class="px-2 py-2 rounded-lg text-xs font-medium transition-all shadow-sm dark:shadow-none"
              >
                Finalizado
              </button>
              <button
                @click="updateStatusForOrder(selectedOrder, 'cancelado')"
                :class="
                  selectedOrder.status === 'cancelado'
                    ? 'bg-red-600 text-white ring-2 ring-offset-2 ring-red-600/30'
                    : 'bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 dark:bg-neutral-950'
                "
                class="px-2 py-2 rounded-lg text-xs font-medium transition-all shadow-sm dark:shadow-none"
              >
                Cancelar
              </button>
            </div>
          </template>

          <!-- Cancelamento restrito: apenas CASHIER -->
          <template v-else-if="userRole === 'CASHIER'">
            <label
              class="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider mt-2"
              >Ações:</label
            >
            <button
              @click="cancelOrderFromModal(selectedOrder)"
              :disabled="selectedOrder.status === 'cancelado' || selectedOrder.status === 'finalizado' || selectedOrder.status === 'entregue'"
              class="w-full py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              :class="
                selectedOrder.status === 'cancelado'
                  ? 'bg-red-600 text-white'
                  : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/40'
              "
            >
              {{ selectedOrder.status === 'cancelado' ? 'Pedido Cancelado' : 'Cancelar Pedido' }}
            </button>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, shallowRef, onMounted, computed } from "vue";
import { Printer, CheckCircle2, Package, Check, RefreshCw, X } from "lucide-vue-next";
import { OrderService, AuthService } from "@/services/http";
import { useToastStore } from "@/stores/toast";
import { useOrderSocket } from "@/composables/useOrderSocket";
import { useOrderStatus } from "@/composables/useOrderStatus";
import { formatarMoeda } from "@/utils/formatters";
import { printReceipt } from "@/utils/printReceipt";

const userRole = AuthService.getRole();

const toast = useToastStore();
const orders = shallowRef([]);
const loadingData = ref(false);

const showModal = ref(false);
const selectedOrder = ref(null);
const loadingItems = ref(false);

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

    if (selectedOrder.value?.id === updated.id || selectedOrder.value?.trackingCode === updated.trackingCode) {
      Object.assign(selectedOrder.value, updated);
    }

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

    // Update selected order data if modal is open
    if (selectedOrder.value && !loadingItems.value) {
      const updated = orders.value.find((o) => o.id === selectedOrder.value.id);
      if (updated) {
        selectedOrder.value = { ...updated, items: selectedOrder.value.items };
      }
    }
  } catch (error) {
    console.error("Falha ao buscar pedidos", error);
  } finally {
    loadingData.value = false;
  }
};

useOrderSocket({ onCreated: onOrderCreated, onUpdated: onOrderUpdated });

const { statusLabel, statusClass } = useOrderStatus();

onMounted(loadData);

// Columns Computed Properties
const colNovos = computed(() => {
  return orders.value.filter((o) => ["novo", "aguardando_pagamento"].includes(o.status));
});

const colPreparo = computed(() => {
  return orders.value.filter((o) => o.status === "em_preparo");
});

const colPronto = computed(() => {
  return orders.value.filter((o) => ["pronto", "em_rota"].includes(o.status));
});

// Modal Logic
const openModal = async (order) => {
  selectedOrder.value = { ...order, items: [] };
  showModal.value = true;
  loadingItems.value = true;

  try {
    const res = await OrderService.getOrder(order.id);
    selectedOrder.value = res.data;
  } catch (error) {
    toast.error("Erro ao carregar detalhes do pedido");
    console.error(error);
  } finally {
    loadingItems.value = false;
  }
};

const closeModal = () => {
  showModal.value = false;
  selectedOrder.value = null;
};

// Actions
const confirmPaymentModal = async () => {
  if (!selectedOrder.value) return;
  try {
    await OrderService.updateOrderStatus(selectedOrder.value.id, undefined, "pago");
    selectedOrder.value.paymentStatus = "pago";

    const idx = orders.value.findIndex((o) => o.id === selectedOrder.value.id);
    if (idx !== -1) {
      const newOrders = [...orders.value];
      newOrders[idx] = { ...newOrders[idx], paymentStatus: "pago" };
      orders.value = newOrders;
    }

    if (selectedOrder.value.status === "aguardando_pagamento") {
      await updateStatusForOrder(selectedOrder.value, "novo");
    }
  } catch (err) {
    console.error(err);
  }
};

const cancelOrderFromModal = async (order) => {
  if (!order || order.status === 'cancelado') return;
  try {
    await OrderService.cancelOrder(order.id);
    toast.success(`Pedido #${order.trackingCode || order.id.slice(0, 8)} cancelado.`);

    const idx = orders.value.findIndex((o) => o.id === order.id);
    if (idx !== -1) {
      const newOrders = [...orders.value];
      newOrders[idx] = { ...newOrders[idx], status: 'cancelado' };
      orders.value = newOrders;
    }
    if (selectedOrder.value && selectedOrder.value.id === order.id) {
      selectedOrder.value.status = 'cancelado';
    }
  } catch (error) {
    toast.error("Erro ao cancelar pedido");
    console.error(error);
  }
};

const updateStatusForOrder = async (order, newStatus) => {
  if (!order || order.status === newStatus) return;

  try {
    await OrderService.updateOrderStatus(order.id, newStatus);
    toast.success(
      `Pedido #${order.trackingCode || order.id.slice(0, 8)} atualizado para: ${statusLabel(newStatus)}`,
    );

    // Atualiza na listagem principal de forma imutável
    const idx = orders.value.findIndex((o) => o.id === order.id);
    if (idx !== -1) {
      const newOrders = [...orders.value];
      newOrders[idx] = { ...newOrders[idx], status: newStatus };
      orders.value = newOrders;
    }

    // Atualiza no modal se estiver aberto
    if (selectedOrder.value && selectedOrder.value.id === order.id) {
      selectedOrder.value.status = newStatus;
    }
  } catch (error) {
    toast.error("Erro ao atualizar status");
    console.error(error);
  }
};
// Reusable Print Function
const executePrint = async (order) => {
  // We need full items to print correctly. If calling from quick action, we might need to fetch them.
  let fullOrder = order;
  if (!fullOrder.items || fullOrder.items.length === 0) {
    try {
      const res = await OrderService.getOrder(order.id);
      fullOrder = res.data;
    } catch {
      console.error("Failed to fetch items for printing");
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

const printOrderFromModal = async () => {
  if (!selectedOrder.value) return;
  await printAndMoveToPrep(selectedOrder.value);
  closeModal(); // Optional: close modal after printing
};

// Helpers
const getReceiptUrl = (url) => {
  if (!url) return "#";
  if (url.startsWith("http")) return url;
  const baseUrl =
    import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:3006/api" : "/api");
  const host = baseUrl.replace("/api", "");
  return `${host}${url}`;
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
/* Hide scrollbar for columns */
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
