from django.db import migrations


def copy_equipment_to_json(apps, schema_editor):
    Dataset = apps.get_model("datasets", "Dataset")
    Equipment = apps.get_model("datasets", "Equipment")
    for ds in Dataset.objects.all():
        rows = Equipment.objects.filter(dataset=ds).order_by("id")
        data = [
            {
                "id": str(eq.id),
                "equipmentName": eq.equipment_name,
                "equipmentType": eq.equipment_type,
                "flowrate": eq.flowrate,
                "pressure": eq.pressure,
                "temperature": eq.temperature,
            }
            for eq in rows
        ]
        ds.equipment_data = data
        ds.save(update_fields=["equipment_data"])


class Migration(migrations.Migration):
    dependencies = [
        ("datasets", "0004_add_equipment_data"),
    ]
    operations = [
        migrations.RunPython(copy_equipment_to_json, migrations.RunPython.noop),
    ]
