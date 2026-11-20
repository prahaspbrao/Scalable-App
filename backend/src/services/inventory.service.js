import prisma from "../config/prisma.js";

export const getInventoryByProductId = async (productId) => {
  const inventory = await prisma.inventory.findUnique({
    where: {
      productId,
    },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          sku: true,
          status: true,
        },
      },
    },
  });

  if (!inventory) {
    throw new Error("INVENTORY_NOT_FOUND");
  }

  return {
    id: inventory.id,
    productId: inventory.productId,
    product: inventory.product,
    quantity: inventory.quantity,
    reserved: inventory.reserved,
    available: inventory.quantity - inventory.reserved,
    createdAt: inventory.createdAt,
    updatedAt: inventory.updatedAt,
  };
};

export const updateInventory = async (productId, quantityChange) => {
  return await prisma.$transaction(async (tx) => {
    const inventory = await tx.inventory.findUnique({
      where: { productId },
    });

    if (!inventory) {
      throw new Error("INVENTORY_NOT_FOUND");
    }

    const newQuantity = inventory.quantity + quantityChange;

    if (newQuantity < inventory.reserved) {
      throw new Error("INSUFFICIENT_STOCK");
    }

    return await tx.inventory.update({
      where: { productId },
      data: {
        quantity: newQuantity,
      },
    });
  });
};

export const reserveStock = async (productId, quantity) => {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new Error("INVALID_RESERVATION_QUANTITY");
  }

  return await prisma.$transaction(async (tx) => {
    const updatedInventory = await tx.$queryRaw`
      UPDATE "Inventory"
      SET
        "reserved" = "reserved" + ${quantity},
        "updatedAt" = NOW()
      WHERE
        "productId" = ${productId}
        AND ("quantity" - "reserved") >= ${quantity}
      RETURNING
        "id",
        "productId",
        "quantity",
        "reserved",
        "createdAt",
        "updatedAt";
    `;

    if (updatedInventory.length === 0) {
      const inventory = await tx.inventory.findUnique({
        where: { productId },
      });

      if (!inventory) {
        throw new Error("INVENTORY_NOT_FOUND");
      }

      throw new Error("INSUFFICIENT_STOCK");
    }

    return updatedInventory[0];
  });
};

export const releaseStock = async (productId, quantity) => {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new Error("INVALID_RELEASE_QUANTITY");
  }

  return await prisma.$transaction(async (tx) => {
    const updatedInventory = await tx.$queryRaw`
      UPDATE "Inventory"
      SET
        "reserved" = "reserved" - ${quantity},
        "updatedAt" = NOW()
      WHERE
        "productId" = ${productId}
        AND "reserved" >= ${quantity}
      RETURNING
        "id",
        "productId",
        "quantity",
        "reserved",
        "createdAt",
        "updatedAt";
    `;

    if (updatedInventory.length === 0) {
      const inventory = await tx.inventory.findUnique({
        where: { productId },
      });

      if (!inventory) {
        throw new Error("INVENTORY_NOT_FOUND");
      }

      throw new Error("INSUFFICIENT_RESERVED_STOCK");
    }

    return updatedInventory[0];
  });
};


export const getLowStockProducts = async (threshold = 10) => {
  if (!Number.isInteger(threshold) || threshold < 0) {
    throw new Error("INVALID_STOCK_THRESHOLD");
  }

  const inventoryRecords = await prisma.$queryRaw`
    SELECT
      i."id",
      i."productId",
      i."quantity",
      i."reserved",
      (i."quantity" - i."reserved") AS "available",
      p."name" AS "productName",
      p."sku",
      p."status"
    FROM "Inventory" i
    INNER JOIN "Product" p
      ON p."id" = i."productId"
    INNER JOIN "Category" c
      ON c."id" = p."categoryId"
    WHERE
      p."status" = 'ACTIVE'
      AND c."isActive" = true
      AND (i."quantity" - i."reserved") <= ${threshold}
    ORDER BY
      (i."quantity" - i."reserved") ASC;
  `;

  return inventoryRecords;
};
