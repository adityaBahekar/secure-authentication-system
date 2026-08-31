const { default: mongoose } = require("mongoose");

const sessionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
      index: true,
    },

    refreshTokenHash: {
      type: String,
      required: true,
    },

    userAgent: String,

    deviceInfo: {
      browser: String,
      os: String,
      device: String,
    },

    ipAddress: String,

    lastUsedAt: Date,

    expiresAt: {
      type: Date,
      required: true,
    },

    revokedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

const sessionModel = mongoose.model("session", sessionSchema);

module.exports = sessionModel;
