const settingsService = require("../services/settingsService");

/**
 * @desc Get global system configuration settings
 */
const getSettings = async (req, res, next) => {
  try {
    const data = await settingsService.getSettings();
    res.status(200).json({ success: true, message: "System settings loaded", data });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Save store general settings details
 */
const updateStore = async (req, res, next) => {
  try {
    const data = await settingsService.updateStoreSettings(req.body);
    res.status(200).json({ success: true, message: "Store settings updated successfully", data });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Updates general theme choices
 */
const updateTheme = async (req, res, next) => {
  try {
    const data = await settingsService.updateStoreSettings({ theme: req.body.theme });
    res.status(200).json({ success: true, message: "Theme settings updated successfully", data });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Updates passwords and security policies configurations
 */
const updateSecurity = async (req, res, next) => {
  try {
    const data = await settingsService.updateStoreSettings(req.body);
    res.status(200).json({ success: true, message: "Security settings updated successfully", data });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Updates currency separator parameters
 */
const updateCurrency = async (req, res, next) => {
  try {
    const data = await settingsService.updateStoreSettings(req.body);
    res.status(200).json({ success: true, message: "Currency settings updated successfully", data });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Updates tax percentage brackets
 */
const updateTax = async (req, res, next) => {
  try {
    const data = await settingsService.updateStoreSettings(req.body);
    res.status(200).json({ success: true, message: "Tax settings updated successfully", data });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Updates default notification delivery settings
 */
const updateNotifications = async (req, res, next) => {
  try {
    const data = await settingsService.updateStoreSettings({ notificationDefaults: req.body.notificationDefaults });
    res.status(200).json({ success: true, message: "Notification defaults updated successfully", data });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSettings,
  updateStore,
  updateTheme,
  updateSecurity,
  updateCurrency,
  updateTax,
  updateNotifications,
};
