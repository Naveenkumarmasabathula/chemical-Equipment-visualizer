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
   **Default admin (admin / admin) is DEV ONLY** — it is created automatically on first API request when using default settings. **Must be disabled in production** (see Production deployment).

4. Run both frontend and backend:
   ```bash
   npm run dev
   ```
   Opens **http://localhost:5000**. Vite (port 5000) proxies `/api` to Django (port 8000).

5. Or run separately:
   - Backend: `npm run dev:backend` (or `python backend/manage.py runserver 8000`)
   - Frontend: `npm run dev:frontend` then open http://localhost:5000

### Deploy on Render (fix "Frontend not built")

If your live site shows **"Frontend not built"** and build logs show only **"36 static files copied"**, Render is not building the React app. Two options:

**Option A – Use Docker (recommended, no dashboard Build Command needed)**  
The repo includes a `Dockerfile` that runs npm build + pip + collectstatic. So Render can build the frontend without relying on the Build Command field.

1. In Render: **New** → **Web Service**. Connect this repo.
2. Set **Environment** to **Docker** (not Python). Leave **Build Command** and **Start Command** blank; Render will use the Dockerfile.
3. Add env vars: `DJANGO_SECRET_KEY` (or generate), `DJANGO_DEBUG=false`, `DJANGO_ALLOWED_HOSTS=<your-service>.onrender.com`, `ALLOW_CREATE_DEFAULT_USER=false`.
4. Create the service. After deploy, the build log should show the Docker build (Node + Python stages) and the site should serve the React app.

If you already have a Web Service that was created as **Python**, you cannot change it to Docker. Create a new Web Service with **Docker** as above, then delete the old one (or keep both and point the URL to the new one).

**Option B – Keep Python and set Build Command**  
1. Open your **Web Service** → **Settings** → **Build & Deploy**.
2. **Root Directory** must be **blank**.
3. **Build Command** — set to exactly this (one line):  
   `npm install && VITE_BASE_URL=/static/ npm run build && pip install -r requirements.txt && cd backend && python manage.py collectstatic --noinput`
4. **Start Command** — `cd backend && gunicorn config.wsgi --bind 0.0.0.0:$PORT`
5. **Save**, then **Manual Deploy**. In the build log you should see npm install, Vite build, and **many more than 36** static files copied.

Full details: see [DEPLOY.md](DEPLOY.md).

### Fix "Bad Request (400)" on Render

Django returns **400 Bad Request** when the request’s host is not in **ALLOWED_HOSTS**. On Render you must set:

- **Environment variable:** `DJANGO_ALLOWED_HOSTS`
- **Value:** your service hostname **without** `https://` or trailing slash, e.g.  
  `chemical-equipment-visualizer-yy0o.onrender.com`

In Render: **Dashboard** → your **Web Service** → **Environment** → add or edit `DJANGO_ALLOWED_HOSTS` with that value → **Save**. Redeploy if needed; the next request should succeed.

### Test with production-like settings locally

To confirm the app runs with production-style env (no default admin, no debug):

**Windows (PowerShell):**
```powershell
cd backend
$env:DJANGO_DEBUG="false"; $env:ALLOW_CREATE_DEFAULT_USER="false"
python manage.py runserver 8000
```

**Windows (cmd):** use `set DJANGO_DEBUG=false` and `set ALLOW_CREATE_DEFAULT_USER=false` before `python manage.py runserver 8000`.

**macOS/Linux:** use `export DJANGO_DEBUG=false` and `export ALLOW_CREATE_DEFAULT_USER=false` before the runserver command.

Create a user via the web app **Sign up** (or `python manage.py createsuperuser`) before logging in; the default admin is not created.

## Build & preview

```bash
npm run build
npm run preview
```

Build output is in `dist/public`. For production, serve that folder (e.g. with Django static files or any static host) and point the API to your Django backend.

## Production deployment

See **[DEPLOY.md](DEPLOY.md)** for step-by-step deployment (single server or split backend/frontend).

Summary:

1. **Backend (Django)**  
   **Disable the default admin** and set environment variables (see `backend/.env.example`):
   - `DJANGO_SECRET_KEY` — long random secret (required in production).
   - `DJANGO_DEBUG=false` — disables debug mode and admin fallback login.
   - `DJANGO_ALLOWED_HOSTS` — comma-separated hosts (e.g. `api.example.com`).
   - `ALLOW_CREATE_DEFAULT_USER=false` — **required in production**; prevents auto-creation of default admin on empty DB.

   Run migrations, then serve with a production WSGI server (e.g. Gunicorn) behind a reverse proxy (HTTPS). Create admin via `python manage.py createsuperuser` or user signup; do not rely on the dev-only default admin.

2. **Frontend**  
   Build with `npm run build` and serve `dist/public` from your web server or the same host as the API. Ensure `/api` is proxied to the Django backend or set the client to use the full API URL.

3. **Database**  
   SQLite is fine for small scale. For higher traffic, switch to PostgreSQL by changing `DATABASES` in `backend/config/settings.py` and installing `psycopg2`.

## Features

- **Basic authentication**: Sign in with username/password. In dev, a default admin (admin / admin) is created; **disable in production** (see above). All API endpoints require auth.
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
