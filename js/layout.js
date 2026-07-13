const EcoSaveFormat = window.EcoSaveFormat || {
  money(value) {
    return `₫${Number(value || 0).toLocaleString("en-US")}`;
  }
};

window.EcoSaveFormat = EcoSaveFormat;

const EcoSaveLayout = (() => {
  const logoSvg = '<svg viewBox="0 0 24 24" fill="none"><path d="M19.5 5.5C12.8 5.7 7.6 9.3 6 15.7C4.8 12.3 5.5 8.8 8 6.3C10.9 3.4 15.5 3.1 19.5 5.5Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 15.7C8.9 12.6 12.2 10.7 16.2 9.8" stroke="currentColor" stroke-linecap="round"/><path d="M6.1 15.8C7.6 18.7 10.8 20.1 14.1 18.8C17.5 17.4 19.3 13.7 19.5 5.5" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function headerTemplate() {
    return `
      <div class="top-bar">
        <div class="container top-bar__inner">
          <p>Save up to 70% on safe near-expiry products from trusted local stores.</p>
          <a href="shop.html">Explore today's deals</a>
        </div>
      </div>
      <header class="site-header">
        <nav class="container nav" aria-label="Primary navigation">
          <a class="logo" href="index.html" aria-label="EcoSave Market home">
            <span class="logo__mark" aria-hidden="true">${logoSvg}</span>
            <span>EcoSave Market</span>
          </a>
          <ul class="nav__menu" id="primaryNav"></ul>
          <div class="nav__actions" id="navActions"></div>
          <button class="menu-toggle" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="mobileMenu">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 7H20"/><path d="M4 12H20"/><path d="M4 17H20"/></svg>
          </button>
        </nav>
        <div class="mobile-menu" id="mobileMenu"></div>
      </header>
    `;
  }

  function footerTemplate() {
    return `
      <footer class="footer">
        <div class="container footer__inner">
          <div class="footer__brand">
            <a class="logo" href="index.html" aria-label="EcoSave Market home">
              <span class="logo__mark" aria-hidden="true">${logoSvg}</span>
              <span>EcoSave Market</span>
            </a>
            <p>Helping customers save money, retailers reduce waste, and communities shop more sustainably.</p>
          </div>
          <div class="footer__links">
            <div>
              <h3>Marketplace</h3>
              <a href="shop.html">Shop Deals</a>
              <a href="wishlist.html">Wishlist</a>
              <a href="dashboard.html">My Reservations</a>
            </div>
            <div>
              <h3>Company</h3>
              <a href="about.html">About</a>
              <a href="partner.html">Partner</a>
              <a href="store-dashboard.html">Store Dashboard</a>
            </div>
            <div>
              <h3>Support</h3>
              <a href="search.html">Search</a>
              <a href="reserve.html">Reserve</a>
              <a href="login.html">Account Login</a>
            </div>
            <div>
              <h3>Contact</h3>
              <a href="contact.html">Contact EcoSave</a>
              <a href="mailto:support@ecosave.local">support@ecosave.local</a>
              <a href="partner.html">Become a Partner</a>
            </div>
          </div>
        </div>
        <div class="container footer__bottom">
          <p>© 2026 EcoSave Market. All rights reserved.</p>
          <div>
            <a href="about.html">Instagram</a>
            <a href="partner.html">LinkedIn</a>
            <a href="contact.html">X</a>
          </div>
        </div>
      </footer>
    `;
  }

  function bindMobileMenu() {
    const menuToggle = document.querySelector(".menu-toggle");
    const mobileMenu = document.querySelector("#mobileMenu");

    if (!menuToggle || !mobileMenu || menuToggle.dataset.menuBound === "true") return;
    menuToggle.dataset.menuBound = "true";

    menuToggle.addEventListener("click", () => {
      const isOpen = mobileMenu.classList.toggle("is-open");
      menuToggle.setAttribute("aria-expanded", String(isOpen));
      menuToggle.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
    });

    mobileMenu.addEventListener("click", (event) => {
      if (!event.target.closest("a")) return;
      mobileMenu.classList.remove("is-open");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Open menu");
    });
  }

  function render() {
    document.querySelector(".top-bar")?.remove();
    document.querySelector(".site-header")?.remove();
    document.body.insertAdjacentHTML("afterbegin", headerTemplate());

    document.querySelector("footer")?.remove();
    document.body.insertAdjacentHTML("beforeend", footerTemplate());

    bindMobileMenu();
  }

  render();

  return {
    bindMobileMenu,
    render
  };
})();
