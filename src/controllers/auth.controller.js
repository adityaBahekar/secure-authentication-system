const authService = require("../services/auth.service");

function getRefreshTokenOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  };
}

async function registerController(req, res, next) {
  const { name, email, password } = req.body;
  const userAgent = req.headers["user-agent"];
  const ipAddress = req.ip;

  const result = await authService.registerUser({
    name,
    email,
    password,
    userAgent,
    ipAddress,
  });

  const { user, accessToken, refreshToken } = result;

  const cookieOptions = getRefreshTokenOptions();

  res.cookie("refreshToken", refreshToken, cookieOptions);

  return res.status(201).json({
    status: "success",
    message: "User register sucessfully",
    response: {
      user,
      accessToken,
    },
  });
}

async function loginController(req, res, next) {
  const { email, password } = req.body;
  const userAgent = req.headers["user-agent"];
  const ipAddress = req.ip;

  const result = await authService.loginUser({
    email,
    password,
    userAgent,
    ipAddress,
  });

  const { user, accessToken, refreshToken } = result;

  const cookieOptions = getRefreshTokenOptions();

  res.cookie("refreshToken", refreshToken, cookieOptions);

  return res.status(200).json({
    status: "success",
    message: "User login sucessfully",
    response: {
      user,
      accessToken,
    },
  });
}

async function refreshController(req, res) {
  const incomingRefreshToken = req.cookies.refreshToken;

  if (!incomingRefreshToken) {
    return res.status(401).json({
      status: "error",
      message: "Refresh token is required",
    });
  }

  const tokens = await authService.refreshUserSession(incomingRefreshToken);

  res.cookie("refreshToken", tokens.refreshToken, getRefreshTokenOptions());

  return res.status(200).json({
    status: "success",
    message: "Refresh token rotated",
    data: { accessToken: tokens.accessToken },
  });
}

async function logoutController(req, res) {
  const refreshToken = req.cookies.refreshToken;
  await authService.logoutUser(refreshToken);
  res.clearCookie("refreshToken", getRefreshTokenOptions());
  return res.status(200).json({
    status: "success",
    message: "User loged out",
  });
}

async function logoutAllController(req, res) {
  const refreshToken = req.cookies.refreshToken;
  await authService.logoutAllUser(refreshToken);
  res.clearCookie("refreshToken", getRefreshTokenOptions());
  return res.status(200).json({
    status: "success",
    message: "All User loged out",
  });
}

module.exports = {
  registerController,
  loginController,
  refreshController,
  logoutController,
  logoutAllController,
};
