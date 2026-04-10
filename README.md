# Budget Tracker

## Project Overview

Budget Tracker is a full-stack web application that helps users manage personal income and expenses.

The project is split into two parts:

- **Backend**: Node.js + Express + PostgreSQL + JWT Authentication
- **Frontend**: React (Vite) + Axios + Recharts

The app allows users to:

- create an account and log in,
- add, update, and delete transactions,
- view financial summaries and charts on the dashboard,
- export filtered transactions as a CSV file.

---

## Setup Instructions

### 1) Prerequisites

Make sure the following are installed on your system:

- Node.js (LTS recommended)
- npm
- PostgreSQL

---

### 2) Clone and Open Project

```bash
git clone https://github.com/Mehroz998/Budget-Tracker.git
cd Budget_Tracker
```

---

### 3) Backend Setup

```bash
cd backend
npm install
```

#### Backend Environment Variables

Create a `backend/.env` file and add the following values:

```env
PORT=3000
DATABASE_URL=your_neondb_connectionString

JWT_SECRET=your_access_token_secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your_refresh_token_secret
JWT_REFRESH_EXPIRES_IN=7d
```

#### Initialize Database Tables

```bash
npm run setup-db
```

This command creates the required tables:

- `users`
- `transactions`
- `refresh_tokens`

#### Start Backend Server

Development mode:

```bash
npm run dev
```

Production mode:

```bash
npm start
```

Backend base URL:

- `http://localhost:3000`

---

### 4) Frontend Setup

Open a new terminal and run:

```bash
cd frontend
npm install
npm run dev
```

Frontend default Vite URL:

- `http://localhost:5173`

> Note: The frontend API client currently uses `http://localhost:3000/api`, so it is recommended to run the backend on port `3000`.

---

### 5) App Use Karna

1. Create an account from the Register page.
2. Log in to the application.
3. Manage your data from the Dashboard and Transactions pages.

---

## Features List

### Authentication

- User registration with basic validation
- User login with JWT access + refresh tokens
- Protected routes (backend + frontend)
- User profile fetch (`/auth/getme`)
- Logout with refresh token revocation
- Refresh token endpoint for new access token generation

### Transaction Management

- Add new transaction (income/expense)
- Edit existing transaction
- Delete transaction
- Transaction listing with pagination
- Category-based filtering
- Date-based filtering:
  - Month to Date
  - Last 7 Days
  - Last Month
  - Last 3 Months
  - From Start
  - Custom Range

### Dashboard & Analytics

- Total balance, total income, total expense metrics
- Monthly income vs expense bar chart
- Expense category pie chart
- Expense trend line chart by category
- Dynamic data reload on filter changes

### Export

- Export filtered transactions as CSV file

### Security & Backend Middleware

- Password hashing using bcrypt
- Bearer token authentication middleware
- CORS + Helmet enabled
- Input sanitization utility
