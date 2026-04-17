require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

// Config do Banco e Rotas
const { sequelize } = require('./models');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3006;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Routes
// Todas as rotas dentro do routes/index.js estarão sob o prefixo /api
app.use('/api', routes);

// Root endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Qbombom Sorvetes API is running' });
});

// ======= CONFIGURAÇÃO DO SERVIDOR HTTP + WEBSOCKET (SOCKET.IO) =======
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE']
  }
});

// Anexa a instância do IO no Express para usarmos nos Controllers (como no orderController.js)
app.set('io', io);

io.on('connection', (socket) => {
  console.log('Cliente WS conectado:', socket.id);
  socket.on('disconnect', () => {
    console.log('Cliente WS desconectado:', socket.id);
  });
});

// Apenas escuta na porta se rodar diretamente (evita problemas em testes/Cypress no futuro)
if (require.main === module) {
  server.listen(PORT, async () => {
    console.log(`Server is running on port ${PORT}`);
    try {
      await sequelize.authenticate();
      console.log('Database connection has been established successfully.');
    } catch (error) {
      console.error('Unable to connect to the database:', error);
    }
  });
}

// Exporta o servidor com o IO atrelado
module.exports = { app, server, io };
