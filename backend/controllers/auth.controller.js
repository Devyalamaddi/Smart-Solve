const User = require('../models/user.model');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/email.service');

// JWT token generation
const generateTokens = async (user) => {
  // Create access token
  const accessToken = jwt.sign(
    { 
      userId: user._id,
      role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
  
  // Create refresh token
  const refreshToken = crypto.randomBytes(40).toString('hex');
  const refreshTokenExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  
  // Store refresh token in user document
  user.refreshTokens.push({
    token: refreshToken,
    expiresAt: refreshTokenExpiry
  });
  
  // Clean up expired tokens
  user.refreshTokens = user.refreshTokens.filter(
    token => token.expiresAt > new Date()
  );
  
  await user.save();
  
  return {
    accessToken,
    refreshToken,
    expiresIn: 3600 // 1 hour in seconds
  };
};

// Register new user
exports.register = async (req, res, next) => {
  try {
    const { username, email, password, fullName, role, institution } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }]
    });
    
    if (existingUser) {
      return res.status(409).json({ 
        message: 'User with this email or username already exists' 
      });
    }
    
    // Create verification token
    const verificationToken = uuidv4();
    
    // Create new user
    const newUser = new User({
      username,
      email,
      password,
      fullName,
      role: role || 'student',
      institution,
      verificationToken
    });
    
    await newUser.save();
    
    // Send verification email
    await sendVerificationEmail(newUser.email, verificationToken);
    
    res.status(201).json({
      message: 'User registered successfully. Please check your email to verify your account.',
      userId: newUser._id
    });
  } catch (error) {
    next(error);
  }
};

// Login user
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Check if user is banned
    if (user.isBanned) {
      return res.status(403).json({ message: 'Your account has been suspended' });
    }
    
    // Check if user is verified
    if (!user.isVerified) {
      return res.status(403).json({ message: 'Please verify your email before logging in' });
    }
    
    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Update last login
    user.lastLogin = new Date();
    await user.save();
    
    // Generate tokens
    const tokens = await generateTokens(user);
    
    res.status(200).json({
      message: 'Login successful',
      user: user.getProfile(),
      ...tokens
    });
  } catch (error) {
    next(error);
  }
};

// Verify email
exports.verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;
    
    const user = await User.findOne({ verificationToken: token });
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification token' });
    }
    
    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();
    
    res.status(200).json({ message: 'Email verified successfully. You can now login.' });
  } catch (error) {
    next(error);
  }
};

// Refresh token
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }
    
    // Find user with this refresh token
    const user = await User.findOne({ 'refreshTokens.token': refreshToken });
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }
    
    // Check if token is expired
    const tokenDoc = user.refreshTokens.find(t => t.token === refreshToken);
    
    if (!tokenDoc || tokenDoc.expiresAt < new Date()) {
      // Remove expired token
      user.refreshTokens = user.refreshTokens.filter(t => t.token !== refreshToken);
      await user.save();
      
      return res.status(401).json({ message: 'Refresh token expired' });
    }
    
    // Remove used refresh token
    user.refreshTokens = user.refreshTokens.filter(t => t.token !== refreshToken);
    await user.save();
    
    // Generate new tokens
    const tokens = await generateTokens(user);
    
    res.status(200).json({
      message: 'Token refreshed successfully',
      ...tokens
    });
  } catch (error) {
    next(error);
  }
};

// Logout
exports.logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const userId = req.user.userId;
    
    // Find user
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(200).json({ message: 'Logout successful' });
    }
    
    // Remove refresh token if provided
    if (refreshToken) {
      user.refreshTokens = user.refreshTokens.filter(t => t.token !== refreshToken);
      await user.save();
    }
    
    res.status(200).json({ message: 'Logout successful' });
  } catch (error) {
    next(error);
  }
};

// Request password reset
exports.requestPasswordReset = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    const user = await User.findOne({ email });
    
    if (!user) {
      // Security best practice: don't tell if email exists or not
      return res.status(200).json({ 
        message: 'If your email is registered, you will receive a password reset link' 
      });
    }
    
    // Generate token and expiry
    const resetToken = crypto.randomBytes(20).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour
    
    // Save token to user
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpiry;
    await user.save();
    
    // Send email
    await sendPasswordResetEmail(user.email, resetToken);
    
    res.status(200).json({ 
      message: 'If your email is registered, you will receive a password reset link' 
    });
  } catch (error) {
    next(error);
  }
};

// Reset password
exports.resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({ message: 'Password reset token is invalid or has expired' });
    }
    
    // Update password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    
    // Clear refresh tokens for security
    user.refreshTokens = [];
    
    await user.save();
    
    res.status(200).json({ message: 'Password has been reset successfully' });
  } catch (error) {
    next(error);
  }
};