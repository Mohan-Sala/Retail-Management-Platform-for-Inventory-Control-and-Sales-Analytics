const customerMarketplaceService = require("../services/customerMarketplaceService");
const ApiResponse = require("../utils/ApiResponse");

const getProducts = async (req, res, next) => {
  try {
    const productsData = await customerMarketplaceService.getMarketplaceProducts(req.query);
    return res.status(200).json(new ApiResponse(200, productsData, "Marketplace products fetched successfully"));
  } catch (e) {
    next(e);
  }
};

const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await customerMarketplaceService.getMarketplaceProductDetails(id);
    if (!product) {
      return res.status(404).json(new ApiResponse(404, null, "Product not found or inactive"));
    }
    return res.status(200).json(new ApiResponse(200, product, "Product details fetched successfully"));
  } catch (e) {
    next(e);
  }
};

module.exports = {
  getProducts,
  getProductById,
};
