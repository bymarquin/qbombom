import { watch } from 'vue'

/**
 * Sincroniza um ref reativo com o localStorage automaticamente.
 * Retorna o valor atual persistido ou o defaultValue fornecido.
 *
 * @param {string} key
 * @param {any} defaultValue
 * @returns {any} valor persistido ou defaultValue
 */
export function readLocalStorage(key, defaultValue) {
  try {
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : defaultValue
  } catch {
    return defaultValue
  }
}

/**
 * Observa um ref e persiste cada mudança no localStorage.
 *
 * @param {string} key
 * @param {import('vue').Ref} source
 */
export function syncToLocalStorage(key, source) {
  watch(source, (value) => {
    localStorage.setItem(key, JSON.stringify(value))
  }, { deep: true })
}
