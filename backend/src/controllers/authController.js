const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// @desc    Register a new user
// @route   POST /api/v1/auth/signup
// @access  Public
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400);
      throw new Error('Please enter all fields');
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
      res.status(400);
      throw new Error('User already exists');
    }

    const user = await User.create({
      name,
      email,
      password,
    });

    if (user) {
      res.status(201).json({
        success: true,
        _id: user._id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        activeRoomId: user.activeRoomId,
        token: generateToken(user._id),
      });
    } else {
      res.status(400);
      throw new Error('Invalid user data');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/v1/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400);
      throw new Error('Please provide email and password');
    }

    const user = await User.findOne({ email }).select('+password');

    if (user && (await user.matchPassword(password))) {
      res.json({
        success: true,
        _id: user._id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        activeRoomId: user.activeRoomId,
        token: generateToken(user._id),
      });
    } else {
      res.status(401);
      throw new Error('Invalid email or password');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Google login / signup
// @route   POST /api/v1/auth/google
// @access  Public
const googleLogin = async (req, res, next) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      res.status(400);
      throw new Error('Please provide a Google ID Token or Access Token');
    }

    let payload;
    const clientId = process.env.GOOGLE_CLIENT_ID;

    // Check if token is a 3-part JWT (ID token)
    const isJwt = idToken.includes('.') && idToken.split('.').length === 3;

    if (clientId) {
      if (isJwt) {
        // Production path A: ID Token verification with Google Auth Library
        try {
          const ticket = await googleClient.verifyIdToken({
            idToken,
            audience: clientId,
          });
          payload = ticket.getPayload();
        } catch (err) {
          console.error('Google ID token verification failed:', err.message);
          res.status(401);
          throw new Error('Invalid Google token');
        }
      } else {
        // Production path B: Access Token verification by calling Google UserInfo API
        try {
          payload = await new Promise((resolve, reject) => {
            const https = require('https');
            https.get(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${idToken}`, (googleRes) => {
              let data = '';
              googleRes.on('data', (chunk) => { data += chunk; });
              googleRes.on('end', () => {
                try {
                  const parsed = JSON.parse(data);
                  if (parsed.error || parsed.error_description) {
                    reject(new Error(parsed.error_description || 'Invalid Access Token'));
                  } else {
                    resolve({
                      sub: parsed.sub,
                      email: parsed.email,
                      name: parsed.name,
                      picture: parsed.picture
                    });
                  }
                } catch (e) { reject(e); }
              });
            }).on('error', (err) => { reject(err); });
          });
        } catch (err) {
          console.error('Google access token fetch failed:', err.message);
          res.status(401);
          throw new Error('Invalid Google access token');
        }
      }
    } else {
      // Local development/test path when GOOGLE_CLIENT_ID is not set.
      if (isJwt) {
        payload = jwt.decode(idToken);
      }
      
      if (!payload) {
        // Fallback realistic user details for local testing without OAuth configurations
        payload = {
          sub: 'google_mock_user_999888',
          email: 'google.roomie@example.com',
          name: 'Google Roomie',
          picture: 'https://api.dicebear.com/7.x/initials/svg?seed=Google%20Roomie'
        };
      }
    }

    const googleId = payload.sub || payload.googleId;
    const email = payload.email;
    const name = payload.name;
    const avatarUrl = payload.picture;

    if (!googleId || !email || !name) {
      res.status(400);
      throw new Error('Invalid Google token details');
    }

    let user = await User.findOne({ googleId });

    if (!user) {
      user = await User.findOne({ email });

      if (user) {
        user.googleId = googleId;
        if (!user.avatarUrl && avatarUrl) {
          user.avatarUrl = avatarUrl;
        }
        await user.save();
      } else {
        user = await User.create({
          name,
          email,
          googleId,
          avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
        });
      }
    }

    res.json({
      success: true,
      _id: user._id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      activeRoomId: user.activeRoomId,
      token: generateToken(user._id),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/v1/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (user) {
      res.json({
        success: true,
        _id: user._id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        activeRoomId: user.activeRoomId,
      });
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot password request
// @route   POST /api/v1/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      res.status(404);
      throw new Error('No user found with that email');
    }

    const resetToken = generateToken(user._id);
    console.log(`[PASSWORD RESET MOCK] Password reset link for: ${email}`);
    console.log(`[PASSWORD RESET MOCK] Reset Link: http://localhost:5173/reset-password?token=${resetToken}`);

    res.json({
      success: true,
      message: 'Password reset link generated. Check console logs for link.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password
// @route   POST /api/v1/auth/reset-password
// @access  Public
const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      res.status(400);
      throw new Error('Please provide token and new password');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'roomies_khata_jwt_secret_key_12345');
    const user = await User.findById(decoded.id);

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  googleLogin,
  getMe,
  forgotPassword,
  resetPassword,
};
