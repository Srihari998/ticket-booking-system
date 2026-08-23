const bcrypt = require('bcryptjs');
const { query } = require('../db');
const { ValidationError, UnauthorizedError, ConflictError } = require('../utils/errors');
const { successResponse } = require('../utils/response');
const { generateAuthToken } = require('../utils/tokens');

const register = async (req, res, next) => {
  try {
    const { name, email, password, role = 'CUSTOMER' } = req.body;

    if (!name || !email || !password) {
      throw new ValidationError('Name, email, and password are required');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ValidationError('Please provide a valid email address');
    }

    if (password.length < 6) {
      throw new ValidationError('Password must be at least 6 characters long');
    }

    const validRoles = ['CUSTOMER', 'ORGANISER', 'ADMIN'];
    const assignedRole = validRoles.includes(role) ? role : 'CUSTOMER';

    const existingUser = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (existingUser.rows.length > 0) {
      throw new ConflictError('A user with this email address already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role, created_at`,
      [name.trim(), email.toLowerCase().trim(), passwordHash, assignedRole]
    );

    const user = result.rows[0];
    const token = generateAuthToken(user);

    return successResponse(
      res,
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.created_at
        },
        token
      },
      201
    );
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ValidationError('Email and password are required');
    }

    const result = await query('SELECT id, name, email, password_hash, role, created_at FROM users WHERE email = $1', [
      email.toLowerCase().trim()
    ]);

    if (result.rows.length === 0) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const user = result.rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const token = generateAuthToken(user);

    return successResponse(res, {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.created_at
      },
      token
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const result = await query('SELECT id, name, email, role, created_at FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) {
      throw new UnauthorizedError('User account not found');
    }
    return successResponse(res, { user: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe
};
