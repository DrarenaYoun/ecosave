const EcoSaveAuth = (() => {
  const usersKey = "ecosaveUsers";
  const currentUserKey = "ecosaveCurrentUser";
  const wishlistKey = "ecosaveWishlist";

  function read(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key)) || fallback;
    } catch {
      return fallback;
    }
  }

  function users() {
    return read(usersKey, []);
  }

  function currentUser() {
    return read(currentUserKey, null);
  }

  function currentPath() {
    return `${window.location.pathname.split("/").pop()}${window.location.search}`;
  }

  function saveUsers(nextUsers) {
    localStorage.setItem(usersKey, JSON.stringify(nextUsers));
  }

  function saveCurrentUser(user) {
    localStorage.setItem(currentUserKey, JSON.stringify(user));
  }

  function normalizeEmail(email) {
    return String(email || "").trim().toLowerCase();
  }

  function destinationFor(user) {
    return user?.role === "store" ? "store-dashboard.html" : "dashboard.html";
  }

  function redirectToLogin() {
    window.location.href = `login.html?redirect=${encodeURIComponent(currentPath())}`;
  }

  function enforceAccess() {
    const requiredRole = document.body.dataset.requiredRole;
    if (!requiredRole) return;

    const user = currentUser();
    if (!user) {
      redirectToLogin();
      return;
    }

    if (user.role !== requiredRole) {
      window.location.href = destinationFor(user);
    }
  }

  function logout() {
    localStorage.removeItem(currentUserKey);
    if (document.body.dataset.requiredRole) {
      window.location.href = "index.html";
      return;
    }
    window.location.reload();
  }

  function navItemsFor(user) {
    if (!user) {
      return [
        ["Home", "index.html"],
        ["Shop", "shop.html"],
        ["Partner", "partner.html"],
        ["About", "about.html"],
        ["Contact", "contact.html"]
      ];
    }

    if (user.role === "store") {
      return [
        ["Home", "index.html"],
        ["Shop", "shop.html"],
        ["Store Dashboard", "store-dashboard.html"],
        ["Partner", "partner.html"],
        ["About", "about.html"]
      ];
    }

    return [
      ["Home", "index.html"],
      ["Shop", "shop.html"],
      ["Wishlist", "wishlist.html"],
      ["My Reservations", "dashboard.html"],
      ["Partner", "partner.html"],
      ["About", "about.html"]
    ];
  }

  function isActiveHref(href) {
    const page = window.location.pathname.split("/").pop() || "index.html";
    if (href === "index.html") return page === "index.html" || page === "";
    return page === href;
  }

  function navLink(label, href) {
    const active = isActiveHref(href) ? ' class="is-active"' : "";
    return `<li><a${active} href="${href}">${label}</a></li>`;
  }

  function mobileLink(label, href) {
    return `<a href="${href}">${label}</a>`;
  }

  function updateNavigation() {
    const user = currentUser();

    document.querySelectorAll('a[href="signup.html"]').forEach((link) => {
      link.href = "register.html";
      if (link.textContent.trim().toLowerCase().includes("sign")) {
        link.textContent = "Register";
      }
    });

    const navItems = navItemsFor(user);

    document.querySelectorAll(".nav__menu").forEach((menu) => {
      menu.innerHTML = navItems.map(([label, href]) => navLink(label, href)).join("");
    });

    document.querySelectorAll(".nav__actions").forEach((actions) => {
      if (!user) {
        actions.innerHTML = '<a class="nav__signin" href="login.html">Login</a><a class="btn btn--primary btn--small" href="register.html">Register</a>';
        return;
      }

      actions.innerHTML = `<span class="nav__signin auth-user">${user.fullName}</span><button class="btn btn--primary btn--small auth-logout" type="button">Logout</button>`;
    });

    document.querySelectorAll(".mobile-menu").forEach((menu) => {
      if (!user) {
        menu.innerHTML = `${navItems.map(([label, href]) => mobileLink(label, href)).join("")}<a href="login.html">Login</a><a href="register.html">Register</a>`;
        return;
      }
      menu.innerHTML = `${navItems.map(([label, href]) => mobileLink(label, href)).join("")}<a class="auth-user" href="${destinationFor(user)}">${user.fullName}</a><a class="auth-logout" href="index.html">Logout</a>`;
    });

    document.querySelectorAll(".auth-logout").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        logout();
      });
    });

    updateWishlistNavigation();
  }

  function wishlistItems() {
    return read(wishlistKey, []);
  }

  function saveWishlist(items) {
    localStorage.setItem(wishlistKey, JSON.stringify(items));
    updateWishlistNavigation();
    window.dispatchEvent(new CustomEvent("ecosaveWishlistUpdated"));
  }

  function userWishlist(user = currentUser()) {
    if (!user) return [];
    return wishlistItems().filter((item) => item.userId === user.id);
  }

  function wishlistCount() {
    return userWishlist().length;
  }

  function isWishlisted(productId) {
    const user = currentUser();
    return Boolean(user && userWishlist(user).some((item) => item.productId === productId));
  }

  function requireWishlistUser() {
    const user = currentUser();
    if (!user) {
      redirectToLogin();
      return null;
    }
    if (user.role !== "customer") {
      return null;
    }
    return user;
  }

  function addWishlistItem(productId) {
    const user = requireWishlistUser();
    if (!user || !productId || isWishlisted(productId)) return false;

    saveWishlist([
      ...wishlistItems(),
      {
        userId: user.id,
        productId,
        addedAt: new Date().toISOString()
      }
    ]);
    return true;
  }

  function removeWishlistItem(productId) {
    const user = currentUser();
    if (!user || !productId) return false;

    const nextItems = wishlistItems().filter((item) => !(item.userId === user.id && item.productId === productId));
    saveWishlist(nextItems);
    return true;
  }

  function toggleWishlist(productId) {
    if (isWishlisted(productId)) {
      removeWishlistItem(productId);
      return false;
    }
    return addWishlistItem(productId);
  }

  function updateWishlistButtons(root = document) {
    root.querySelectorAll("[data-wishlist-product-id]").forEach((button) => {
      const productId = button.dataset.wishlistProductId;
      const active = isWishlisted(productId);
      button.classList.toggle("is-active", active);
      button.textContent = active ? "\u2665" : "\u2661";
      button.setAttribute("aria-label", active ? "Remove from wishlist" : "Add to wishlist");
    });
  }

  function updateWishlistNavigation() {
    const user = currentUser();
    const label = user?.role === "customer" ? `\u2764\uFE0F Wishlist (${wishlistCount()})` : "Wishlist";

    document.querySelectorAll('.site-header a[href="wishlist.html"], .mobile-menu a[href="wishlist.html"]').forEach((link) => {
      link.textContent = label;
    });

    document.querySelectorAll('[data-nav-target="wishlist.html"]').forEach((button) => {
      button.setAttribute("aria-label", label);
    });
  }

  function bindWishlistButtons(root = document) {
    root.querySelectorAll("[data-wishlist-product-id]").forEach((button) => {
      if (button.dataset.wishlistBound === "true") return;
      button.dataset.wishlistBound = "true";
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        toggleWishlist(button.dataset.wishlistProductId);
        updateWishlistButtons(root);
      });
    });

    updateWishlistButtons(root);
  }

  function registerUser(data) {
    const nextUsers = users();
    const email = normalizeEmail(data.email);

    if (nextUsers.some((user) => user.email === email)) {
      return { ok: false, message: "An account with this email already exists." };
    }

    const user = {
      id: `USER-${Date.now()}`,
      fullName: data.fullName.trim(),
      email,
      password: data.password,
      role: data.role,
      storeName: data.role === "store" ? data.storeName.trim() : "",
      location: data.role === "store" ? data.location.trim() : "",
      createdAt: new Date().toISOString()
    };

    nextUsers.push(user);
    saveUsers(nextUsers);
    saveCurrentUser(user);
    return { ok: true, user };
  }

  function loginUser(email, password) {
    const found = users().find((user) => user.email === normalizeEmail(email) && user.password === password);
    if (!found) {
      return { ok: false, message: "Email or password is incorrect." };
    }
    saveCurrentUser(found);
    return { ok: true, user: found };
  }

  function setupAuthForms() {
    const role = document.querySelector("#role");
    const storeFields = document.querySelector("#storeFields");
    const loginForm = document.querySelector("#loginForm");
    const registerForm = document.querySelector("#registerForm");
    const authError = document.querySelector("#authError");

    if (role && storeFields) {
      const toggleStoreFields = () => {
        const isStore = role.value === "store";
        storeFields.classList.toggle("is-visible", isStore);
        storeFields.querySelectorAll("input").forEach((input) => {
          input.required = isStore;
        });
      };
      role.addEventListener("change", toggleStoreFields);
      toggleStoreFields();
    }

    if (loginForm) {
      loginForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const result = loginUser(loginForm.email.value, loginForm.password.value);
        if (!result.ok) {
          authError.textContent = result.message;
          authError.classList.add("is-visible");
          return;
        }
        const redirect = new URLSearchParams(window.location.search).get("redirect");
        window.location.href = redirect || destinationFor(result.user);
      });
    }

    if (registerForm) {
      registerForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const formData = new FormData(registerForm);
        const roleValue = formData.get("role");
        const requiredValues = [
          formData.get("fullName"),
          formData.get("email"),
          formData.get("password"),
          roleValue
        ];

        if (roleValue === "store") {
          requiredValues.push(formData.get("storeName"), formData.get("location"));
        }

        if (requiredValues.some((value) => !String(value || "").trim())) {
          authError.textContent = "Please complete every required field.";
          authError.classList.add("is-visible");
          return;
        }

        const result = registerUser({
          fullName: formData.get("fullName"),
          email: formData.get("email"),
          password: formData.get("password"),
          role: roleValue,
          storeName: formData.get("storeName") || "",
          location: formData.get("location") || ""
        });

        if (!result.ok) {
          authError.textContent = result.message;
          authError.classList.add("is-visible");
          return;
        }

        window.location.href = destinationFor(result.user);
      });
    }
  }

  enforceAccess();
  updateNavigation();
  setupAuthForms();
  bindWishlistButtons();

  window.addEventListener("ecosaveWishlistUpdated", () => {
    updateWishlistButtons();
  });

  return {
    addWishlistItem,
    bindWishlistButtons,
    currentUser,
    destinationFor,
    isWishlisted,
    loginUser,
    logout,
    registerUser,
    removeWishlistItem,
    toggleWishlist,
    updateWishlistNavigation,
    userWishlist,
    wishlistCount
  };
})();
