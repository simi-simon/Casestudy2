# Employee App - Backend Integration (Assignment 3)

A full-stack Employee Management Application with an Express and Node.js backend integrated with MongoDB Atlas and an Angular frontend dashboard.

## 🚀 Features

- **Full RESTful CRUD API**:
  - `GET /api/employeelist` — Fetch all employee records
  - `GET /api/employeelist/:id` — Fetch single employee by MongoDB ObjectId
  - `POST /api/employeelist` — Create a new employee with validation
  - `PUT /api/employeelist` — Update an existing employee
  - `DELETE /api/employeelist/:id` — Delete an employee by ObjectId
- **Single Page Application (SPA)**:
  - Serves static Angular bundle from `dist/Frontend`
  - Client-side routing supported via wildcard route `/*`
- **Data Validation & Error Handling**:
  - Required field validation (`name`, `position`, `location`, `salary`)
  - Numeric validation for `salary`
  - Valid MongoDB ObjectId checks
  - Standard HTTP status codes (`200`, `201`, `400`, `404`, `500`)

---

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB Atlas via Mongoose
- **Frontend**: Angular (pre-built in `dist/Frontend`)
- **Environment Management**: `dotenv`

---

## ⚙️ Setup & Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/simi-simon/Casestudy2.git
   cd Casestudy2
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
   Open `.env` and set your MongoDB Atlas connection string:
   ```env
   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/Casestudy2?retryWrites=true&w=majority
   PORT=3000
   ```

---

## 🏃 Running the Application

- **Production Mode**:
  ```bash
  npm start
  ```
- **Development Mode** (with automatic restart):
  ```bash
  npm run dev
  ```
- **Run Automated Tests**:
  ```bash
  npm test
  ```

Open your browser at `http://localhost:3000` to access the application.

---

## 🌐 Deployment on Render

1. Create a **New Web Service** connected to your GitHub repository.
2. Build Command: `npm install`
3. Start Command: `npm start`
4. Set Environment Variable:
   - `MONGODB_URI`: Your MongoDB Atlas connection string (ensure Atlas Network Access allows `0.0.0.0/0`).
