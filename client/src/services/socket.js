import { io } from 'socket.io-client'

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || (import.meta.env.DEV ? 'http://localhost:3006' : window.location.origin)

const socket = io(SOCKET_URL, {
  autoConnect: false, // Iniciaremos a conexão apenas quando necessário (ex: no KDS)
})

export default socket
