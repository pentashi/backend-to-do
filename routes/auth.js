const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const User = require('../models/Users');

// Rate limiter for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: { errors: [{ msg: 'Too many attempts. Please try again later.' }] }
});

// @route   POST /api/auth/signup
// @desc    Register a new user
router.post(
  '/signup',
  [
    check('name', 'Name is required').trim().not().isEmpty(),
    check('email', 'Please include a valid email').isEmail().normalizeEmail(),
    check(
      'password',
      'Password must be at least 8 characters long and include one number, one special character, and one uppercase letter.'
    ).matches(/^(?=.*[A-Z])(?=.*[0-9])(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {
      // Check if user already exists
      let user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({ 
          errors: [{ msg: 'User already exists' }] 
        });
      }

      // Create user with plain password - let the model middleware handle hashing
      user = new User({
        name: name.trim(),
        email,
        password  // plain password here
      });

      await user.save();

      // Generate tokens
      const accessToken = generateAccessToken(user._id);
      const refreshToken = generateRefreshToken(user._id);

      // Save refresh token to user
      user.refreshToken = refreshToken;
      await user.save();

      res.status(201).json({
        accessToken,
        refreshToken
      });
    } catch (error) {
      console.error('Error in signup:', error.message);
      res.status(500).json({ errors: [{ msg: 'Server error' }] });
    }
  }
);

// @route   POST /api/auth/login
// @desc    Authenticate user and return token
router.post('/login', authLimiter, async (req, res) => {
  const { email, password } = req.body;

  try {
    console.log('Looking for user with email:', email);
    const user = await User.findOne({ email }).select('+password');
    console.log('Found user:', user ? 'Yes' : 'No');

    if (!user) {
      return res.status(401).json({ 
        errors: [{ msg: 'Invalid credentials' }] 
      });
    }

    console.log('Stored password hash:', user.password);
    console.log('Hash version in DB:', user.password.substring(0, 7));
    
    console.log('Attempting password comparison...');
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password comparison result:', isMatch);

    if (!isMatch) {
      return res.status(401).json({ 
        errors: [{ msg: 'Invalid credentials' }] 
      });
    }

    // Only generate and send tokens if password matches
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    res.status(200).json({
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('Error in login:', error.message);
    res.status(500).json({ errors: [{ msg: 'Server error' }] });
  }
});

// @route   POST /api/auth/refresh-token
// @desc    Get new access token using refresh token
router.post('/refresh-token', async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ errors: [{ msg: 'Refresh token required' }] });
  }

  try {
    const user = await User.findOne({ refreshToken });
    if (!user) {
      return res.status(401).json({ errors: [{ msg: 'Invalid refresh token' }] });
    }

    // Verify refresh token
    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Generate new access token
    const accessToken = generateAccessToken(user._id);

    res.json({ accessToken });
  } catch (error) {
    return res.status(401).json({ errors: [{ msg: 'Invalid refresh token' }] });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user and invalidate refresh token
router.post('/logout', async (req, res) => {
  const { refreshToken } = req.body;

  try {
    // Find user and remove refresh token
    await User.findOneAndUpdate(
      { refreshToken },
      { $set: { refreshToken: null } }
    );

    res.status(200).json({ msg: 'Logged out successfully' });
  } catch (error) {
    console.error('Error in logout:', error.message);
    res.status(500).json({ errors: [{ msg: 'Server error' }] });
  }
});

// Helper functions for token generation
function generateAccessToken(userId) {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' }
  );
}

function generateRefreshToken(userId) {
  return jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
}

module.exports = router;
