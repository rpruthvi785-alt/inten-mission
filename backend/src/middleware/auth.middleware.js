const authMiddleware = (req, res, next) => {
  const expectedToken = process.env.AUTH_TOKEN || 'demo-static-token';

  // Support token as query param for browser-native requests (iframe, img)
  const queryToken = req.query.token;
  if (queryToken) {
    if (queryToken === expectedToken) {
      req.user = { role: 'admin', token: queryToken };
      return next();
    }
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({
      error: 'Unauthorized: Authorization header is required',
    });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({
      error: 'Unauthorized: Authorization header must be in format "Bearer <token>"',
    });
  }

  const token = parts[1];
  if (token !== expectedToken) {
    return res.status(401).json({
      error: 'Unauthorized: Invalid token',
    });
  }

  // Token is valid
  req.user = { role: 'admin', token };
  next();
};

module.exports = authMiddleware;
