from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    def handle(self, *args, **options):
        if User.objects.exists():
            self.stdout.write(self.style.WARNING("Users already exist. Skipping."))
            return
        User.objects.create_user(username="admin", password="admin")
        self.stdout.write(self.style.SUCCESS("Default user created: username=admin, password=admin"))
