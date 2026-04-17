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
                  pedidoRastreado.paymentStatus === 'pendente' &&
                  !pedidoRastreado.receiptUrl
                "
                class="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-xl p-5 mb-6 text-center shadow-sm"
              >
                <h4 class="font-bold text-red-700 dark:text-red-400 mb-2">Aguardando Pagamento</h4>

                <template v-if="chavePixLoja && pixPayload">
                  <p class="text-sm text-neutral-700 dark:text-neutral-300 mb-4">
                    Escaneie o QR Code abaixo ou copie a chave PIX Copia e Cola para pagar
                    <strong>{{ formatarMoeda(pedidoRastreado.total) }}</strong
                    >. Depois, anexe o comprovante para liberarmos seu pedido.
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
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        ></path>
                      </svg>
                      Copiar Código PIX
                    </button>
                  </div>
                </template>
                <template v-else>
                  <div class="py-8 flex flex-col items-center justify-center">
                    <div
                      class="w-8 h-8 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mb-3"
                    ></div>
                    <p class="text-sm text-neutral-500">Gerando código PIX...</p>
                  </div>
                </template>

                <label
                  class="block w-full py-3.5 bg-red-600 text-white rounded-lg text-sm font-semibold transition-all duration-200 hover:bg-red-700 cursor-pointer shadow-md active:scale-95 text-center relative mt-2"
                >
                  <span v-if="!uploadingReceipt" class="flex justify-center items-center gap-2"
                    ><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                      ></path>
                    </svg>
                    Anexar Comprovante do PIX</span
                  >
                  <span v-else class="flex justify-center items-center gap-2"
                    ><div
                      class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
                    ></div>
                    Enviando...</span
                  >
                  <input
                    type="file"
                    accept="image/*"
                    class="hidden"
                    @change="handleFileUpload"
                    :disabled="uploadingReceipt"
                  />
                </label>
              </div>

              <div
                v-else-if="
                  pedidoRastreado.paymentMethod === 'PIX' &&
                  pedidoRastreado.receiptUrl &&
                  pedidoRastreado.paymentStatus === 'pendente'
                "
                class="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30 rounded-xl p-5 mb-6 text-center shadow-sm"
              >
                <div
                  class="w-12 h-12 bg-blue-100 dark:bg-blue-800/30 rounded-full flex items-center justify-center mx-auto mb-3 text-blue-600 dark:text-blue-400"
                >
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>
                  </svg>
                </div>
                <h4 class="font-bold text-blue-800 dark:text-blue-300 mb-1">
                  Comprovante Recebido!
                </h4>
                <p class="text-sm text-neutral-600 dark:text-neutral-400">
                  Estamos conferindo e logo seu pedido vai para a cozinha.
                </p>
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
              <svg v-if="!confirmingDelivery" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
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
import { useToastStore } from "@/stores/toast";
import { formatarMoeda } from "@/utils/formatters";
import { OrderService, SettingService } from "@/services/http";
import { generatePixPayload } from "@/utils/pix";
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

const emit = defineEmits(["update:modelValue", "receipt-uploaded", "limpar", "order-cancelled"]);
const toast = useToastStore();

const uploadingReceipt = ref(false);
const cancellingOrder = ref(false);
const confirmingDelivery = ref(false);
const waOptingOut = ref(false);

// Configurações do PIX da Loja (Buscadas do backend)
const chavePixLoja = ref("");
const tipoChavePix = ref("cpf");
const nomeLoja = ref("Qbombom Delivery");
const cidadeLoja = ref("Sao Paulo");

const carregarConfiguracoes = async () => {
  try {
    const { data } = await SettingService.getSettings();
    if (data) {
      if (data.pix && data.pix.key) {
        chavePixLoja.value = data.pix.key; // Não aplicamos limpeza aqui, o utils/pix fará de acordo com o tipo
        tipoChavePix.value = data.pix.type || "cpf";
      }
      if (data.profile) {
        if (data.profile.name) nomeLoja.value = data.profile.name;
        if (data.profile.address && data.profile.address.city) {
          // Pega apenas a cidade antes do traço/estado
          cidadeLoja.value = data.profile.address.city.split("-")[0].trim();
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
    if (isOpen && props.pedidoRastreado?.paymentMethod === "PIX" && !chavePixLoja.value) {
      carregarConfiguracoes();
    }
  },
);

onMounted(() => {
  if (props.modelValue && props.pedidoRastreado?.paymentMethod === "PIX") {
    carregarConfiguracoes();
  }
});

// Payload computado dinamicamente usando o utilitário PIX
const pixPayload = computed(() => {
  if (!props.pedidoRastreado || !chavePixLoja.value) return "";
  return generatePixPayload(
    chavePixLoja.value,
    tipoChavePix.value,
    nomeLoja.value,
    cidadeLoja.value,
    props.pedidoRastreado.total,
    props.pedidoRastreado.id || "***",
  );
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
    toast.success("Obrigado! Bom apetite 😋");
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

const handleFileUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    // 5MB
    toast.error("A imagem deve ter no máximo 5MB");
    return;
  }

  uploadingReceipt.value = true;

  try {
    const base64Image = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });

    const payload = {
      receiptBase64: base64Image,
    };

    // Upload usando API JSON ao invés de FormData
    await OrderService.uploadReceipt(props.pedidoRastreado.trackingCode, payload);

    toast.success("Comprovante enviado!");
    emit("receipt-uploaded");
  } catch (error) {
    console.error(error);
    toast.error("Falha ao enviar comprovante");
  } finally {
    uploadingReceipt.value = false;
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
