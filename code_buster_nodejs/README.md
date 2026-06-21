# Codebuster Machine Test REST API (Node.js + Express + MySQL)

## Installation & Setup

### 1. Prerequisites
- **Node.js** (v16.x or newer recommended)
- **MySQL Server** (Running locally or remotely)

### 2. Configure Environment Variables
Clone the `.env.example` file and create a `.env` file in the project root:
```env
PORT=5000
NODE_ENV=development

# MySQL DB configurations
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=code_buster
DB_USER=root
DB_PASSWORD=your_password

# Log details
LOG_LEVEL=info
BULK_UPLOAD_BATCH_SIZE=500
```
*Note: Make sure you create the target database (e.g. `CREATE DATABASE code_buster;`) inside your MySQL instance before running the app.*

### 3. Install Dependencies
Run the command below in the project directory:
```bash
npm install
```

### 4. Run the Server
- **Development Mode** (Runs server with `nodemon` for hot reloading):
  ```bash
  npm run dev
  ```
- **Production Mode**:
  ```bash
  npm start
  ```
Upon starting, Sequelize automatically compiles model schemas, maps associations, and synchronizes the MySQL tables (`users`, `categories`, `products`).

---

## API Documentation Summary

### Response Formats
- **Success Response (200 / 201):**
  ```json
  {
    "success": true,
    "message": "Category created successfully",
    "data": { "id": 1, "uniqueId": "CAT_1a2b3c4d", "name": "Electronics" }
  }
  ```
- **Error Response (400 / 404 / 409 / 422 / 500):**
  ```json
  {
    "success": false,
    "message": "Validation failed",
    "errors": [
      { "field": "name", "message": "Category name is required" }
    ]
  }
  ```

### User API (`/api/users`)
- `POST /` : Registers user. Body: `{ "email": "user@example.com", "password": "securepassword" }` (hashes password explicitly; ignores hash in returns).
- `GET /` : Lists users (paginated).
- `GET /:id` : Retrieves user details (supports numeric database ID or string `uniqueId`).
- `PUT /:id` : Updates user credentials (hashes password updates).
- `DELETE /:id` : Deletes user account.

### Category API (`/api/categories`)
- `POST /` : Creates a category. Body: `{ "name": "Electronics", "userId": 1 }` (checks user presence; blocks duplicates case-insensitively).
- `GET /` : Lists categories (supports pagination and `search=name` filters).
- `GET /:id` : Retrieves category by ID or `uniqueId`.
- `PUT /:id` : Updates category name. Body: `{ "name": "Smartphones", "userId": 1 }`.
- `DELETE /:id` : Deletes category (safe check: blocks delete requests if products are linked to the category).

### Product API (`/api/products`)
- `POST /` : Creates product. Body: `{ "name": "iPhone", "productPrice": 999.00, "categoryId": 1, "userId": 1 }`.
- `GET /` : Paginated search list. Query parameters:
  - `page`: Page index (default: `1`)
  - `limit`: Items per page (default: `10`)
  - `search`: Search products by name (case-insensitive substring)
  - `category`: Search products by category name (case-insensitive substring)
  - `sortBy`: Column to sort (supports `productPrice`, `name`, `createdAt`)
  - `sortOrder`: Sorting direction (`asc` or `desc`)
- `GET /:id` : Retrieves product details.
- `PUT /:id` : Updates product parameters.
- `DELETE /:id` : Deletes product.
- `POST /bulk-upload` : Imports products in batch transactions. Accepts multipart form data with file key named `file`.
- `GET /export` : Generates report files. Query param: `format=csv` (streams response) or `format=xlsx` (excel binary).

---

## Sample Bulk Upload Format (CSV)
The bulk uploader requires the header names below. Save as `.csv` and upload:
```csv
name,productImage,productPrice,categoryUniqueId,userUniqueId
iPhone 15 Pro,https://images.com/iphone15.jpg,129999.00,CAT_0d2e8f1a,USR_7a9f8e4b
Logitech MX Master,https://images.com/mxmaster.jpg,9500.00,CAT_0d2e8f1a,USR_7a9f8e4b
```
Use the Postman Collection at the root of the project to test all endpoints!
