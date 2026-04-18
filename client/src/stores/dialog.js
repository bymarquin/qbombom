import { defineStore } from 'pinia'

export const useDialogStore = defineStore('dialog', {
  state: () => ({
    visible: false,
    title: '',
    message: '',
    confirmLabel: 'Confirmar',
    cancelLabel: 'Cancelar',
    confirmVariant: 'danger',
    _resolve: null,
  }),
  actions: {
    confirm({ title, message, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', confirmVariant = 'danger' }) {
      this.title = title
      this.message = message
      this.confirmLabel = confirmLabel
      this.cancelLabel = cancelLabel
      this.confirmVariant = confirmVariant
      this.visible = true
      return new Promise((resolve) => {
        this._resolve = resolve
      })
    },
    _respond(result) {
      this.visible = false
      this._resolve?.(result)
      this._resolve = null
    },
  },
})
