from django.urls import path
from apps.jobs.views.jobs_applications_view import (
    JobsApplicationCreateAPI,
    JobsApplicationDetailAPI,
    JobsApplicationDeleteAPI,
    JobsApplicationListAPI,
    JobsApplicationUpdateAPI
)


urlpatterns = [
    path('create/', JobsApplicationCreateAPI.as_view()),
    path('<int:pk>/', JobsApplicationDetailAPI.as_view()),
    path('delete/<int:pk>/', JobsApplicationDeleteAPI.as_view()),
    path('update/<int:pk>/', JobsApplicationUpdateAPI.as_view(), name='jobs-update'),
    path('', JobsApplicationListAPI.as_view()),
]