
import express from "express";

import {
  archiveProductController,
  createProductController,
  getAllProductsController,
  getProductByIdController,
  getProductBySlugController,
  updateProductController,
} from "../controllers/product.controller.js";

import {
  protect,
  authorize,
} from "../middleware/auth.middleware.js";

const router = express.Router();

// Public: Get all active products
router.get("/", getAllProductsController);

router.get("/slug/:slug", getProductBySlugController);

// Public: Get product by ID
router.get("/:id", getProductByIdController);

// Admin only: Update product
router.patch(
  "/:id",
  protect,
  authorize("ADMIN"),
  updateProductController
);

// Admin only: Create product
router.post(
  "/",
  protect,
  authorize("ADMIN"),
  createProductController
);

router.delete(
  "/:id",
  protect,
  authorize("ADMIN"),
  archiveProductController
);

export default router;
