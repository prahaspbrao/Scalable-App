import {
  getInventoryByProductId,
  updateInventory,
  reserveStock,
  releaseStock,
  getLowStockProducts,
} from "../services/inventory.service.js";

export const getInventoryController = async (req, res) => {
  try {
    const inventory = await getInventoryByProductId(req.params.productId);

    return res.status(200).json({
      success: true,
      message: "Inventory retrieved successfully",
      data: inventory,
    });
  } catch (error) {
    if (error.message === "INVENTORY_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Inventory not found for this product",
      });
    }

    console.error("Get inventory error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const updateInventoryController = async (req, res) => {
  try {
    const { quantityChange } = req.body;
    const { productId } = req.params;

    if (
      quantityChange === undefined ||
      !Number.isInteger(quantityChange) ||
      quantityChange === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "quantityChange must be a non-zero integer",
      });
    }

    const inventory = await updateInventory(productId, quantityChange);

    return res.status(200).json({
      success: true,
      message: "Inventory updated successfully",
      data: {
        ...inventory,
        available: inventory.quantity - inventory.reserved,
      },
    });
  } catch (error) {
    if (error.message === "INVENTORY_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Inventory not found for this product",
      });
    }

    if (error.message === "INSUFFICIENT_STOCK") {
      return res.status(400).json({
        success: false,
        message: "Cannot reduce quantity below reserved stock",
      });
    }

    console.error("Update inventory error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const reserveStockController = async (req, res) => {
  try {
    const { quantity } = req.body;
    const { productId } = req.params;

    if (!Number.isInteger(quantity) || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be a positive integer",
      });
    }

    const inventory = await reserveStock(productId, quantity);

    return res.status(200).json({
      success: true,
      message: "Stock reserved successfully",
      data: {
        ...inventory,
        available: inventory.quantity - inventory.reserved,
      },
    });
  } catch (error) {
    if (error.message === "INVENTORY_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Inventory not found for this product",
      });
    }

    if (error.message === "INSUFFICIENT_STOCK") {
      return res.status(409).json({
        success: false,
        message: "Insufficient available stock",
      });
    }

    console.error("Reserve stock error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const releaseStockController = async (req, res) => {
  try {
    const { quantity } = req.body;
    const { productId } = req.params;

    if (!Number.isInteger(quantity) || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be a positive integer",
      });
    }

    const inventory = await releaseStock(productId, quantity);

    return res.status(200).json({
      success: true,
      message: "Reserved stock released successfully",
      data: {
        ...inventory,
        available: inventory.quantity - inventory.reserved,
      },
    });
  } catch (error) {
    if (error.message === "INVENTORY_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Inventory not found for this product",
      });
    }

    if (error.message === "INSUFFICIENT_RESERVED_STOCK") {
      return res.status(409).json({
        success: false,
        message: "Cannot release more stock than currently reserved",
      });
    }

    console.error("Release stock error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getLowStockProductsController = async (req, res) => {
  try {
    const threshold =
      req.query.threshold === undefined ? 10 : Number(req.query.threshold);

    if (!Number.isInteger(threshold) || threshold < 0) {
      return res.status(400).json({
        success: false,
        message: "Threshold must be a non-negative integer",
      });
    }

    const products = await getLowStockProducts(threshold);

    return res.status(200).json({
      success: true,
      message: "Low-stock products retrieved successfully",
      data: {
        threshold,
        count: products.length,
        products,
      },
    });
  } catch (error) {
    console.error("Get low-stock products error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve low-stock products",
    });
  }
};