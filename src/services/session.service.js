const Session = require("../models/session.model");
const tokenService = require("./token.service");
const sha256 = require("sha256");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const UnauthorizedError = require('../errors/UnauthorizedError')

async function createSession({ userId, sessionId, refreshToken, userAgent, ipAddress }) {
  const refreshTokenHash = sha256(refreshToken);

  return Session.create({
    sessionId,
    userId,
    refreshTokenHash,
    userAgent,
    ipAddress,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });
}

async function updateSession(session, newRefreshToken) {
  session.refreshTokenHash = sha256(newRefreshToken);
  session.lastUsedAt = new Date();
  session.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await session.save();
  return session;
}

async function refreshSession(refreshToken) {
  let payload;

  try {
    payload = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
  } catch (err) {
    throw new UnauthorizedError("Invalid or expired token");
  }

  const session = await Session.findOne({
    sessionId: payload.sessionId,
  }).populate("userId", "_id role");

  if (!session) {
    throw new UnauthorizedError("Invalid or expired session");
  }

  if (session.expiresAt < new Date()) {
    throw new UnauthorizedError("Invalid or expired session");
  }

  if (session.revokedAt) {
    throw new UnauthorizedError("Invalid or expired session");
  }

  const userTokenHash = sha256(refreshToken);

  if (userTokenHash !== session.refreshTokenHash) {
    throw new UnauthorizedError("Invalid refresh token");
  }

  const accessToken = tokenService.generateAccessToken({
    sub: session.userId._id,
    role: session.userId.role,
  });

  const newRefreshToken = tokenService.generateRefreshToken({
    sub: session.userId._id,
    sessionId: session.sessionId,
    jti: crypto.randomUUID(),
  });

  await updateSession(session, newRefreshToken);

  return {
    accessToken,
    refreshToken: newRefreshToken,
  };
}

async function revokeSession(refreshToken) {
  if (!refreshToken) {
    return;
  }

  let payload;

  try {
    payload = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
  } catch (err) {
    return;
  }

  const session = await Session.findOne({
    sessionId: payload.sessionId,
  });

  if (!session || session.expiresAt < new Date() || session.revokedAt) {
    return;
  }

  session.revokedAt = new Date();
  await session.save();
}

async function revokeAllSessions(refreshToken) {
  if (!refreshToken) {
    return;
  }

  let payload;
  const now = new Date();

  try {
    payload = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
  } catch (err) {
    return;
  }

  await Session.updateMany(
    {
      userId: payload.sub,
      revokedAt: null,
    },
    {
      revokedAt: now,
    },
  );
}

module.exports = {
  createSession,
  updateSession,
  refreshSession,
  revokeSession,
  revokeAllSessions,
};

