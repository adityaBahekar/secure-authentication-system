const User = require("../models/user.model");
const tokenService = require("./token.service");
const bcrypt = require("bcrypt");
const sessionService = require("./session.service");
const crypto = require("crypto");
const ConflictError = require('../errors/ConflictError')
const UnauthorizedError = require('../errors/UnauthorizedError')


async function registerUser(data) {
  const { name, password, email, userAgent, ipAddress } = data;

  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await User.findOne({
    email: normalizedEmail,
  });

  if (existingUser) {
    throw new ConflictError("Email already registered");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email: normalizedEmail,
    password: hashedPassword,
  });

  const sessionId = crypto.randomUUID();
  const accessToken = tokenService.generateAccessToken({
    sub: user._id,
    role: user.role,
  });

  const refreshToken = tokenService.generateRefreshToken({
    sub: user._id,
    sessionId,
    jti: crypto.randomUUID(),
  });

  await sessionService.createSession({
    userId: user._id,
    sessionId,
    refreshToken,
    userAgent,
    ipAddress,
  });

  const userResponse = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isVerified: user.isVerified,
  };

  return {
    user: userResponse,
    accessToken,
    refreshToken,
  };
}

async function loginUser(data) {
  const { email, password, userAgent, ipAddress } = data;

  const normalizedEmail = email.trim().toLowerCase();

  const user = await User.findOne({
    email: normalizedEmail,
  }).select("+password");

  if (!user) {
    throw new UnauthorizedError("Invalid email or password");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new UnauthorizedError("Invalid email or password");
  }

  const sessionId = crypto.randomUUID();
  const accessToken = tokenService.generateAccessToken({
    sub: user._id,
    role: user.role,
  });

  const refreshToken = tokenService.generateRefreshToken({
    sub: user._id,
    sessionId,
    jti: crypto.randomUUID(),
  });

  await sessionService.createSession({
    userId: user._id,
    sessionId,
    refreshToken,
    userAgent,
    ipAddress,
  });

  const userResponse = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isVerified: user.isVerified,
  };

  return {
    user: userResponse,
    accessToken,
    refreshToken,
  };
}

async function logoutUser(refreshToken) {
  return sessionService.revokeSession(refreshToken);
}

async function logoutAllUser(refreshToken) {
  return sessionService.revokeAllSessions(refreshToken);
}

async function refreshUserSession(refreshToken) {
  return sessionService.refreshSession(refreshToken);
}

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  logoutAllUser,
  refreshUserSession,
};
