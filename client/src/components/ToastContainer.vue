<template>
  <div
    class="fixed z-[99999] top-4 left-1/2 -translate-x-1/2
           w-[calc(100%-2rem)] max-w-md
           flex flex-col gap-2 pointer-events-none"
  >
    <TransitionGroup name="toast" tag="div" class="flex flex-col gap-2">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="bg-white dark:bg-neutral-900 pointer-events-auto flex items-start gap-3 p-3 sm:p-4 rounded-xl shadow-lg border border-neutral-100 dark:border-neutral-800/50 opacity-100"
      >
        <!-- Ícone baseado no tipo -->
        <div class="flex-shrink-0 mt-0.5">
          <CircleCheck v-if="toast.type === 'success'" class="w-5 h-5 text-green-500" />
          <CircleX v-else-if="toast.type === 'error'" class="w-5 h-5 text-red-500" />
          <CircleAlert v-else-if="toast.type === 'warning'" class="w-5 h-5 text-amber-500" />
          <Info v-else class="w-5 h-5 text-blue-500" />
        </div>

        <!-- Mensagem -->
        <div class="flex-1">
          <p class="text-sm font-medium text-neutral-800 dark:text-neutral-200 leading-snug">
            {{ toast.message }}
          </p>
        </div>

        <!-- Botão Fechar -->
        <button
          @click="toastStore.removeToast(toast.id)"
          class="flex-shrink-0 text-neutral-400 hover:text-neutral-600 dark:text-neutral-400 p-1 -m-1 transition-colors rounded-md hover:bg-neutral-50 dark:hover:bg-neutral-800/50 dark:bg-neutral-950 focus:outline-none"
        >
          <X class="w-4 h-4" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup>
import { useToastStore } from '@/stores/toast'
import { storeToRefs } from 'pinia'
import { CircleCheck, CircleX, CircleAlert, Info, X } from 'lucide-vue-next'

const toastStore = useToastStore()
const { toasts } = storeToRefs(toastStore)
</script>

<style scoped>
/* Entrada: cai de cima com overshoot leve */
@keyframes toast-in {
  0%   { opacity: 0; transform: translateY(-28px) scale(0.96); }
  65%  { opacity: 1; transform: translateY(6px)   scale(1.01); }
  100% { opacity: 1; transform: translateY(0)     scale(1);    }
}

/* Saída: puxada para baixo primeiro, depois sobe e some */
@keyframes toast-out {
  0%   { opacity: 1; transform: translateY(0)     scale(1);    }
  35%  { opacity: 1; transform: translateY(8px)   scale(1.01); }
  100% { opacity: 0; transform: translateY(-38px) scale(0.96); }
}

.toast-enter-active {
  animation: toast-in 420ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

.toast-leave-active {
  animation: toast-out 380ms cubic-bezier(0.4, 0, 0.6, 1) both;
  position: absolute;
  width: 100%;
}

/* Reposicionamento suave dos toasts restantes */
.toast-move {
  transition: transform 320ms cubic-bezier(0.22, 1, 0.36, 1);
}
</style>
