const jwt = require("jsonwebtoken");

function signToken(payload, secret, expiresIn) {
  return jwt.sign(payload, secret, {
    expiresIn,
  });
}

function generateAccessToken({ sub, role }) {
  const payload = {
    sub,
    role,
  };

  const secret = process.env.ACCESS_TOKEN_SECRET;
  const expiresIn = process.env.ACCESS_TOKEN_EXPIRES_IN;

  return signToken(payload, secret, expiresIn);
}

function generateRefreshToken({ sub, sessionId, jti }) {
  const payload = {
    sub,
    sessionId,
    jti,
  };

  const secret = process.env.REFRESH_TOKEN_SECRET;
  const expiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN;

  return signToken(payload, secret, expiresIn);
}

module.exports = { generateAccessToken, generateRefreshToken };
