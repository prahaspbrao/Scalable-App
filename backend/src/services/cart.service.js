import prisma from "../config/prisma.js";

export const getOrCreateCart = async (userId) => {
  const cart = await prisma.cart.upsert({
    where: {
      userId,
    },
    update: {},
    create: {
      userId,
    },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              sku: true,
              price: true,
              imageUrl: true,
              status: true,
            },
          },
        },
      },
    },
  });

  return cart;
};

export const addToCart = async (userId, productId, quantity) => {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new Error("INVALID_QUANTITY");
  }

  return await prisma.$transaction(async (tx) => {
    // 1. Find an active product in an active category
    const product = await tx.product.findFirst({
      where: {
        id: productId,
        status: "ACTIVE",
        category: {
          isActive: true,
        },
      },
      include: {
        inventory: true,
      },
    });

    if (!product) {
      throw new Error("PRODUCT_NOT_AVAILABLE");
    }

    // 2. Check inventory availability
    if (!product.inventory) {
      throw new Error("INVENTORY_NOT_FOUND");
    }

    // 3. Get or create the user's cart
    const cart = await tx.cart.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });

    // 4. Check whether the product already exists in the cart
    const existingItem = await tx.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
    });

    // 5. Calculate the final cart quantity
    const newQuantity = (existingItem?.quantity || 0) + quantity;

    // 6. Validate available stock
    const availableStock =
      product.inventory.quantity - product.inventory.reserved;

    if (newQuantity > availableStock) {
      throw new Error("INSUFFICIENT_STOCK");
    }

    // 7. Create or update the cart item
    const cartItem = await tx.cartItem.upsert({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
      update: {
        quantity: newQuantity,
      },
      create: {
        cartId: cart.id,
        productId,
        quantity,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            price: true,
            imageUrl: true,
          },
        },
      },
    });

    return cartItem;
  });
};

export const getCart = async (userId) => {
  const cart = await prisma.cart.findUnique({
    where: {
      userId,
    },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              sku: true,
              price: true,
              imageUrl: true,
              status: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!cart) {
    return {
      items: [],
      totalItems: 0,
      subtotal: 0,
    };
  }

  const items = cart.items.map((item) => {
    const unitPrice = Number(item.product.price);
    const itemSubtotal = unitPrice * item.quantity;

    return {
      id: item.id,
      productId: item.productId,
      name: item.product.name,
      slug: item.product.slug,
      sku: item.product.sku,
      imageUrl: item.product.imageUrl,
      unitPrice,
      quantity: item.quantity,
      subtotal: Number(itemSubtotal.toFixed(2)),
    };
  });

  const totalItems = items.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const subtotal = Number(
    items.reduce((total, item) => total + item.subtotal, 0).toFixed(2)
  );

  return {
    cartId: cart.id,
    items,
    totalItems,
    subtotal,
  };
};

export const updateCartItem = async (userId, productId, quantity) => {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new Error("INVALID_QUANTITY");
  }

  return await prisma.$transaction(async (tx) => {
    // Find the user's cart
    const cart = await tx.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      throw new Error("CART_NOT_FOUND");
    }

    // Find the requested cart item
    const cartItem = await tx.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
    });

    if (!cartItem) {
      throw new Error("CART_ITEM_NOT_FOUND");
    }

    // Validate product availability
    const product = await tx.product.findFirst({
      where: {
        id: productId,
        status: "ACTIVE",
        category: {
          isActive: true,
        },
      },
      include: {
        inventory: true,
      },
    });

    if (!product) {
      throw new Error("PRODUCT_NOT_AVAILABLE");
    }

    if (!product.inventory) {
      throw new Error("INVENTORY_NOT_FOUND");
    }

    const availableStock =
      product.inventory.quantity - product.inventory.reserved;

    if (quantity > availableStock) {
      throw new Error("INSUFFICIENT_STOCK");
    }

    // Update cart item quantity
    return await tx.cartItem.update({
      where: {
        id: cartItem.id,
      },
      data: {
        quantity,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            price: true,
            imageUrl: true,
          },
        },
      },
    });
  });
};

export const removeCartItem = async (userId, productId) => {
  return await prisma.$transaction(async (tx) => {
    // Find the user's cart
    const cart = await tx.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      throw new Error("CART_NOT_FOUND");
    }

    // Find the cart item
    const cartItem = await tx.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
    });

    if (!cartItem) {
      throw new Error("CART_ITEM_NOT_FOUND");
    }

    // Remove the item
    await tx.cartItem.delete({
      where: {
        id: cartItem.id,
      },
    });

    return {
      productId,
      message: "Product removed from cart successfully",
    };
  });
};

export const clearCart = async (userId) => {
  return await prisma.$transaction(async (tx) => {
    // Find the user's cart
    const cart = await tx.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      throw new Error("CART_NOT_FOUND");
    }

    // Delete all items belonging to this cart
    const result = await tx.cartItem.deleteMany({
      where: {
        cartId: cart.id,
      },
    });

    return {
      message: "Cart cleared successfully",
      deletedItems: result.count,
    };
  });
};