const UserSession = require("../models/UserSession");

/**
 * @desc Logs new session and enforces maximum active login concurrency limits
 */
const registerSession = async (userId, sessionData) => {
  const activeCount = await UserSession.countDocuments({ userId, isRevoked: false });
  if (activeCount >= 5) {
    const oldest = await UserSession.findOne({ userId, isRevoked: false }).sort({ loginAt: 1 });
    if (oldest) {
      oldest.isRevoked = true;
      oldest.revokedAt = new Date();
      await oldest.save();
    }
  }

  const session = new UserSession({
    userId,
    ...sessionData,
  });
  await session.save();
  return session;
};

/**
 * @desc Get list of all non-expired active sessions
 */
const getActiveSessions = async (userId) => {
  return UserSession.find({ userId, isRevoked: false }).sort({ lastActivityAt: -1 }).lean();
};

/**
 * @desc Terminate specific session by ID
 */
const revokeSession = async (sessionId) => {
  return UserSession.findOneAndUpdate(
    { sessionId },
    { isRevoked: true, revokedAt: new Date() },
    { returnDocument: "after" },
  );
};

/**
 * @desc Revoke all sessions except the current session
 */
const revokeAllExcept = async (userId, currentSessionId) => {
  return UserSession.updateMany(
    { userId, sessionId: { $ne: currentSessionId } },
    { isRevoked: true, revokedAt: new Date() },
  );
};

module.exports = {
  registerSession,
  getActiveSessions,
  revokeSession,
  revokeAllExcept,
};
