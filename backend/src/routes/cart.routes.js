import express from "express";

import {
  getCartController,
  addToCartController,
  updateCartItemController,
  removeCartItemController,
  clearCartController,
} from "../controllers/cart.controller.js";

import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// All cart routes require authentication
router.use(protect);

// Get customer's cart
router.get("/", getCartController);

// Add product to cart
router.post("/", addToCartController);

// Update product quantity
router.patch("/:productId", updateCartItemController);

// Remove a product from cart
router.delete("/:productId", removeCartItemController);

// Clear entire cart
router.delete("/", clearCartController);

export default router;