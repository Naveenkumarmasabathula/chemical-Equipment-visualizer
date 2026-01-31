#!/usr/bin/env bash
set -e
echo "==> Installing Node dependencies..."
npm install
echo "==> Building frontend (VITE_BASE_URL=/static/)..."
VITE_BASE_URL=/static/ npm run build
echo "==> Installing Python dependencies..."
pip install -r requirements.txt
echo "==> Collecting static files..."
cd backend && python manage.py collectstatic --noinput
echo "==> Build complete."
