
import prisma from "../config/prisma.js";

// Generate URL-friendly slug
const generateSlug = (name) => {
    return name
        .toLowerCase()
        .trim()
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
};

// Create a new category
export const createCategory = async ({
    name,
    description,
    parentId,
}) => {

    // Generate slug from category name
    const slug = generateSlug(name);

    if (!slug) {
        throw new Error("INVALID_CATEGORY_NAME");
    }

    // Check duplicate category
    const existingCategory = await prisma.category.findUnique({
        where: {
            slug,
        },
    });

    if (existingCategory) {
        throw new Error("CATEGORY_ALREADY_EXISTS");
    }

    // Validate parent category if provided
    if (parentId) {
        const parentCategory = await prisma.category.findUnique({
            where: {
                id: parentId,
            },
        });

        if (!parentCategory || !parentCategory.isActive) {
            throw new Error("PARENT_CATEGORY_NOT_FOUND");
        }
    }

    // Create category in database
    const category = await prisma.category.create({
        data: {
            name: name.trim(),
            slug,
            description: description?.trim() || null,
            parentId: parentId || null,
        },
    });

    return category;
};

// get all category
export const getAllCategories = async () => {
    const categories = await prisma.category.findMany({
        where: {
            isActive: true,
        },
        orderBy: {
            name: "asc",
        },
        select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            isActive: true,
            parentId: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    // Create a lookup map for all categories
    const categoryMap = new Map();

    categories.forEach((category) => {
        categoryMap.set(category.id, {
            ...category,
            children: [],
        });
    });

    // Build parent-child hierarchy
    const rootCategories = [];

    categories.forEach((category) => {
        const currentCategory = categoryMap.get(category.id);

        if (category.parentId && categoryMap.has(category.parentId)) {
            categoryMap.get(category.parentId).children.push(currentCategory);
        } else {
            rootCategories.push(currentCategory);
        }
    });

    return rootCategories;
};


// get alll categories by IDs
export const getCategoryById = async (categoryId) => {
    const category = await prisma.category.findFirst({
        where: {
            id: categoryId,
            isActive: true,
        },
        include: {
            parent: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                },
            },
            children: {
                where: {
                    isActive: true,
                },
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    description: true,
                    isActive: true,
                },
            },
        },
    });

    if (!category) {
        throw new Error("CATEGORY_NOT_FOUND");
    }

    return category;
};


// update  category by ID
export const updateCategory = async (
    categoryId,
    { name, description, parentId }
) => {
    // Find existing category
    const existingCategory = await prisma.category.findUnique({
        where: { id: categoryId },
    });

    if (!existingCategory || !existingCategory.isActive) {
        throw new Error("CATEGORY_NOT_FOUND");
    }

    const updateData = {};

    // Update name and slug
    if (name !== undefined) {
        if (typeof name !== "string" || !name.trim()) {
            throw new Error("INVALID_CATEGORY_NAME");
        }

        const trimmedName = name.trim();
        const slug = generateSlug(trimmedName);

        if (!slug) {
            throw new Error("INVALID_CATEGORY_NAME");
        }

        const duplicate = await prisma.category.findFirst({
            where: {
                slug,
                NOT: { id: categoryId },
            },
        });

        if (duplicate) {
            throw new Error("CATEGORY_ALREADY_EXISTS");
        }

        updateData.name = trimmedName;
        updateData.slug = slug;
    }

    // Update description
    if (description !== undefined) {
        if (description !== null && typeof description !== "string") {
            throw new Error("INVALID_DESCRIPTION");
        }

        updateData.description =
            typeof description === "string"
                ? description.trim() || null
                : null;
    }

    // Update parent category
    if (parentId !== undefined) {
        if (parentId === categoryId) {
            throw new Error("INVALID_PARENT_CATEGORY");
        }

        if (parentId === null || parentId === "") {
            updateData.parentId = null;
        } else {
            const parentCategory = await prisma.category.findUnique({
                where: { id: parentId },
            });

            if (!parentCategory || !parentCategory.isActive) {
                throw new Error("PARENT_CATEGORY_NOT_FOUND");
            }

            // Prevent circular hierarchy
            let currentParent = parentCategory;

            while (currentParent) {
                if (currentParent.id === categoryId) {
                    throw new Error("CIRCULAR_CATEGORY_HIERARCHY");
                }

                if (!currentParent.parentId) break;

                currentParent = await prisma.category.findUnique({
                    where: { id: currentParent.parentId },
                    select: { id: true, parentId: true },
                });
            }

            updateData.parentId = parentId;
        }
    }

    if (Object.keys(updateData).length === 0) {
        throw new Error("NO_UPDATE_DATA");
    }

    return prisma.category.update({
        where: { id: categoryId },
        data: updateData,
    });
};

// delete category by ID
export const deleteCategory = async (categoryId) => {
  // 1. Find the category
  const category = await prisma.category.findFirst({
    where: {
      id: categoryId,
      isActive: true,
    },
  });

  if (!category) {
    throw new Error("CATEGORY_NOT_FOUND");
  }

  // 2. Check whether active child categories exist
  const activeChildren = await prisma.category.count({
    where: {
      parentId: categoryId,
      isActive: true,
    },
  });

  if (activeChildren > 0) {
    throw new Error("CATEGORY_HAS_ACTIVE_CHILDREN");
  }

  // 3. Perform soft deletion
  return await prisma.category.update({
    where: {
      id: categoryId,
    },
    data: {
      isActive: false,
    },
  });
};





