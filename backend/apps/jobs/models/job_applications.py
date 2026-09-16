from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone


def validate_not_in_future(value):
    if value and value > timezone.now().date():
        raise ValidationError(
            "Das Bewerbungsdatum darf nicht in der Zukunft liegen.",
            params={"value": value},
        )


class JobsApplicationModel(models.Model):
    company_name = models.CharField(max_length=255)
    description = models.TextField()
    url = models.TextField(null=True, blank=True)
    notes = models.TextField(blank=True, null=True)
    status = models.CharField(
        max_length=50,
        choices=[
            ("pending", "Pending"),
            ("accepted", "Accepted"),
            ("rejected", "Rejected"),
        ],
        default="pending",
    )
    applied_at = models.DateField(
        blank=True, null=True, validators=[validate_not_in_future]
    )

    class Meta:
        db_table = "job_applications"
        verbose_name = "Job Application"
        verbose_name_plural = "Job Applications"