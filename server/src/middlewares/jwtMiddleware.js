require("dotenv").config();
const jwt = require("jsonwebtoken");

const secretKey = process.env.JWT_SECRET_KEY;
const tokenDuration = process.env.JWT_EXPIRES_IN;
const tokenAlgorithm = process.env.JWT_ALGORITHM;

module.exports = {
  // Middleware to generate the JWT token
  generateToken: (req, res, next) => {
      console.log(`Generating JWT token`);

      // Ensure user_id is available
      if (!res.locals.user_id) {
        console.error('User ID not found in res.locals');
        return res.status(500).json({ error: 'User ID required to generate token' });
      }

      // Payload includes user_id, username, and timestamp
      const payload = {
        user_id: res.locals.user_id,
        username: res.locals.username || null,
        role_id: res.locals.role_id || 3,
        timestamp: new Date()
      };

      const options = {
        algorithm: tokenAlgorithm,
        expiresIn: tokenDuration
      };

      jwt.sign(payload, secretKey, options, (err, token) => {
        if(err){
          console.error(`Error generating JWT: ${err.message}`);
          return res.status(500).json({ error: `Failed to generate token: ${err.message}`});
        }

        res.cookie('authToken', token, {
          httpOnly: true, 
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'Lax',
          maxAge: 1000*60*60*24
        });

      console.log('JWT set in cookie');
      next();
    });
  },

  // Middleware to verify the JWT token
  verifyToken: (req, res, next) => {
    const token = req.cookies?.authToken;

    if (!token) {
      return res.status(401).json({ error: 'No token found in cookies' });
    }

    const callback = (err, decoded) => {
      if (err) {
        console.error(`Error verifying JWT: ${err.message}`);
        return res.status(401).json({ error: 'Invalid or expired token' });
      }

      if (!decoded.user_id) {
        console.error('Token payload missing user_id');
        return res.status(400).json({ error: 'Token payload invalid. User ID is required.' });
      } 

      if (!decoded.role_id){
        console.error('Token payload missing role_id');
        return res.status(400).json({ error: 'Token payload invalid. Role ID is required.'})
      }

      // Store decoded data in res.locals
      res.locals.user_id = decoded.user_id;
      res.locals.username = decoded.username || null;
      res.locals.role_id = Number(decoded.role_id) || 3;
      res.locals.tokenTimestamp = decoded.timestamp;

      req.user = {
        user_id: decoded.user_id,
        username: decoded.username || null,
        role_id: decoded.role_id || 3
      };

      console.log('Token verified, user_id:', req.user.user_id);
      next();
    };

    jwt.verify(token, secretKey, callback);
  }
};