const params = new URLSearchParams(window.location.search);
const requestedId = params.get("id");
let products = getProducts();
let countdownTimer = null;

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
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function productColors(item) {
  return item?.colors || palette[item?.category] || ["#34A853", "#BDEBC7"];
}

function isSoldOut(item) {
  return typeof EcoSaveProductData !== "undefined"
    ? EcoSaveProductData.isSoldOut(item)
    : Number(item.quantity || 0) <= 0;
}

function storeInitials(storeName) {
  return storeName
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function relatedProducts(item) {
  return products
    .filter((candidate) => candidate.id !== item.id && candidate.category === item.category)
    .slice(0, 4);
}

function showMissingProduct() {
  document.title = "Product Not Found | EcoSave Market";
  breadcrumbName.textContent = "Product not found";
  productName.textContent = "Product Not Found";
  categoryPill.textContent = "Coming Soon";
  storeLine.textContent = "This product is not available in the current EcoSave catalog.";
  salePrice.textContent = "Unavailable";
  originalPrice.textContent = "";
  discountBadge.textContent = "Unavailable";
  saveText.textContent = "Choose another deal";
  countdown.textContent = "No active expiry";
  description.textContent = "We could not find a product matching this link. Please return to the shop and choose another EcoSave deal.";
  pickupWindow.textContent = "Unavailable";
  distance.textContent = "Unavailable";
  expiryDate.textContent = "Unavailable";
  stock.textContent = "Unavailable";
  storeName.textContent = "EcoSave Market";
  storeInfo.textContent = "Product id not found";
  reserveBtn.textContent = "Back to Shop";
  reserveBtn.addEventListener("click", () => {
    window.location.href = "shop.html";
  });
  wishBtn.disabled = true;
  relatedGrid.innerHTML = products.slice(0, 4).map(relatedCard).join("");
  if (typeof EcoSaveAuth !== "undefined") {
    EcoSaveAuth.bindWishlistButtons(relatedGrid);
  }
}

function relatedCard(item) {
  const colors = productColors(item);
  const wished = typeof EcoSaveAuth !== "undefined" && EcoSaveAuth.isWishlisted(item.id);
  return `
    <article class="related-card" data-product-id="${item.id}">
      <a class="related-card__link" href="product.html?id=${encodeURIComponent(item.id)}" aria-label="View ${item.name}"></a>
      <div class="related-media" style="--a:${colors[0]};--b:${colors[1]};background-image:url('${item.image || ""}'),radial-gradient(circle at 72% 24%,rgba(255,255,255,.75),transparent 24%),linear-gradient(135deg,${colors[0]},${colors[1]});background-size:cover,auto,auto;background-position:center,center,center">
        <button class="wish ${wished ? "is-active" : ""}" type="button" data-wishlist-product-id="${item.id}" aria-label="Save ${item.name}">${wished ? "♥" : "♡"}</button>
      </div>
      <div class="related-body">
        <h3>${item.name}</h3>
        <p>${item.storeName}</p>
        <strong>${money(item.salePrice)}</strong>
      </div>
    </article>
  `;
}

function renderProduct(item) {
  const colors = productColors(item);
  const expiry = new Date(`${item.expiryDate}T23:59:59`);
  const soldOut = isSoldOut(item);

  document.title = `${item.name} | EcoSave Market`;
  breadcrumbName.textContent = item.name;
  productName.textContent = item.name;
  categoryPill.textContent = item.category;
  storeLine.textContent = `From ${item.storeName} · ${item.location}`;
  salePrice.textContent = money(item.salePrice);
  originalPrice.textContent = money(item.originalPrice);
  discountBadge.textContent = `${item.discountPercentage}% OFF`;
  saveText.textContent = `You save ${item.discountPercentage}%`;
  description.textContent = item.description;
  pickupWindow.textContent = "Available for local pickup today";
  distance.textContent = item.location;
  expiryDate.textContent = shortDate(item.expiryDate);
  stock.textContent = `Stock Remaining: ${item.quantity}`;
  storeName.textContent = item.storeName;
  storeInfo.textContent = `Verified EcoSave partner · ${item.location}`;
  storeLogo.textContent = storeInitials(item.storeName);

  mainImage.style.setProperty("--a", colors[0]);
  mainImage.style.setProperty("--b", colors[1]);
  mainImage.style.backgroundImage = `url("${item.image}"), radial-gradient(circle at 72% 24%,rgba(255,255,255,.75),transparent 24%), linear-gradient(135deg,${colors[0]},${colors[1]})`;
  mainImage.style.backgroundSize = "cover, auto, auto";
  mainImage.style.backgroundPosition = "center, center, center";

  galleryGrid.innerHTML = [0, 1, 2, 3].map((_, index) => `
    <button class="thumb ${index === 0 ? "is-active" : ""}" style="--a:${colors[0]};--b:${colors[1]}" aria-label="View product image ${index + 1}"></button>
  `).join("");

  const related = relatedProducts(item);
  relatedGrid.innerHTML = (related.length ? related : products.filter((candidate) => candidate.id !== item.id).slice(0, 4))
    .map(relatedCard)
    .join("");

  wishBtn.dataset.wishlistProductId = item.id;
  if (typeof EcoSaveAuth !== "undefined") {
    EcoSaveAuth.bindWishlistButtons(document);
  }

  function updateCountdown() {
    const diff = expiry - new Date();

    if (diff <= 0) {
      countdown.textContent = "Expires soon";
      return;
    }

    const days = Math.floor(diff / 864e5);
    const hours = Math.floor((diff % 864e5) / 36e5);
    countdown.textContent = days > 0 ? `${days}d ${hours}h remaining` : `${hours}h remaining`;
  }

  if (countdownTimer) {
    clearInterval(countdownTimer);
  }

  reserveBtn.textContent = soldOut ? "Sold Out" : "Reserve Now";
  reserveBtn.disabled = soldOut;
  reserveBtn.classList.toggle("is-disabled", soldOut);
  reserveBtn.onclick = () => {
    if (soldOut) return;
    window.location.href = `reserve.html?id=${encodeURIComponent(item.id)}`;
  };

  updateCountdown();
  countdownTimer = setInterval(updateCountdown, 60000);
}

window.addEventListener("ecosaveWishlistUpdated", () => {
  if (typeof EcoSaveAuth !== "undefined") {
    EcoSaveAuth.bindWishlistButtons(document);
  }
});

function renderCurrentProduct() {
  products = getProducts();
  const product = products.find((item) => item.id === requestedId);

  if (product) {
    renderProduct(product);
  } else {
    showMissingProduct();
  }
}

window.addEventListener("ecosaveProductsUpdated", renderCurrentProduct);
renderCurrentProduct();
