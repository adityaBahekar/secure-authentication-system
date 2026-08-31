const User = require("../models/user.model");

async function getUserById(id){
  const user = await User.findById(id);

  if (!user) {
    throw new Error("User not found");
  }

  const userResponse = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isVerified: user.isVerified,
  };

  return userResponse;
}

module.exports = { getUserById };
