from django.urls import path

from apps.jobs.views.jobs_applications_view import JobsApplicationCreateAPI

urlpatterns = [
    path('create/', JobsApplicationCreateAPI.as_view(), name='create-job-application'),
    
]