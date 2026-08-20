from django.db import models


class Complainant(models.Model):
    class PartyType(models.TextChoices):
        INDIVIDUAL = "INDIVIDUAL", "Individual"
        ORGANIZATION = "ORGANIZATION", "Organization"

    party_type = models.CharField(
        max_length=20,
        choices=PartyType.choices,
    )

    full_name = models.CharField(max_length=255)
    organization_name = models.CharField(
        max_length=255,
        blank=True,
    )

    email = models.EmailField(blank=True)
    phone_number = models.CharField(
        max_length=20,
        blank=True,
    )

    address = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.full_name


class Respondent(models.Model):
    class PartyType(models.TextChoices):
        INDIVIDUAL = "INDIVIDUAL", "Individual"
        ORGANIZATION = "ORGANIZATION", "Organization"

    party_type = models.CharField(
        max_length=20,
        choices=PartyType.choices,
    )

    full_name = models.CharField(max_length=255)
    organization_name = models.CharField(
        max_length=255,
        blank=True,
    )

    email = models.EmailField(blank=True)
    phone_number = models.CharField(
        max_length=20,
        blank=True,
    )

    address = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.full_name


class Complaint(models.Model):
    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        SUBMITTED = "SUBMITTED", "Submitted"
        UNDER_REVIEW = "UNDER_REVIEW", "Under Review"
        NOTICE_SENT = "NOTICE_SENT", "Notice Sent"
        RESPONSE_PENDING = "RESPONSE_PENDING", "Response Pending"
        MEDIATION = "MEDIATION", "Mediation"
        HEARING = "HEARING", "Hearing"
        DECIDED = "DECIDED", "Decided"
        REVIEW = "REVIEW", "Under Review of Award"
        ENFORCEMENT = "ENFORCEMENT", "Enforcement"
        CLOSED = "CLOSED", "Closed"

    case_number = models.CharField(
        max_length=50,
        unique=True,
    )

    complainant = models.ForeignKey(
        Complainant,
        on_delete=models.PROTECT,
        related_name="complaints",
    )

    respondent = models.ForeignKey(
        Respondent,
        on_delete=models.PROTECT,
        related_name="complaints",
    )

    title = models.CharField(max_length=255)

    description = models.TextField()

    status = models.CharField(
        max_length=30,
        choices=Status.choices,
        default=Status.DRAFT,
    )

    submitted_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.case_number
class ComplaintDocument(models.Model):
    complaint = models.ForeignKey(
        Complaint,
        on_delete=models.CASCADE,
        related_name="documents",
    )

    title = models.CharField(max_length=255)

    document = models.FileField(
        upload_to="complaint_documents/"
    )

    description = models.TextField(blank=True)

    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title