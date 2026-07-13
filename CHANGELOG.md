# Changelog

## 2026-07-09

- Fixed mojibake VND currency rendering across homepage, shop, product detail, search, wishlist, reservation, customer dashboard, store dashboard, and analytics displays.
- Standardized displayed product prices to the `₫4,000` format.
- Added a shared `EcoSaveFormat.money()` formatter for consistent VND rendering across page scripts.
- Removed obsolete white placeholder pseudo-elements from product image containers on homepage, shop cards, and product detail gallery.
- Updated static product price placeholders to use VND formatting while preserving existing layout and behavior.
- Added Business Performance analytics to the seller dashboard.
- Added KPI cards for products, reservations, orders, revenue, discounts, and remaining inventory.
- Added best-selling product ranking, inventory overview, and reservation status statistics.
- Added local canvas charts for revenue by product, reservation status distribution, and top selling products.
- Restored `store-dashboard.html` with existing product, inventory, reservation, and analytics sections.
- Replaced centralized products with 83 rows from `EcoSave_Product_List_FINAL.xlsx`.
- Updated product images to use the workbook `Image Search Link` values.
- Fixed product data encoding so Vietnamese names and locations are stored as UTF-8.
- Updated shop and related product cards to render product image URLs from centralized data.
- Added centralized reservation data helpers in `js/reservation-data.js`.
- Added reservation creation, customer filtering, store filtering, status updates, cancellation, completion, expiry handling, and reservation statistics.
- Updated customer reservation flow to create structured reservations and decrement inventory through centralized helpers.
- Added My Reservations tracking to the reserve page and customer dashboard.
- Upgraded store dashboard reservation management with Confirm, Reject, Mark Ready, and Mark Completed actions.
- Added inventory restoration for cancelled, rejected, and expired reservations while preserving completed reservation inventory.
- Added local inventory synchronization using `ecosaveInventory`.
- Added reservation quantity decrement with sold-out protection.
- Added live category counts on the homepage from centralized products and custom products.
- Added sold-out and low-stock states across homepage deals, shop cards, product detail, wishlist, search, and reserve flow.
- Added store dashboard inventory metrics for total products, total units, low stock, and sold out products.
- Added shared product data helper for merging imported products with `ecosaveCustomProducts`.
- Added store product management in the store dashboard with add, edit, delete, validation, and ownership checks.
- Added automatic discount calculation and generated IDs for store-created products.
- Updated homepage featured deals, shop, product detail, reservations, customer dashboard, wishlist, and search to use centralized product access.
- Added a centralized search results page using the same product catalog and wishlist/reserve actions.
- Updated store dashboard metrics to reflect store products and incoming reservations from localStorage.

## 2026-07-08

- Added shared layout renderer for consistent header, mobile navigation, and footer across the site.
- Standardized role-based navigation for guests, customers, and store partners.
- Updated shared footer to include Marketplace, Company, Support, Contact, social links, and copyright.
- Added shared stylesheet loading to older inline-style pages for consistent footer and responsive navigation.

## 2026-07-07

- Added customer wishlist saved in `ecosaveWishlist` per logged-in user.
- Added wishlist page with saved product cards, empty state, product view, reserve, and remove actions.
- Added shared wishlist heart behavior across home, shop, product detail, and related products.
- Added wishlist count updates in navigation for logged-in customers.
- Merged centralized products with `ecosaveCustomProducts` for wishlist-compatible product rendering.
- Added local authentication with customer and store account roles.
- Added registration with store name and location fields for store accounts.
- Added login, logout, current-user persistence, and role-based page protection.
- Updated navigation to show Login/Register for guests and user name/Logout for logged-in users.
- Connected customer reservations to the logged-in customer account.
- Added store dashboard for partner product and reservation management.
- Added store overview metrics for listed products, total reservations, and pending reservations.
- Added partner reservation actions for confirming or rejecting customer reservations.
- Added Store Dashboard navigation links across customer and marketplace pages.
- Added customer dashboard for viewing saved reservations from `ecosaveReservations`.
- Added reservation cards with product details, status, view product, and cancel actions.
- Added default reservation status support with `Pending` and `Cancelled`.
- Added reservation flow in `reserve.html` using centralized product data and `?id=`.
- Added `js/reserve.js` with product summary rendering, form validation, reservation ID generation, and localStorage saving.
- Updated Product Detail “Reserve Now” to open `reserve.html?id=...`.
- Updated `product.html` to render product details from centralized `js/products.js` data using `?id=`.
- Added product detail fallback handling for missing product IDs.
- Connected shop product cards to `product.html?id=...`.
- Replaced sample product data with 89 products imported from `EcoSave_Product_List.xlsx`.
- Updated shop rendering to use Excel-backed product fields: `salePrice`, `expiryDate`, `image`, `description`, `quantity`, and `location`.
- Updated shop filters to match imported product categories.
- Added centralized product data in `js/products.js`.
- Updated the shop page to render products from shared local JavaScript data.
- Preserved shop filtering, sorting, and pagination with reusable shop rendering logic.
- Implemented homepage navigation hub links.
- Connected shop and product authentication links to placeholder pages.
- Added placeholder pages for unfinished navigation destinations.
- Added shared CSS and JavaScript for placeholder page header, footer, and mobile menu behavior.
