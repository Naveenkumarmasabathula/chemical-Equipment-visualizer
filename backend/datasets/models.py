from django.conf import settings
from django.db import models
from django.utils import timezone


def _default_equipment_data():
    return []


class Dataset(models.Model):
    id = models.UUIDField(primary_key=True, editable=False)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="datasets",
        null=True,
        blank=True,
    )
    name = models.CharField(max_length=255)
    uploaded_at = models.DateTimeField(default=timezone.now)
    total_count = models.IntegerField()
    avg_flowrate = models.FloatField()
    avg_pressure = models.FloatField()
    avg_temperature = models.FloatField()
    pinned = models.BooleanField(default=False)
    equipment_data = models.JSONField(default=_default_equipment_data)

    class Meta:
        ordering = ["-pinned", "-uploaded_at"]
        db_table = "datasets"

    def to_dict(self):
        return {
            "id": str(self.id),
            "name": self.name,
            "uploadedAt": self.uploaded_at.isoformat(),
            "totalCount": self.total_count,
            "avgFlowrate": self.avg_flowrate,
            "avgPressure": self.avg_pressure,
            "avgTemperature": self.avg_temperature,
            "pinned": self.pinned,
        }
