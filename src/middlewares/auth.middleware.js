const jwt = require("jsonwebtoken");
const UnauthorizedError = require("../errors/UnauthorizedError");

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw new UnauthorizedError("Authorization header is missing");
  }

  if (!authHeader.startsWith("Bearer ")) {
    throw new UnauthorizedError("Invalid Authorization header");
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    throw new UnauthorizedError("Access token is missing");
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  } catch (error) {
    throw new UnauthorizedError("Invalid or Expired access Token");
  }

  req.user = {
    id: decoded.sub,
    role: decoded.role,
  };

  return next();
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      throw new UnauthorizedError("Authentication required");
    }

    if (roles.includes(req.user.role)) {
      return next();
    } else {
      throw new ForbiddenError(
        "You do not have permission to perform this action.",
      );
    }
  };
}

module.exports = {
  authenticate,
};
