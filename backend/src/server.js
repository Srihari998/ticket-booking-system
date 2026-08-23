const http = require('http');
const app = require('./app');
const config = require('./config');
const { initSocketServer } = require('./sockets');
const { startExpirationWorker, stopExpirationWorker } = require('./jobs/expirationWorker');
const { closePool } = require('./db');

const server = http.createServer(app);

initSocketServer(server, config.clientUrl);

startExpirationWorker(5000);

const PORT = config.port;

server.listen(PORT, () => {
  console.log(`Ticket Booking System backend listening on port ${PORT}`);
});

const gracefulShutdown = async () => {
  console.log('Shutting down server gracefully...');
  stopExpirationWorker();
  server.close(async () => {
    await closePool();
    process.exit(0);
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
