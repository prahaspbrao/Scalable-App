
import express from "express";

import {
  createCategoryController,
  getAllCategoriesController,
  getCategoryByIdController,
  updateCategoryController,
  deleteCategoryController,
} from "../controllers/category.controller.js";
import {
    protect,
    authorize,
} from "../middleware/auth.middleware.js";

const router = express.Router();

// Create category - ADMIN only
router.post(
    "/",
    protect,
    authorize("ADMIN"),
    createCategoryController
);

// Get all active categories - Public
router.get("/", getAllCategoriesController);

// Get category by ID - Public
router.get("/:id", getCategoryByIdController);

// Update category - ADMIN only
router.patch(
    "/:id",
    protect,
    authorize("ADMIN"),
    updateCategoryController
);

// Delete category by ID
router.delete(
  "/:id",
  protect,
  authorize("ADMIN"),
  deleteCategoryController
); 


export default router;
