<template>
  <Transition name="fade">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-[60] bg-neutral-50 dark:bg-neutral-950 flex flex-col items-center justify-center p-6"
    >
      <div
        class="w-full max-w-[420px] bg-white dark:bg-neutral-900 rounded-2xl shadow-xl dark:shadow-none shadow-red-900/5 border border-neutral-100 dark:border-neutral-800/50 flex flex-col overflow-y-auto max-h-[92vh]"
      >
        <div class="flex flex-col items-center text-center px-8 pt-8 pb-4">
          <div
            class="w-16 h-16 bg-red-50 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-5 border border-red-100 dark:border-red-900/50 scale-in shrink-0"
          >
            <Check class="w-8 h-8 text-red-600" />
          </div>
          <h1 class="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-1 tracking-tight">
            Pedido Recebido!
          </h1>
          <p class="text-sm text-neutral-500 dark:text-neutral-500">
            {{ isPix ? 'Escaneie o QR Code abaixo para pagar.' : 'Sua delícia já está na fila de preparo.' }}
          </p>
        </div>

        <!-- PIX Section -->
        <div v-if="isPix" class="px-6 pb-2">
          <div class="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-xl p-5 text-center">
            <p class="text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wide mb-4">
              Pagar {{ formatarMoeda(subtotalEnviado) }} via PIX
            </p>

            <template v-if="pixPayload">
              <div class="flex justify-center mb-4">
                <div class="bg-white p-3 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700">
                  <qrcode-vue :value="pixPayload" :size="170" level="M" />
                </div>
              </div>

              <button
                @click="copiarChave"
                class="w-full py-2.5 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2"
                :class="copiado
                  ? 'bg-green-600 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'"
              >
                <Check v-if="copiado" class="w-4 h-4" />
                <Copy v-else class="w-4 h-4" />
                {{ copiado ? 'Copiado!' : 'Copiar Código PIX' }}
              </button>

              <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-3">
                Após pagar, acesse "Acompanhar Pedido" para enviar o comprovante.
              </p>
            </template>

            <div v-else class="py-6 flex flex-col items-center gap-3">
              <div class="w-8 h-8 border-4 border-red-200 border-t-red-600 rounded-full animate-spin"></div>
              <p class="text-sm text-neutral-500">Gerando QR Code...</p>
            </div>
          </div>
        </div>

        <!-- Resumo -->
        <div class="px-6 py-4">
          <div class="bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 p-4 rounded-xl text-left">
            <p class="text-xs text-neutral-500 dark:text-neutral-500 font-medium uppercase tracking-wide mb-1">
              Resumo
            </p>
            <p class="text-neutral-900 dark:text-neutral-100 font-bold text-xl mb-3">
              {{ formatarMoeda(subtotalEnviado) }}
            </p>
            <div class="h-px bg-neutral-200 dark:bg-neutral-700 w-full mb-3"></div>
            <p class="text-sm text-neutral-600 dark:text-neutral-400">
              Nome: <span class="text-neutral-900 dark:text-neutral-100 font-semibold">{{ checkoutEnviado.nome }}</span>
            </p>
            <p class="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
              Pagamento: <span class="text-neutral-900 dark:text-neutral-100 font-semibold">{{ checkoutEnviado.pagamento }}</span>
            </p>
          </div>
        </div>

        <!-- Ações -->
        <div class="px-6 pb-8 flex flex-col gap-3">
          <button
            @click="emit('acompanhar')"
            class="w-full py-3 bg-red-600 text-white rounded-lg text-sm font-semibold transition-all hover:bg-red-700 active:scale-[0.98] shadow-sm"
          >
            Acompanhar Pedido
          </button>
          <button
            @click="emit('fechar')"
            class="w-full py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-lg text-sm font-semibold transition-all hover:bg-neutral-50 dark:hover:bg-neutral-800/50 active:scale-[0.98]"
          >
            Fazer Novo Pedido
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed } from "vue";
import { Check, Copy } from "lucide-vue-next";
import { formatarMoeda } from "@/utils/formatters";
import { generatePixPayload } from "@/utils/pix";
import QrcodeVue from "qrcode.vue";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  subtotalEnviado: { type: Number, required: true },
  checkoutEnviado: { type: Object, required: true },
  pedidoCriado: { type: Object, default: null },
  pixConfig: { type: Object, default: () => ({}) },
});

const emit = defineEmits(["acompanhar", "fechar"]);

const copiado = ref(false);

const isPix = computed(() => props.checkoutEnviado.pagamento === "PIX");

const pixPayload = computed(() => {
  if (!isPix.value || !props.pedidoCriado || !props.pixConfig?.key) return "";
  return generatePixPayload(
    props.pixConfig.key,
    props.pixConfig.type,
    props.pixConfig.name,
    props.pixConfig.city,
    props.pedidoCriado.total,
    props.pedidoCriado.id || "***",
  );
});

const copiarChave = async () => {
  try {
    await navigator.clipboard.writeText(pixPayload.value);
    copiado.value = true;
    setTimeout(() => { copiado.value = false; }, 2000);
  } catch {
    // sem feedback visual extra
  }
};
</script>
