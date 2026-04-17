<template>
  <div
    class="fixed z-[99999] flex flex-col gap-2 pointer-events-none
           bottom-4 left-4 right-4
           sm:bottom-auto sm:top-4 sm:left-auto sm:right-4 sm:w-full sm:max-w-sm"
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
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(30px) scale(0.95);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(30px) scale(0.95);
}
</style>
