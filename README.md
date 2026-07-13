# Inventory Management System

A Java Spring Boot + MySQL + MongoDB inventory management project.

## Authentication & Authorization (Spring Security + JWT)

The project uses JWT for authentication. There are three roles with different levels of authorization:
- `ADMIN`: Full access to everything, including user management (listing/deleting users).
- `MANAGER`: Full access to products, inventory, stores, orders, and reports. No user management access.
- `EMPLOYEE`: Read access everywhere, can create orders and update inventory, cannot delete products/stores or manage users.

### Obtaining a Token

#### 1. Register a User
```bash
curl -X POST http://localhost:8081/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "adminUser",
    "email": "admin@example.com",
    "password": "securePassword123",
    "role": "ADMIN"
  }'
```
*(Roles can be: `ADMIN`, `MANAGER`, or `EMPLOYEE`)*

#### 2. Log in and Retrieve JWT Tokens
```bash
curl -X POST http://localhost:8081/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "adminUser",
    "password": "securePassword123"
  }'
```
Response:
```json
{
  "accessToken": "eyJhbGciOi...",
  "refreshToken": "eyJhbGciOi...",
  "username": "adminUser",
  "role": "ADMIN"
}
```

### Using the JWT Token

To authenticate your requests, add the `Authorization` header with the Bearer token:
```bash
curl -X GET http://localhost:8081/product \
  -H "Authorization: Bearer <your_access_token>"
```

### Testing in Frontend

To make the frontend web client work with authenticated APIs:
1. Log in via curl or Swagger UI to obtain the `accessToken`.
2. Open your browser console (F12) on the frontend page and run:
   ```javascript
   localStorage.setItem("accessToken", "YOUR_ACCESS_TOKEN_HERE");
   ```
3. Refresh the page. The frontend fetch requests will now automatically include the JWT token.

---

## Google OAuth Setup

To configure Google OAuth login and registration:

### 1. Obtain Credentials from Google Cloud Console
1. Navigate to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create or select a project.
3. Go to **APIs & Services** > **OAuth consent screen**:
   - Set User Type to External.
   - Fill in app information, and add `openid`, `email`, and `profile` to scopes.
   - Under Test Users, add your testing email accounts.
4. Go to **APIs & Services** > **Credentials**:
   - Click **Create Credentials** > **OAuth client ID**.
   - Set Application Type to **Web application**.
   - Under Authorized JavaScript origins, add `http://localhost:5173`.
   - Click Create and copy your **Client ID** and **Client Secret**.

### 2. Configure Environment Variables
- **Backend (`back-end/.env`)**:
  ```env
  GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
  GOOGLE_CLIENT_SECRET=GOCSPX-your-client-secret
  ```
- **Frontend (`front-end-react/.env`)**:
  ```env
  VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
  ```

---

## API Documentation (OpenAPI / Swagger UI)

All APIs are documented and testable via Swagger UI:
- **Swagger UI URL:** [http://localhost:8081/swagger-ui.html](http://localhost:8081/swagger-ui.html)
- You can use the "Authorize" button to paste your JWT `accessToken` (under format `Bearer <token>`) to test authenticated endpoints.

---

## Pagination & Sorting

The following endpoints support pagination:
- `GET /product?page=0&size=5&sort=id,asc`
- `GET /inventory/{storeId}?page=0&size=5&sort=id,asc`
- `GET /reviews?page=0&size=5&sort=id,asc`
- `GET /reviews/{storeId}/{productId}?page=0&size=5&sort=id,asc`

The response format returns metadata alongside the contents:
```json
{
  "products": [...],
  "currentPage": 0,
  "totalPages": 3,
  "totalItems": 15
}
```

---

## Phase 2: Core Improvements & Dynamic Features

This phase introduces database schema normalization, static file storage, transactional inter-store transfers, scheduling low-stock alerts, and specifications-based search.

### 1. Category & Supplier Management
- **Category Endpoints:** CRUD at `/category` (reads for all authenticated roles, writes restricted to `ADMIN` and `MANAGER`).
- **Supplier Endpoints:** CRUD at `/supplier` (reads for all roles, writes restricted to `ADMIN` and `MANAGER`).
- **Data Migration:** Old string category columns are automatically migrated into the normalization structures upon application startup.

### 2. Product Images
- **Upload Endpoint:** `POST /uploads` (multipart file upload). Returns `{ "url": "..." }` pointing to the statically served upload folder.
- Stored under a configurable local uploads directory, which can be modified via `app.upload.dir` in properties.

### 3. Stock Transfers
- **Initiate:** `POST /transfers/initiate?productId={id}&fromStoreId={id}&toStoreId={id}&quantity={qty}` (stores source stock level validation).
- **Confirm Receipt:** `POST /transfers/{id}/confirm` (managers increment target inventory and mark status `COMPLETED`).
- **Cancel:** `POST /transfers/{id}/cancel` (managers cancel PENDING logs and return quantity back to source store).
- All transfer operations are wrapped in `@Transactional`.

### 4. Low Stock Alerts
- **Configure Threshold:** Define per-inventory `lowStockThreshold` values (default 10).
- **Retrieval:** `GET /inventory/low-stock/{storeId}` returns items below threshold for a store.
- **Scheduled Alerts:** Daily checks at midnight log low-stock items via `@Scheduled` alerts.

### 5. Advanced Search & Filtering
- **Endpoint:** `GET /product/search`
- **Supported Parameters:** `sku` (partial SKU match), `categoryId`, `minPrice`, `maxPrice`, `storeId` (availablity check), and `minRating` (calculates review averages dynamically from MongoDB). Supports full pagination & sorting.