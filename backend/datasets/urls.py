from django.urls import path
from .views import (
    AuthCheckView,
    RegisterView,
    DatasetListView,
    DatasetDetailView,
    DatasetReportPDFView,
    SummaryStatsView,
    UploadView,
)

urlpatterns = [
    path("auth/check", AuthCheckView.as_view(), name="auth-check"),
    path("auth/check/", AuthCheckView.as_view(), name="auth-check-slash"),
    path("auth/register", RegisterView.as_view(), name="auth-register"),
    path("auth/register/", RegisterView.as_view(), name="auth-register-slash"),
    path("datasets", DatasetListView.as_view(), name="dataset-list"),
    path("datasets/<str:id>", DatasetDetailView.as_view(), name="dataset-detail"),
    path("datasets/<str:id>/", DatasetDetailView.as_view(), name="dataset-detail"),
    path("datasets/<str:id>/report.pdf", DatasetReportPDFView.as_view(), name="dataset-report-pdf"),
    path("datasets/<str:id>/report.pdf/", DatasetReportPDFView.as_view(), name="dataset-report-pdf"),
    path("summary/<str:id>", SummaryStatsView.as_view(), name="summary-stats"),
    path("summary/<str:id>/", SummaryStatsView.as_view(), name="summary-stats"),
    path("upload", UploadView.as_view(), name="upload"),
    path("upload/", UploadView.as_view(), name="upload"),
]
