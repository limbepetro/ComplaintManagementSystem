from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = "ADMIN", "System Administrator"
        OFFICER = "OFFICER", "Commission Officer"
        CASE_OFFICER = "CASE_OFFICER", "Case Officer"
        MEDIATOR = "MEDIATOR", "Mediator"
        HEARING_OFFICER = "HEARING_OFFICER", "Hearing Officer"

    role = models.CharField(
        max_length=30,
        choices=Role.choices,
        default=Role.OFFICER,
    )

    phone_number = models.CharField(
        max_length=20,
        blank=True,
    )

    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.get_full_name() or self.username