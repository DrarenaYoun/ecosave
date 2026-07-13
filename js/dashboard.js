const reservationList = document.querySelector("#reservationList");
const dashboardEmpty = document.querySelector("#dashboardEmpty");
const reservationCount = document.querySelector("#reservationCount");
const totalReservationCount = document.querySelector("#totalReservationCount");
const activeReservationCount = document.querySelector("#activeReservationCount");
const completedReservationCount = document.querySelector("#completedReservationCount");
const cancelledReservationCount = document.querySelector("#cancelledReservationCount");
const currentUser = typeof EcoSaveAuth !== "undefined" ? EcoSaveAuth.currentUser() : null;

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

function productFor(reservation) {
  return typeof EcoSaveProductData !== "undefined"
    ? EcoSaveProductData.productById(reservation.productId)
    : null;
}

function colorsFor(product) {
  return product?.colors || palette[product?.category] || ["#34A853", "#BDEBC7"];
}

function statusClass(status) {
  return `reservation-status reservation-status--${status.toLowerCase().replaceAll(" ", "-")}`;
}

function reservationCard(reservation) {
  const product = productFor(reservation);
  const colors = colorsFor(product);
  const productName = product?.name || reservation.productName || "EcoSave Product";
  const category = product?.category || "Product";
  const salePrice = product?.salePrice ?? reservation.salePrice;
  const storeName = reservation.storeName || product?.storeName || "EcoSave Store";
  const location = product?.location || reservation.location || "Pickup location unavailable";
  const image = product?.image || "";
  const canCancel = reservation.status === "Pending";

  return `
    <article class="reservation-card" data-reservation-id="${reservation.id}">
      <div class="reservation-card__image" style="--a:${colors[0]};--b:${colors[1]};background-image:url('${image}'),radial-gradient(circle at 72% 24%,rgba(255,255,255,.75),transparent 24%),linear-gradient(135deg,${colors[0]},${colors[1]});background-size:cover,auto,auto;background-position:center,center,center"></div>
      <div class="reservation-card__body">
        <div class="reservation-card__top">
          <div class="reservation-card__id">${reservation.id}</div>
          <div class="${statusClass(reservation.status)}">${reservation.status}</div>
        </div>
        <h2>${productName}</h2>
        <p class="reservation-card__store">${storeName}<br />${location}</p>
        <div class="reservation-card__meta">
          <span>Category<strong>${category}</strong></span>
          <span>Sale price<strong>${money(salePrice)}</strong></span>
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

function render() {
  const reservations = EcoSaveReservations.reservationsByCustomer(currentUser);
  const stats = EcoSaveReservations.reservationStats(reservations);

  reservationCount.textContent = reservations.length;
  totalReservationCount.textContent = stats.total;
  activeReservationCount.textContent = stats.active;
  completedReservationCount.textContent = stats.completed;
  cancelledReservationCount.textContent = stats.cancelled;

  dashboardEmpty.classList.toggle("is-visible", reservations.length === 0);
  reservationList.innerHTML = reservations.map(reservationCard).join("");

  reservationList.querySelectorAll("[data-action='view']").forEach((button) => {
    button.addEventListener("click", () => {
      window.location.href = `product.html?id=${encodeURIComponent(button.dataset.productId)}`;
    });
  });

  reservationList.querySelectorAll("[data-action='cancel']").forEach((button) => {
    button.addEventListener("click", () => {
      EcoSaveReservations.cancelReservation(button.dataset.reservationId);
      render();
    });
  });
}

render();
window.addEventListener("ecosaveProductsUpdated", render);
window.addEventListener("ecosaveReservationsUpdated", render);
