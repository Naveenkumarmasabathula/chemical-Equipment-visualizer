import logging
import os
from django.contrib.auth import get_user_model

logger = logging.getLogger(__name__)


def ensure_default_user():
    if os.environ.get("ALLOW_CREATE_DEFAULT_USER", "true").lower() != "true":
        return
    try:
        User = get_user_model()
        if not User.objects.exists():
            User.objects.create_user(username="admin", password="admin")
            logger.info("Default user created; set a strong password in production.")
    except Exception as e:
        logger.warning("ensure_default_user failed: %s", e)


class EnsureDefaultUserMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.path.startswith("/api/"):
            ensure_default_user()
        return self.get_response(request)
