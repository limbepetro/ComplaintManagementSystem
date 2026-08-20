from django.contrib import admin

from .models import (
    ComplaintNotice,
    RespondentResponse,
    MediationSession,
    Hearing,
    HearingCommittee,
    DecisionAward,
    AwardReview,
    EnforcementCase,
    CostTaxation,
    CaseClosure,
)


@admin.register(ComplaintNotice)
class ComplaintNoticeAdmin(admin.ModelAdmin):
    list_display = (
        "reference_number",
        "complaint",
        "notice_type",
        "delivery_method",
        "delivery_status",
        "issue_date",
        "response_deadline",
    )

    list_filter = (
        "notice_type",
        "delivery_method",
        "delivery_status",
    )

    search_fields = (
        "reference_number",
        "complaint__case_number",
    )


@admin.register(RespondentResponse)
class RespondentResponseAdmin(admin.ModelAdmin):
    list_display = (
        "complaint",
        "respondent",
        "notice",
        "status",
        "submitted_at",
        "created_at",
    )

    list_filter = (
        "status",
    )

    search_fields = (
        "complaint__case_number",
        "respondent__full_name",
        "response_text",
    )


@admin.register(MediationSession)
class MediationSessionAdmin(admin.ModelAdmin):
    list_display = (
        "complaint",
        "mediator",
        "session_date",
        "status",
        "outcome",
    )

    list_filter = (
        "status",
        "outcome",
    )

    search_fields = (
        "complaint__case_number",
        "mediator__username",
    )


@admin.register(Hearing)
class HearingAdmin(admin.ModelAdmin):
    list_display = (
        "complaint",
        "hearing_date",
        "start_time",
        "location",
        "status",
    )

    list_filter = (
        "status",
        "hearing_date",
    )

    search_fields = (
        "complaint__case_number",
        "location",
    )


@admin.register(HearingCommittee)
class HearingCommitteeAdmin(admin.ModelAdmin):
    list_display = (
        "hearing",
        "chairperson",
        "member_two",
        "member_three",
        "chairperson_expertise",
        "member_two_expertise",
        "member_three_expertise",
    )

    list_filter = (
        "chairperson_expertise",
        "member_two_expertise",
        "member_three_expertise",
    )

    search_fields = (
        "hearing__complaint__case_number",
        "chairperson__username",
        "member_two__username",
        "member_three__username",
    )


@admin.register(DecisionAward)
class DecisionAwardAdmin(admin.ModelAdmin):
    list_display = (
        "reference_number",
        "complaint",
        "decision_date",
        "outcome",
        "status",
        "award_amount",
        "costs_awarded",
    )

    list_filter = (
        "outcome",
        "status",
        "decision_date",
    )

    search_fields = (
        "reference_number",
        "complaint__case_number",
        "findings",
        "orders",
    )
@admin.register(AwardReview)
class AwardReviewAdmin(admin.ModelAdmin):
    list_display = (
        "decision_award",
        "applicant",
        "application_date",
        "status",
        "outcome",
        "review_date",
    )

    list_filter = (
        "status",
        "outcome",
        "application_date",
    )

    search_fields = (
        "decision_award__reference_number",
        "applicant__username",
        "grounds",
        "decision",
    )
@admin.register(EnforcementCase)
class EnforcementCaseAdmin(admin.ModelAdmin):
    list_display = (
        "enforcement_reference",
        "decision_award",
        "issue_date",
        "compliance_deadline",
        "status",
        "amount_due",
        "amount_paid",
    )

    list_filter = (
        "status",
        "issue_date",
    )

    search_fields = (
        "enforcement_reference",
        "decision_award__reference_number",
        "enforcement_action",
        "notes",
    )
@admin.register(CostTaxation)
class CostTaxationAdmin(admin.ModelAdmin):
    list_display = (
        "bill_reference",
        "decision_award",
        "applicant",
        "filing_date",
        "amount_claimed",
        "amount_allowed",
        "status",
        "taxation_date",
    )

    list_filter = (
        "status",
        "filing_date",
        "taxation_date",
    )

    search_fields = (
        "bill_reference",
        "decision_award__reference_number",
        "applicant__username",
        "taxation_notes",
    )
@admin.register(CaseClosure)
class CaseClosureAdmin(admin.ModelAdmin):
    list_display = (
        "closure_reference",
        "complaint",
        "closure_date",
        "reason",
        "closed_by",
    )

    list_filter = (
        "reason",
        "closure_date",
    )

    search_fields = (
        "closure_reference",
        "complaint__case_number",
        "summary",
        "notes",
        "closed_by__username",
    )