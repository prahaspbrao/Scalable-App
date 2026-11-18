
import prisma from "../config/prisma.js";

// Generate URL-friendly product slug
const generateSlug = (name) => {
  return name
    .toLowerCase()
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

// Create a new product
export const createProduct = async ({
  name,
  description,
  sku,
  price,
  categoryId,
  quantity,
  imageUrl,
}) => {
  const slug = generateSlug(name);

  if (!slug) {
    throw new Error("INVALID_PRODUCT_NAME");
  }

  try {
    return await prisma.$transaction(async (tx) => {
      // 1. Verify category exists and is active
      const category = await tx.category.findFirst({
        where: {
          id: categoryId,
          isActive: true,
        },
      });

      if (!category) {
        throw new Error("CATEGORY_NOT_FOUND");
      }

      // 2. Create product
      const product = await tx.product.create({
        data: {
          name: name.trim(),
          slug,
          description: description.trim(),
          sku: sku.trim().toUpperCase(),
          price,
          categoryId,
          imageUrl: imageUrl || null,
        },
      });

      // 3. Create inventory
      await tx.inventory.create({
        data: {
          productId: product.id,
          quantity,
          reserved: 0,
        },
      });

      // 4. Return product with category and inventory
      return await tx.product.findUnique({
        where: {
          id: product.id,
        },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          inventory: true,
        },
      });
    });
  } catch (error) {
    // Handle Prisma unique constraint violations
    if (error.code === "P2002") {
      const target = Array.isArray(error.meta?.target)
        ? error.meta.target.join(" ")
        : String(error.meta?.target || "");

      if (target.includes("sku")) {
        throw new Error("DUPLICATE_PRODUCT_SKU");
      }

      if (target.includes("slug")) {
        throw new Error("DUPLICATE_PRODUCT_SLUG");
      }

      throw new Error("DUPLICATE_PRODUCT_FIELD");
    }

    throw error;
  }
};


export const getAllProducts = async ({
  page = 1,
  limit = 10,
  search,
  categoryId,
  sortBy = "createdAt",
  order = "desc",
}) => {
  const skip = (page - 1) * limit;

  // Build product filters
  const where = {
    status: "ACTIVE",
  };

  // Search by product name
  if (search) {
    where.name = {
      contains: search,
      mode: "insensitive",
    };
  }

  // Filter by category
  if (categoryId) {
    where.categoryId = categoryId;
  }

  // Exclude products belonging to inactive categories
  where.category = {
    isActive: true,
  };

  // Fetch products and total count
  const [products, totalProducts] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [sortBy]: order,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        inventory: {
          select: {
            quantity: true,
            reserved: true,
          },
        },
      },
    }),

    prisma.product.count({ where }),
  ]);

  return {
    products,
    pagination: {
      totalProducts,
      currentPage: page,
      totalPages: Math.ceil(totalProducts / limit),
      limit,
    },
  };
};


export const getProductById = async (productId) => {
  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      status: "ACTIVE",
      category: {
        isActive: true,
      },
    },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      inventory: {
        select: {
          quantity: true,
          reserved: true,
        },
      },
    },
  });

  if (!product) {
    throw new Error("PRODUCT_NOT_FOUND");
  }

  return product;
};


export const getProductBySlug = async (slug) => {
  const product = await prisma.product.findFirst({
    where: {
      slug,
      status: "ACTIVE",
      category: {
        isActive: true,
      },
    },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      inventory: {
        select: {
          quantity: true,
          reserved: true,
        },
      },
    },
  });

  if (!product) {
    throw new Error("PRODUCT_NOT_FOUND");
  }

  return product;
};


export const updateProduct = async (productId, updateData) => {
  // 1. Check whether product exists
  const existingProduct = await prisma.product.findUnique({
    where: {
      id: productId,
    },
  });

  if (!existingProduct) {
    throw new Error("PRODUCT_NOT_FOUND");
  }

  // 2. Prepare fields to update
  const data = {};

  if (updateData.name !== undefined) {
    const name = updateData.name.trim();
    const slug = generateSlug(name);

    if (!slug) {
      throw new Error("INVALID_PRODUCT_NAME");
    }

    data.name = name;
    data.slug = slug;
  }

  if (updateData.description !== undefined) {
    data.description = updateData.description.trim();
  }

  if (updateData.sku !== undefined) {
    data.sku = updateData.sku.trim().toUpperCase();
  }

  if (updateData.price !== undefined) {
    data.price = updateData.price;
  }

  if (updateData.imageUrl !== undefined) {
    data.imageUrl = updateData.imageUrl;
  }

  if (updateData.status !== undefined) {
    data.status = updateData.status;
  }

  // 3. Validate category if categoryId is being changed
  if (updateData.categoryId !== undefined) {
    const category = await prisma.category.findFirst({
      where: {
        id: updateData.categoryId,
        isActive: true,
      },
    });

    if (!category) {
      throw new Error("CATEGORY_NOT_FOUND");
    }

    data.categoryId = updateData.categoryId;
  }

  // 4. Ensure at least one field is provided
  if (Object.keys(data).length === 0) {
    throw new Error("NO_UPDATE_DATA");
  }

  try {
    // 5. Update product
    return await prisma.product.update({
      where: {
        id: productId,
      },
      data,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        inventory: {
          select: {
            quantity: true,
            reserved: true,
          },
        },
      },
    });
  } catch (error) {
    // 6. Handle duplicate SKU or slug
    if (error.code === "P2002") {
      const target = Array.isArray(error.meta?.target)
        ? error.meta.target.join(" ")
        : String(error.meta?.target || "");

      if (target.includes("sku")) {
        throw new Error("DUPLICATE_PRODUCT_SKU");
      }

      if (target.includes("slug")) {
        throw new Error("DUPLICATE_PRODUCT_SLUG");
      }

      throw new Error("DUPLICATE_PRODUCT_FIELD");
    }

    throw error;
  }
};

export const archiveProduct = async (productId) => {
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw new Error("PRODUCT_NOT_FOUND");
  }

  if (product.status === "ARCHIVED") {
    throw new Error("PRODUCT_ALREADY_ARCHIVED");
  }

return prisma.product.update({
    where: { id: productId },
    data: {
      status: "ARCHIVED",
    },
  });
};