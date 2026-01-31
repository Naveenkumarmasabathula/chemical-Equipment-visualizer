# Chemical Equipment Parameter Visualizer (Hybrid Web + Desktop)

React (Web) and PyQt5 (Desktop) frontends with a **Django + Django REST Framework** API backend using **Pandas** for CSV parsing/analytics and **SQLite** for data storage.

## Task requirements checklist

| Requirement | Status |
|-------------|--------|
| **Tech stack** | |
| Frontend (Web): React.js + Chart.js | ✅ `client/` (Vite, React, Chart.js) |
| Frontend (Desktop): PyQt5 + Matplotlib | ✅ `desktop/` (PyQt5, Matplotlib) |
| Backend: Django + DRF | ✅ `backend/` |
| Data handling: Pandas (CSV & analytics) | ✅ Backend parsing & summary |
| Database: SQLite (last 5 datasets) | ✅ `backend/db.sqlite3` |
| **Key features** | |
| 1. CSV upload (Web + Desktop) | ✅ Web: FileUpload; Desktop: upload dialog |
| 2. Data summary API | ✅ `GET /api/summary/:id` |
| 3. Visualization: Chart.js (Web), Matplotlib (Desktop) | ✅ Charts.tsx; desktop charts |
| 4. History: last 5 datasets with summary | ✅ Dataset list, pin, delete |
| 5. PDF report + basic authentication | ✅ `GET .../report.pdf`, login |
| 6. Sample data: sample_equipment_data.csv | ✅ `sample_data/sample_equipment_data.csv` |

## Run locally

1. **Python 3.10+** and **Node 18+** required.

2. Install dependencies:
   ```bash
   pip install -r backend/requirements.txt
   npm install
   ```

3. Set up the database (first time only):
   ```bash
   cd backend
   python manage.py migrate
   ```
   The default user (**admin** / **admin**) is created automatically on first API request. Optionally run `python manage.py create_default_user` to create it earlier.

4. Run both frontend and backend:
   ```bash
   npm run dev
   ```
   Opens **http://localhost:5000**. Vite (port 5000) proxies `/api` to Django (port 8000).

5. Or run separately:
   - Backend: `npm run dev:backend` (or `python backend/manage.py runserver 8000`)
   - Frontend: `npm run dev:frontend` then open http://localhost:5000

## Build & preview

```bash
npm run build
npm run preview
```

Build output is in `dist/public`. For production, serve that folder (e.g. with Django static files or any static host) and point the API to your Django backend.

## Production deployment

1. **Backend (Django)**  
   Set environment variables (see `backend/.env.example`):
   - `DJANGO_SECRET_KEY` — long random secret (required in production).
   - `DJANGO_DEBUG=false` — disables debug mode and admin fallback login.
   - `DJANGO_ALLOWED_HOSTS` — comma-separated hosts (e.g. `api.example.com`).
   - `ALLOW_CREATE_DEFAULT_USER=false` — optional; prevents auto-creation of default admin on empty DB.

   Run migrations, then serve with a production WSGI server (e.g. Gunicorn) behind a reverse proxy (HTTPS). Do not use the default admin password in production; change it with `python manage.py changepassword admin`.

2. **Frontend**  
   Build with `npm run build` and serve `dist/public` from your web server or the same host as the API. Ensure `/api` is proxied to the Django backend or set the client to use the full API URL.

3. **Database**  
   SQLite is fine for small scale. For higher traffic, switch to PostgreSQL by changing `DATABASES` in `backend/config/settings.py` and installing `psycopg2`.

## Features

- **Basic authentication**: Sign in with username/password (default: admin / admin). All API endpoints require auth.
- **PDF report**: Download a PDF report for the selected dataset (header button).
- **Pin datasets**: Pin datasets in history so they stay at the top; unpin to restore order.
- **Delete with confirm**: Delete button in dataset history opens a confirmation dialog before removing.
- **Django REST Framework**: RESTful API with serializers and APIViews.
- **Pandas**: CSV reading and analytics. **SQLite**: Last 5 datasets stored (pinned ones preferred when evicting).

## API

- `POST /api/auth/check` — login with JSON `{ "username", "password" }` (no auth required). Returns 200 with `{ "username" }` or 401.
- All other endpoints require **Basic auth** (use credentials from login):  
- `GET /api/datasets/:id` — dataset with equipment rows  
- `PATCH /api/datasets/:id` — toggle pin state  
- `DELETE /api/datasets/:id` — delete dataset  
- `GET /api/datasets/:id/report.pdf` — download PDF report  
- `GET /api/summary/:id` — summary statistics  
- `POST /api/upload` — upload CSV (form field: `file`)

CSV columns: Equipment Name (or `equipment_name`), Type (or `equipment_type`), optional Flowrate, Pressure, Temperature. Last 5 datasets are stored in SQLite (`backend/db.sqlite3`).

---

## Desktop app (PyQt5 + Matplotlib)

The desktop client uses the same Django API. Run the backend first, then the desktop app.

1. Install desktop dependencies:
   ```bash
   pip install -r desktop/requirements.txt
   ```

2. Start the backend (if not already running):
   ```bash
   npm run dev:backend
   ```

3. Run the desktop app:
   ```bash
   python desktop/main.py
   ```
   Default API base: `http://localhost:8000/api`. Log in with **admin** / **admin**, then upload CSV, view datasets, summary, charts (Matplotlib), and download PDF report.
