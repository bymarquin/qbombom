<template>
  <Transition name="fade">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-[60] bg-neutral-50 dark:bg-neutral-950 flex flex-col items-center justify-center p-6 text-center"
    >
      <div
        class="w-full max-w-[420px] bg-white dark:bg-neutral-900 p-8 sm:p-10 rounded-2xl shadow-xl dark:shadow-none shadow-red-900/5 border border-neutral-100 dark:border-neutral-800/50 flex flex-col items-center"
      >
        <div
          class="w-16 h-16 bg-red-50 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6 border border-red-100 dark:border-red-900/50 scale-in"
        >
          <Check class="w-8 h-8 text-red-600" />
        </div>
        <h1 class="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2 tracking-tight">
          Pedido Recebido!
        </h1>
        <p v-if="checkoutEnviado.pagamento === 'PIX'" class="text-sm text-red-600 dark:text-red-400 font-semibold mb-8 px-2">
          Falta pouco! Acompanhe seu pedido para realizar o PIX e anexar o comprovante.
        </p>
        <p v-else class="text-sm text-neutral-500 dark:text-neutral-500 mb-8">
          Sua delícia já está na fila de preparo.
        </p>

        <div
          class="bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 p-5 rounded-xl w-full text-left mb-8"
        >
          <p
            class="text-xs text-neutral-500 dark:text-neutral-500 font-medium uppercase tracking-wide mb-1"
          >
            Resumo
          </p>
          <p class="text-neutral-900 dark:text-neutral-100 font-bold text-xl mb-3">
            {{ formatarMoeda(subtotalEnviado) }}
          </p>
          <div class="h-px bg-neutral-200 dark:bg-neutral-700 w-full mb-3"></div>
          <p class="text-sm text-neutral-600 dark:text-neutral-400">
            Nome:
            <span class="text-neutral-900 dark:text-neutral-100 font-semibold">{{
              checkoutEnviado.nome
            }}</span>
          </p>
          <p class="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
            Forma de Pagamento:
            <span class="text-neutral-900 dark:text-neutral-100 font-semibold">{{
              checkoutEnviado.pagamento
            }}</span>
          </p>
        </div>

        <button
          @click="emit('acompanhar')"
          class="w-full py-3 bg-red-600 text-white rounded-lg text-sm font-semibold transition-all duration-200 hover:bg-red-700 active:scale-[0.98] shadow-sm dark:shadow-none hover:shadow-md dark:shadow-none animate-bounce mt-2"
        >
          Acompanhar Pedido
        </button>
        <button
          @click="emit('fechar')"
          class="w-full py-3 mt-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-lg text-sm font-semibold transition-all duration-200 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 dark:bg-neutral-950 active:scale-[0.98]"
        >
          Fazer Novo Pedido
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { Check } from "lucide-vue-next";
import { formatarMoeda } from "@/utils/formatters";

defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  subtotalEnviado: {
    type: Number,
    required: true
  },
  checkoutEnviado: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['acompanhar', 'fechar']);
</script>