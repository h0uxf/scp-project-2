require("dotenv").config();
const jwt = require("jsonwebtoken");

const accessSecret = process.env.JWT_SECRET_KEY;
const refreshSecret = process.env.JWT_REFRESH_SECRET_KEY;
const accessDuration = process.env.JWT_EXPIRES_IN;
const refreshDuration = process.env.JWT_REFRESH_EXPIRES_IN;
const algorithm = process.env.JWT_ALGORITHM;

module.exports = {
  // Generate access and refresh tokens
  generateTokens: (req, res, next) => {
    console.log(`Generating access and refresh JWT tokens`);

    const { user_id, username, role_id } = res.locals;

    if (!user_id) {
      console.error('User ID not found in res.locals');
      return res.status(500).json({ error: 'User ID required to generate token' });
    }

    const payload = {
      user_id,
      username: username || null,
      role_id: role_id || 3,
      timestamp: new Date()
    };

    const accessOptions = { algorithm, expiresIn: accessDuration };
    const refreshOptions = { algorithm, expiresIn: refreshDuration };

    try {
      const accessToken = jwt.sign(payload, accessSecret, accessOptions);
      const refreshToken = jwt.sign(payload, refreshSecret, refreshOptions);

      // Set HTTP-only cookies
      res.cookie('authToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Lax',
        maxAge: 1000 * 60 * 15 // 15 mins
      });

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Lax',
        maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
      });

      console.log('Access and Refresh JWTs set in cookies');
      next();

    } catch (err) {
      console.error('Error generating tokens:', err);
      return res.status(500).json({ error: 'Failed to generate tokens' });
    }
  },

  // Verify access token
  verifyAccessToken: (req, res, next) => {
    const token = req.cookies?.authToken;

    if (!token) {
      return res.status(401).json({ error: 'No access token found' });
    }

    jwt.verify(token, accessSecret, (err, decoded) => {
      if (err) {
        console.error('Access token error:', err.message);
        return res.status(401).json({ error: 'Invalid or expired access token' });
      }

      req.user = decoded;
      res.locals = { ...res.locals, ...decoded };
      next();
    });
  },

  // Endpoint handler: Refresh access token
  refreshTokenHandler: (req, res) => {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ error: 'No refresh token found' });
    }

    jwt.verify(refreshToken, refreshSecret, (err, decoded) => {
      if (err) {
        console.error('Refresh token error:', err.message);
        return res.status(401).json({ error: 'Invalid or expired refresh token' });
      }

      const payload = {
        user_id: decoded.user_id,
        username: decoded.username,
        role_id: decoded.role_id,
        timestamp: new Date()
      };

      const accessToken = jwt.sign(payload, accessSecret, {
        algorithm,
        expiresIn: accessDuration
      });

      res.cookie('authToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Lax',
        maxAge: 1000 * 60 * 15 // 15 mins
      });

      console.log('New access token issued');
      res.json({ message: 'Access token refreshed' });
    });
  }
};
