from django.db import migrations


def assign_owner(apps, schema_editor):
    Dataset = apps.get_model("datasets", "Dataset")
    User = apps.get_model("auth", "User")
    first_user = User.objects.order_by("pk").first()
    if first_user:
        Dataset.objects.filter(owner__isnull=True).update(owner=first_user)


class Migration(migrations.Migration):
    dependencies = [
        ("datasets", "0007_add_dataset_owner"),
    ]
    operations = [
        migrations.RunPython(assign_owner, migrations.RunPython.noop),
    ]
