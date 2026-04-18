<template>
  <Transition name="dialog-fade">
    <div
      v-if="store.visible"
      class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      @click.self="store._respond(false)"
    >
      <Transition name="dialog-pop" appear>
        <div
          v-if="store.visible"
          class="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-100 dark:border-neutral-800/50 w-full max-w-sm overflow-hidden"
        >
          <div class="p-6">
            <h3 class="text-base font-bold text-neutral-900 dark:text-neutral-100 mb-2">
              {{ store.title }}
            </h3>
            <p class="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
              {{ store.message }}
            </p>
          </div>
          <div class="px-6 pb-5 flex justify-end gap-3">
            <button
              @click="store._respond(false)"
              class="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors"
            >
              {{ store.cancelLabel }}
            </button>
            <button
              @click="store._respond(true)"
              class="px-4 py-2 text-sm font-semibold rounded-lg transition-colors"
              :class="
                store.confirmVariant === 'danger'
                  ? 'text-white bg-red-600 hover:bg-red-700'
                  : 'text-white bg-neutral-800 hover:bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200'
              "
            >
              {{ store.confirmLabel }}
            </button>
          </div>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<script setup>
import { useDialogStore } from '@/stores/dialog'
const store = useDialogStore()
</script>

<style scoped>
.dialog-fade-enter-active,
.dialog-fade-leave-active {
  transition: opacity 0.2s ease;
}
.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;
}

.dialog-pop-enter-active {
  transition: all 0.2s ease;
}
.dialog-pop-enter-from {
  opacity: 0;
  transform: scale(0.95) translateY(8px);
}
</style>
