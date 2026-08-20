from django.db import models
from complaints.models import Complaint


class ComplaintNotice(models.Model):
    class NoticeType(models.TextChoices):
        SUMMONS = "SUMMONS", "Summons"
        NOTICE = "NOTICE", "Notice"
        ENFORCEMENT = "ENFORCEMENT", "Enforcement Notice"
        PENALTY = "PENALTY", "Penalty Notice"

    class DeliveryMethod(models.TextChoices):
        EMAIL = "EMAIL", "Email"
        PHYSICAL = "PHYSICAL", "Physical Delivery"
        POSTAL = "POSTAL", "Postal Service"
        OTHER = "OTHER", "Other"

    class DeliveryStatus(models.TextChoices):
        PENDING = "PENDING", "Pending"
        SENT = "SENT", "Sent"
        DELIVERED = "DELIVERED", "Delivered"
        FAILED = "FAILED", "Failed"

    complaint = models.ForeignKey(
        Complaint,
        on_delete=models.CASCADE,
        related_name="notices",
    )

    notice_type = models.CharField(
        max_length=20,
        choices=NoticeType.choices,
    )

    reference_number = models.CharField(
        max_length=50,
        unique=True,
    )

    issue_date = models.DateField()

    response_deadline = models.DateField(
        null=True,
        blank=True,
    )

    delivery_method = models.CharField(
        max_length=20,
        choices=DeliveryMethod.choices,
    )

    delivery_status = models.CharField(
        max_length=20,
        choices=DeliveryStatus.choices,
        default=DeliveryStatus.PENDING,
    )

    delivered_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    message = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.reference_number


class RespondentResponse(models.Model):
    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        SUBMITTED = "SUBMITTED", "Submitted"
        ACCEPTED = "ACCEPTED", "Accepted"
        REJECTED = "REJECTED", "Rejected"

    complaint = models.ForeignKey(
        Complaint,
        on_delete=models.CASCADE,
        related_name="respondent_responses",
    )

    respondent = models.ForeignKey(
        "complaints.Respondent",
        on_delete=models.PROTECT,
        related_name="responses",
    )

    notice = models.ForeignKey(
        ComplaintNotice,
        on_delete=models.PROTECT,
        related_name="responses",
        null=True,
        blank=True,
    )

    response_text = models.TextField()

    status = models.CharField(
        max_length=20,
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
        return f"Response - {self.complaint.case_number}"


class MediationSession(models.Model):
    class Status(models.TextChoices):
        SCHEDULED = "SCHEDULED", "Scheduled"
        IN_PROGRESS = "IN_PROGRESS", "In Progress"
        COMPLETED = "COMPLETED", "Completed"
        CANCELLED = "CANCELLED", "Cancelled"

    class Outcome(models.TextChoices):
        PENDING = "PENDING", "Pending"
        SETTLED = "SETTLED", "Settled"
        PARTIALLY_SETTLED = "PARTIALLY_SETTLED", "Partially Settled"
        FAILED = "FAILED", "Failed"

    complaint = models.ForeignKey(
        Complaint,
        on_delete=models.CASCADE,
        related_name="mediation_sessions",
    )

    mediator = models.ForeignKey(
        "user_management.User",
        on_delete=models.PROTECT,
        related_name="mediation_sessions",
    )

    session_date = models.DateField()

    start_time = models.TimeField(
        null=True,
        blank=True,
    )

    end_time = models.TimeField(
        null=True,
        blank=True,
    )

    location = models.CharField(
        max_length=255,
        blank=True,
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.SCHEDULED,
    )

    outcome = models.CharField(
        max_length=30,
        choices=Outcome.choices,
        default=Outcome.PENDING,
    )

    settlement_agreement = models.TextField(
        blank=True,
    )

    notes = models.TextField(
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    def __str__(self):
        return f"Mediation - {self.complaint.case_number}"


class Hearing(models.Model):
    class Status(models.TextChoices):
        SCHEDULED = "SCHEDULED", "Scheduled"
        IN_PROGRESS = "IN_PROGRESS", "In Progress"
        COMPLETED = "COMPLETED", "Completed"
        ADJOURNED = "ADJOURNED", "Adjourned"
        CANCELLED = "CANCELLED", "Cancelled"

    complaint = models.ForeignKey(
        Complaint,
        on_delete=models.CASCADE,
        related_name="hearings",
    )

    hearing_date = models.DateField()

    start_time = models.TimeField(
        null=True,
        blank=True,
    )

    end_time = models.TimeField(
        null=True,
        blank=True,
    )

    location = models.CharField(
        max_length=255,
        blank=True,
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.SCHEDULED,
    )

    proceedings = models.TextField(
        blank=True,
    )

    adjournment_reason = models.TextField(
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    def __str__(self):
        return f"Hearing - {self.complaint.case_number}"


class HearingCommittee(models.Model):
    class Expertise(models.TextChoices):
        LAW = "LAW", "Law"
        DATA_PROTECTION = "DATA_PROTECTION", "Personal Data Protection"
        ICT = "ICT", "Information and Communication Technology"
        OTHER = "OTHER", "Other"

    hearing = models.OneToOneField(
        Hearing,
        on_delete=models.CASCADE,
        related_name="committee",
    )

    chairperson = models.ForeignKey(
        "user_management.User",
        on_delete=models.PROTECT,
        related_name="chaired_hearing_committees",
    )

    member_two = models.ForeignKey(
        "user_management.User",
        on_delete=models.PROTECT,
        related_name="second_hearing_committee_memberships",
    )

    member_three = models.ForeignKey(
        "user_management.User",
        on_delete=models.PROTECT,
        related_name="third_hearing_committee_memberships",
    )

    chairperson_expertise = models.CharField(
        max_length=30,
        choices=Expertise.choices,
        blank=True,
        null=True,
    )

    member_two_expertise = models.CharField(
        max_length=30,
        choices=Expertise.choices,
        blank=True,
        null=True,
    )

    member_three_expertise = models.CharField(
        max_length=30,
        choices=Expertise.choices,
        blank=True,
        null=True,
    )

    notes = models.TextField(blank=True)

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    def __str__(self):
        return f"Committee - {self.hearing.complaint.case_number}"
class DecisionAward(models.Model):
    class Outcome(models.TextChoices):
        COMPLAINT_ALLOWED = "COMPLAINT_ALLOWED", "Complaint Allowed"
        COMPLAINT_DISMISSED = "COMPLAINT_DISMISSED", "Complaint Dismissed"
        PARTIALLY_ALLOWED = "PARTIALLY_ALLOWED", "Complaint Partially Allowed"
        SETTLED = "SETTLED", "Settled"
        OTHER = "OTHER", "Other"

    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        ISSUED = "ISSUED", "Issued"
        UNDER_REVIEW = "UNDER_REVIEW", "Under Review"
        FINAL = "FINAL", "Final"
        ENFORCEMENT = "ENFORCEMENT", "Under Enforcement"
        CLOSED = "CLOSED", "Closed"

    complaint = models.OneToOneField(
        Complaint,
        on_delete=models.CASCADE,
        related_name="decision_award",
    )

    hearing = models.ForeignKey(
        Hearing,
        on_delete=models.PROTECT,
        related_name="decision_awards",
        null=True,
        blank=True,
    )

    reference_number = models.CharField(
        max_length=50,
        unique=True,
    )

    decision_date = models.DateField()

    outcome = models.CharField(
        max_length=30,
        choices=Outcome.choices,
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT,
    )

    findings = models.TextField()

    orders = models.TextField(
        blank=True,
    )

    reasons = models.TextField(
        blank=True,
    )

    award_amount = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        null=True,
        blank=True,
    )

    costs_awarded = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        null=True,
        blank=True,
    )

    issued_by = models.ForeignKey(
        "user_management.User",
        on_delete=models.PROTECT,
        related_name="issued_decision_awards",
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    def __str__(self):
        return self.reference_number
class AwardReview(models.Model):
    class Status(models.TextChoices):
        SUBMITTED = "SUBMITTED", "Submitted"
        UNDER_REVIEW = "UNDER_REVIEW", "Under Review"
        APPROVED = "APPROVED", "Review Approved"
        REJECTED = "REJECTED", "Review Rejected"
        COMPLETED = "COMPLETED", "Completed"

    class Outcome(models.TextChoices):
        PENDING = "PENDING", "Pending"
        CONFIRMED = "CONFIRMED", "Award Confirmed"
        VARIED = "VARIED", "Award Varied"
        REVERSED = "REVERSED", "Award Reversed"

    decision_award = models.ForeignKey(
        DecisionAward,
        on_delete=models.PROTECT,
        related_name="reviews",
    )

    applicant = models.ForeignKey(
        "user_management.User",
        on_delete=models.PROTECT,
        related_name="award_reviews",
    )

    application_date = models.DateField()

    grounds = models.TextField()

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.SUBMITTED,
    )

    outcome = models.CharField(
        max_length=20,
        choices=Outcome.choices,
        default=Outcome.PENDING,
    )

    review_date = models.DateField(
        null=True,
        blank=True,
    )

    decision = models.TextField(
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    def __str__(self):
        return f"Review - {self.decision_award.reference_number}"
class EnforcementCase(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        NOTICE_ISSUED = "NOTICE_ISSUED", "Notice Issued"
        COMPLIANCE_PENDING = "COMPLIANCE_PENDING", "Compliance Pending"
        COMPLIED = "COMPLIED", "Complied"
        NON_COMPLIANT = "NON_COMPLIANT", "Non-Compliant"
        COMPLETED = "COMPLETED", "Completed"

    decision_award = models.ForeignKey(
        DecisionAward,
        on_delete=models.PROTECT,
        related_name="enforcement_cases",
    )

    enforcement_reference = models.CharField(
        max_length=50,
        unique=True,
    )

    issue_date = models.DateField()

    compliance_deadline = models.DateField(
        null=True,
        blank=True,
    )

    status = models.CharField(
        max_length=30,
        choices=Status.choices,
        default=Status.PENDING,
    )

    amount_due = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        null=True,
        blank=True,
    )

    amount_paid = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0,
    )

    enforcement_action = models.TextField(
        blank=True,
    )

    notes = models.TextField(
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    def __str__(self):
        return self.enforcement_reference
class CostTaxation(models.Model):
    class Status(models.TextChoices):
        SUBMITTED = "SUBMITTED", "Submitted"
        UNDER_TAXATION = "UNDER_TAXATION", "Under Taxation"
        TAXED = "TAXED", "Taxed"
        DISALLOWED = "DISALLOWED", "Disallowed"
        COMPLETED = "COMPLETED", "Completed"

    decision_award = models.ForeignKey(
        DecisionAward,
        on_delete=models.PROTECT,
        related_name="cost_taxations",
    )

    applicant = models.ForeignKey(
        "user_management.User",
        on_delete=models.PROTECT,
        related_name="cost_taxations",
    )

    bill_reference = models.CharField(
        max_length=50,
        unique=True,
    )

    filing_date = models.DateField()

    amount_claimed = models.DecimalField(
        max_digits=15,
        decimal_places=2,
    )

    amount_allowed = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        null=True,
        blank=True,
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.SUBMITTED,
    )

    taxation_date = models.DateField(
        null=True,
        blank=True,
    )

    taxation_notes = models.TextField(
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    def __str__(self):
        return self.bill_reference
class CaseClosure(models.Model):
    class ClosureReason(models.TextChoices):
        AWARD_COMPLIED = "AWARD_COMPLIED", "Award Complied With"
        SETTLEMENT_REACHED = "SETTLEMENT_REACHED", "Settlement Reached"
        REVIEW_COMPLETED = "REVIEW_COMPLETED", "Review Completed"
        ENFORCEMENT_COMPLETED = "ENFORCEMENT_COMPLETED", "Enforcement Completed"
        OTHER = "OTHER", "Other"

    complaint = models.OneToOneField(
        Complaint,
        on_delete=models.PROTECT,
        related_name="closure",
    )

    closure_reference = models.CharField(
        max_length=50,
        unique=True,
    )

    closure_date = models.DateField()

    reason = models.CharField(
        max_length=40,
        choices=ClosureReason.choices,
    )

    summary = models.TextField()

    closed_by = models.ForeignKey(
        "user_management.User",
        on_delete=models.PROTECT,
        related_name="closed_cases",
    )

    notes = models.TextField(
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    def __str__(self):
        return self.closure_reference