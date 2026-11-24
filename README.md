# Athena Library Management System

Web application for managing library book inventories, member checkouts, and return tracking. Built with FastAPI, PostgreSQL, SQLAlchemy, and React.

## Overview

- **Authentication & Roles:** JWT-based login and registration with separate views and permissions for `Admin` (librarians) and `Member` (readers).
- **Catalog Search:** Filter books by title, author, ISBN, category, and stock availability.
- **Checkout & Return Rules:** Limits members to 3 active borrowed books at a time, blocks duplicate active checkouts of the same title, and sets a 14-day return window.
- **Database Concurrency:** Uses row-level locking (`SELECT ... FOR UPDATE`) on book records during checkout and return requests to prevent inventory mismatches when multiple requests happen at once.
- **Admin Dashboard:** Displays total books, active loans, overdue counts, and member totals, with forms to add or remove books and review circulation logs.

## Tech Stack

- **Backend:** Python, FastAPI, SQLAlchemy, Pydantic, PostgreSQL
- **Frontend:** React, Vite, React Router, Bootstrap 5, Axios

## Folder Structure

```text
Athena-library-management-system/
├── backend/
│   ├── app/
│   │   ├── routers/      # Auth, books, and borrow endpoints
│   │   ├── auth.py       # JWT and password hashing helpers
│   │   ├── database.py   # Database engine and session setup
│   │   ├── main.py       # FastAPI app and CORS settings
│   │   ├── models.py     # SQLAlchemy table definitions
│   │   └── schemas.py    # Request and response schemas
│   ├── requirements.txt
│   └── seed.py
└── frontend/
    ├── src/
    │   ├── components/   # Navigation bar and protected route wrapper
    │   ├── context/      # Authentication state
    │   ├── pages/        # Catalog, Profile, AdminDashboard, Login, Register
    │   └── services/     # Axios API instance
    └── vercel.json