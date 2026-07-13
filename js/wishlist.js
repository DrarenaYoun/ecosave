const wishlistGrid = document.querySelector("#wishlistGrid");
const wishlistEmpty = document.querySelector("#wishlistEmpty");
const wishlistCount = document.querySelector("#wishlistCount");

const palette = {
  Vegetables: ["#34A853", "#E5F8E9"],
  Meat: ["#EF7C57", "#FFE0D4"],
  "Frozen Food": ["#71B8FF", "#DCEEFF"],
  Bakery: ["#FFB703", "#FFE7A3"],
  Dairy: ["#54C6EB", "#DDF7FF"],
  Drinks: ["#8DD7CF", "#E7FBF7"],
  Snacks: ["#D9985F", "#FFE2BD"],
  Household: ["#A8B3BD", "#F1F5F7"]
};

function getProducts() {
  if (typeof EcoSaveProductData !== "undefined") {
    return EcoSaveProductData.allProducts();
  }
  return window.EcoSaveProducts || [];
}

function money(value) {
  return EcoSaveFormat.money(value);
}

function shortDate(value) {
  if (!value) return "Unavailable";
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", {
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

function productFor(productId) {
  return getProducts().find((product) => product.id === productId);
}

function wishlistCard(item) {
  const product = productFor(item.productId);
  if (!product) return "";

  const colors = colorsFor(product);
  const soldOut = isSoldOut(product);
  return `
    <article class="wishlist-card" data-product-id="${product.id}">
      <div class="wishlist-card__image" style="--a:${colors[0]};--b:${colors[1]};background-image:url('${product.image || ""}'),radial-gradient(circle at 72% 24%,rgba(255,255,255,.75),transparent 24%),linear-gradient(135deg,${colors[0]},${colors[1]});background-size:cover,auto,auto;background-position:center,center,center">
        <span>${product.discountPercentage}% OFF</span>
      </div>
      <div class="wishlist-card__body">
        <div class="reservation-card__top">
          <div class="reservation-card__id">${product.category}</div>
          <button class="wish is-active" type="button" data-wishlist-product-id="${product.id}" aria-label="Remove from wishlist">♥</button>
        </div>
        <h2>${product.name}</h2>
        <p class="reservation-card__store">${product.storeName}<br />${product.location}</p>
        <div class="reservation-card__meta">
          <span>Original price<strong>${money(product.originalPrice)}</strong></span>
          <span>Sale price<strong>${money(product.salePrice)}</strong></span>
          <span>Discount<strong>${product.discountPercentage}%</strong></span>
          <span>Expiry date<strong>${shortDate(product.expiryDate)}</strong></span>
          <span>Stock<strong>${soldOut ? "Sold Out" : `${product.quantity} left`}</strong></span>
        </div>
        <div class="reservation-card__actions">
          <button class="btn btn--primary" type="button" data-action="view" data-product-id="${product.id}">View Product</button>
          ${soldOut ? "" : `<button class="btn btn--primary" type="button" data-action="reserve" data-product-id="${product.id}">Reserve Now</button>`}
          <button class="btn btn--danger" type="button" data-action="remove" data-product-id="${product.id}">Remove</button>
        </div>
      </div>
    </article>
  `;
}

function render() {
  const items = EcoSaveAuth.userWishlist().filter((item) => productFor(item.productId));
  wishlistCount.textContent = items.length;
  wishlistEmpty.classList.toggle("is-visible", items.length === 0);
  wishlistGrid.innerHTML = items.map(wishlistCard).join("");

  wishlistGrid.querySelectorAll("[data-action='view']").forEach((button) => {
    button.addEventListener("click", () => {
      window.location.href = `product.html?id=${encodeURIComponent(button.dataset.productId)}`;
    });
  });

  wishlistGrid.querySelectorAll("[data-action='reserve']").forEach((button) => {
    button.addEventListener("click", () => {
      window.location.href = `reserve.html?id=${encodeURIComponent(button.dataset.productId)}`;
    });
  });

  wishlistGrid.querySelectorAll("[data-action='remove']").forEach((button) => {
    button.addEventListener("click", () => {
      EcoSaveAuth.removeWishlistItem(button.dataset.productId);
      render();
    });
  });

  EcoSaveAuth.bindWishlistButtons(wishlistGrid);
}

window.addEventListener("ecosaveWishlistUpdated", render);
window.addEventListener("ecosaveProductsUpdated", render);
render();
