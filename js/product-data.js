(function () {
  const root = typeof window !== "undefined" ? window : globalThis;
  const customProductsKey = "ecosaveCustomProducts";
  const inventoryKey = "ecosaveInventory";

  function storage() {
    return root.localStorage || globalThis.localStorage;
  }

  function readCustomProducts() {
    try {
      return JSON.parse(storage().getItem(customProductsKey)) || [];
    } catch {
      return [];
    }
  }

  function readInventory() {
    try {
      return JSON.parse(storage().getItem(inventoryKey)) || {};
    } catch {
      return {};
    }
  }

  function emitProductUpdate() {
    if (typeof root.dispatchEvent !== "function") return;
    const event = typeof root.CustomEvent === "function"
      ? new root.CustomEvent("ecosaveProductsUpdated")
      : { type: "ecosaveProductsUpdated" };
    root.dispatchEvent(event);
  }

  function writeInventory(inventory) {
    storage().setItem(inventoryKey, JSON.stringify(inventory));
    emitProductUpdate();
  }

  function writeCustomProducts(products) {
    storage().setItem(customProductsKey, JSON.stringify(products));
    emitProductUpdate();
  }

  function toNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
  }

  function discountPercentage(originalPrice, salePrice) {
    const original = toNumber(originalPrice);
    const sale = toNumber(salePrice);
    if (!original || sale >= original) return 0;
    return Math.round(((original - sale) / original) * 100);
  }

  function baseProducts() {
    return [...(root.EcoSaveProducts || []), ...readCustomProducts()];
  }

  function liveQuantity(product) {
    const inventory = readInventory();
    const storedQuantity = inventory[product.id];
    const quantity = storedQuantity === undefined ? product.quantity : storedQuantity;
    return Math.max(0, toNumber(quantity));
  }

  function withInventory(product) {
    return { ...product, quantity: liveQuantity(product) };
  }

  function allProducts() {
    return baseProducts().map(withInventory);
  }

  function productById(productId) {
    return allProducts().find((product) => product.id === productId);
  }

  function productsForStore(store) {
    const storeId = store?.id || "";
    const storeName = store?.storeName || "";
    return allProducts().filter((product) => {
      if (product.storeId) return product.storeId === storeId;
      return product.storeName === storeName;
    });
  }

  function normalizeProduct(input, store) {
    const originalPrice = toNumber(input.originalPrice);
    const salePrice = toNumber(input.salePrice);
    const productId = input.id || `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

    return {
      id: productId,
      storeId: store.id,
      storeName: store.storeName,
      name: input.name.trim(),
      category: input.category.trim(),
      originalPrice,
      salePrice,
      discountPercentage: discountPercentage(originalPrice, salePrice),
      expiryDate: input.expiryDate,
      quantity: toNumber(input.quantity),
      description: input.description.trim() || "Near-expiry product listed by a verified EcoSave partner.",
      image: input.image.trim() || "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80",
      location: input.location.trim() || store.location || "Pickup location available after reservation",
      createdAt: input.createdAt || new Date().toISOString()
    };
  }

  function createProduct(input, store) {
    const product = normalizeProduct(input, store);
    writeCustomProducts([...readCustomProducts(), product]);
    setQuantity(product.id, product.quantity);
    return product;
  }

  function updateProduct(productId, storeId, updates) {
    let updatedProduct = null;
    const nextProducts = readCustomProducts().map((product) => {
      if (product.id !== productId || product.storeId !== storeId) return product;
      updatedProduct = normalizeProduct({ ...product, ...updates, id: product.id, createdAt: product.createdAt }, {
        id: product.storeId,
        storeName: product.storeName,
        location: product.location
      });
      return updatedProduct;
    });

    if (updatedProduct) {
      writeCustomProducts(nextProducts);
      setQuantity(updatedProduct.id, updatedProduct.quantity);
    }

    return updatedProduct;
  }

  function deleteProduct(productId, storeId) {
    const products = readCustomProducts();
    const product = products.find((item) => item.id === productId);
    if (!product || product.storeId !== storeId) return false;
    writeCustomProducts(products.filter((item) => item.id !== productId));
    const inventory = readInventory();
    delete inventory[productId];
    writeInventory(inventory);
    return true;
  }

  function setQuantity(productId, quantity) {
    const inventory = readInventory();
    inventory[productId] = Math.max(0, toNumber(quantity));
    writeInventory(inventory);
    return inventory[productId];
  }

  function decreaseQuantity(productId, amount = 1) {
    const product = productById(productId);
    if (!product) return null;
    const nextQuantity = Math.max(0, liveQuantity(product) - Math.max(1, toNumber(amount)));
    setQuantity(productId, nextQuantity);
    return nextQuantity;
  }

  function increaseQuantity(productId, amount = 1) {
    const product = productById(productId);
    if (!product) return null;
    const nextQuantity = liveQuantity(product) + Math.max(1, toNumber(amount));
    setQuantity(productId, nextQuantity);
    return nextQuantity;
  }

  function canReserve(productId, amount = 1) {
    const product = productById(productId);
    return !!product && liveQuantity(product) >= Math.max(1, toNumber(amount));
  }

  function reserveQuantity(productId, amount = 1) {
    if (!canReserve(productId, amount)) return false;
    decreaseQuantity(productId, amount);
    return true;
  }

  function reserveProduct(productId) {
    return reserveQuantity(productId, 1);
  }

  function isSoldOut(product) {
    return liveQuantity(product) <= 0;
  }

  function categoryCounts() {
    return allProducts().reduce((counts, product) => {
      counts[product.category] = counts[product.category] || { products: 0, units: 0 };
      if (product.quantity > 0) {
        counts[product.category].products += 1;
        counts[product.category].units += product.quantity;
      }
      return counts;
    }, {});
  }

  function inventoryStats(products = allProducts()) {
    return products.reduce((stats, product) => {
      const quantity = liveQuantity(product);
      stats.totalProducts += 1;
      stats.totalUnits += quantity;
      if (quantity > 0 && quantity <= 5) stats.lowStock += 1;
      if (quantity === 0) stats.soldOut += 1;
      return stats;
    }, {
      totalProducts: 0,
      totalUnits: 0,
      lowStock: 0,
      soldOut: 0
    });
  }

  root.EcoSaveProductData = {
    customProducts: readCustomProducts,
    saveCustomProducts: writeCustomProducts,
    allProducts,
    productById,
    productsForStore,
    createProduct,
    updateProduct,
    deleteProduct,
    discountPercentage,
    inventory: readInventory,
    liveQuantity,
    setQuantity,
    decreaseQuantity,
    increaseQuantity,
    canReserve,
    reserveQuantity,
    reserveProduct,
    isSoldOut,
    categoryCounts,
    inventoryStats
  };

  if (typeof root.addEventListener === "function") {
    root.addEventListener("storage", (event) => {
      if ((event.key === customProductsKey || event.key === inventoryKey) && typeof root.dispatchEvent === "function") {
        emitProductUpdate();
      }
    });
  }
}());
