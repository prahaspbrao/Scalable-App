import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} from "../services/cart.service.js";

// GET /api/v1/cart
export const getCartController = async (req, res) => {
  try {
    const cart = await getCart(req.user.id);

    return res.status(200).json({
      success: true,
      message: "Cart retrieved successfully",
      data: cart,
    });
  } catch (error) {
    console.error("Get cart error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve cart",
    });
  }
};

// POST /api/v1/cart
export const addToCartController = async (req, res) => {
  try {
    const { productId, quantity } = req.body ?? {};

    if (
      typeof productId !== "string" ||
      productId.trim() === "" ||
      !Number.isInteger(quantity) ||
      quantity <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid productId and positive integer quantity are required",
      });
    }

    const cartItem = await addToCart(
      req.user.id,
      productId,
      quantity
    );

    return res.status(201).json({
      success: true,
      message: "Product added to cart successfully",
      data: cartItem,
    });
  } catch (error) {
    console.error("Add to cart error:", error);

    const errors = {
      INVALID_QUANTITY: [400, "Quantity must be a positive integer"],
      PRODUCT_NOT_AVAILABLE: [404, "Product is not available"],
      INVENTORY_NOT_FOUND: [404, "Product inventory not found"],
      INSUFFICIENT_STOCK: [409, "Insufficient available stock"],
    };

    const mappedError = errors[error.message];

    return res.status(mappedError?.[0] || 500).json({
      success: false,
      message: mappedError?.[1] || "Failed to add product to cart",
    });
  }
};

// PATCH /api/v1/cart/:productId
export const updateCartItemController = async (req, res) => {
  try {
    const { quantity } = req.body ?? {};
    const { productId } = req.params;

    if (!Number.isInteger(quantity) || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be a positive integer",
      });
    }

    const cartItem = await updateCartItem(
      req.user.id,
      productId,
      quantity
    );

    return res.status(200).json({
      success: true,
      message: "Cart item updated successfully",
      data: cartItem,
    });
  } catch (error) {
    console.error("Update cart item error:", error);

    const errors = {
      INVALID_QUANTITY: [400, "Quantity must be a positive integer"],
      CART_NOT_FOUND: [404, "Cart not found"],
      CART_ITEM_NOT_FOUND: [404, "Cart item not found"],
      PRODUCT_NOT_AVAILABLE: [404, "Product is not available"],
      INVENTORY_NOT_FOUND: [404, "Product inventory not found"],
      INSUFFICIENT_STOCK: [409, "Insufficient available stock"],
    };

    const mappedError = errors[error.message];

    return res.status(mappedError?.[0] || 500).json({
      success: false,
      message: mappedError?.[1] || "Failed to update cart item",
    });
  }
};

// DELETE /api/v1/cart/:productId
export const removeCartItemController = async (req, res) => {
  try {
    const result = await removeCartItem(
      req.user.id,
      req.params.productId
    );

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Remove cart item error:", error);

    const errors = {
      CART_NOT_FOUND: [404, "Cart not found"],
      CART_ITEM_NOT_FOUND: [404, "Cart item not found"],
    };

    const mappedError = errors[error.message];

    return res.status(mappedError?.[0] || 500).json({
      success: false,
      message: mappedError?.[1] || "Failed to remove cart item",
    });
  }
};

// DELETE /api/v1/cart
export const clearCartController = async (req, res) => {
  try {
    const result = await clearCart(req.user.id);

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Clear cart error:", error);

    if (error.message === "CART_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to clear cart",
    });
  }
};