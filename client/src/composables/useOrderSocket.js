import { onUnmounted } from 'vue'
import socket from '@/services/socket'

/**
 * Conecta ao socket e registra handlers para orderCreated e orderUpdated.
 * Limpa os listeners automaticamente ao desmontar o componente.
 *
 * @param {Object} handlers
 * @param {(order: object) => void} handlers.onCreated
 * @param {(order: object) => void} handlers.onUpdated
 * @param {() => void} [handlers.onConnect]
 * @param {() => void} [handlers.onDisconnect]
 */
export function useOrderSocket({ onCreated, onUpdated, onConnect, onDisconnect } = {}) {
  if (!socket.connected) socket.connect()

  if (onConnect)    socket.on('connect',    onConnect)
  if (onDisconnect) socket.on('disconnect', onDisconnect)
  if (onCreated)    socket.on('orderCreated', onCreated)
  if (onUpdated)    socket.on('orderUpdated', onUpdated)

  onUnmounted(() => {
    if (onConnect)    socket.off('connect',    onConnect)
    if (onDisconnect) socket.off('disconnect', onDisconnect)
    if (onCreated)    socket.off('orderCreated', onCreated)
    if (onUpdated)    socket.off('orderUpdated', onUpdated)
  })
}
