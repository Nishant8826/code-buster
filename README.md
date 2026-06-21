# Codebuster Workspace

This monorepo contains the following projects:
1. **Frontend**: [Angular Application](file:///d:/git/codebuster/angular_assignment) (`angular_assignment`)
2. **Backend**: [REST API (Node.js + Express + MySQL)](file:///d:/git/codebuster/code_buster_nodejs) (`code_buster_nodejs`)

---

## 🛠️ Project Structure
- `/angular_assignment`: Angular frontend application.
- `/code_buster_nodejs`: Node.js & Express REST API backend using Sequelize ORM.

---

## 🖥️ Frontend Setup (Angular)
Go to the frontend directory:
```bash
cd angular_assignment
```

### Install Dependencies
```bash
npm install
```

### Run Development Server
```bash
npm run dev # or ng serve
```
The app will run at `http://localhost:4200/`.

### Run Unit Tests
```bash
npm run test
```

---

## ⚙️ Backend Setup (Node.js API)
Go to the backend directory:
```bash
cd code_buster_nodejs
```

### Prerequisites
- **Node.js** (v16.x or newer recommended)
- **MySQL Server** (Running locally or remotely)

### Configure Environment Variables
Create a `.env` file in the `code_buster_nodejs` directory:
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
*Note: Make sure to create the target database (e.g., `CREATE DATABASE code_buster;`) in MySQL before starting the server.*

### Install Dependencies
```bash
npm install
```

### Run Server
- **Development Mode** (with hot reload):
  ```bash
  npm run dev
  ```
- **Production Mode**:
  ```bash
  npm start
  ```
Upon starting, Sequelize automatically compiles schemas, maps associations, and synchronizes the MySQL tables (`users`, `categories`, `products`).

---

## Sample Bulk Upload Format (CSV)
The bulk uploader requires the header names below. Save as `.csv` and upload:
```csv
name,productImage,productPrice,categoryUniqueId,userUniqueId
iPhone 15 Pro,https://images.com/iphone15.jpg,129999.00,CAT_0d2e8f1a,USR_7a9f8e4b
Logitech MX Master,https://images.com/mxmaster.jpg,9500.00,CAT_0d2e8f1a,USR_7a9f8e4b
```
Use the Postman Collection at the root of the project to test all endpoints!
