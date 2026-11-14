import {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} from "../services/category.service.js";

export const createCategoryController = async (req, res) => {
    try {
        const { name, description, parentId } = req.body || {};

        // Validate required field
        if (!name || typeof name !== "string" || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Category name is required",
            });
        }

        if (
            description !== undefined &&
            description !== null &&
            typeof description !== "string"
        ) {
            return res.status(400).json({
                success: false,
                message: "Description must be a string",
            });
        }

        if (
            parentId !== undefined &&
            parentId !== null &&
            (typeof parentId !== "string" || !parentId.trim())
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid parent category ID",
            });
        }

        // Call service
        const category = await createCategory({
            name,
            description,
            parentId: parentId || null,
        });

        return res.status(201).json({
            success: true,
            message: "Category created successfully",
            data: category,
        });

    } catch (error) {
        if (error.message === "CATEGORY_ALREADY_EXISTS") {
            return res.status(409).json({
                success: false,
                message: "A category with this name already exists",
            });
        }

        if (error.message === "PARENT_CATEGORY_NOT_FOUND") {
            return res.status(404).json({
                success: false,
                message: "Parent category not found or inactive",
            });
        }

        if (error.message === "INVALID_CATEGORY_NAME") {
            return res.status(400).json({
                success: false,
                message: "Invalid category name",
            });
        }

        console.error("Create category error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};


export const getAllCategoriesController = async (req, res) => {
    try {
        const categories = await getAllCategories();

        return res.status(200).json({
            success: true,
            message: "Categories retrieved successfully",
            count: categories.length,
            data: categories,
        });

    } catch (error) {
        console.error("Get categories error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};


export const getCategoryByIdController = async (req, res) => {
    try {
        const { id } = req.params;

        const category = await getCategoryById(id);

        return res.status(200).json({
            success: true,
            message: "Category retrieved successfully",
            data: category,
        });

    } catch (error) {
        if (error.message === "CATEGORY_NOT_FOUND") {
            return res.status(404).json({
                success: false,
                message: "Category not found",
            });
        }

        console.error("Get category by ID error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};


export const updateCategoryController = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, parentId } = req.body || {};

        // Validate request body
        if (
            name === undefined &&
            description === undefined &&
            parentId === undefined
        ) {
            return res.status(400).json({
                success: false,
                message: "At least one field is required for update",
            });
        }

        if (
            name !== undefined &&
            (typeof name !== "string" || !name.trim())
        ) {
            return res.status(400).json({
                success: false,
                message: "Category name must be a non-empty string",
            });
        }

        if (
            description !== undefined &&
            description !== null &&
            typeof description !== "string"
        ) {
            return res.status(400).json({
                success: false,
                message: "Description must be a string",
            });
        }

        if (
            parentId !== undefined &&
            parentId !== null &&
            typeof parentId !== "string"
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid parent category ID",
            });
        }

        const category = await updateCategory(id, {
            name,
            description,
            parentId,
        });

        return res.status(200).json({
            success: true,
            message: "Category updated successfully",
            data: category,
        });

    } catch (error) {
        const errors = {
            CATEGORY_NOT_FOUND: [404, "Category not found"],
            CATEGORY_ALREADY_EXISTS: [409, "Category name already exists"],
            PARENT_CATEGORY_NOT_FOUND: [404, "Parent category not found or inactive"],
            INVALID_CATEGORY_NAME: [400, "Invalid category name"],
            INVALID_PARENT_CATEGORY: [400, "A category cannot be its own parent"],
            CIRCULAR_CATEGORY_HIERARCHY: [400, "Circular category hierarchy is not allowed"],
            INVALID_DESCRIPTION: [400, "Description must be a string"],
            NO_UPDATE_DATA: [400, "No valid fields provided for update"],
        };

        const knownError = errors[error.message];

        if (knownError) {
            return res.status(knownError[0]).json({
                success: false,
                message: knownError[1],
            });
        }

        console.error("Update category error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};


export const deleteCategoryController = async (req, res) => {
  try {
    const { id } = req.params;

    await deleteCategory(id);

    return res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    if (error.message === "CATEGORY_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    if (error.message === "CATEGORY_HAS_ACTIVE_CHILDREN") {
      return res.status(409).json({
        success: false,
        message: "Cannot delete category while active child categories exist",
      });
    }

    console.error("Delete category error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};



