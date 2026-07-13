const searchForm = document.querySelector("#searchForm");
const searchQuery = document.querySelector("#searchQuery");
const searchLocation = document.querySelector("#searchLocation");
const searchResults = document.querySelector("#searchResults");
const searchEmpty = document.querySelector("#searchEmpty");
const searchCount = document.querySelector("#searchCount");
const searchParams = new URLSearchParams(window.location.search);

const searchPalette = {
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

function searchProducts() {
  if (typeof EcoSaveProductData !== "undefined") {
    return EcoSaveProductData.allProducts();
  }
  return window.EcoSaveProducts || [];
}

function searchMoney(value) {
  return EcoSaveFormat.money(value);
}

function searchShortDate(value) {
  if (!value) return "Unavailable";
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function searchColors(product) {
  return product?.colors || searchPalette[product?.category] || ["#34A853", "#BDEBC7"];
}

function searchSoldOut(product) {
  return typeof EcoSaveProductData !== "undefined"
    ? EcoSaveProductData.isSoldOut(product)
    : Number(product.quantity || 0) <= 0;
}

function searchableText(product) {
  return [
    product.name,
    product.category,
    product.storeName,
    product.location,
    product.description
  ].join(" ").toLowerCase();
}

function resultCard(product) {
  const colors = searchColors(product);
  const wished = typeof EcoSaveAuth !== "undefined" && EcoSaveAuth.isWishlisted(product.id);
  const soldOut = searchSoldOut(product);
  return `
    <article class="wishlist-card" data-product-id="${product.id}">
      <div class="wishlist-card__image" style="--a:${colors[0]};--b:${colors[1]};background-image:url('${product.image || ""}'),radial-gradient(circle at 72% 24%,rgba(255,255,255,.75),transparent 24%),linear-gradient(135deg,${colors[0]},${colors[1]});background-size:cover,auto,auto;background-position:center,center,center">
        <span>${product.discountPercentage}% OFF</span>
      </div>
      <div class="wishlist-card__body">
        <div class="reservation-card__top">
          <div class="reservation-card__id">${product.category}</div>
          <button class="wish ${wished ? "is-active" : ""}" type="button" data-wishlist-product-id="${product.id}" aria-label="Save ${product.name}">${wished ? "â™¥" : "♡"}</button>
        </div>
        <h2>${product.name}</h2>
        <p class="reservation-card__store">${product.storeName}<br />${product.location}</p>
        <div class="reservation-card__meta">
          <span>Sale price<strong>${searchMoney(product.salePrice)}</strong></span>
          <span>Original price<strong>${searchMoney(product.originalPrice)}</strong></span>
          <span>Discount<strong>${product.discountPercentage}%</strong></span>
          <span>Expiry date<strong>${searchShortDate(product.expiryDate)}</strong></span>
          <span>Stock<strong>${soldOut ? "Sold Out" : `${product.quantity} left`}</strong></span>
        </div>
        <div class="reservation-card__actions">
          <button class="btn btn--primary" type="button" data-action="view" data-product-id="${product.id}">View Product</button>
          ${soldOut ? "" : `<button class="btn btn--primary" type="button" data-action="reserve" data-product-id="${product.id}">Reserve Now</button>`}
        </div>
      </div>
    </article>
  `;
}

function renderSearch() {
  const query = searchQuery.value.trim().toLowerCase();
  const location = searchLocation.value.trim().toLowerCase();
  const results = searchProducts().filter((product) => {
    const queryMatches = !query || searchableText(product).includes(query);
    const locationMatches = !location || String(product.location || "").toLowerCase().includes(location);
    return queryMatches && locationMatches;
  });

  searchCount.textContent = results.length;
  searchEmpty.classList.toggle("is-visible", results.length === 0);
  searchResults.innerHTML = results.map(resultCard).join("");

  searchResults.querySelectorAll("[data-action='view']").forEach((button) => {
    button.addEventListener("click", () => {
      window.location.href = `product.html?id=${encodeURIComponent(button.dataset.productId)}`;
    });
  });

  searchResults.querySelectorAll("[data-action='reserve']").forEach((button) => {
    button.addEventListener("click", () => {
      window.location.href = `reserve.html?id=${encodeURIComponent(button.dataset.productId)}`;
    });
  });

  if (typeof EcoSaveAuth !== "undefined") {
    EcoSaveAuth.bindWishlistButtons(searchResults);
  }
}

searchQuery.value = searchParams.get("query") || "";
searchLocation.value = searchParams.get("location") || "";

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const params = new URLSearchParams();
  if (searchQuery.value.trim()) params.set("query", searchQuery.value.trim());
  if (searchLocation.value.trim()) params.set("location", searchLocation.value.trim());
  history.replaceState(null, "", params.toString() ? `search.html?${params.toString()}` : "search.html");
  renderSearch();
});

searchQuery.addEventListener("input", renderSearch);
searchLocation.addEventListener("input", renderSearch);
window.addEventListener("ecosaveWishlistUpdated", renderSearch);
window.addEventListener("ecosaveProductsUpdated", renderSearch);
renderSearch();
