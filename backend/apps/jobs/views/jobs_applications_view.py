from apps.jobs.models import JobsApplicationModel
from apps.jobs.serializers.jobs_applications_serializer import JobsApplicationSerializer
from rest_framework import generics
class JobsApplicationCreateAPI(generics.CreateAPIView):
    queryset = JobsApplicationModel.objects.all()
    serializer_class = JobsApplicationSerializer