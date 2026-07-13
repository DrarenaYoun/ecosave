const perPage = 8;
let category = new URLSearchParams(window.location.search).get("category") || "All";
let page = 1;

const grid = document.querySelector("#grid");
const search = document.querySelector("#search");
const sort = document.querySelector("#sort");
const count = document.querySelector("#count");
const summary = document.querySelector("#summaryCount");
const status = document.querySelector("#pageStatus");
const pagination = document.querySelector("#pagination");
const empty = document.querySelector("#empty");
const filterButtons = document.querySelectorAll(".filter-btn");
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

function date(value) {
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function colorsFor(product) {
  return product.colors || palette[product.category] || ["#34A853", "#BDEBC7"];
}

function isSoldOut(product) {
  return typeof EcoSaveProductData !== "undefined"
    ? EcoSaveProductData.isSoldOut(product)
    : Number(product.quantity || 0) <= 0;
}

function stockLabel(product) {
  if (isSoldOut(product)) return "Sold Out";
  if (Number(product.quantity || 0) <= 5) return `Only ${product.quantity} left`;
  return `${product.quantity} left`;
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

function filtered() {
  const query = search.value.toLowerCase().trim();
  const list = getProducts().filter((product) => {
    const categoryMatches = category === "All" || product.category === category;
    return categoryMatches && searchableText(product).includes(query);
  });

  list.sort((a, b) => {
    if (sort.value === "discount") return b.discountPercentage - a.discountPercentage;
    if (sort.value === "price") return a.salePrice - b.salePrice;
    if (sort.value === "distance") return (a.distance || 0) - (b.distance || 0);
    return new Date(a.expiryDate) - new Date(b.expiryDate);
  });

  return list;
}

function productCard(product) {
  const colors = colorsFor(product);
  const wished = typeof EcoSaveAuth !== "undefined" && EcoSaveAuth.isWishlisted(product.id);
  const soldOut = isSoldOut(product);
  return `
    <article class="product-card ${soldOut ? "is-sold-out" : ""}" data-product-id="${product.id}">
      <div class="product-media" style="--a:${colors[0]};--b:${colors[1]};background-image:url('${product.image || ""}'),radial-gradient(circle at 72% 24%,rgba(255,255,255,.75),transparent 24%),linear-gradient(135deg,${colors[0]},${colors[1]});background-size:cover,auto,auto;background-position:center,center,center">
        <span class="discount">${soldOut ? "Sold Out" : `${product.discountPercentage}% OFF`}</span>
        <button class="wish ${wished ? "is-active" : ""}" type="button" data-wishlist-product-id="${product.id}" aria-label="Save ${product.name}">${wished ? "♥" : "♡"}</button>
      </div>
      <div class="product-body">
        <div class="meta"><span>${product.location}</span><span>${product.category}</span></div>
        <h3>${product.name}</h3>
        <p class="store">${product.storeName}</p>
        <div class="price-row">
          <div><strong>${money(product.salePrice)}</strong><span>${money(product.originalPrice)}</span></div>
          <em class="expiry">Expires ${date(product.expiryDate)}</em>
        </div>
        <p class="stock-status ${soldOut ? "stock-status--sold-out" : product.quantity <= 5 ? "stock-status--low" : ""}">${stockLabel(product)}</p>
        <button class="reserve" type="button" ${soldOut ? "disabled" : ""}>${soldOut ? "Sold Out" : "Reserve Deal"}</button>
      </div>
    </article>
  `;
}

function render() {
  const list = filtered();
  const pages = Math.max(1, Math.ceil(list.length / perPage));
  if (page > pages) page = pages;

  const shown = list.slice((page - 1) * perPage, page * perPage);
  count.textContent = list.length;
  summary.textContent = list.length;
  status.textContent = list.length ? `Page ${page} of ${pages}` : "No pages";
  empty.classList.toggle("is-visible", !list.length);
  grid.innerHTML = shown.map(productCard).join("");

  pagination.innerHTML = pages > 1
    ? `<button class="page-btn" data-page="${Math.max(1, page - 1)}">Prev</button>${Array.from({ length: pages }, (_, index) => `<button class="page-btn ${index + 1 === page ? "is-active" : ""}" data-page="${index + 1}">${index + 1}</button>`).join("")}<button class="page-btn" data-page="${Math.min(pages, page + 1)}">Next</button>`
    : "";

  if (typeof EcoSaveAuth !== "undefined") {
    EcoSaveAuth.bindWishlistButtons(grid);
  }

  document.querySelectorAll(".reserve").forEach((button) => {
    button.onclick = (event) => {
      event.stopPropagation();
      if (button.disabled) return;
      const card = button.closest(".product-card");
      window.location.href = `reserve.html?id=${encodeURIComponent(card.dataset.productId)}`;
    };
  });

  document.querySelectorAll(".product-card").forEach((card) => {
    card.onclick = () => {
      window.location.href = `product.html?id=${encodeURIComponent(card.dataset.productId)}`;
    };
  });

  document.querySelectorAll(".page-btn").forEach((button) => {
    button.onclick = () => {
      page = Number(button.dataset.page);
      render();
    };
  });
}

filterButtons.forEach((button) => {
  button.onclick = () => {
    filterButtons.forEach((item) => item.classList.remove("is-active"));
    button.classList.add("is-active");
    category = button.dataset.category;
    page = 1;
    render();
  };
});

search.oninput = () => {
  page = 1;
  render();
};

sort.onchange = () => {
  page = 1;
  render();
};

const activeFilter = Array.from(filterButtons).find((button) => button.dataset.category === category);
if (activeFilter) {
  filterButtons.forEach((button) => button.classList.remove("is-active"));
  activeFilter.classList.add("is-active");
} else {
  category = "All";
}

window.addEventListener("ecosaveWishlistUpdated", render);
window.addEventListener("ecosaveProductsUpdated", render);
render();
