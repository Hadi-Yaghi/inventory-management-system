# Changelog

All notable changes to the Inventory Management System will be documented in this file.

## [1.1.0] - 2026-07-13

### Added
- **Google OAuth Integration**: Added a stateless backend Google ID Token verification endpoint `POST /auth/google` using Google's Java Client API Libraries (`com.google.api-client`).
- **User Persistence Expansion**: Added `auth_provider` column to the `User` entity to dynamically track OAuth and standard accounts.
- **Frontend Auth Integration**: Wired programmatic Google Sign-In response hooks using Google's Identity Services script inside `index.html` and `AuthContext.jsx`.
- **Environment Documentation**: Added `.env.example` templates in both frontend and backend directories.

### Changed
- **SaaS Redesign**: Completely overhauled `Login.jsx` and `Signup.jsx` with card layouts, custom backgrounds, logo wordmarks, input labels, password eye toggles, active button loading spinners, and inline form validation.

## [1.0.0] - 2026-07-13

### Fixed
#### Backend Security & Permissions
- **Security Rule Ordering**: Reordered matchers in [SecurityConfig.java](file:///c:/Users/hadi9/Downloads/inventory-management-system-codex-fix-errors/inventory-management-system-codex-fix-errors/back-end/src/main/java/com/project/code/security/SecurityConfig.java) to evaluate specific paths (e.g., `/store/placeOrder` and `/inventory/**` for EMPLOYEE) before generic catch-all rules. This resolved 403 Forbidden issues on order placement and inventory updates.
- **Role-Based Filtering on Sidebar**: Updated [Layout.jsx](file:///c:/Users/hadi9/Downloads/inventory-management-system-codex-fix-errors/inventory-management-system-codex-fix-errors/front-end-react/src/components/Layout.jsx) to show/hide navigation links dynamically based on user role (e.g., Reports and Activity Logs are restricted).
- **Dashboard Crashes for Employee**: Resolved 403 dashboard crash for EMPLOYEEs by conditionally calling the analytics API only for ADMIN/MANAGER in [Dashboard.jsx](file:///c:/Users/hadi9/Downloads/inventory-management-system-codex-fix-errors/inventory-management-system-codex-fix-errors/front-end-react/src/pages/Dashboard.jsx) and showing a welcome screen instead.

#### Backend Controllers & Services
- **Product Deletion Corrupts Data**: Fixed `deleteProduct` in [ProductController.java](file:///c:/Users/hadi9/Downloads/inventory-management-system-codex-fix-errors/inventory-management-system-codex-fix-errors/back-end/src/main/java/com/project/code/Controller/ProductController.java) which incorrectly deleted order items matching the product's primary key as order item ID. Replaced with `deleteByProductId` in [OrderItemRepository.java](file:///c:/Users/hadi9/Downloads/inventory-management-system-codex-fix-errors/inventory-management-system-codex-fix-errors/back-end/src/main/java/com/project/code/Repo/OrderItemRepository.java).
- **Negative Product Prices**: Added `@Positive` validation in [Product.java](file:///c:/Users/hadi9/Downloads/inventory-management-system-codex-fix-errors/inventory-management-system-codex-fix-errors/back-end/src/main/java/com/project/code/Model/Product.java) to enforce price positivity.
- **Product Details 404**: Updated `getProductbyId` in [ProductController.java](file:///c:/Users/hadi9/Downloads/inventory-management-system-codex-fix-errors/inventory-management-system-codex-fix-errors/back-end/src/main/java/com/project/code/Controller/ProductController.java) to throw `NotFoundException` instead of returning null with a 200 HTTP code.
- **Error Handling**: Replaced `catch (Error e)` blocks with `catch (Exception e)` in [ProductController.java](file:///c:/Users/hadi9/Downloads/inventory-management-system-codex-fix-errors/inventory-management-system-codex-fix-errors/back-end/src/main/java/com/project/code/Controller/ProductController.java) and [StoreController.java](file:///c:/Users/hadi9/Downloads/inventory-management-system-codex-fix-errors/inventory-management-system-codex-fix-errors/back-end/src/main/java/com/project/code/Controller/StoreController.java).
- **Inventory Validation NPE**: Added null checks to `validateQuantity` in [InventoryController.java](file:///c:/Users/hadi9/Downloads/inventory-management-system-codex-fix-errors/inventory-management-system-codex-fix-errors/back-end/src/main/java/com/project/code/Controller/InventoryController.java) to prevent NullPointerException when inventory records don't exist.

#### Frontend UI Pages & Components
- **Sidebar Links Added**: Registered missing pages (Returns, Reviews, Reports) in [Layout.jsx](file:///c:/Users/hadi9/Downloads/inventory-management-system-codex-fix-errors/inventory-management-system-codex-fix-errors/front-end-react/src/components/Layout.jsx) sidebar list.
- **Signup Page Activation**: Fully wired the form in [Signup.jsx](file:///c:/Users/hadi9/Downloads/inventory-management-system-codex-fix-errors/inventory-management-system-codex-fix-errors/front-end-react/src/pages/Signup.jsx) to the backend `POST /auth/register` API.
- **Product Management View**: Hid the "Add Product" button for the EMPLOYEE role on [Products.jsx](file:///c:/Users/hadi9/Downloads/inventory-management-system-codex-fix-errors/inventory-management-system-codex-fix-errors/front-end-react/src/pages/Products.jsx) and added a fully functional "Delete" action for ADMIN and MANAGER roles.
- **Category Management**: Implemented inline creation and delete actions in [Categories.jsx](file:///c:/Users/hadi9/Downloads/inventory-management-system-codex-fix-errors/inventory-management-system-codex-fix-errors/front-end-react/src/pages/Categories.jsx).
- **Order Status Controls**: Integrated status change transitions (Confirm, Cancel, Complete) into the [Orders.jsx](file:///c:/Users/hadi9/Downloads/inventory-management-system-codex-fix-errors/inventory-management-system-codex-fix-errors/front-end-react/src/pages/Orders.jsx) view.
- **Stock Transfers**: Created a popup modal/form in [Inventory.jsx](file:///c:/Users/hadi9/Downloads/inventory-management-system-codex-fix-errors/inventory-management-system-codex-fix-errors/front-end-react/src/pages/Inventory.jsx) to request stock transfers.
- **Report Downloads**: Wired up Excel, PDF, and CSV download capabilities on [Reports.jsx](file:///c:/Users/hadi9/Downloads/inventory-management-system-codex-fix-errors/inventory-management-system-codex-fix-errors/front-end-react/src/pages/Reports.jsx).
- **Returns & Users Operations**: Implemented Approve/Reject buttons on [Returns.jsx](file:///c:/Users/hadi9/Downloads/inventory-management-system-codex-fix-errors/inventory-management-system-codex-fix-errors/front-end-react/src/pages/Returns.jsx) and User Delete on [Users.jsx](file:///c:/Users/hadi9/Downloads/inventory-management-system-codex-fix-errors/inventory-management-system-codex-fix-errors/front-end-react/src/pages/Users.jsx).

### Added
- **API Endpoints**: Added `GET /store` and `DELETE /store/{id}` in [StoreController.java](file:///c:/Users/hadi9/Downloads/inventory-management-system-codex-fix-errors/inventory-management-system-codex-fix-errors/back-end/src/main/java/com/project/code/Controller/StoreController.java) to allow listing stores in the UI and store cleanups.
- **Frontend API Integrations**: Added missing handlers for stock transfers, user deletes, report exports, and returns approve/reject actions in [misc.js](file:///c:/Users/hadi9/Downloads/inventory-management-system-codex-fix-errors/inventory-management-system-codex-fix-errors/front-end-react/src/api/misc.js).
