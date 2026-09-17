from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _


def validate_not_in_future(value):
    if value and value > timezone.now().date():
        raise ValidationError(
            _("Das Bewerbungsdatum darf nicht in der Zukunft liegen."),
            code="future_date",
            params={"value": value},
        )


class JobsApplicationModel(models.Model):
    STATUS_PENDING = "pending"
    STATUS_ACCEPTED = "accepted"
    STATUS_REJECTED = "rejected"

    STATUS_CHOICES = [
        (STATUS_PENDING, _("Ausstehend")),
        (STATUS_ACCEPTED, _("Angenommen")),
        (STATUS_REJECTED, _("Abgelehnt")),
    ]

    company_name = models.CharField(
        max_length=255,
        verbose_name=_("Firmenname"),
        help_text=_("Name des Unternehmens, bei dem du dich beworben hast."),
        error_messages={
            "blank": _("Bitte gib den Firmennamen ein."),
            "max_length": _("Der Firmenname darf maximal 255 Zeichen lang sein."),
        },
    )
    description = models.TextField(
        verbose_name=_("Beschreibung"),
        help_text=_("Beschreibung der Position oder Bewerbung."),
        error_messages={
            "blank": _("Bitte gib eine Beschreibung ein."),
        },
    )
    url = models.TextField(
        null=True,
        blank=True,
        verbose_name=_("Link zur Stellenanzeige"),
        help_text=_("Optionaler Link zur Stellenausschreibung."),
    )
    notes = models.TextField(
        blank=True,
        null=True,
        verbose_name=_("Notizen"),
        help_text=_("Optionale persönliche Notizen zur Bewerbung."),
    )
    status = models.CharField(
        max_length=50,
        choices=STATUS_CHOICES,
        default=STATUS_PENDING,
        verbose_name=_("Status"),
        help_text=_("Aktueller Stand der Bewerbung."),
        error_messages={
            "invalid_choice": _("Ungültiger Status ausgewählt."),
        },
    )
    applied_at = models.DateField(
        blank=True,
        null=True,
        verbose_name=_("Bewerbungsdatum"),
        help_text=_("Datum, an dem die Bewerbung abgeschickt wurde."),
        validators=[validate_not_in_future],
        error_messages={
            "invalid": _("Bitte gib ein gültiges Datum ein (Format: JJJJ-MM-TT)."),
        },
    )

    class Meta:
        db_table = "job_applications"
        verbose_name = _("Bewerbung")
        verbose_name_plural = _("Bewerbungen")

    def __str__(self):
        return f"{self.company_name} ({self.get_status_display()})"