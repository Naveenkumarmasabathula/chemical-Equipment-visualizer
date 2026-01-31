from django.conf import settings
from django.http import HttpResponse


def spa_index(request):
    index_path = settings.STATIC_ROOT / "index.html"
    if not index_path.exists():
        return HttpResponse(
            "<p>Frontend not built. Run <code>npm run build</code> then <code>python manage.py collectstatic</code>.</p>",
            content_type="text/html",
        )
    return HttpResponse(index_path.read_text(), content_type="text/html")
