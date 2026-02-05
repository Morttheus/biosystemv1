// middleware/security.js
const rateLimit = require('express-rate-limit');

// Rate limiter para rotas de autenticação (mais restritivo)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 tentativas por IP
  message: {
    error: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
    retryAfter: 15
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter geral para API
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 100, // 100 requisições por minuto
  message: {
    error: 'Muitas requisições. Tente novamente em alguns segundos.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware de log de auditoria (LGPD)
const auditLog = (req, res, next) => {
  const startTime = Date.now();

  // Log após a resposta
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      userId: req.usuario?.id || 'anonymous',
      statusCode: res.statusCode,
      duration: `${duration}ms`,
    };

    // Log para operações sensíveis (dados pessoais)
    if (req.path.includes('/pacientes') || req.path.includes('/prontuarios')) {
      logData.sensitiveOperation = true;
      console.log('[AUDIT-LGPD]', JSON.stringify(logData));
    } else if (process.env.NODE_ENV === 'development') {
      console.log('[AUDIT]', JSON.stringify(logData));
    }
  });

  next();
};

// Middleware para sanitização básica de input
const sanitizeInput = (req, res, next) => {
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        // Remove tags HTML potencialmente perigosas
        req.body[key] = req.body[key]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<[^>]*>/g, '')
          .trim();
      }
    });
  }
  next();
};

// Headers de segurança básicos (se não usar helmet)
const securityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
};

module.exports = {
  authLimiter,
  apiLimiter,
  auditLog,
  sanitizeInput,
  securityHeaders
};
