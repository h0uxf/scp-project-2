const xss = require('xss');

const xssOptions = {
  whiteList: {
    p: [], // Allow <p> tags with no attributes
    b: [], // Allow <b> tags with no attributes
    i: [], // Allow <i> tags with no attributes
  },
  stripIgnoreTag: true, // Remove tags not in whiteList
  stripIgnoreTagBody: ['script'], // Remove content of ignored tags like <script>
};

const sanitizeData = (obj) => {
  if (!obj) return obj;

  try {
    if (typeof obj === 'string') {
      return xss(obj, xssOptions);
    }

    if (Array.isArray(obj)) {
      return obj.map(item => sanitizeData(item));
    }

    if (typeof obj === 'object' && obj !== null) {
      const sanitized = {};
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          sanitized[key] = sanitizeData(obj[key]);
        }
      }
      return sanitized;
    }

    return obj;
  } catch (error) {
    console.error('Sanitization error:', error);
    return obj;
  }
};

const sanitizeRequest = (req, res, next) => {
  try {
    if (req.body) req.body = sanitizeData(req.body);
    if (req.query) req.query = sanitizeData(req.query);
    if (req.params) req.params = sanitizeData(req.params);
  } catch (err) {
    console.error('Request sanitization failed:', err);
  }
  next();
};

const sanitizeResponse = (req, res, next) => {
  const originalJson = res.json;
  res.json = function (data) {
    const sanitizedData = sanitizeData(data);
    return originalJson.call(this, sanitizedData);
  };

  const originalSend = res.send;
  res.send = function (body) {
    let sanitizedBody;
    if (typeof body === 'string' || typeof body === 'object') {
      sanitizedBody = sanitizeData(body);
    } else {
      sanitizedBody = body;
    }
    return originalSend.call(this, sanitizedBody);
  };

  next();
};

module.exports = {
  sanitizeData,
  sanitizeRequest,  
  sanitizeResponse,
};
