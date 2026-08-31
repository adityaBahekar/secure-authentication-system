const userService = require("../services/user.service");

async function getMe(req, res, next) {
  const user = await userService.getUserById(req.user.id);
  return res.status(200).json({
    status: "success",
    message: "User fetched successfully",
    response: {
      user
    }
  });
}

module.exports = { getMe };
