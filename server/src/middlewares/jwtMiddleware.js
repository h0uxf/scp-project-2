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

    const { user_id, username, role_id, role_name } = res.locals;

    if (!user_id) {
      console.error('User ID not found in res.locals');
      return res.status(500).json({ error: 'User ID required to generate token' });
    }

    const payload = {
      user_id,
      username: username || null,
      role_id: role_id || 3,
      role_name: role_name, 
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

  // Verify access token and attempt refresh if invalid or missing
  verifyAccessToken: (req, res, next) => {
    const accessToken = req.cookies?.authToken;
    const refreshToken = req.cookies?.refreshToken;
    console.log("Received cookies: "+{accessToken, refreshToken});

    // Helper function to verify refresh token and issue new access token
    const tryRefreshToken = () => {
      if (!refreshToken) {
        console.error('No refresh token found');
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
          role_name: decoded.role_name,
          timestamp: new Date()
        };

        try {
          const newAccessToken = jwt.sign(payload, accessSecret, {
            algorithm,
            expiresIn: accessDuration
          });

          // Set new access token in cookie
          res.cookie('authToken', newAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Lax',
            maxAge: 1000 * 60 * 15 // 15 mins
          });

          console.log('New access token issued via refresh');
          req.user = payload;
          res.locals = { ...res.locals, ...payload };
          
          next();
        } catch (err) {
          console.error('Error generating new access token:', err);
          return res.status(500).json({ error: 'Failed to generate new access token' });
        }
      });
    };

    if (!accessToken) {
      console.log('No access token found, attempting refresh');
      return tryRefreshToken();
    }

    jwt.verify(accessToken, accessSecret, (err, decoded) => {
      if (err) {
        console.error('Access token error:', err.message);
        console.log('Attempting to refresh access token');
        return tryRefreshToken();
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
        role_name: decoded.role_name,
        timestamp: new Date()
      };

      try {
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
      } catch (err) {
        console.error('Error generating new access token:', err);
        return res.status(500).json({ error: 'Failed to generate new access token' });
      }
    });
  }
};