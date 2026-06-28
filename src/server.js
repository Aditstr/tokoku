const app = require('./app');

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`✅ Server berjalan di http://localhost:${PORT}`);
  console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
});

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT',  () => gracefulShutdown('SIGINT'));

async function gracefulShutdown(signal) {
  console.log(`\n⚠️  Menerima ${signal}, memulai graceful shutdown...`);
  server.close(async () => {
    const prisma = require('./lib/prisma');
    await prisma.$disconnect();
    console.log('👋 Shutdown selesai');
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000);
}