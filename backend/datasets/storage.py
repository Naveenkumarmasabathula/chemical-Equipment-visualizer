import uuid
from typing import Any
from django.db import transaction
from django.utils import timezone
import pandas as pd

from .models import Dataset

MAX_DATASETS = 5


def _datasets_for_user(user):
    if user is None:
        return Dataset.objects.none()
    return Dataset.objects.filter(owner=user)


def _equipment_for_response(dataset: Dataset) -> list[dict[str, Any]]:
    data = getattr(dataset, "equipment_data", None) or []
    ds_id = str(dataset.id)
    return [
        {
            "id": str(row.get("id", uuid.uuid4())),
            "datasetId": ds_id,
            "equipmentName": row.get("equipmentName", ""),
            "equipmentType": row.get("equipmentType", ""),
            "flowrate": float(row.get("flowrate", 0)),
            "pressure": float(row.get("pressure", 0)),
            "temperature": float(row.get("temperature", 0)),
        }
        for row in data
    ]


def get_datasets(user) -> list[dict[str, Any]]:
    qs = _datasets_for_user(user)
    datasets = qs[:MAX_DATASETS]
    return [ds.to_dict() for ds in datasets]


def get_dataset(dataset_id: str, user) -> dict[str, Any] | None:
    try:
        dataset = _datasets_for_user(user).get(id=dataset_id)
        result = dataset.to_dict()
        result["equipment"] = _equipment_for_response(dataset)
        return result
    except Dataset.DoesNotExist:
        return None


@transaction.atomic
def create_dataset(
    name: str,
    total_count: int,
    avg_flowrate: float,
    avg_pressure: float,
    avg_temperature: float,
    equipment_rows: list[dict[str, Any]],
    user,
) -> dict[str, Any]:
    dataset_id = uuid.uuid4()
    equipment_data = [
        {
            "id": str(uuid.uuid4()),
            "equipmentName": row["equipmentName"],
            "equipmentType": row["equipmentType"],
            "flowrate": row["flowrate"],
            "pressure": row["pressure"],
            "temperature": row["temperature"],
        }
        for row in equipment_rows
    ]
    dataset = Dataset.objects.create(
        id=dataset_id,
        owner=user,
        name=name,
        uploaded_at=timezone.now(),
        total_count=total_count,
        avg_flowrate=avg_flowrate,
        avg_pressure=avg_pressure,
        avg_temperature=avg_temperature,
        equipment_data=equipment_data,
    )
    _maintain_limit(user)
    result = dataset.to_dict()
    result["equipment"] = _equipment_for_response(dataset)
    return result


def delete_dataset(dataset_id: str, user) -> bool:
    try:
        dataset = _datasets_for_user(user).get(id=dataset_id)
        dataset.delete()
        return True
    except Dataset.DoesNotExist:
        return False


def toggle_pin(dataset_id: str, user) -> dict[str, Any] | None:
    try:
        dataset = _datasets_for_user(user).get(id=dataset_id)
        dataset.pinned = not dataset.pinned
        dataset.save(update_fields=["pinned"])
        return dataset.to_dict()
    except Dataset.DoesNotExist:
        return None


def get_summary_stats(dataset_id: str, user) -> dict[str, Any] | None:
    try:
        dataset = _datasets_for_user(user).get(id=dataset_id)
    except Dataset.DoesNotExist:
        return None
    data = getattr(dataset, "equipment_data", None) or []
    if not data:
        return None
    df = pd.DataFrame(
        [
            {
                "equipmentType": row.get("equipmentType", ""),
                "flowrate": float(row.get("flowrate", 0)),
                "pressure": float(row.get("pressure", 0)),
                "temperature": float(row.get("temperature", 0)),
            }
            for row in data
        ]
    )
    total_equipment = len(df)
    type_distribution = df["equipmentType"].value_counts().to_dict()
    avg_flowrate = df["flowrate"].mean()
    avg_pressure = df["pressure"].mean()
    avg_temperature = df["temperature"].mean()
    flowrate_range = {
        "min": float(df["flowrate"].min()),
        "max": float(df["flowrate"].max()),
    }
    pressure_range = {
        "min": float(df["pressure"].min()),
        "max": float(df["pressure"].max()),
    }
    temperature_range = {
        "min": float(df["temperature"].min()),
        "max": float(df["temperature"].max()),
    }
    return {
        "totalEquipment": total_equipment,
        "avgFlowrate": float(avg_flowrate),
        "avgPressure": float(avg_pressure),
        "avgTemperature": float(avg_temperature),
        "typeDistribution": {str(k): int(v) for k, v in type_distribution.items()},
        "flowrateRange": flowrate_range,
        "pressureRange": pressure_range,
        "temperatureRange": temperature_range,
    }


def _maintain_limit(user) -> None:
    qs = _datasets_for_user(user)
    count = qs.count()
    if count > MAX_DATASETS:
        oldest = (
            qs.filter(pinned=False)
            .order_by("uploaded_at")[: count - MAX_DATASETS]
        )
        for dataset in oldest:
            dataset.delete()
        remaining = qs.count()
        if remaining > MAX_DATASETS:
            oldest = qs.order_by("uploaded_at")[: remaining - MAX_DATASETS]
            for dataset in oldest:
                dataset.delete()
