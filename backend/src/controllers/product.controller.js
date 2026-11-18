import {
  archiveProduct,
  createProduct,
  getAllProducts,
  getProductById,
  getProductBySlug,
  updateProduct,
} from "../services/product.service.js";

export const createProductController = async (req, res) => {
  try {
    const {
      name,
      description,
      sku,
      price,
      categoryId,
      quantity,
      imageUrl,
    } = req.body;

    // 1. Validate required fields
    if (
      !name ||
      !description ||
      !sku ||
      price === undefined ||
      !categoryId ||
      quantity === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided",
      });
    }

    // 2. Validate string fields
    if (
      typeof name !== "string" ||
      typeof description !== "string" ||
      typeof sku !== "string" ||
      typeof categoryId !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid field types",
      });
    }

    if (
      !name.trim() ||
      !description.trim() ||
      !sku.trim() ||
      !categoryId.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "String fields cannot be empty",
      });
    }

    // 3. Validate price
    const priceString = String(price).trim();

    if (
      !/^\d+(\.\d{1,2})?$/.test(priceString) ||
      !Number.isFinite(Number(priceString)) ||
      Number(priceString) <= 0 ||
      Number(priceString) >= 100000000
    ) {
      return res.status(400).json({
        success: false,
        message: "Price must be a positive number with at most 2 decimal places",
      });
    }

    // 4. Validate quantity
    if (
      !Number.isInteger(quantity) ||
      quantity < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be a non-negative integer",
      });
    }

    // 5. Validate image URL if provided
    if (imageUrl !== undefined && imageUrl !== null) {
      if (typeof imageUrl !== "string") {
        return res.status(400).json({
          success: false,
          message: "Image URL must be a string",
        });
      }

      try {
        const parsedUrl = new URL(imageUrl);

        if (!["http:", "https:"].includes(parsedUrl.protocol)) {
          throw new Error("INVALID_URL");
        }
      } catch {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid image URL",
        });
      }
    }

    // 6. Call Product Service
    const product = await createProduct({
      name,
      description,
      sku,
      price: priceString,
      categoryId,
      quantity,
      imageUrl,
    });

    // 7. Send success response
    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });

  } catch (error) {
    // Category validation
    if (error.message === "CATEGORY_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Category not found or inactive",
      });
    }

    // Duplicate SKU
    if (error.message === "DUPLICATE_PRODUCT_SKU") {
      return res.status(409).json({
        success: false,
        message: "Product SKU already exists",
      });
    }

    // Duplicate slug
    if (error.message === "DUPLICATE_PRODUCT_SLUG") {
      return res.status(409).json({
        success: false,
        message: "Product with this name already exists",
      });
    }

    // Other unique constraint violation
    if (error.message === "DUPLICATE_PRODUCT_FIELD") {
      return res.status(409).json({
        success: false,
        message: "A unique product field already exists",
      });
    }

    // Invalid product name
    if (error.message === "INVALID_PRODUCT_NAME") {
      return res.status(400).json({
        success: false,
        message: "Invalid product name",
      });
    }

    console.error("Create product error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


export const getAllProductsController = async (req, res) => {
  try {
    const {
      page = "1",
      limit = "10",
      search,
      categoryId,
      sortBy = "createdAt",
      order = "desc",
    } = req.query;

    // 1. Validate pagination
    const parsedPage = Number(page);
    const parsedLimit = Number(limit);

    if (
      !Number.isInteger(parsedPage) ||
      !Number.isInteger(parsedLimit) ||
      parsedPage < 1 ||
      parsedLimit < 1 ||
      parsedLimit > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid pagination parameters",
      });
    }

    // 2. Validate sorting fields
    const allowedSortFields = [
      "name",
      "price",
      "createdAt",
    ];

    if (!allowedSortFields.includes(sortBy)) {
      return res.status(400).json({
        success: false,
        message: "Invalid sortBy field",
      });
    }

    // 3. Validate sorting order
    if (!["asc", "desc"].includes(order)) {
      return res.status(400).json({
        success: false,
        message: "Order must be either asc or desc",
      });
    }

    // 4. Validate optional filters
    if (search !== undefined && !search.trim()) {
      return res.status(400).json({
        success: false,
        message: "Search cannot be empty",
      });
    }

    if (
      categoryId !== undefined &&
      !categoryId.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Category ID cannot be empty",
      });
    }

    // 5. Call Product Service
    const result = await getAllProducts({
      page: parsedPage,
      limit: parsedLimit,
      search,
      categoryId,
      sortBy,
      order,
    });

    return res.status(200).json({
      success: true,
      message: "Products retrieved successfully",
      data: result.products,
      pagination: result.pagination,
    });

  } catch (error) {
    console.error("Get products error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


export const getProductByIdController = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await getProductById(id);

    return res.status(200).json({
      success: true,
      message: "Product retrieved successfully",
      data: product,
    });

  } catch (error) {
    if (error.message === "PRODUCT_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Product not found or unavailable",
      });
    }

    console.error("Get product by ID error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


export const getProductBySlugController = async (req, res) => {
  try {
    const { slug } = req.params;

    const product = await getProductBySlug(slug);

    return res.status(200).json({
      success: true,
      message: "Product retrieved successfully",
      data: product,
    });

  } catch (error) {
    if (error.message === "PRODUCT_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Product not found or unavailable",
      });
    }

    console.error("Get product by slug error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


export const updateProductController = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      name,
      description,
      sku,
      price,
      categoryId,
      imageUrl,
      status,
    } = req.body;

    // 1. Validate that at least one field is provided
    const allowedFields = [
      "name",
      "description",
      "sku",
      "price",
      "categoryId",
      "imageUrl",
      "status",
    ];

    const providedFields = Object.keys(req.body || {});

    if (
      providedFields.length === 0 ||
      providedFields.some((field) => !allowedFields.includes(field))
    ) {
      return res.status(400).json({
        success: false,
        message: "Provide valid product fields to update",
      });
    }

    // 2. Validate string fields
    const stringFields = {
      name,
      description,
      sku,
      categoryId,
    };

    for (const [field, value] of Object.entries(stringFields)) {
      if (value !== undefined) {
        if (typeof value !== "string" || !value.trim()) {
          return res.status(400).json({
            success: false,
            message: `${field} must be a non-empty string`,
          });
        }
      }
    }

    // 3. Validate price
    let priceString;

    if (price !== undefined) {
      priceString = String(price).trim();

      if (
        !/^\d+(\.\d{1,2})?$/.test(priceString) ||
        !Number.isFinite(Number(priceString)) ||
        Number(priceString) <= 0 ||
        Number(priceString) >= 100000000
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid product price",
        });
      }
    }

    // 4. Validate image URL
    if (imageUrl !== undefined && imageUrl !== null) {
      if (typeof imageUrl !== "string") {
        return res.status(400).json({
          success: false,
          message: "Image URL must be a string or null",
        });
      }

      try {
        const parsedUrl = new URL(imageUrl);

        if (!["http:", "https:"].includes(parsedUrl.protocol)) {
          throw new Error("INVALID_URL");
        }
      } catch {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid image URL",
        });
      }
    }

    // 5. Validate product status
    const allowedStatuses = ["DRAFT", "ACTIVE", "ARCHIVED"];

    if (
      status !== undefined &&
      !allowedStatuses.includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid product status",
      });
    }

    // 6. Call service
    const product = await updateProduct(id, {
      name,
      description,
      sku,
      price: priceString,
      categoryId,
      imageUrl,
      status,
    });

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: product,
    });

  } catch (error) {
    if (error.message === "PRODUCT_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (error.message === "CATEGORY_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Category not found or inactive",
      });
    }

    if (error.message === "DUPLICATE_PRODUCT_SKU") {
      return res.status(409).json({
        success: false,
        message: "Product SKU already exists",
      });
    }

    if (error.message === "DUPLICATE_PRODUCT_SLUG") {
      return res.status(409).json({
        success: false,
        message: "Product with this name already exists",
      });
    }

    if (error.message === "DUPLICATE_PRODUCT_FIELD") {
      return res.status(409).json({
        success: false,
        message: "A unique product field already exists",
      });
    }

    if (error.message === "INVALID_PRODUCT_NAME") {
      return res.status(400).json({
        success: false,
        message: "Invalid product name",
      });
    }

    if (error.message === "NO_UPDATE_DATA") {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update",
      });
    }

    console.error("Update product error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const archiveProductController = async (req, res) => {
  try {
    const product = await archiveProduct(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Product archived successfully",
      data: product,
    });
  } catch (error) {
    if (error.message === "PRODUCT_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (error.message === "PRODUCT_ALREADY_ARCHIVED") {
      return res.status(409).json({
        success: false,
        message: "Product is already archived",
      });
    }

    console.error("Archive product error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


    
