const params = new URLSearchParams(window.location.search);
const productId = params.get("id");
let product = typeof EcoSaveProductData !== "undefined"
  ? EcoSaveProductData.productById(productId)
  : (window.EcoSaveProducts || []).find((item) => item.id === productId);

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

const reserveLayout = document.querySelector("#reserveLayout");
const reserveMissing = document.querySelector("#reserveMissing");
const reservationForm = document.querySelector("#reservationForm");
const reservationSuccess = document.querySelector("#reservationSuccess");
const reservationError = document.querySelector("#reservationError");
const reserveImage = document.querySelector("#reserveImage");
const reserveCategory = document.querySelector("#reserveCategory");
const reserveQuantity = document.querySelector("#reserveQuantity");
const reserveName = document.querySelector("#reserveName");
const reserveStore = document.querySelector("#reserveStore");
const reserveLocation = document.querySelector("#reserveLocation");
const reservePrice = document.querySelector("#reservePrice");
const reserveExpiry = document.querySelector("#reserveExpiry");
const reservationId = document.querySelector("#reservationId");
const fullName = document.querySelector("#fullName");
const phone = document.querySelector("#phone");
const email = document.querySelector("#email");
const reserveAmount = document.querySelector("#reserveAmount");
const pickupDate = document.querySelector("#pickupDate");
const reserveSubmitBtn = reservationForm?.querySelector("button[type='submit']");
const reserveReservationsList = document.querySelector("#reserveReservationsList");
const reserveReservationsEmpty = document.querySelector("#reserveReservationsEmpty");
const currentUser = typeof EcoSaveAuth !== "undefined" ? EcoSaveAuth.currentUser() : null;

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

function colorsFor(item) {
  return palette[item?.category] || ["#34A853", "#BDEBC7"];
}

function isSoldOut(item) {
  return typeof EcoSaveProductData !== "undefined"
    ? EcoSaveProductData.isSoldOut(item)
    : Number(item.quantity || 0) <= 0;
}

function showMissingProduct() {
  reserveLayout.style.display = "none";
  reserveMissing.classList.add("is-visible");
}

function renderProductSummary(item) {
  const colors = colorsFor(item);
  reserveImage.style.setProperty("--a", colors[0]);
  reserveImage.style.setProperty("--b", colors[1]);
  reserveImage.style.backgroundImage = `url("${item.image}"), radial-gradient(circle at 72% 24%,rgba(255,255,255,.75),transparent 24%), linear-gradient(135deg,${colors[0]},${colors[1]})`;
  reserveImage.style.backgroundSize = "cover, auto, auto";
  reserveImage.style.backgroundPosition = "center, center, center";

  reserveCategory.textContent = item.category;
  reserveQuantity.textContent = isSoldOut(item) ? "Sold Out" : `${item.quantity} left`;
  reserveName.textContent = item.name;
  reserveStore.textContent = item.storeName;
  reserveLocation.textContent = item.location;
  reservePrice.textContent = money(item.salePrice);
  reserveExpiry.textContent = `Expires ${shortDate(item.expiryDate)}`;
  reserveAmount.max = Math.max(1, Number(item.quantity || 0));
}

function showWarning(message) {
  reservationError.textContent = message;
  reservationError.classList.add("is-visible");
}

function showSoldOutWarning() {
  showWarning("This product is sold out and cannot be reserved right now.");
  if (reserveSubmitBtn) {
    reserveSubmitBtn.textContent = "Sold Out";
    reserveSubmitBtn.disabled = true;
  }
}

function resetSubmitState(item) {
  if (!reserveSubmitBtn) return;
  const soldOut = item && isSoldOut(item);
  reserveSubmitBtn.textContent = soldOut ? "Sold Out" : "Confirm Reservation";
  reserveSubmitBtn.disabled = Boolean(soldOut);
}

function validateForm() {
  const quantity = Number(reserveAmount.value || 1);
  const fields = [fullName, phone, email, pickupDate];
  if (!fields.every((field) => field.value.trim())) {
    return "Please complete every required field.";
  }
  if (!Number.isFinite(quantity) || quantity < 1) {
    return "Please choose a valid reservation quantity.";
  }
  if (product && quantity > Number(product.quantity || 0)) {
    return `Only ${product.quantity} item(s) are available for this product.`;
  }
  return "";
}

function reservationCard(reservation) {
  const item = typeof EcoSaveProductData !== "undefined" ? EcoSaveProductData.productById(reservation.productId) : null;
  const colors = colorsFor(item);
  const image = item?.image || "";
  const canCancel = reservation.status === "Pending";

  return `
    <article class="reservation-card" data-reservation-id="${reservation.id}">
      <div class="reservation-card__image" style="--a:${colors[0]};--b:${colors[1]};background-image:url('${image}'),radial-gradient(circle at 72% 24%,rgba(255,255,255,.75),transparent 24%),linear-gradient(135deg,${colors[0]},${colors[1]});background-size:cover,auto,auto;background-position:center,center,center"></div>
      <div class="reservation-card__body">
        <div class="reservation-card__top">
          <div class="reservation-card__id">${reservation.id}</div>
          <div class="reservation-status reservation-status--${reservation.status.toLowerCase().replaceAll(" ", "-")}">${reservation.status}</div>
        </div>
        <h2>${reservation.productName}</h2>
        <p class="reservation-card__store">${reservation.storeName}</p>
        <div class="reservation-card__meta">
          <span>Quantity<strong>${reservation.quantity}</strong></span>
          <span>Reservation date<strong>${shortDate(reservation.reservationDate)}</strong></span>
          <span>Expiry date<strong>${shortDate(reservation.expiryDate)}</strong></span>
          <span>Status<strong>${reservation.status}</strong></span>
        </div>
        <div class="reservation-card__actions">
          <button class="btn btn--primary" type="button" data-action="view" data-product-id="${reservation.productId}">View Product</button>
          ${canCancel ? `<button class="btn btn--danger" type="button" data-action="cancel" data-reservation-id="${reservation.id}">Cancel Reservation</button>` : ""}
        </div>
      </div>
    </article>
  `;
}

function renderCustomerReservations() {
  if (!reserveReservationsList || !window.EcoSaveReservations) return;
  const reservations = EcoSaveReservations.reservationsByCustomer(currentUser);
  reserveReservationsEmpty.classList.toggle("is-visible", reservations.length === 0);
  reserveReservationsList.innerHTML = reservations.map(reservationCard).join("");

  reserveReservationsList.querySelectorAll("[data-action='view']").forEach((button) => {
    button.addEventListener("click", () => {
      window.location.href = `product.html?id=${encodeURIComponent(button.dataset.productId)}`;
    });
  });

  reserveReservationsList.querySelectorAll("[data-action='cancel']").forEach((button) => {
    button.addEventListener("click", () => {
      EcoSaveReservations.cancelReservation(button.dataset.reservationId);
      product = typeof EcoSaveProductData !== "undefined" ? EcoSaveProductData.productById(productId) : product;
      if (product) {
        renderProductSummary(product);
        resetSubmitState(product);
      }
      renderCustomerReservations();
    });
  });
}

if (!product) {
  showMissingProduct();
} else {
  renderProductSummary(product);
  resetSubmitState(product);

  if (isSoldOut(product)) {
    showSoldOutWarning();
  }

  if (currentUser) {
    fullName.value = currentUser.fullName || "";
    email.value = currentUser.email || "";
  }

  reservationForm.addEventListener("submit", (event) => {
    event.preventDefault();
    product = typeof EcoSaveProductData !== "undefined" ? EcoSaveProductData.productById(productId) : product;

    const validationMessage = validateForm();
    if (validationMessage) {
      showWarning(validationMessage);
      return;
    }

    if (!product || isSoldOut(product)) {
      showSoldOutWarning();
      if (product) renderProductSummary(product);
      return;
    }

    const result = EcoSaveReservations.createReservation({
      productId: product.id,
      customerId: currentUser?.id || "",
      customerName: fullName.value.trim(),
      customerEmail: email.value.trim(),
      customerPhone: phone.value.trim(),
      pickupDate: pickupDate.value,
      quantity: Number(reserveAmount.value || 1)
    });

    if (!result.ok) {
      showWarning(result.reason);
      product = EcoSaveProductData.productById(productId);
      if (product) renderProductSummary(product);
      resetSubmitState(product);
      return;
    }

    reservationError.classList.remove("is-visible");
    reservationId.textContent = result.reservation.id;
    reservationForm.style.display = "none";
    reservationSuccess.classList.add("is-visible");
    product = EcoSaveProductData.productById(productId);
    renderProductSummary(product);
    renderCustomerReservations();
  });
}

renderCustomerReservations();
window.addEventListener("ecosaveReservationsUpdated", renderCustomerReservations);
window.addEventListener("ecosaveProductsUpdated", () => {
  product = typeof EcoSaveProductData !== "undefined" ? EcoSaveProductData.productById(productId) : product;
  if (product) {
    renderProductSummary(product);
    resetSubmitState(product);
  }
});
