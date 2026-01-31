import json
import logging
from django.db import IntegrityError
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated
from django.conf import settings
from django.contrib.auth import authenticate, get_user_model
from django.http import HttpResponse
from config.middleware import ensure_default_user
import io
import pandas as pd

from .serializers import (
    DatasetSerializer,
    DatasetWithEquipmentSerializer,
    SummaryStatsSerializer,
)
from . import storage
from .parsing import parse_csv_with_headers, has_required_columns
from .pdf_report import generate_dataset_pdf

logger = logging.getLogger(__name__)


def _auth_credentials(request):
    data = getattr(request, "data", None) or {}
    if not data and getattr(request, "body", None):
        try:
            raw = request.body
            if isinstance(raw, bytes):
                raw = raw.decode("utf-8")
            data = json.loads(raw) if raw else {}
        except Exception as e:
            logger.warning("Auth check: body parse failed: %s", e)
    if not data and getattr(request, "POST", None):
        data = dict(request.POST) if request.POST else {}
        data = {k: (v[0] if isinstance(v, list) and len(v) else v) for k, v in data.items()}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""
    return username, password


class AuthCheckView(APIView):
    permission_classes = []
    authentication_classes = []
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def post(self, request):
        ensure_default_user()
        username, password = _auth_credentials(request)
        if not username or not password:
            return Response(
                {"detail": "Invalid username or password"},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        user = authenticate(request, username=username, password=password)
        if user is None:
            User = get_user_model()
            try:
                u = User.objects.get(username=username)
                if u.check_password(password):
                    user = u
            except (User.DoesNotExist, TypeError):
                pass
        if user is None and settings.DEBUG and username == "admin" and password == "admin":
            User = get_user_model()
            try:
                u = User.objects.get(username="admin")
                if not u.check_password("admin"):
                    u.set_password("admin")
                    u.save()
                user = u
            except User.DoesNotExist:
                user = User.objects.create_user(username="admin", password="admin")
        if user is None:
            return Response(
                {"detail": "Invalid username or password"},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        return Response({"username": user.get_username()}, status=status.HTTP_200_OK)


class RegisterView(APIView):
    permission_classes = []
    authentication_classes = []
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def post(self, request):
        ensure_default_user()
        username, password = _auth_credentials(request)
        if not username:
            return Response(
                {"detail": "Username is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not password:
            return Response(
                {"detail": "Password is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if len(username) < 2:
            return Response(
                {"detail": "Username must be at least 2 characters"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if len(password) < 8:
            return Response(
                {"detail": "Password must be at least 8 characters"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if username.lower() == "admin":
            return Response(
                {"detail": "The username 'admin' is reserved. Please choose another username."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        User = get_user_model()
        if User.objects.filter(username=username).exists():
            return Response(
                {"detail": "Username already exists. Please choose another or sign in."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            User.objects.create_user(username=username, password=password)
        except IntegrityError:
            return Response(
                {"detail": "Username already exists. Please choose another or sign in."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response({"username": username}, status=status.HTTP_201_CREATED)


class DatasetListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            datasets = storage.get_datasets(request.user)
            serializer = DatasetSerializer(datasets, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception:
            return Response(
                {"message": "Failed to fetch datasets"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class DatasetDetailView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser]

    def get(self, request, id):
        try:
            dataset = storage.get_dataset(id, request.user)
            if dataset is None:
                return Response(
                    {"message": "Dataset not found"},
                    status=status.HTTP_404_NOT_FOUND,
                )
            serializer = DatasetWithEquipmentSerializer(dataset)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception:
            return Response(
                {"message": "Failed to fetch dataset"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def delete(self, request, id):
        try:
            deleted = storage.delete_dataset(id, request.user)
            if not deleted:
                return Response(
                    {"message": "Dataset not found"},
                    status=status.HTTP_404_NOT_FOUND,
                )
            return Response(
                {"message": "Dataset deleted successfully"},
                status=status.HTTP_200_OK,
            )
        except Exception:
            return Response(
                {"message": "Failed to delete dataset"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def patch(self, request, id):
        try:
            updated = storage.toggle_pin(id, request.user)
            if updated is None:
                return Response(
                    {"message": "Dataset not found"},
                    status=status.HTTP_404_NOT_FOUND,
                )
            serializer = DatasetSerializer(updated)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception:
            return Response(
                {"message": "Failed to update dataset"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class DatasetReportPDFView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, id):
        try:
            dataset = storage.get_dataset(id, request.user)
            if dataset is None:
                return Response(
                    {"message": "Dataset not found"},
                    status=status.HTTP_404_NOT_FOUND,
                )
            stats = storage.get_summary_stats(id, request.user)
            pdf_bytes = generate_dataset_pdf(dataset, stats)
            name = dataset.get("name", "report").replace(" ", "_")
            response = HttpResponse(pdf_bytes, content_type="application/pdf")
            response["Content-Disposition"] = f'attachment; filename="{name}_report.pdf"'
            return response
        except Exception as e:
            logger.exception("PDF generation failed: %s", e)
            return Response(
                {"message": "Failed to generate PDF."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class SummaryStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, id):
        try:
            stats = storage.get_summary_stats(id, request.user)
            if stats is None:
                return Response(
                    {"message": "Dataset not found or has no data"},
                    status=status.HTTP_404_NOT_FOUND,
                )
            serializer = SummaryStatsSerializer(stats)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception:
            return Response(
                {"message": "Failed to fetch summary statistics"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class UploadView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        try:
            if "file" not in request.FILES:
                return Response(
                    {"message": "No file uploaded"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            file_obj = request.FILES["file"]
            content = file_obj.read().decode("utf-8")
            file_name = file_obj.name or "Uploaded Dataset"

            rows, errors, field_names = parse_csv_with_headers(content)

            if not rows:
                return Response(
                    {"message": "CSV file is empty"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            try:
                df = pd.read_csv(io.StringIO(content), skipinitialspace=True)
                df.columns = df.columns.str.strip()
                if not has_required_columns(df):
                    return Response(
                        {
                            "message": "CSV must contain 'Equipment Name' (or 'equipment_name') and 'Type' (or 'equipment_type') columns",
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )
            except Exception:
                pass

            equipment = [r for r in rows if r["equipmentName"] and r["equipmentType"]]
            if not equipment:
                return Response(
                    {"message": "No valid equipment data found in CSV"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            df_equipment = pd.DataFrame(equipment)
            count = len(equipment)
            avg_flowrate = float(df_equipment["flowrate"].mean() or 0.0)
            avg_pressure = float(df_equipment["pressure"].mean() or 0.0)
            avg_temperature = float(df_equipment["temperature"].mean() or 0.0)
            if pd.isna(avg_flowrate):
                avg_flowrate = 0.0
            if pd.isna(avg_pressure):
                avg_pressure = 0.0
            if pd.isna(avg_temperature):
                avg_temperature = 0.0

            name = file_name.replace(".csv", "").replace(".CSV", "")
            dataset_with_equipment = storage.create_dataset(
                name=name,
                total_count=count,
                avg_flowrate=avg_flowrate,
                avg_pressure=avg_pressure,
                avg_temperature=avg_temperature,
                equipment_rows=equipment,
                user=request.user,
            )
            dataset_data = {
                "id": dataset_with_equipment["id"],
                "name": dataset_with_equipment["name"],
                "uploadedAt": dataset_with_equipment["uploadedAt"],
                "totalCount": dataset_with_equipment["totalCount"],
                "pinned": dataset_with_equipment.get("pinned", False),
            }
            serializer = DatasetSerializer(dataset_data)
            return Response(
                {
                    "message": "File uploaded successfully",
                    "dataset": serializer.data,
                },
                status=status.HTTP_201_CREATED,
            )
        except UnicodeDecodeError:
            return Response(
                {"message": "File must be UTF-8 encoded text"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            logger.exception("Upload failed: %s", e)
            return Response(
                {"message": "Failed to process uploaded file. Please try again."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
