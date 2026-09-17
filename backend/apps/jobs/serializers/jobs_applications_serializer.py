from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from rest_framework import serializers

from apps.jobs.models.job_applications import JobsApplicationModel


class JobsApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobsApplicationModel
        fields = "__all__"
        