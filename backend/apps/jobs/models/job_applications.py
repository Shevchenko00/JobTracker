from django.db import models


class JobsApplicationModel(models.Model):
    company_name = models.CharField(max_length=255)
    description = models.TextField()
    status = models.CharField(
        max_length=50,
        choices=[
            ("pending", "Pending"),
            ("accepted", "Accepted"),
            ("rejected", "Rejected"),
        ],
        default="pending",
    )
    applied_at = models.DateTimeField(auto_now_add=True, blank=True, null=True)

    class Meta:
        db_table = "job_applications"
        verbose_name = "Job Application"
        verbose_name_plural = "Job Applications"