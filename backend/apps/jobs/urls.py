from django.urls import path
from apps.jobs.views.jobs_applications_view import (
    JobsApplicationCreateAPI,
    JobsApplicationDetailAPI,
    JobsApplicationDeleteAPI,
    JobsApplicationListAPI
)


urlpatterns = [
    path('create/', JobsApplicationCreateAPI.as_view()),
    path('<int:pk>/', JobsApplicationDetailAPI.as_view()),
    path('delete/<int:pk>/', JobsApplicationDeleteAPI.as_view()),
    path('', JobsApplicationListAPI.as_view()),
]