from django.db.models import Q
from django.utils.translation import gettext as _

from rest_framework import generics
from rest_framework.exceptions import APIException

from apps.jobs.models import JobsApplicationModel
from apps.jobs.pagination import ApplicationPagination
from apps.jobs.serializers.jobs_applications_serializer import (
    JobsApplicationSerializer,
)


class DuplicateApplicationException(APIException):
    status_code = 409
    default_code = "duplicate_application"

    def __init__(self, application_id):
        self.detail = {
            "code": "duplicate_application",
            "message": _(
                "Für dieses Unternehmen existiert bereits "
                "eine Bewerbung mit diesem Datum."
            ),
            "application_id": application_id,
        }


class ApplicationDuplicateCheckMixin:
    """
    Checks whether an application with the same company and applied_at
    already exists.

    This is a soft duplicate check:
    it does NOT create a database unique constraint.
    """

    def check_duplicate(self, serializer):
        company_name = serializer.validated_data.get("company_name")
        applied_at = serializer.validated_data.get("applied_at")

        # Если компания или дата не указаны,
        # duplicate check не выполняем.
        if not company_name or not applied_at:
            return

        # Нормализуем пробелы.
        company_name = " ".join(company_name.split())

        queryset = JobsApplicationModel.objects.filter(
            company_name__iexact=company_name,
            applied_at=applied_at,
        )

        # При UPDATE не считаем саму текущую заявку дубликатом.
        if self.kwargs.get("pk"):
            queryset = queryset.exclude(
                pk=self.kwargs["pk"]
            )

        duplicate = queryset.first()

        if duplicate:
            raise DuplicateApplicationException(
                application_id=duplicate.pk
            )


class JobsApplicationCreateAPI(
    ApplicationDuplicateCheckMixin,
    generics.CreateAPIView,
):
    queryset = JobsApplicationModel.objects.all()
    serializer_class = JobsApplicationSerializer

    def perform_create(self, serializer):
        self.check_duplicate(serializer)
        serializer.save()


class JobsApplicationListAPI(generics.ListAPIView):
    """
    Query params supported:

      ?search=Google
          -> ищет по company_name и description

      ?status=pending,accepted
          -> фильтр по одному или нескольким статусам

      ?date_from=2026-01-01
          -> applied_at >= date_from

      ?date_to=2026-12-31
          -> applied_at <= date_to

      ?ordering=-applied_at
          -> сортировка:
             applied_at, company_name, status
             с "-" для убывания
    """

    serializer_class = JobsApplicationSerializer
    pagination_class = ApplicationPagination

    ALLOWED_ORDERING = {
        "applied_at",
        "-applied_at",
        "company_name",
        "-company_name",
        "status",
        "-status",
    }

    def get_queryset(self):
        queryset = JobsApplicationModel.objects.all()
        params = self.request.query_params

        search = params.get("search")

        if search:
            queryset = queryset.filter(
                Q(company_name__icontains=search)
                | Q(description__icontains=search)
            )

        status_param = params.get("status")

        if status_param:
            statuses = [
                s.strip()
                for s in status_param.split(",")
                if s.strip()
            ]

            if statuses:
                queryset = queryset.filter(
                    status__in=statuses
                )

        date_from = params.get("date_from")

        if date_from:
            queryset = queryset.filter(
                applied_at__gte=date_from
            )

        date_to = params.get("date_to")

        if date_to:
            queryset = queryset.filter(
                applied_at__lte=date_to
            )

        ordering = params.get("ordering")

        queryset = queryset.order_by(
            ordering
            if ordering in self.ALLOWED_ORDERING
            else "-applied_at"
        )

        return queryset


class JobsApplicationDetailAPI(generics.RetrieveAPIView):
    queryset = JobsApplicationModel.objects.all()
    serializer_class = JobsApplicationSerializer


class JobsApplicationUpdateAPI(
    ApplicationDuplicateCheckMixin,
    generics.UpdateAPIView,
):
    queryset = JobsApplicationModel.objects.all()
    serializer_class = JobsApplicationSerializer

    def perform_update(self, serializer):
        self.check_duplicate(serializer)
        serializer.save()


class JobsApplicationDeleteAPI(generics.DestroyAPIView):
    queryset = JobsApplicationModel.objects.all()
    serializer_class = JobsApplicationSerializer
