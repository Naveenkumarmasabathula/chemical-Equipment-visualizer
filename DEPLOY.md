# Deploying Chemical Equipment Visualizer

Two main options: **single server** (backend + frontend together) or **split** (backend on one host, frontend on another).

**Render:** Use your Render service URL as the host. If your app is at `https://chemical-viz.onrender.com`, set `DJANGO_ALLOWED_HOSTS=chemical-viz.onrender.com` (no `https://`, no trailing slash). With a custom domain, add it: `chemical-viz.onrender.com,www.yourdomain.com`.

### Render setup (Web Service)

**Option 1 – Use Docker (recommended if you keep seeing "Frontend not built")**  
The repo includes a `Dockerfile` that runs npm build, pip install, and collectstatic. Create a **new** Web Service, connect this repo, set **Environment** to **Docker** (not Python). Leave Build Command and Start Command blank; Render uses the Dockerfile. Set **DJANGO_ALLOWED_HOSTS** and other env vars. The build will include the React app. (Existing Python services cannot be switched to Docker; create a new Docker service and delete the old one if needed.)

**Option 2 – Use the Blueprint**  
The repo includes a `render.yaml` that uses `runtime: docker`. In Render: **New → Blueprint**, connect this repo; the created service will use the Dockerfile. Set **DJANGO_ALLOWED_HOSTS** in the service Environment to your host (e.g. `chemical-equipment-visualizer.onrender.com`).

**Option 3 – Fix an existing Python service**  
If you see "Frontend not built" (build logs show only "36 static files copied") or `ModuleNotFoundError`:

1. Open the service in Render → **Settings** → **Build & Deploy**.
2. Set **Build Command** to: `npm install && VITE_BASE_URL=/static/ npm run build && pip install -r requirements.txt && cd backend && python manage.py collectstatic --noinput`
3. Set **Start Command** to: `cd backend && gunicorn config.wsgi --bind 0.0.0.0:$PORT`
4. **Root Directory** must be blank. Click **Save Changes**, then **Manual Deploy**.

- **Root Directory:** leave blank (repo root).
- **Build Command (API only):** `pip install -r requirements.txt`  
- **Build Command (API + React app):** `bash build.sh` (so the site at `/` serves the React app; otherwise you'll see "Frontend not built").
- **Start Command:** `cd backend && gunicorn config.wsgi --bind 0.0.0.0:$PORT`  
  **Important:** Do not use Render’s default `gunicorn your_application.wsgi` — this project uses `config.wsgi` and must run from the `backend` folder.
- **Environment:** Add `DJANGO_SECRET_KEY`, `DJANGO_DEBUG=false`, `DJANGO_ALLOWED_HOSTS=<your-service>.onrender.com`, `ALLOW_CREATE_DEFAULT_USER=false`.

To serve the React app too, use a build that builds the frontend and runs collectstatic (see Option A below).

---

## Option A: Single server (Django serves API + React build)

One host serves the app and the API. Good for VPS, Railway, Render, Fly.io.

### 1. Set production env vars

```bash
# Required
export DJANGO_SECRET_KEY="your-long-random-secret"
export DJANGO_DEBUG=false
export DJANGO_ALLOWED_HOSTS="yourdomain.com,www.yourdomain.com"
# On Render use your service host, e.g.: chemical-viz.onrender.com
export ALLOW_CREATE_DEFAULT_USER=false
```

On Windows PowerShell:

```powershell
$env:DJANGO_SECRET_KEY="your-long-random-secret"
$env:DJANGO_DEBUG="false"
$env:DJANGO_ALLOWED_HOSTS="yourdomain.com,www.yourdomain.com"
# On Render use your service host, e.g.: chemical-viz.onrender.com
$env:ALLOW_CREATE_DEFAULT_USER="false"
```

### 2. Build frontend and collect static files

Build with `VITE_BASE_URL=/static/` so assets are served under `/static/`:

```bash
# Windows PowerShell
$env:VITE_BASE_URL="/static/"; npm run build

# macOS/Linux
VITE_BASE_URL=/static/ npm run build
```

Then collect static files:

```bash
cd backend
python manage.py migrate
python manage.py collectstatic --noinput
```

### 3. Run with Gunicorn

```bash
cd backend
gunicorn config.wsgi --bind 0.0.0.0:8000
```

For production, run behind a reverse proxy (Nginx, Caddy) with HTTPS.

### 4. Create an admin user

Default admin is disabled in production. Create a user:

```bash
cd backend
python manage.py createsuperuser
```

Or use the web app **Sign up** page after deployment.

---

## Option B: Split (backend + frontend on different hosts)

Backend on Railway/Render/Fly.io; frontend on Vercel/Netlify (or same server, different port).

### Backend

1. Deploy the **backend** folder (or repo root with `Procfile`/start command pointing to backend).
2. Set env vars as in Option A. Add your frontend URL to CORS:
   - In `backend/config/settings.py`, add your frontend origin to `CORS_ALLOWED_ORIGINS`, e.g. `https://yourapp.vercel.app`.
3. Start command: `gunicorn config.wsgi --bind 0.0.0.0:$PORT` (use `$PORT` if the host provides it).
4. Run migrations (one-off): `python manage.py migrate`.
5. Create a user: `python manage.py createsuperuser` or use Sign up.

### Frontend

1. Build with the API URL. The app uses relative `/api` by default. If the API is on a different origin, set it at build time:
   - Add to frontend env (e.g. Vercel): `VITE_API_URL=https://your-api.railway.app`
   - In `client/src/lib/authApi.ts`, use `const API_BASE = import.meta.env.VITE_API_URL ?? "";`
2. Build: `npm run build`.
3. Deploy `dist/public` (or the output of `npm run build`) to your static host.

---

## Quick single-server deploy (e.g. Ubuntu VPS)

```bash
# On the server
git clone https://github.com/Naveenkumarmasabathula/chemical-Equipment-visualizer.git
cd chemical-Equipment-visualizer

pip install -r backend/requirements.txt
npm install
VITE_BASE_URL=/static/ npm run build

cd backend
export DJANGO_SECRET_KEY="$(openssl rand -base64 32)"
export DJANGO_DEBUG=false
export DJANGO_ALLOWED_HOSTS="yourdomain.com"
export ALLOW_CREATE_DEFAULT_USER=false

python manage.py migrate
python manage.py collectstatic --noinput
python manage.py createsuperuser

gunicorn config.wsgi --bind 0.0.0.0:8000
```

Put Nginx (or Caddy) in front with SSL (e.g. Let's Encrypt) and proxy `/` and `/api` to `127.0.0.1:8000`.

---

## Checklist

- [ ] `DJANGO_SECRET_KEY` set to a long random value
- [ ] `DJANGO_DEBUG=false`
- [ ] `DJANGO_ALLOWED_HOSTS` set to your domain(s) or Render host (e.g. `yourapp.onrender.com`)
- [ ] `ALLOW_CREATE_DEFAULT_USER=false`
- [ ] Migrations run (`python manage.py migrate`)
- [ ] Frontend built (`VITE_BASE_URL=/static/ npm run build`) and static collected (`collectstatic`) for single-server
- [ ] Admin/user created via `createsuperuser` or Sign up
- [ ] HTTPS and a production WSGI server (e.g. Gunicorn behind Nginx)
