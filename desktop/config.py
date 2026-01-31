"""
Desktop app config. This client talks only to the remote backend over HTTP.
No Django, no SQLite, no backend code — API only.
"""
import os

# Default: live Render backend. Override with API_BASE_URL for local or another host.
DEFAULT_API_URL = os.environ.get(
    "API_BASE_URL",
    "https://chemical-equipment-visualizer-1-ifjc.onrender.com/api",
)

REQUEST_TIMEOUT = 30  # seconds
