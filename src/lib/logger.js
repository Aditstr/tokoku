const morgan = require('morgan');

// Format log yang informatif tapi tidak terlalu verbose
// Method URL Status ResponseTime - ContentLength
const format = process.env.NODE_ENV === 'production'
  ? 'combined'   // format lengkap untuk production (ada IP, user-agent)
  : 'dev';       // format ringkas + berwarna untuk development

const logger = morgan(format, {
  // Skip logging untuk health check — terlalu noisy kalau dicek tiap 5 menit
  skip: (req) => req.url === '/health',
});

module.exports = logger;