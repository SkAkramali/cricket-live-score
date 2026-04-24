const bcrypt = require("bcrypt");
const db = require("../database");
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require("../utils/jwt");

/**
 * Signup Handler - Register new user with JWT
 */
const signupHandler = async (req, res) => {
  try {
    const { username, password, email, full_name, phone, role } = req.body;

    // Validate required fields
    if (!username || !password || !email) {
      return res.status(400).json({
        success: false,
        message: "Username, email, and password are required"
      });
    }

    // Check if user already exists
    const [existingUser] = await db.execute(
      "SELECT user_id FROM users WHERE email = ? OR username = ?",
      [email, username]
    );

    if (existingUser.length > 0) {
      return res.status(409).json({
        success: false,
        message: "User with this email or username already exists"
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const [result] = await db.execute(
      "INSERT INTO users (username, password, email, full_name, phone, role) VALUES (?, ?, ?, ?, ?, ?)",
      [username, hashedPassword, email, full_name || null, phone || null, role || 'player']
    );

    // Generate tokens
    const payload = {
      user_id: result.insertId,
      username,
      email,
      role: role || 'player'
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user: {
          user_id: result.insertId,
          username,
          email,
          full_name: full_name || null,
          role: role || 'player'
        },
        accessToken,
        refreshToken
      }
    });
  } catch (err) {
    console.error('Signup error:', err);

    // Handle specific MySQL errors
    if (err.code === 'ER_NO_SUCH_TABLE') {
      return res.status(500).json({
        success: false,
        message: "Database table 'users' does not exist. Please restart the server to initialize tables.",
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }

    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: "User with this email or username already exists"
      });
    }

    if (err.code === 'ECONNREFUSED') {
      return res.status(500).json({
        success: false,
        message: "Database connection failed. Please check if MySQL is running.",
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to register user",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

/**
 * Login Handler - Authenticate user and return JWT
 */
const loginHandler = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    // Get user from database
    const [users] = await db.execute(
      "SELECT user_id, username, email, password, full_name, role, is_active FROM users WHERE email = ?",
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    const user = users[0];

    // Check if user is active
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: "Account is deactivated. Please contact support."
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    // Generate tokens
    const payload = {
      user_id: user.user_id,
      username: user.username,
      email: user.email,
      role: user.role
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          user_id: user.user_id,
          username: user.username,
          email: user.email,
          full_name: user.full_name,
          role: user.role
        },
        accessToken,
        refreshToken
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({
      success: false,
      message: "Failed to login",
      error: err.message
    });
  }
};

/**
 * Get Current User Handler - Return authenticated user info
 */
const getCurrentUserHandler = async (req, res) => {
  try {
    // req.user is set by authenticateToken middleware
    const [users] = await db.execute(
      "SELECT user_id, username, email, full_name, phone, role, created_at FROM users WHERE user_id = ?",
      [req.user.user_id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user: users[0]
      }
    });
  } catch (err) {
    console.error('Get current user error:', err);
    res.status(500).json({
      success: false,
      message: "Failed to get user info",
      error: err.message
    });
  }
};

/**
 * Refresh Token Handler - Generate new access token
 */
const refreshTokenHandler = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: "Refresh token is required"
      });
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // Generate new access token
    const payload = {
      user_id: decoded.user_id,
      username: decoded.username,
      email: decoded.email,
      role: decoded.role
    };

    const newAccessToken = generateAccessToken(payload);

    res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      data: {
        accessToken: newAccessToken
      }
    });
  } catch (err) {
    console.error('Refresh token error:', err);
    res.status(401).json({
      success: false,
      message: "Invalid or expired refresh token",
      error: err.message
    });
  }
};

/**
 * Update Profile Handler
 */
const updateProfileHandler = async (req, res) => {
  try {
    const { full_name, phone } = req.body;
    const userId = req.user.user_id;

    await db.execute(
      "UPDATE users SET full_name = ?, phone = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?",
      [full_name, phone, userId]
    );

    res.status(200).json({
      success: true,
      message: "Profile updated successfully"
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
      error: err.message
    });
  }
};

/**
 * Change Password Handler
 */
const changePasswordHandler = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.user_id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required"
      });
    }

    // Get current password
    const [users] = await db.execute(
      "SELECT password FROM users WHERE user_id = ?",
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, users[0].password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect"
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await db.execute(
      "UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?",
      [hashedPassword, userId]
    );

    res.status(200).json({
      success: true,
      message: "Password changed successfully"
    });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({
      success: false,
      message: "Failed to change password",
      error: err.message
    });
  }
};

module.exports = {
  signupHandler,
  loginHandler,
  getCurrentUserHandler,
  refreshTokenHandler,
  updateProfileHandler,
  changePasswordHandler
};