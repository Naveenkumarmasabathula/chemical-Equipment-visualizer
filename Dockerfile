# Stage 1: build frontend
FROM node:20-bookworm-slim AS frontend
WORKDIR /app
COPY package.json package-lock.json ./
COPY client ./client
COPY shared ./shared
COPY vite.config.ts tsconfig.json tailwind.config.ts postcss.config.js components.json ./
RUN npm ci && VITE_BASE_URL=/static/ npm run build

# Stage 2: backend + static
FROM python:3.12-slim AS app
WORKDIR /app
# Copy backend and root requirements
COPY backend ./backend
COPY requirements.txt ./
# Copy frontend build from stage 1 (Django expects client/dist/public next to backend/)
COPY --from=frontend /app/dist ./client/dist
# Install Python deps and collect static files
RUN pip install --no-cache-dir -r requirements.txt && \
    cd backend && python manage.py collectstatic --noinput
# Render sets PORT at runtime
ENV PORT=10000
EXPOSE 10000
# Run migrations then start the server (required for signup/login to work)
CMD cd backend && python manage.py migrate --noinput && gunicorn config.wsgi --bind 0.0.0.0:${PORT}
