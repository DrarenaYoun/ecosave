const params = new URLSearchParams(window.location.search);
const currentUser = typeof EcoSaveAuth !== "undefined" ? EcoSaveAuth.currentUser() : null;
const selectedStore = params.get("store") || currentUser?.storeName || "";

const storeName = document.querySelector("#storeName");
const storeInfo = document.querySelector("#storeInfo");
const totalProducts = document.querySelector("#totalProducts");
const totalReservations = document.querySelector("#totalReservations");
const pendingReservations = document.querySelector("#pendingReservations");
const completedReservations = document.querySelector("#completedReservations");
const cancelledReservations = document.querySelector("#cancelledReservations");
const inventoryTotalProducts = document.querySelector("#inventoryTotalProducts");
const totalUnitsInStock = document.querySelector("#totalUnitsInStock");
const lowStockCount = document.querySelector("#lowStockCount");
const soldOutCount = document.querySelector("#soldOutCount");
const storeProducts = document.querySelector("#storeProducts");
const storeProductsEmpty = document.querySelector("#storeProductsEmpty");
const storeReservations = document.querySelector("#storeReservations");
const storeReservationsEmpty = document.querySelector("#storeReservationsEmpty");
const productForm = document.querySelector("#productForm");
const productFormTitle = document.querySelector("#productFormTitle");
const productFormError = document.querySelector("#productFormError");
const editingProductId = document.querySelector("#editingProductId");
const productNameInput = document.querySelector("#productNameInput");
const productCategoryInput = document.querySelector("#productCategoryInput");
const originalPriceInput = document.querySelector("#originalPriceInput");
const salePriceInput = document.querySelector("#salePriceInput");
const expiryDateInput = document.querySelector("#expiryDateInput");
const quantityInput = document.querySelector("#quantityInput");
const descriptionInput = document.querySelector("#descriptionInput");
const imageInput = document.querySelector("#imageInput");
const locationInput = document.querySelector("#locationInput");
const storeNameInput = document.querySelector("#storeNameInput");
const submitProductBtn = document.querySelector("#submitProductBtn");
const cancelEditBtn = document.querySelector("#cancelEditBtn");
const analyticsFields = {
  totalProducts: document.querySelector("#analyticsTotalProducts"),
  activeProducts: document.querySelector("#analyticsActiveProducts"),
  soldProducts: document.querySelector("#analyticsSoldProducts"),
  pendingReservations: document.querySelector("#analyticsPendingReservations"),
  completedOrders: document.querySelector("#analyticsCompletedOrders"),
  cancelledOrders: document.querySelector("#analyticsCancelledOrders"),
  totalRevenue: document.querySelector("#analyticsTotalRevenue"),
  averageDiscount: document.querySelector("#analyticsAverageDiscount"),
  inventoryRemaining: document.querySelector("#analyticsInventoryRemaining"),
  productsInStock: document.querySelector("#analyticsProductsInStock"),
  lowStock: document.querySelector("#analyticsLowStock"),
  outOfStock: document.querySelector("#analyticsOutOfStock"),
  statusPending: document.querySelector("#analyticsStatusPending"),
  statusConfirmed: document.querySelector("#analyticsStatusConfirmed"),
  statusReady: document.querySelector("#analyticsStatusReady"),
  statusCompleted: document.querySelector("#analyticsStatusCompleted"),
  statusCancelled: document.querySelector("#analyticsStatusCancelled"),
  statusExpired: document.querySelector("#analyticsStatusExpired"),
  bestSellingProducts: document.querySelector("#bestSellingProducts"),
  revenueChart: document.querySelector("#revenueByProductChart"),
  statusChart: document.querySelector("#reservationStatusChart"),
  topSellingChart: document.querySelector("#topSellingChart")
};

const palette = {
  Vegetables: ["#34A853", "#E5F8E9"],
  Meat: ["#EF7C57", "#FFE0D4"],
  "Frozen Food": ["#71B8FF", "#DCEEFF"],
  Bakery: ["#FFB703", "#FFE7A3"],
  Dairy: ["#54C6EB", "#DDF7FF"],
  Drinks: ["#8DD7CF", "#E7FBF7"],
  Snacks: ["#D9985F", "#FFE2BD"],
  Household: ["#A8B3BD", "#F1F5F7"],
  Beauty: ["#E88CCF", "#FFE2F5"],
  Food: ["#34A853", "#E5F8E9"]
};

function getProducts() {
  if (typeof EcoSaveProductData !== "undefined") {
    return EcoSaveProductData.allProducts();
  }
  return window.EcoSaveProducts || [];
}

function getCustomProducts() {
  if (typeof EcoSaveProductData !== "undefined") {
    return EcoSaveProductData.customProducts();
  }
  try {
    return JSON.parse(localStorage.getItem("ecosaveCustomProducts")) || [];
  } catch {
    return [];
  }
}

function money(value) {
  return EcoSaveFormat.money(value);
}

function shortDate(value) {
  if (!value) return "Unavailable";
  const date = String(value).includes("T") ? new Date(value) : new Date(`${value}T00:00:00`);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function colorsFor(product) {
  return product?.colors || palette[product?.category] || ["#34A853", "#BDEBC7"];
}

function isSoldOut(product) {
  return typeof EcoSaveProductData !== "undefined"
    ? EcoSaveProductData.isSoldOut(product)
    : Number(product.quantity || 0) <= 0;
}

function stockStatus(product) {
  if (isSoldOut(product)) return "Sold Out";
  if (Number(product.quantity || 0) <= 5) return `Low stock: ${product.quantity} left`;
  return `${product.quantity} left`;
}

function productFor(reservation) {
  return getProducts().find((product) => product.id === reservation.productId);
}

function storeProductList() {
  return getProducts().filter((product) => {
    if (product.storeId) return product.storeId === currentUser?.id;
    return product.storeName === selectedStore;
  });
}

function ownCustomProducts() {
  return getProducts().filter((product) => product.storeId === currentUser?.id);
}

function storeReservationList() {
  if (typeof EcoSaveReservations !== "undefined") {
    return EcoSaveReservations.reservationsByStore(currentUser);
  }
  return [];
}

function statusFor(reservation) {
  return reservation.status || "Pending";
}

function priceForReservation(reservation) {
  const product = productFor(reservation);
  return Number(reservation.salePrice ?? product?.salePrice ?? 0);
}

function unitsForReservation(reservation) {
  return Math.max(1, Number(reservation.quantity || 1));
}

function emptyAnalyticsList(message) {
  return `<div class="dashboard-empty analytics-empty is-visible"><p>${message}</p></div>`;
}

function computeBusinessAnalytics(products, reservations) {
  const completed = reservations.filter((reservation) => statusFor(reservation) === "Completed");
  const cancelled = reservations.filter((reservation) => statusFor(reservation) === "Cancelled");
  const statusCounts = EcoSaveReservations?.reservationStats
    ? EcoSaveReservations.reservationStats(reservations)
    : reservations.reduce((counts, reservation) => {
      const status = statusFor(reservation);
      counts[status] = (counts[status] || 0) + 1;
      return counts;
    }, {});

  const productSales = new Map();
  completed.forEach((reservation) => {
    const product = productFor(reservation);
    const productId = reservation.productId;
    const units = unitsForReservation(reservation);
    const revenue = priceForReservation(reservation) * units;
    const current = productSales.get(productId) || {
      productId,
      name: product?.name || reservation.productName || "EcoSave Product",
      units: 0,
      revenue: 0,
      remaining: product?.quantity || 0
    };

    current.units += units;
    current.revenue += revenue;
    current.remaining = product?.quantity || current.remaining;
    productSales.set(productId, current);
  });

  const sales = [...productSales.values()].sort((a, b) => b.units - a.units || b.revenue - a.revenue);
  const totalRevenue = sales.reduce((sum, product) => sum + product.revenue, 0);
  const soldProducts = sales.reduce((sum, product) => sum + product.units, 0);
  const inventoryRemaining = products.reduce((sum, product) => sum + Number(product.quantity || 0), 0);
  const activeProducts = products.filter((product) => Number(product.quantity || 0) > 0).length;
  const lowStock = products.filter((product) => Number(product.quantity || 0) > 0 && Number(product.quantity || 0) < 5).length;
  const outOfStock = products.filter((product) => Number(product.quantity || 0) === 0).length;
  const averageDiscount = products.length
    ? Math.round(products.reduce((sum, product) => sum + Number(product.discountPercentage || 0), 0) / products.length)
    : 0;

  return {
    totalProducts: products.length,
    activeProducts,
    soldProducts,
    pendingReservations: statusCounts.pending || statusCounts.Pending || 0,
    completedOrders: completed.length,
    cancelledOrders: cancelled.length,
    totalRevenue,
    averageDiscount,
    inventoryRemaining,
    productsInStock: activeProducts,
    lowStock,
    outOfStock,
    statusCounts: {
      Pending: statusCounts.pending || statusCounts.Pending || 0,
      Confirmed: statusCounts.Confirmed || 0,
      "Ready for pickup": statusCounts["Ready for pickup"] || 0,
      Completed: statusCounts.completed || statusCounts.Completed || 0,
      Cancelled: statusCounts.cancelled || statusCounts.Cancelled || 0,
      Expired: statusCounts.Expired || 0
    },
    sales
  };
}

function resizeCanvas(canvas) {
  if (!canvas) return null;
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  const width = Math.max(280, Math.floor(rect.width || canvas.parentElement?.clientWidth || 420));
  const height = Number(canvas.getAttribute("height")) || 260;
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  canvas.style.height = `${height}px`;
  const context = canvas.getContext("2d");
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.clearRect(0, 0, width, height);
  return { context, width, height };
}

function drawEmptyChart(canvas, message) {
  const chart = resizeCanvas(canvas);
  if (!chart) return;
  const { context, width, height } = chart;
  context.fillStyle = "#66736A";
  context.font = "700 13px Inter, sans-serif";
  context.textAlign = "center";
  context.fillText(message, width / 2, height / 2);
}

function drawBarChart(canvas, items, valueKey, labelKey, color = "#34A853") {
  const chart = resizeCanvas(canvas);
  if (!chart) return;
  const { context, width, height } = chart;
  const data = items.filter((item) => Number(item[valueKey]) > 0).slice(0, 6);
  if (!data.length) {
    drawEmptyChart(canvas, "No completed order data yet");
    return;
  }

  const max = Math.max(...data.map((item) => Number(item[valueKey])));
  const padding = 38;
  const gap = 12;
  const barWidth = (width - padding * 2 - gap * (data.length - 1)) / data.length;
  context.font = "700 11px Inter, sans-serif";
  context.textAlign = "center";

  data.forEach((item, index) => {
    const barHeight = Math.max(8, ((height - 90) * Number(item[valueKey])) / max);
    const x = padding + index * (barWidth + gap);
    const y = height - 42 - barHeight;
    context.fillStyle = color;
    context.fillRect(x, y, barWidth, barHeight);
    context.fillStyle = "#142018";
    context.fillText(valueKey === "revenue" ? money(item[valueKey]) : item[valueKey], x + barWidth / 2, y - 8);
    context.fillStyle = "#66736A";
    context.fillText(String(item[labelKey]).slice(0, 14), x + barWidth / 2, height - 18);
  });
}

function drawHorizontalBarChart(canvas, items) {
  const chart = resizeCanvas(canvas);
  if (!chart) return;
  const { context, width, height } = chart;
  const data = items.filter((item) => item.units > 0).slice(0, 5);
  if (!data.length) {
    drawEmptyChart(canvas, "No selling product data yet");
    return;
  }

  const max = Math.max(...data.map((item) => item.units));
  const left = 120;
  const rowHeight = Math.min(38, (height - 24) / data.length);
  context.font = "700 12px Inter, sans-serif";

  data.forEach((item, index) => {
    const y = 22 + index * rowHeight;
    const barWidth = Math.max(8, ((width - left - 48) * item.units) / max);
    context.fillStyle = "#66736A";
    context.textAlign = "right";
    context.fillText(item.name.slice(0, 18), left - 10, y + 14);
    context.fillStyle = "#34A853";
    context.fillRect(left, y, barWidth, 18);
    context.fillStyle = "#142018";
    context.textAlign = "left";
    context.fillText(`${item.units}`, left + barWidth + 8, y + 14);
  });
}

function drawDoughnutChart(canvas, statusCounts) {
  const chart = resizeCanvas(canvas);
  if (!chart) return;
  const { context, width, height } = chart;
  const entries = [
    ["Pending", statusCounts.Pending, "#FFB703"],
    ["Confirmed", statusCounts.Confirmed, "#54C6EB"],
    ["Ready", statusCounts["Ready for pickup"], "#8DD7CF"],
    ["Completed", statusCounts.Completed, "#34A853"],
    ["Cancelled", statusCounts.Cancelled, "#E5484D"],
    ["Expired", statusCounts.Expired, "#A8B3BD"]
  ].filter((item) => item[1] > 0);

  const total = entries.reduce((sum, item) => sum + item[1], 0);
  if (!total) {
    drawEmptyChart(canvas, "No reservation data yet");
    return;
  }

  const radius = Math.min(width, height) * 0.28;
  const centerX = width * 0.38;
  const centerY = height / 2;
  let start = -Math.PI / 2;

  entries.forEach(([, value, color]) => {
    const slice = (value / total) * Math.PI * 2;
    context.beginPath();
    context.moveTo(centerX, centerY);
    context.arc(centerX, centerY, radius, start, start + slice);
    context.closePath();
    context.fillStyle = color;
    context.fill();
    start += slice;
  });

  context.beginPath();
  context.arc(centerX, centerY, radius * 0.58, 0, Math.PI * 2);
  context.fillStyle = "#FFFFFF";
  context.fill();
  context.fillStyle = "#142018";
  context.font = "900 20px Inter, sans-serif";
  context.textAlign = "center";
  context.fillText(total, centerX, centerY + 7);

  context.font = "700 12px Inter, sans-serif";
  context.textAlign = "left";
  entries.forEach(([label, value, color], index) => {
    const x = width * 0.68;
    const y = 42 + index * 28;
    context.fillStyle = color;
    context.fillRect(x, y - 10, 10, 10);
    context.fillStyle = "#66736A";
    context.fillText(`${label}: ${value}`, x + 16, y);
  });
}

function renderBestSellingProducts(items) {
  if (!analyticsFields.bestSellingProducts) return;
  const topItems = items.slice(0, 5);
  analyticsFields.bestSellingProducts.innerHTML = topItems.length
    ? topItems.map((item, index) => `
      <div class="analytics-list-row">
        <span>${index + 1}</span>
        <strong>${item.name}</strong>
        <em>${item.units} sold</em>
        <em>${money(item.revenue)}</em>
        <em>${item.remaining} left</em>
      </div>
    `).join("")
    : emptyAnalyticsList("Completed orders will appear here.");
}

function renderBusinessAnalytics(products, reservations) {
  if (!analyticsFields.totalProducts) return;
  const analytics = computeBusinessAnalytics(products, reservations);
  analyticsFields.totalProducts.textContent = analytics.totalProducts;
  analyticsFields.activeProducts.textContent = analytics.activeProducts;
  analyticsFields.soldProducts.textContent = analytics.soldProducts;
  analyticsFields.pendingReservations.textContent = analytics.pendingReservations;
  analyticsFields.completedOrders.textContent = analytics.completedOrders;
  analyticsFields.cancelledOrders.textContent = analytics.cancelledOrders;
  analyticsFields.totalRevenue.textContent = money(analytics.totalRevenue);
  analyticsFields.averageDiscount.textContent = `${analytics.averageDiscount}%`;
  analyticsFields.inventoryRemaining.textContent = analytics.inventoryRemaining;
  analyticsFields.productsInStock.textContent = analytics.productsInStock;
  analyticsFields.lowStock.textContent = analytics.lowStock;
  analyticsFields.outOfStock.textContent = analytics.outOfStock;
  analyticsFields.statusPending.textContent = analytics.statusCounts.Pending;
  analyticsFields.statusConfirmed.textContent = analytics.statusCounts.Confirmed;
  analyticsFields.statusReady.textContent = analytics.statusCounts["Ready for pickup"];
  analyticsFields.statusCompleted.textContent = analytics.statusCounts.Completed;
  analyticsFields.statusCancelled.textContent = analytics.statusCounts.Cancelled;
  analyticsFields.statusExpired.textContent = analytics.statusCounts.Expired;

  renderBestSellingProducts(analytics.sales);
  drawBarChart(analyticsFields.revenueChart, analytics.sales, "revenue", "name", "#34A853");
  drawDoughnutChart(analyticsFields.statusChart, analytics.statusCounts);
  drawHorizontalBarChart(analyticsFields.topSellingChart, analytics.sales);
}

function showProductError(message) {
  productFormError.textContent = message;
  productFormError.classList.add("is-visible");
}

function clearProductError() {
  productFormError.textContent = "";
  productFormError.classList.remove("is-visible");
}

function productPayloadFromForm() {
  return {
    name: productNameInput.value,
    category: productCategoryInput.value,
    originalPrice: originalPriceInput.value,
    salePrice: salePriceInput.value,
    expiryDate: expiryDateInput.value,
    quantity: quantityInput.value,
    description: descriptionInput.value,
    image: imageInput.value,
    location: locationInput.value
  };
}

function validateProductInput(payload) {
  if (!payload.name.trim()) return "Product name is required.";
  if (!payload.category.trim()) return "Category is required.";
  if (!payload.expiryDate) return "Expiry date is required.";
  if (!Number.isFinite(Number(payload.salePrice)) || Number(payload.salePrice) <= 0) return "Sale price must be a positive number.";
  if (!Number.isFinite(Number(payload.quantity)) || Number(payload.quantity) <= 0) return "Quantity must be a positive number.";
  if (payload.originalPrice && Number(payload.originalPrice) < 0) return "Original price cannot be negative.";
  return "";
}

function resetProductForm() {
  productForm.reset();
  editingProductId.value = "";
  productFormTitle.textContent = "Add Product";
  submitProductBtn.textContent = "Add Product";
  cancelEditBtn.hidden = true;
  storeNameInput.value = currentUser?.storeName || "";
  locationInput.value = currentUser?.location || "";
  clearProductError();
}

function fillProductForm(product) {
  editingProductId.value = product.id;
  productNameInput.value = product.name || "";
  productCategoryInput.value = product.category || "";
  originalPriceInput.value = product.originalPrice || "";
  salePriceInput.value = product.salePrice || "";
  expiryDateInput.value = product.expiryDate || "";
  quantityInput.value = product.quantity || "";
  descriptionInput.value = product.description || "";
  imageInput.value = product.image || "";
  locationInput.value = product.location || currentUser?.location || "";
  productFormTitle.textContent = "Edit Product";
  submitProductBtn.textContent = "Update Product";
  cancelEditBtn.hidden = false;
  clearProductError();
  productForm.scrollIntoView({ behavior: "smooth", block: "start" });
}

function productCard(product) {
  const colors = colorsFor(product);
  const isOwnerProduct = product.storeId === currentUser?.id;
  const soldOut = isSoldOut(product);
  return `
    <article class="store-product-card ${soldOut ? "is-sold-out" : ""}" data-product-id="${product.id}">
      <div class="store-product-card__image" style="--a:${colors[0]};--b:${colors[1]};background-image:url('${product.image || ""}'),radial-gradient(circle at 72% 24%,rgba(255,255,255,.75),transparent 24%),linear-gradient(135deg,${colors[0]},${colors[1]});background-size:cover,auto,auto;background-position:center,center,center"></div>
      <div class="store-product-card__body">
        <div class="product-owner-badge">${isOwnerProduct ? "Store product" : "Catalog product"}</div>
        <h3>${product.name}</h3>
        <p>${product.category}<br />Expires ${shortDate(product.expiryDate)} · ${stockStatus(product)}</p>
        <strong>${money(product.salePrice)}</strong>
        <div class="store-product-card__actions">
          <a class="btn btn--muted" href="product.html?id=${encodeURIComponent(product.id)}">View</a>
          <button class="btn btn--muted" type="button" data-action="edit-product" data-product-id="${product.id}" ${isOwnerProduct ? "" : "disabled"}>Edit</button>
          <button class="btn btn--danger" type="button" data-action="delete-product" data-product-id="${product.id}" ${isOwnerProduct ? "" : "disabled"}>Delete</button>
        </div>
      </div>
    </article>
  `;
}

function reservationRow(reservation) {
  const product = productFor(reservation);
  const productName = product?.name || reservation.productName || "EcoSave Product";
  const status = statusFor(reservation);
  const fullName = reservation.customerName || "Customer";
  const phone = reservation.customerPhone || "No phone";
  const date = reservation.reservationDate || reservation.createdAt || "";

  return `
    <div class="store-reservation-row" data-reservation-id="${reservation.id}">
      <span>Customer<strong>${fullName}<br />${phone}</strong></span>
      <span>Product<strong>${productName}</strong></span>
      <span>Quantity<strong>${reservation.quantity}</strong></span>
      <span>Date<strong>${shortDate(date)}</strong></span>
      <span>Status<strong>${status}</strong></span>
      <div class="store-reservation-actions">
        ${status === "Pending" ? `<button class="btn btn--muted" type="button" data-action="confirm" data-reservation-id="${reservation.id}">Confirm</button><button class="btn btn--danger" type="button" data-action="reject" data-reservation-id="${reservation.id}">Reject</button>` : ""}
        ${status === "Confirmed" ? `<button class="btn btn--muted" type="button" data-action="ready" data-reservation-id="${reservation.id}">Mark Ready</button>` : ""}
        ${status === "Ready for pickup" ? `<button class="btn btn--muted" type="button" data-action="complete" data-reservation-id="${reservation.id}">Mark Completed</button>` : ""}
      </div>
    </div>
  `;
}

function updateReservationStatus(reservationId, status) {
  EcoSaveReservations.updateReservationStatus(reservationId, status);
  render();
}

function handleProductSubmit(event) {
  event.preventDefault();

  if (!currentUser || currentUser.role !== "store") {
    showProductError("Only logged-in store accounts can manage products.");
    return;
  }

  const payload = productPayloadFromForm();
  const validationMessage = validateProductInput(payload);
  if (validationMessage) {
    showProductError(validationMessage);
    return;
  }

  clearProductError();

  if (editingProductId.value) {
    const updated = EcoSaveProductData.updateProduct(editingProductId.value, currentUser.id, payload);
    if (!updated) {
      showProductError("You can only edit products created by your store account.");
      return;
    }
  } else {
    EcoSaveProductData.createProduct(payload, currentUser);
  }

  resetProductForm();
  render();
}

function bindProductActions() {
  storeProducts.querySelectorAll("[data-action='edit-product']").forEach((button) => {
    button.addEventListener("click", () => {
      const product = ownCustomProducts().find((item) => item.id === button.dataset.productId);
      if (!product) {
        showProductError("You can only edit products created by your store account.");
        return;
      }
      fillProductForm(product);
    });
  });

  storeProducts.querySelectorAll("[data-action='delete-product']").forEach((button) => {
    button.addEventListener("click", () => {
      const product = ownCustomProducts().find((item) => item.id === button.dataset.productId);
      if (!product) {
        showProductError("You can only delete products created by your store account.");
        return;
      }

      if (!confirm(`Delete ${product.name}?`)) return;
      EcoSaveProductData.deleteProduct(product.id, currentUser.id);
      if (editingProductId.value === product.id) resetProductForm();
      render();
    });
  });
}

function bindReservationActions() {
  storeReservations.querySelectorAll("[data-action='confirm']").forEach((button) => {
    button.addEventListener("click", () => {
      updateReservationStatus(button.dataset.reservationId, "Confirmed");
    });
  });

  storeReservations.querySelectorAll("[data-action='reject']").forEach((button) => {
    button.addEventListener("click", () => {
      updateReservationStatus(button.dataset.reservationId, "Cancelled");
    });
  });

  storeReservations.querySelectorAll("[data-action='ready']").forEach((button) => {
    button.addEventListener("click", () => {
      updateReservationStatus(button.dataset.reservationId, "Ready for pickup");
    });
  });

  storeReservations.querySelectorAll("[data-action='complete']").forEach((button) => {
    button.addEventListener("click", () => {
      EcoSaveReservations.completeReservation(button.dataset.reservationId);
      render();
    });
  });
}

function render() {
  const listedProducts = storeProductList();
  const reservations = storeReservationList();
  const reservationStats = typeof EcoSaveReservations !== "undefined"
    ? EcoSaveReservations.reservationStats(reservations)
    : { total: reservations.length, pending: 0, completed: 0, cancelled: 0 };
  const inventoryStats = typeof EcoSaveProductData !== "undefined"
    ? EcoSaveProductData.inventoryStats(listedProducts)
    : {
      totalProducts: listedProducts.length,
      totalUnits: listedProducts.reduce((sum, product) => sum + Number(product.quantity || 0), 0),
      lowStock: listedProducts.filter((product) => product.quantity > 0 && product.quantity <= 5).length,
      soldOut: listedProducts.filter((product) => Number(product.quantity || 0) === 0).length
    };

  storeName.textContent = `${selectedStore || "Partner Store"} Dashboard`;
  storeInfo.textContent = selectedStore
    ? `Managing near-expiry listings and reservations for ${selectedStore}${currentUser?.location ? ` in ${currentUser.location}` : ""}.`
    : "No store account is active.";

  totalProducts.textContent = listedProducts.length;
  totalReservations.textContent = reservationStats.total;
  pendingReservations.textContent = reservationStats.pending;
  completedReservations.textContent = reservationStats.completed;
  cancelledReservations.textContent = reservationStats.cancelled;
  inventoryTotalProducts.textContent = inventoryStats.totalProducts;
  totalUnitsInStock.textContent = inventoryStats.totalUnits;
  lowStockCount.textContent = inventoryStats.lowStock;
  soldOutCount.textContent = inventoryStats.soldOut;

  storeProductsEmpty.classList.toggle("is-visible", listedProducts.length === 0);
  storeProducts.innerHTML = listedProducts.map(productCard).join("");

  storeReservationsEmpty.classList.toggle("is-visible", reservations.length === 0);
  storeReservations.innerHTML = reservations.map(reservationRow).join("");

  renderBusinessAnalytics(listedProducts, reservations);
  bindProductActions();
  bindReservationActions();
}

if (productForm) {
  productForm.addEventListener("submit", handleProductSubmit);
}

if (cancelEditBtn) {
  cancelEditBtn.addEventListener("click", resetProductForm);
}

resetProductForm();
render();
window.addEventListener("ecosaveProductsUpdated", render);
window.addEventListener("ecosaveReservationsUpdated", render);
window.addEventListener("resize", render);
