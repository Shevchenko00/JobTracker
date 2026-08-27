
from apps.jobs.models.job_applications import JobsApplicationModel
from rest_framework import serializers

class JobsApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobsApplicationModel
        fields = "__all__"