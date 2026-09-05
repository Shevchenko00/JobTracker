from django.db.models import Q
from apps.jobs.models import JobsApplicationModel
from apps.jobs.serializers.jobs_applications_serializer import JobsApplicationSerializer
from rest_framework import generics
from apps.jobs.pagination import ApplicationPagination

class JobsApplicationCreateAPI(generics.CreateAPIView):
    queryset = JobsApplicationModel.objects.all()
    serializer_class = JobsApplicationSerializer


class JobsApplicationListAPI(generics.ListAPIView):
    """
    Query params supported:
      ?search=Google           -> ищет по company_name и description (icontains)
      ?status=pending,accepted -> фильтр по одному или нескольким статусам через запятую
      ?date_from=2026-01-01    -> applied_at >= date_from
      ?date_to=2026-12-31      -> applied_at <= date_to
      ?ordering=-applied_at    -> сортировка (applied_at, company_name, status; с "-" для убывания)
    """
    serializer_class = JobsApplicationSerializer
    pagination_class = ApplicationPagination
    ALLOWED_ORDERING = {
        "applied_at", "-applied_at",
        "company_name", "-company_name",
        "status", "-status",
    }

    def get_queryset(self):
        queryset = JobsApplicationModel.objects.all()
        params = self.request.query_params

        search = params.get("search")
        if search:
            queryset = queryset.filter(
                Q(company_name__icontains=search) | Q(description__icontains=search)
            )

        status_param = params.get("status")
        if status_param:
            statuses = [s.strip() for s in status_param.split(",") if s.strip()]
            if statuses:
                queryset = queryset.filter(status__in=statuses)

        date_from = params.get("date_from")
        if date_from:
            queryset = queryset.filter(applied_at__gte=date_from)

        date_to = params.get("date_to")
        if date_to:
            queryset = queryset.filter(applied_at__lte=date_to)

        ordering = params.get("ordering")
        queryset = queryset.order_by(
            ordering if ordering in self.ALLOWED_ORDERING else "-applied_at"
        )

        return queryset


class JobsApplicationDetailAPI(generics.RetrieveAPIView):
    queryset = JobsApplicationModel.objects.all()
    serializer_class = JobsApplicationSerializer


class JobsApplicationUpdateAPI(generics.UpdateAPIView):
    queryset = JobsApplicationModel.objects.all()
    serializer_class = JobsApplicationSerializer


class JobsApplicationDeleteAPI(generics.DestroyAPIView):
    queryset = JobsApplicationModel.objects.all()
    serializer_class = JobsApplicationSerializer