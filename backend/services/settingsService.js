const StoreSettings = require("../models/StoreSettings");

// Global memory cache storing store settings
let settingsCache = null;

/**
 * @desc Invalidate store settings cache key
 */
const invalidateSettingsCache = () => {
  settingsCache = null;
  console.log("[Settings Cache] Global Store Settings cache successfully invalidated.");
};

/**
 * @desc Fetch singleton settings document or initialize a default one
 */
const getSettings = async () => {
  if (settingsCache) return settingsCache;

  let settings = await StoreSettings.findOne({});
  if (!settings) {
    settings = await StoreSettings.create({});
  }
  settingsCache = settings.toObject();
  return settingsCache;
};

/**
 * @desc Updates settings payload and invalidates cache
 */
const updateStoreSettings = async (data) => {
  const settings = await StoreSettings.findOneAndUpdate({}, data, { returnDocument: "after", upsert: true });
  invalidateSettingsCache();
  return settings;
};

module.exports = {
  getSettings,
  updateStoreSettings,
  invalidateSettingsCache,
};
