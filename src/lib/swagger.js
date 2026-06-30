const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TokoKu API',
      version: '1.0.0',
      description: 'Dokumentasi API untuk TokoKu — marketplace sederhana dengan Node.js, Express, PostgreSQL, dan Prisma',
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production'
          ? 'https://tokoku-qgyf.onrender.com'
          : 'http://localhost:3000',
        description: process.env.NODE_ENV === 'production' ? 'Production' : 'Development',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  // Lokasi file yang berisi komentar dokumentasi
  apis: ['./src/modules/**/*.routes.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;