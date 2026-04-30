<template>
  <Transition name="fade">
    <div
      v-if="modelValue && pedidoRastreado"
      class="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
    >
      <Transition name="slide-up" appear>
        <div
          class="flex flex-col bg-neutral-50 dark:bg-neutral-950 w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-xl sm:rounded-2xl shadow-2xl overflow-hidden relative"
        >
          <header
            class="bg-white dark:bg-neutral-900 px-4 py-4 flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 shrink-0 sticky top-0 z-10 shadow-sm dark:shadow-none"
          >
            <h2 class="font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
              Status do Pedido
            </h2>
            <button
              @click="emit('update:modelValue', false)"
              class="text-sm font-medium text-neutral-500 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 dark:text-neutral-100 transition-colors"
            >
              Fechar
            </button>
          </header>

          <main class="flex-1 overflow-y-auto p-5 pb-32">
            <div
              v-if="pedidoRastreado.status === 'cancelado'"
              class="bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 mb-5 text-center"
            >
              <h4 class="font-bold text-neutral-900 dark:text-neutral-100 mb-1">
                Pedido cancelado
              </h4>
              <p class="text-sm text-neutral-600 dark:text-neutral-400">
                Seu pedido foi cancelado com sucesso.
              </p>
            </div>

            <div
              class="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl dark:shadow-none shadow-red-900/5 border border-neutral-100 dark:border-neutral-800/50 p-5 mb-5 relative overflow-hidden"
            >
              <!-- PIX Upload Section -->
              <div
                v-if="
                  pedidoRastreado.paymentMethod === 'PIX' &&
                  pedidoRastreado.paymentStatus === 'pendente'
                "
                class="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-xl p-5 mb-6 text-center shadow-sm"
              >
                <h4 class="font-bold text-red-700 dark:text-red-400 mb-2">Aguardando Pagamento</h4>

                <template v-if="pixPayload">
                  <p class="text-sm text-neutral-700 dark:text-neutral-300 mb-4">
                    Escaneie o QR Code abaixo ou copie a chave PIX Copia e Cola para pagar
                    <strong>{{ formatarMoeda(pedidoRastreado.total) }}</strong
                    >. A confirmação do pagamento é automática pelo Mercado Pago.
                  </p>

                  <!-- QR Code PIX -->
                  <div class="flex justify-center mb-4">
                    <div
                      class="bg-white p-3 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800"
                    >
                      <qrcode-vue :value="pixPayload" :size="180" level="M" />
                    </div>
                  </div>

                  <div
                    class="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg p-3 font-mono text-neutral-900 dark:text-neutral-100 text-sm mb-4 break-all flex flex-col gap-2"
                  >
                    <div class="text-left text-xs text-neutral-500 font-sans font-semibold">
                      PIX Copia e Cola
                    </div>
                    <div class="max-h-20 overflow-y-auto text-left text-xs">{{ pixPayload }}</div>
                    <button
                      @click="copiarChave"
                      class="mt-2 text-xs bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 font-bold px-3 py-2 rounded-md hover:bg-red-200 dark:hover:bg-red-900/60 transition flex items-center justify-center gap-1 w-full uppercase"
                    >
                      <Copy class="w-4 h-4" />
                      Copiar Código PIX
                    </button>
                  </div>
                </template>
                <template v-else>
                  <div class="py-8 flex flex-col items-center justify-center gap-3">
                    <div class="w-8 h-8 border-4 border-red-200 border-t-red-600 rounded-full animate-spin"></div>
                    <p class="text-sm text-neutral-500">Aguardando QR Code do Mercado Pago...</p>
                  </div>
                </template>

                <div v-if="!wppSent">
                  <a
                    v-if="whatsappUrl"
                    :href="whatsappUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    @click="wppSent = true"
                    class="flex items-center justify-center gap-2 w-full py-3.5 bg-green-600 text-white rounded-lg text-sm font-semibold transition-all duration-200 hover:bg-green-700 shadow-md active:scale-95 mt-2"
                  >
                    <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    Falar com a loja no WhatsApp
                  </a>
                </div>
                <div
                  v-else
                  class="flex items-center justify-center gap-2 w-full py-3.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 rounded-lg text-sm font-semibold mt-2"
                >
                  <CheckCircle class="w-5 h-5" />
                  Mensagem enviada para a loja.
                </div>
              </div>

              <h3
                class="font-bold text-neutral-900 dark:text-neutral-100 mb-6 text-sm tracking-tight border-b border-neutral-100 dark:border-neutral-800/50 pb-3"
              >
                Linha do Tempo
              </h3>

              <!-- Timeline de Status -->
              <div class="relative flex flex-col gap-6 pl-3">
                <!-- Linha contínua do tempo (Fundo) -->
                <div
                  class="absolute left-[19px] top-2 bottom-2 w-[2px] bg-neutral-100 dark:bg-neutral-800 rounded-full"
                ></div>
                <!-- Linha preenchida de progresso -->
                <div
                  class="absolute left-[19px] top-2 w-[2px] bg-red-600 rounded-full transition-all duration-500 ease-out"
                  :style="{ height: alturaLinhaProgresso }"
                ></div>

                <!-- Passos -->
                <div
                  v-for="passo in statusFluxo"
                  :key="passo.id"
                  class="relative flex gap-4 items-center z-10"
                >
                  <div
                    class="w-4 h-4 shrink-0 rounded-full border-2 transition-all duration-500 flex items-center justify-center bg-white dark:bg-neutral-900"
                    :class="
                      statusMaiorOuIgual(passo.id)
                        ? 'border-red-600'
                        : 'border-neutral-300 dark:border-neutral-700'
                    "
                  >
                    <div
                      v-if="statusMaiorOuIgual(passo.id)"
                      class="w-1.5 h-1.5 bg-red-600 rounded-full scale-in-fast"
                    ></div>
                  </div>
                  <div>
                    <h4
                      class="text-sm font-bold transition-colors"
                      :class="
                        statusMaiorOuIgual(passo.id)
                          ? 'text-neutral-900 dark:text-neutral-100'
                          : 'text-neutral-400'
                      "
                    >
                      {{ passo.label }}
                    </h4>
                    <p
                      v-if="pedidoRastreado.status === passo.id"
                      class="text-xs font-semibold text-red-600 mt-0.5 animate-pulse"
                    >
                      {{ passo.activeMsg }}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div
              class="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl dark:shadow-none shadow-red-900/5 border border-neutral-100 dark:border-neutral-800/50 p-5"
            >
              <h3
                class="font-bold text-neutral-900 dark:text-neutral-100 mb-3 text-sm tracking-tight border-b border-neutral-100 dark:border-neutral-800/50 pb-3"
              >
                Resumo
              </h3>
              <p class="text-sm text-neutral-600 dark:text-neutral-400 font-medium">
                Nome:
                <span class="text-neutral-900 dark:text-neutral-100">{{
                  pedidoRastreado.customerName
                }}</span>
              </p>
              <p class="text-sm text-neutral-600 dark:text-neutral-400 font-medium mt-1 mb-3">
                Total:
                <span class="text-neutral-900 dark:text-neutral-100">{{
                  formatarMoeda(pedidoRastreado.total)
                }}</span>
              </p>

              <div class="space-y-2 border-t border-neutral-100 dark:border-neutral-800/50 pt-3">
                <div
                  v-for="item in pedidoRastreado.items"
                  :key="item.id"
                  class="text-xs text-neutral-500 dark:text-neutral-500"
                >
                  <span class="font-bold text-neutral-700 dark:text-neutral-300"
                    >{{ item.quantity }}x</span
                  >
                  {{ item.product.name }}
                </div>
              </div>
            </div>
          </main>

          <footer
            class="bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 p-4 shrink-0 shadow-sm dark:shadow-none z-20 absolute bottom-0 w-full"
          >
            <button
              v-if="canConfirmDelivery"
              @click="confirmarRecebimento"
              :disabled="confirmingDelivery"
              class="w-full mb-2 py-3 bg-green-600 text-white rounded-lg text-sm font-semibold transition-all hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Check v-if="!confirmingDelivery" class="w-5 h-5" />
              <div v-else class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              {{ confirmingDelivery ? "Confirmando..." : "Recebi meu pedido" }}
            </button>
            <button
              v-if="canCancelOrder"
              @click="cancelarPedido"
              :disabled="cancellingOrder"
              class="w-full mb-2 py-3 bg-red-600 text-white rounded-lg text-sm font-semibold transition-all hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {{ cancellingOrder ? "Cancelando pedido..." : "Cancelar Pedido" }}
            </button>
            <button
              v-if="pedidoRastreado?.trackingCode"
              @click="desativarWhatsapp"
              :disabled="waOptingOut"
              class="w-full mb-2 py-3 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm font-semibold transition-all hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {{ waOptingOut ? "Desativando WhatsApp..." : "Parar notificações no WhatsApp" }}
            </button>
            <button
              @click="emit('limpar')"
              class="w-full py-3 bg-neutral-50 dark:bg-neutral-950 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/50 rounded-lg text-sm font-semibold transition-all hover:bg-red-50 dark:hover:bg-neutral-900"
            >
              Encerrar Acompanhamento
            </button>
          </footer>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { Copy, CheckCircle, Check } from "lucide-vue-next";
import { useToastStore } from "@/stores/toast";
import { formatarMoeda } from "@/utils/formatters";
import { OrderService, SettingService } from "@/services/http";
import QrcodeVue from "qrcode.vue";

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  pedidoRastreado: {
    type: Object,
    default: null,
  },
  statusFluxo: {
    type: Array,
    default: () => [],
  },
  alturaLinhaProgresso: {
    type: String,
    default: "0%",
  },
  statusMaiorOuIgual: {
    type: Function,
    default: () => false,
  },
});

const emit = defineEmits(["update:modelValue", "limpar", "order-cancelled"]);
const toast = useToastStore();

const cancellingOrder = ref(false);
const confirmingDelivery = ref(false);
const waOptingOut = ref(false);
const wppSent = ref(false);

// Configurações da Loja (buscadas do backend)
const telefoneLojaWhatsApp = ref("");

const carregarConfiguracoes = async () => {
  try {
    const { data } = await SettingService.getSettings();
    if (data) {
      if (data.profile) {
        if (data.profile.phone) {
          telefoneLojaWhatsApp.value = data.profile.phone.replace(/\D/g, "");
        }
      }
    }
  } catch (error) {
    console.error("Erro ao buscar configurações PIX", error);
  }
};

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen && props.pedidoRastreado?.paymentMethod === "PIX") {
      carregarConfiguracoes();
    }
  },
);

watch(
  () => props.pedidoRastreado,
  (pedido) => {
    if (props.modelValue && pedido?.paymentMethod === "PIX") {
      carregarConfiguracoes();
    }
  },
);

onMounted(() => {
  if (props.modelValue && props.pedidoRastreado?.paymentMethod === "PIX") {
    carregarConfiguracoes();
  }
});

const pixPayload = computed(() => {
  if (!props.pedidoRastreado) return "";
  return props.pedidoRastreado.pixQrCode || "";
});

const whatsappUrl = computed(() => {
  if (!telefoneLojaWhatsApp.value || !props.pedidoRastreado) return "";
  const numero = telefoneLojaWhatsApp.value.startsWith("55")
    ? telefoneLojaWhatsApp.value
    : `55${telefoneLojaWhatsApp.value}`;
  const msg = `Olá! Acabei de pagar via PIX o pedido #${props.pedidoRastreado.trackingCode} no valor de ${formatarMoeda(props.pedidoRastreado.total)}.`;
  return `https://wa.me/${numero}?text=${encodeURIComponent(msg)}`;
});

const canCancelOrder = computed(() => {
  if (!props.pedidoRastreado) return false;
  if (props.pedidoRastreado.paymentStatus === "pago") return false;

  const cancellableStatuses = ["aguardando_pagamento", "novo"];
  return cancellableStatuses.includes(props.pedidoRastreado.status);
});

const canConfirmDelivery = computed(() =>
  props.pedidoRastreado?.status === "em_rota" && props.pedidoRastreado?.type === "Entrega"
);

const confirmarRecebimento = async () => {
  if (!props.pedidoRastreado?.trackingCode || confirmingDelivery.value) return;

  confirmingDelivery.value = true;
  try {
    await OrderService.confirmDelivery(props.pedidoRastreado.trackingCode);
  } catch (error) {
    const msg = error?.response?.data?.error || "Não foi possível confirmar o recebimento.";
    toast.error(msg);
  } finally {
    confirmingDelivery.value = false;
  }
};

const copiarChave = async () => {
  try {
    await navigator.clipboard.writeText(pixPayload.value);
    toast.success("Código PIX copiado para a área de transferência!");
  } catch (err) {
    toast.error("Erro ao copiar código PIX: " + err.message);
  }
};

const cancelarPedido = async () => {
  if (!props.pedidoRastreado?.trackingCode || !canCancelOrder.value || cancellingOrder.value)
    return;

  cancellingOrder.value = true;
  try {
    await OrderService.cancelPublicOrder(props.pedidoRastreado.trackingCode);
    toast.success("Pedido cancelado com sucesso!");
    emit("order-cancelled");
  } catch (error) {
    const msg = error?.response?.data?.error || "Não foi possível cancelar o pedido agora.";
    toast.error(msg);
  } finally {
    cancellingOrder.value = false;
  }
};

const desativarWhatsapp = async () => {
  if (!props.pedidoRastreado?.trackingCode || waOptingOut.value) return;

  waOptingOut.value = true;
  try {
    await OrderService.optOutWhatsappByTracking(props.pedidoRastreado.trackingCode);
    toast.success("Notificações de WhatsApp desativadas.");
  } catch (error) {
    const msg = error?.response?.data?.error || "Não foi possível desativar agora.";
    toast.error(msg);
  } finally {
    waOptingOut.value = false;
  }
};
</script>
