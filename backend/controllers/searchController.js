const globalSearchService = require("../services/globalSearchService");

/**
 * @desc Handles incoming requests for debounced cross-module searches
 */
const search = async (req, res, next) => {
  try {
    const { q, limit = 5 } = req.query;
    const results = await globalSearchService.performSearch(req.user, q, parseInt(limit));
    res.status(200).json({ success: true, message: "Search results returned", data: results });
  } catch (error) {
    next(error);
  }
};

module.exports = { search };
