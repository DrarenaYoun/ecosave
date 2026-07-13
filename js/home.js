const homeDealsGrid = document.querySelector(".deals-grid");
const homeCategoryCards = document.querySelectorAll(".category-card");
const homePalette = {
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

function homeProducts() {
  if (typeof EcoSaveProductData !== "undefined") {
    return EcoSaveProductData.allProducts();
  }
  return window.EcoSaveProducts || [];
}

function homeIsSoldOut(product) {
  return typeof EcoSaveProductData !== "undefined"
    ? EcoSaveProductData.isSoldOut(product)
    : Number(product.quantity || 0) <= 0;
}

function homeMoney(value) {
  return EcoSaveFormat.money(value);
}

function homeShortDate(value) {
  if (!value) return "Unavailable";
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function homeColors(product) {
  return product?.colors || homePalette[product?.category] || ["#34A853", "#BDEBC7"];
}

function homeFilterCategory(product) {
  if (product.category === "Drinks") return "drinks";
  if (product.category === "Household" || product.category === "Beauty") return "household";
  return "food";
}

function homeDealCard(product) {
  const colors = homeColors(product);
  const wished = typeof EcoSaveAuth !== "undefined" && EcoSaveAuth.isWishlisted(product.id);
  const soldOut = homeIsSoldOut(product);
  const stockLabel = soldOut ? "Sold Out" : `${product.quantity} left`;
  return `
    <article class="deal-card" data-category="${homeFilterCategory(product)}" data-product-id="${product.id}">
      <a class="deal-card__link" href="product.html?id=${encodeURIComponent(product.id)}" aria-label="View ${product.name}"></a>
      <div class="deal-card__media" style="--media-a:${colors[0]};--media-b:${colors[1]};background-image:url('${product.image || ""}'),radial-gradient(circle at 72% 24%,rgba(255,255,255,.75),transparent 24%),linear-gradient(135deg,${colors[0]},${colors[1]});background-size:cover,auto,auto;background-position:center,center,center">
        <span class="discount-badge">${product.discountPercentage}% OFF</span>
        <button class="save-btn" type="button" data-wishlist-product-id="${product.id}" aria-label="Save ${product.name}">${wished ? "â™¥" : "♡"}</button>
      </div>
      <div class="deal-card__body">
        <div class="deal-meta"><span>${product.location || "Local pickup"}</span><span>Expires ${homeShortDate(product.expiryDate)}</span></div>
        <h3>${product.name}</h3>
        <p>${product.storeName}</p>
        <div class="deal-price"><div><strong>${homeMoney(product.salePrice)}</strong><span>${homeMoney(product.originalPrice)}</span></div><em class="${soldOut ? "stock-status stock-status--sold-out" : ""}">${stockLabel}</em></div>
        <button class="reserve-btn" type="button" ${soldOut ? "disabled" : ""}>${soldOut ? "Sold Out" : "Reserve Deal"}</button>
      </div>
    </article>
  `;
}

function renderHomeCategories() {
  if (!homeCategoryCards.length || typeof EcoSaveProductData === "undefined") return;
  const counts = EcoSaveProductData.categoryCounts();

  homeCategoryCards.forEach((card) => {
    const title = card.querySelector("h3")?.textContent.trim();
    const count = counts[title]?.products || 0;
    const label = count === 1 ? "available product" : "available products";
    const text = card.querySelector("p");
    if (text) text.textContent = `${count} ${label}`;
  });
}

function bindHomeDeals() {
  if (typeof EcoSaveAuth !== "undefined") {
    EcoSaveAuth.bindWishlistButtons(homeDealsGrid);
  }

  homeDealsGrid.querySelectorAll(".reserve-btn").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      if (button.disabled) return;
      const card = event.currentTarget.closest(".deal-card");
      window.location.href = `reserve.html?id=${encodeURIComponent(card.dataset.productId)}`;
    });
  });

  const activeFilter = document.querySelector(".deal-tab.is-active")?.dataset.filter || "all";
  homeDealsGrid.querySelectorAll(".deal-card").forEach((card) => {
    const isVisible = activeFilter === "all" || card.dataset.category === activeFilter;
    card.style.display = isVisible ? "" : "none";
  });
}

function renderHomeDeals() {
  if (!homeDealsGrid) return;
  const products = homeProducts()
    .slice()
    .sort((a, b) => (b.discountPercentage || 0) - (a.discountPercentage || 0))
    .slice(0, 4);

  homeDealsGrid.innerHTML = products.map(homeDealCard).join("");
  bindHomeDeals();
}

function renderHomeInventory() {
  renderHomeCategories();
  renderHomeDeals();
}

renderHomeInventory();
window.addEventListener("ecosaveProductsUpdated", renderHomeInventory);
window.addEventListener("ecosaveWishlistUpdated", renderHomeDeals);
