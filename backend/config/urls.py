from django.urls import path, include, re_path
from .views import spa_index

urlpatterns = [
    path("api/auth/", include("accounts.urls")),
    path("api/", include("datasets.urls")),
    re_path(r"^", spa_index),
]
