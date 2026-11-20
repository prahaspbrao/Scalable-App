import express from "express";
import {
  getInventoryController,
  updateInventoryController,
  reserveStockController,
  releaseStockController,
  getLowStockProductsController
} from "../controllers/inventory.controller.js";
import { protect, authorize } from "../middleware/auth.middleware.js";


const router = express.Router();

router.get(
  "/low-stock",
  protect,
  authorize("ADMIN"),
  getLowStockProductsController
);

// Get inventory details (Admin only)
router.get(
  "/:productId",
  protect,
  authorize("ADMIN"),
  getInventoryController
);

// Update inventory (Admin only)
router.patch(
  "/:productId",
  protect,
  authorize("ADMIN"),
  updateInventoryController
);

// Reserve stock (Authenticated customer or admin)
router.post(
  "/:productId/reserve",
  protect,
  reserveStockController
);

// Release reserved stock (Authenticated users)
router.post(
  "/:productId/release",
  protect,
  releaseStockController
);


export default router;