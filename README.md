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