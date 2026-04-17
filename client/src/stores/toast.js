import { defineStore } from 'pinia'

export const useToastStore = defineStore('toast', {
  state: () => ({
    toasts: [],
  }),
  actions: {
    addToast(message, type = 'info', duration = 3500) {
      const id = Date.now() + Math.random().toString(36).substring(2)
      console.log('Adding toast:', message)
      this.toasts.push({ id, message, type })

      setTimeout(() => {
        this.removeToast(id)
      }, duration)
    },
    removeToast(id) {
      this.toasts = this.toasts.filter((toast) => toast.id !== id)
    },
    success(message, duration) {
      this.addToast(message, 'success', duration)
    },
    error(message, duration) {
      this.addToast(message, 'error', duration)
    },
    warning(message, duration) {
      this.addToast(message, 'warning', duration)
    },
    info(message, duration) {
      this.addToast(message, 'info', duration)
    },
  },
})
