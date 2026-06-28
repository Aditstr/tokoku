// Middleware factory — terima schema Zod, return middleware Express
function validate(schema, source = 'body') {
  return (req, res, next) => {
    // source bisa 'body', 'query', atau 'params'
    const parsed = schema.safeParse(req[source]);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Input tidak valid',
          details: parsed.error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
      });
    }

    // Taruh data yang sudah divalidasi di req.validated
    // supaya controller tinggal pakai req.validated, bukan req.body langsung
    req.validated = parsed.data;
    next();
  };
}

module.exports = validate;