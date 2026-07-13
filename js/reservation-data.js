(function () {
  const root = typeof window !== "undefined" ? window : globalThis;
  const reservationsKey = "ecosaveReservations";
  const terminalStatuses = ["Completed", "Cancelled", "Expired"];

  function storage() {
    return root.localStorage || globalThis.localStorage;
  }

  function productsApi() {
    return root.EcoSaveProductData || globalThis.EcoSaveProductData;
  }

  function emitUpdate() {
    if (typeof root.dispatchEvent !== "function") return;
    const event = typeof root.CustomEvent === "function"
      ? new root.CustomEvent("ecosaveReservationsUpdated")
      : { type: "ecosaveReservationsUpdated" };
    root.dispatchEvent(event);
  }

  function readRawReservations() {
    try {
      return JSON.parse(storage().getItem(reservationsKey)) || [];
    } catch {
      return [];
    }
  }

  function writeReservations(reservations) {
    storage().setItem(reservationsKey, JSON.stringify(reservations));
    emitUpdate();
  }

  function generateReservationId() {
    return `ECO-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  }

  function productById(productId) {
    return productsApi()?.productById(productId);
  }

  function todayDate() {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  }

  function isExpired(reservation) {
    if (!reservation.expiryDate) return false;
    const expiry = new Date(`${reservation.expiryDate}T23:59:59`);
    return expiry < todayDate();
  }

  function normalizeReservation(reservation) {
    const product = productById(reservation.productId);
    const customer = reservation.customer || {};
    const reservationDate = reservation.reservationDate || reservation.createdAt || new Date().toISOString();
    const quantity = Math.max(1, Number(reservation.reservedQuantity || reservation.quantity || 1));

    return {
      ...reservation,
      id: reservation.id || generateReservationId(),
      productId: reservation.productId,
      productName: reservation.productName || product?.name || "EcoSave Product",
      storeId: reservation.storeId || product?.storeId || "",
      storeName: reservation.storeName || product?.storeName || "EcoSave Store",
      customerId: reservation.customerId || reservation.userId || "",
      customerName: reservation.customerName || customer.fullName || "Customer",
      customerEmail: reservation.customerEmail || reservation.userEmail || customer.email || "",
      customerPhone: reservation.customerPhone || customer.phone || "",
      pickupDate: reservation.pickupDate || customer.pickupDate || "",
      quantity,
      reservationDate,
      expiryDate: reservation.expiryDate || product?.expiryDate || "",
      status: reservation.status || "Pending",
      inventoryRestored: Boolean(reservation.inventoryRestored),
      createdAt: reservation.createdAt || reservationDate
    };
  }

  function allReservations(options = {}) {
    let reservations = readRawReservations().map(normalizeReservation);
    if (options.skipExpiry !== true) {
      reservations = applyExpiredReservations(reservations, { persist: true });
    }
    return reservations;
  }

  function restoreInventory(reservation) {
    if (reservation.inventoryRestored || !productsApi()) return reservation;
    productsApi().increaseQuantity(reservation.productId, reservation.quantity);
    return {
      ...reservation,
      inventoryRestored: true,
      inventoryRestoredAt: new Date().toISOString()
    };
  }

  function applyExpiredReservations(reservations = readRawReservations().map(normalizeReservation), options = {}) {
    let changed = false;
    const nextReservations = reservations.map((reservation) => {
      if (terminalStatuses.includes(reservation.status)) return reservation;
      if (!isExpired(reservation)) return reservation;
      changed = true;
      return restoreInventory({
        ...reservation,
        status: "Expired",
        statusUpdatedAt: new Date().toISOString()
      });
    });

    if (changed && options.persist !== false) {
      writeReservations(nextReservations);
    }

    return nextReservations;
  }

  function createReservation(input) {
    const product = productById(input.productId);
    if (!product) {
      return { ok: false, reason: "Product not found." };
    }

    const quantity = Math.max(1, Number(input.quantity || 1));
    if (!productsApi()?.canReserve(product.id, quantity)) {
      return { ok: false, reason: "Not enough inventory is available for this product." };
    }

    const reserved = productsApi().reserveQuantity(product.id, quantity);
    if (!reserved) {
      return { ok: false, reason: "This product is sold out and cannot be reserved right now." };
    }

    const reservation = normalizeReservation({
      id: generateReservationId(),
      productId: product.id,
      productName: product.name,
      storeId: product.storeId || "",
      storeName: product.storeName,
      customerId: input.customerId || "",
      customerName: input.customerName || "Customer",
      customerEmail: input.customerEmail || "",
      customerPhone: input.customerPhone || "",
      pickupDate: input.pickupDate || "",
      quantity,
      reservationDate: new Date().toISOString(),
      expiryDate: product.expiryDate,
      status: "Pending",
      salePrice: product.salePrice,
      location: product.location,
      inventoryRestored: false,
      createdAt: new Date().toISOString()
    });

    writeReservations([...allReservations({ skipExpiry: true }), reservation]);
    return { ok: true, reservation };
  }

  function updateReservationStatus(reservationId, status) {
    let updatedReservation = null;
    const reservations = allReservations({ skipExpiry: true }).map((reservation) => {
      if (reservation.id !== reservationId) return reservation;
      let nextReservation = {
        ...reservation,
        status,
        statusUpdatedAt: new Date().toISOString()
      };

      if ((status === "Cancelled" || status === "Expired") && reservation.status !== "Completed" && !nextReservation.inventoryRestored) {
        nextReservation = restoreInventory(nextReservation);
      }

      updatedReservation = nextReservation;
      return nextReservation;
    });

    writeReservations(reservations);
    return updatedReservation;
  }

  function cancelReservation(reservationId) {
    const reservation = allReservations({ skipExpiry: true }).find((item) => item.id === reservationId);
    if (!reservation || reservation.status !== "Pending") return null;
    return updateReservationStatus(reservationId, "Cancelled");
  }

  function completeReservation(reservationId) {
    return updateReservationStatus(reservationId, "Completed");
  }

  function reservationsByCustomer(customer) {
    const userId = customer?.id || "";
    const email = customer?.email || "";
    return allReservations().filter((reservation) => {
      if (reservation.customerId) return reservation.customerId === userId;
      return reservation.customerEmail === email;
    });
  }

  function reservationsByStore(store) {
    const storeId = store?.id || "";
    const storeName = store?.storeName || "";
    return allReservations().filter((reservation) => {
      const product = productById(reservation.productId);
      if (reservation.storeId) return reservation.storeId === storeId;
      if (product?.storeId) return product.storeId === storeId;
      return reservation.storeName === storeName || product?.storeName === storeName;
    });
  }

  function reservationStats(reservations = allReservations()) {
    return reservations.reduce((stats, reservation) => {
      stats.total += 1;
      stats[reservation.status] = (stats[reservation.status] || 0) + 1;
      if (!terminalStatuses.includes(reservation.status)) stats.active += 1;
      if (reservation.status === "Completed") stats.completed += 1;
      if (reservation.status === "Cancelled") stats.cancelled += 1;
      if (reservation.status === "Pending") stats.pending += 1;
      return stats;
    }, {
      total: 0,
      active: 0,
      completed: 0,
      cancelled: 0,
      pending: 0,
      Confirmed: 0,
      "Ready for pickup": 0,
      Expired: 0
    });
  }

  root.EcoSaveReservations = {
    statuses: ["Pending", "Confirmed", "Ready for pickup", "Completed", "Cancelled", "Expired"],
    createReservation,
    allReservations,
    reservationsByCustomer,
    reservationsByStore,
    updateReservationStatus,
    cancelReservation,
    completeReservation,
    reservationStats,
    applyExpiredReservations,
    normalizeReservation,
    saveReservations: writeReservations
  };

  applyExpiredReservations();

  if (typeof root.addEventListener === "function") {
    root.addEventListener("storage", (event) => {
      if (event.key === reservationsKey) emitUpdate();
    });
  }
}());
