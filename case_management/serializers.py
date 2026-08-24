from rest_framework import serializers

from complaints.models import Complaint

from .models import (
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


class RespondentResponseSerializer(serializers.ModelSerializer):
    VALID_TRANSITIONS = {
        RespondentResponse.Status.DRAFT: {
            RespondentResponse.Status.SUBMITTED,
        },
        RespondentResponse.Status.SUBMITTED: {
            RespondentResponse.Status.ACCEPTED,
            RespondentResponse.Status.REJECTED,
        },
        RespondentResponse.Status.ACCEPTED: set(),
        RespondentResponse.Status.REJECTED: set(),
    }

    class Meta:
        model = RespondentResponse
        fields = [
            "id", "complaint", "respondent", "notice",
            "response_text", "status", "submitted_at",
            "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "submitted_at", "created_at", "updated_at",
        ]

    def validate(self, attrs):
        instance = self.instance

        complaint = attrs.get(
            "complaint",
            instance.complaint if instance else None,
        )
        respondent = attrs.get(
            "respondent",
            instance.respondent if instance else None,
        )
        notice = attrs.get(
            "notice",
            instance.notice if instance else None,
        )

        if complaint and respondent:
            if complaint.respondent_id != respondent.id:
                raise serializers.ValidationError({
                    "respondent": (
                        "The respondent does not belong to "
                        "the selected complaint."
                    )
                })

        if complaint and notice:
            if notice.complaint_id != complaint.id:
                raise serializers.ValidationError({
                    "notice": (
                        "The selected notice does not belong "
                        "to the selected complaint."
                    )
                })

        if instance is None:
            return attrs

        new_status = attrs.get("status")

        if new_status is None:
            return attrs

        current_status = instance.status

        if new_status == current_status:
            return attrs

        if new_status not in self.VALID_TRANSITIONS.get(
            current_status,
            set(),
        ):
            raise serializers.ValidationError({
                "status": (
                    f"Invalid response status transition "
                    f"from {current_status} to {new_status}."
                )
            })

        return attrs


class RespondentResponseCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = RespondentResponse
        fields = [
            "id", "complaint", "notice", "response_text",
        ]
        read_only_fields = ["id"]

    def validate(self, attrs):
        complaint = attrs["complaint"]
        notice = attrs.get("notice")

        if complaint.status not in [
            Complaint.Status.NOTICE_SENT,
            Complaint.Status.RESPONSE_PENDING,
        ]:
            raise serializers.ValidationError({
                "complaint": (
                    "A respondent response can only be "
                    "registered during the response stage."
                )
            })

        if notice and notice.complaint_id != complaint.id:
            raise serializers.ValidationError({
                "notice": (
                    "The selected notice does not belong "
                    "to the selected complaint."
                )
            })

        if RespondentResponse.objects.filter(
            complaint=complaint
        ).exclude(
            status=RespondentResponse.Status.REJECTED
        ).exists():
            raise serializers.ValidationError({
                "complaint": (
                    "A respondent response already exists "
                    "for this complaint."
                )
            })

        return attrs

    def create(self, validated_data):
        complaint = validated_data["complaint"]

        return RespondentResponse.objects.create(
            complaint=complaint,
            respondent=complaint.respondent,
            notice=validated_data.get("notice"),
            response_text=validated_data["response_text"],
            status=RespondentResponse.Status.DRAFT,
        )


class MediationSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = MediationSession
        fields = "__all__"
        read_only_fields = ["created_at", "updated_at"]

    def validate(self, attrs):
        instance = self.instance

        complaint = attrs.get(
            "complaint",
            instance.complaint if instance else None,
        )
        mediator = attrs.get(
            "mediator",
            instance.mediator if instance else None,
        )
        status = attrs.get(
            "status",
            instance.status
            if instance
            else MediationSession.Status.SCHEDULED,
        )
        outcome = attrs.get(
            "outcome",
            instance.outcome
            if instance
            else MediationSession.Outcome.PENDING,
        )

        if complaint is not None:
            if complaint.status != Complaint.Status.MEDIATION:
                raise serializers.ValidationError({
                    "complaint": (
                        "A mediation session can only be created "
                        "for a complaint currently in the "
                        "MEDIATION stage."
                    )
                })

        if mediator is not None:
            if mediator.role != "MEDIATOR":
                raise serializers.ValidationError({
                    "mediator": (
                        "The selected user is not authorized "
                        "to conduct mediation."
                    )
                })

            if not mediator.is_active:
                raise serializers.ValidationError({
                    "mediator": (
                        "The selected mediator account is inactive."
                    )
                })

        if (
            status == MediationSession.Status.COMPLETED
            and outcome == MediationSession.Outcome.PENDING
        ):
            raise serializers.ValidationError({
                "outcome": (
                    "A mediation session cannot be completed "
                    "while the outcome is still pending."
                )
            })

        if outcome in {
            MediationSession.Outcome.SETTLED,
            MediationSession.Outcome.PARTIALLY_SETTLED,
            MediationSession.Outcome.FAILED,
        } and status != MediationSession.Status.COMPLETED:
            raise serializers.ValidationError({
                "status": (
                    "A mediation outcome can only be recorded "
                    "when the mediation session is completed."
                )
            })

        return attrs


class HearingSerializer(serializers.ModelSerializer):
    complaint_case_number = serializers.CharField(
        source="complaint.case_number",
        read_only=True,
    )
    complaint_title = serializers.CharField(
        source="complaint.title",
        read_only=True,
    )

    class Meta:
        model = Hearing
        fields = [
            "id", "complaint", "complaint_case_number",
            "complaint_title", "hearing_date", "start_time",
            "end_time", "location", "status", "proceedings",
            "adjournment_reason", "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "complaint_case_number", "complaint_title",
            "created_at", "updated_at",
        ]

    def validate(self, attrs):
        instance = self.instance

        complaint = attrs.get(
            "complaint",
            instance.complaint if instance else None,
        )
        status = attrs.get(
            "status",
            instance.status
            if instance
            else Hearing.Status.SCHEDULED,
        )
        start_time = attrs.get(
            "start_time",
            instance.start_time if instance else None,
        )
        end_time = attrs.get(
            "end_time",
            instance.end_time if instance else None,
        )
        proceedings = attrs.get(
            "proceedings",
            instance.proceedings if instance else "",
        )
        adjournment_reason = attrs.get(
            "adjournment_reason",
            instance.adjournment_reason
            if instance
            else "",
        )

        if complaint is not None:
            if complaint.status != Complaint.Status.HEARING:
                raise serializers.ValidationError({
                    "complaint": (
                        "A hearing can only be scheduled for "
                        "a complaint currently in the HEARING stage."
                    )
                })

        if start_time and end_time and end_time <= start_time:
            raise serializers.ValidationError({
                "end_time": (
                    "End time must be later than start time."
                )
            })

        if (
            status == Hearing.Status.COMPLETED
            and not proceedings.strip()
        ):
            raise serializers.ValidationError({
                "proceedings": (
                    "Completed hearings must contain "
                    "proceedings notes."
                )
            })

        if (
            status == Hearing.Status.ADJOURNED
            and not adjournment_reason.strip()
        ):
            raise serializers.ValidationError({
                "adjournment_reason": (
                    "An adjournment reason is required "
                    "when a hearing is adjourned."
                )
            })

        return attrs


class HearingCommitteeSerializer(serializers.ModelSerializer):
    class Meta:
        model = HearingCommittee
        fields = "__all__"


class DecisionAwardSerializer(serializers.ModelSerializer):
    VALID_TRANSITIONS = {
        DecisionAward.Status.DRAFT: {
            DecisionAward.Status.ISSUED,
        },
        DecisionAward.Status.ISSUED: {
            DecisionAward.Status.UNDER_REVIEW,
            DecisionAward.Status.FINAL,
        },
        DecisionAward.Status.UNDER_REVIEW: {
            DecisionAward.Status.FINAL,
            DecisionAward.Status.ENFORCEMENT,
        },
        DecisionAward.Status.FINAL: {
            DecisionAward.Status.ENFORCEMENT,
            DecisionAward.Status.CLOSED,
        },
        DecisionAward.Status.ENFORCEMENT: {
            DecisionAward.Status.CLOSED,
        },
        DecisionAward.Status.CLOSED: set(),
    }

    class Meta:
        model = DecisionAward
        fields = [
            "id", "complaint", "hearing", "reference_number",
            "decision_date", "outcome", "status", "findings",
            "orders", "reasons", "award_amount",
            "costs_awarded", "issued_by", "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "issued_by", "created_at", "updated_at",
        ]

    def validate(self, attrs):
        instance = self.instance

        complaint = attrs.get(
            "complaint",
            instance.complaint if instance else None,
        )
        hearing = attrs.get(
            "hearing",
            instance.hearing if instance else None,
        )

        if complaint is None:
            raise serializers.ValidationError({
                "complaint": "A complaint is required."
            })

        if hearing is None:
            raise serializers.ValidationError({
                "hearing": "A hearing is required."
            })

        if complaint.status != Complaint.Status.HEARING:
            raise serializers.ValidationError({
                "complaint": (
                    "A decision and award can only be prepared "
                    "for a complaint in the HEARING stage."
                )
            })

        if hearing.complaint_id != complaint.id:
            raise serializers.ValidationError({
                "hearing": (
                    "The selected hearing does not belong "
                    "to the selected complaint."
                )
            })

        if hearing.status != Hearing.Status.COMPLETED:
            raise serializers.ValidationError({
                "hearing": (
                    "A decision and award can only be prepared "
                    "after the hearing is completed."
                )
            })

        new_status = attrs.get(
            "status",
            instance.status
            if instance
            else DecisionAward.Status.DRAFT,
        )

        if instance is not None and new_status != instance.status:
            allowed = self.VALID_TRANSITIONS.get(
                instance.status,
                set(),
            )

            if new_status not in allowed:
                raise serializers.ValidationError({
                    "status": (
                        f"Invalid decision status transition "
                        f"from {instance.status} to {new_status}."
                    )
                })

        if new_status in {
            DecisionAward.Status.ISSUED,
            DecisionAward.Status.FINAL,
        }:
            findings = attrs.get(
                "findings",
                instance.findings if instance else "",
            )

            if not findings or not findings.strip():
                raise serializers.ValidationError({
                    "findings": (
                        "Findings are required before the "
                        "decision can be issued or finalized."
                    )
                })

        return attrs

    def create(self, validated_data):
        validated_data["status"] = DecisionAward.Status.DRAFT
        return super().create(validated_data)


class AwardReviewSerializer(serializers.ModelSerializer):
    VALID_TRANSITIONS = {
        AwardReview.Status.SUBMITTED: {
            AwardReview.Status.UNDER_REVIEW,
        },
        AwardReview.Status.UNDER_REVIEW: {
            AwardReview.Status.APPROVED,
            AwardReview.Status.REJECTED,
            AwardReview.Status.COMPLETED,
        },
        AwardReview.Status.APPROVED: {
            AwardReview.Status.COMPLETED,
        },
        AwardReview.Status.REJECTED: {
            AwardReview.Status.COMPLETED,
        },
        AwardReview.Status.COMPLETED: set(),
    }

    class Meta:
        model = AwardReview
        fields = "__all__"
        read_only_fields = [
            "applicant",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):
        instance = self.instance

        decision_award = attrs.get(
            "decision_award",
            instance.decision_award if instance else None,
        )

        if decision_award is None:
            raise serializers.ValidationError({
                "decision_award": (
                    "A decision and award is required."
                )
            })

        if decision_award.status not in [
            DecisionAward.Status.ISSUED,
            DecisionAward.Status.UNDER_REVIEW,
            DecisionAward.Status.FINAL,
        ]:
            raise serializers.ValidationError({
                "decision_award": (
                    "Only an issued, under-review, or final "
                    "decision can be reviewed."
                )
            })

        new_status = attrs.get(
            "status",
            instance.status
            if instance
            else AwardReview.Status.SUBMITTED,
        )

        if instance is not None and new_status != instance.status:
            allowed = self.VALID_TRANSITIONS.get(
                instance.status,
                set(),
            )

            if new_status not in allowed:
                raise serializers.ValidationError({
                    "status": (
                        f"Invalid review status transition "
                        f"from {instance.status} to {new_status}."
                    )
                })

        if new_status == AwardReview.Status.COMPLETED:
            outcome = attrs.get(
                "outcome",
                instance.outcome
                if instance
                else AwardReview.Outcome.PENDING,
            )

            if outcome == AwardReview.Outcome.PENDING:
                raise serializers.ValidationError({
                    "outcome": (
                        "A completed award review must "
                        "have a final outcome."
                    )
                })

        return attrs

    def create(self, validated_data):
        validated_data["status"] = AwardReview.Status.SUBMITTED
        validated_data["outcome"] = AwardReview.Outcome.PENDING
        return super().create(validated_data)


class EnforcementCaseSerializer(serializers.ModelSerializer):
    VALID_TRANSITIONS = {
        EnforcementCase.Status.PENDING: {
            EnforcementCase.Status.NOTICE_ISSUED,
        },
        EnforcementCase.Status.NOTICE_ISSUED: {
            EnforcementCase.Status.COMPLIANCE_PENDING,
        },
        EnforcementCase.Status.COMPLIANCE_PENDING: {
            EnforcementCase.Status.COMPLIED,
            EnforcementCase.Status.NON_COMPLIANT,
        },
        EnforcementCase.Status.COMPLIED: {
            EnforcementCase.Status.COMPLETED,
        },
        EnforcementCase.Status.NON_COMPLIANT: {
            EnforcementCase.Status.COMPLETED,
        },
        EnforcementCase.Status.COMPLETED: set(),
    }

    class Meta:
        model = EnforcementCase
        fields = [
            "id", "decision_award", "enforcement_reference",
            "issue_date", "compliance_deadline", "status",
            "amount_due", "amount_paid", "enforcement_action",
            "notes", "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "created_at", "updated_at",
        ]

    def validate(self, attrs):
        instance = self.instance

        decision_award = attrs.get(
            "decision_award",
            instance.decision_award if instance else None,
        )

        if decision_award is None:
            raise serializers.ValidationError({
                "decision_award": (
                    "A decision and award is required."
                )
            })

        if decision_award.status not in [
            DecisionAward.Status.ISSUED,
            DecisionAward.Status.FINAL,
            DecisionAward.Status.ENFORCEMENT,
        ]:
            raise serializers.ValidationError({
                "decision_award": (
                    "Enforcement can only begin for an "
                    "issued, final, or enforcement-stage award."
                )
            })

        new_status = attrs.get(
            "status",
            instance.status
            if instance
            else EnforcementCase.Status.PENDING,
        )

        if instance is None and new_status != EnforcementCase.Status.PENDING:
            raise serializers.ValidationError({
                "status": (
                    "A new enforcement case must start "
                    "in PENDING status."
                )
            })

        if instance is not None and new_status != instance.status:
            allowed = self.VALID_TRANSITIONS.get(
                instance.status,
                set(),
            )

            if new_status not in allowed:
                raise serializers.ValidationError({
                    "status": (
                        f"Invalid enforcement status "
                        f"transition from {instance.status} "
                        f"to {new_status}."
                    )
                })

        amount_due = attrs.get(
            "amount_due",
            instance.amount_due if instance else None,
        )
        amount_paid = attrs.get(
            "amount_paid",
            instance.amount_paid if instance else 0,
        )

        if amount_due is not None and amount_due < 0:
            raise serializers.ValidationError({
                "amount_due": (
                    "Amount due cannot be negative."
                )
            })

        if amount_paid is not None and amount_paid < 0:
            raise serializers.ValidationError({
                "amount_paid": (
                    "Amount paid cannot be negative."
                )
            })

        if (
            amount_due is not None
            and amount_due > 0
            and amount_paid > amount_due
        ):
            raise serializers.ValidationError({
                "amount_paid": (
                    "Amount paid cannot exceed amount due."
                )
            })

        if new_status == EnforcementCase.Status.COMPLIED:
            if (
                amount_due is not None
                and amount_due > 0
                and amount_paid < amount_due
            ):
                raise serializers.ValidationError({
                    "amount_paid": (
                        "The enforcement case cannot be marked "
                        "COMPLIED until the full amount due has "
                        "been paid."
                    )
                })

        if new_status == EnforcementCase.Status.COMPLETED:
            current_status = (
                instance.status
                if instance
                else EnforcementCase.Status.PENDING
            )

            if current_status not in {
                EnforcementCase.Status.COMPLIED,
                EnforcementCase.Status.NON_COMPLIANT,
            }:
                raise serializers.ValidationError({
                    "status": (
                        "An enforcement case can only be completed "
                        "after compliance or confirmed "
                        "non-compliance."
                    )
                })

        return attrs

    def create(self, validated_data):
        validated_data["status"] = EnforcementCase.Status.PENDING
        return super().create(validated_data)


class CostTaxationSerializer(serializers.ModelSerializer):
    VALID_TRANSITIONS = {
        CostTaxation.Status.SUBMITTED: {
            CostTaxation.Status.UNDER_TAXATION,
        },
        CostTaxation.Status.UNDER_TAXATION: {
            CostTaxation.Status.TAXED,
            CostTaxation.Status.DISALLOWED,
        },
        CostTaxation.Status.TAXED: {
            CostTaxation.Status.COMPLETED,
        },
        CostTaxation.Status.DISALLOWED: {
            CostTaxation.Status.COMPLETED,
        },
        CostTaxation.Status.COMPLETED: set(),
    }

    class Meta:
        model = CostTaxation
        fields = [
            "id",
            "decision_award",
            "applicant",
            "bill_reference",
            "filing_date",
            "amount_claimed",
            "amount_allowed",
            "status",
            "taxation_date",
            "taxation_notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "applicant",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):
        instance = self.instance

        decision_award = attrs.get(
            "decision_award",
            instance.decision_award if instance else None,
        )

        if decision_award is None:
            raise serializers.ValidationError({
                "decision_award": (
                    "A decision and award is required."
                )
            })

        if decision_award.status not in [
            DecisionAward.Status.ISSUED,
            DecisionAward.Status.FINAL,
            DecisionAward.Status.UNDER_REVIEW,
            DecisionAward.Status.ENFORCEMENT,
            DecisionAward.Status.CLOSED,
        ]:
            raise serializers.ValidationError({
                "decision_award": (
                    "Cost taxation can only be filed against "
                    "an issued or later-stage decision."
                )
            })

        amount_claimed = attrs.get(
            "amount_claimed",
            instance.amount_claimed if instance else None,
        )

        amount_allowed = attrs.get(
            "amount_allowed",
            instance.amount_allowed if instance else None,
        )

        if (
            amount_claimed is not None
            and amount_claimed < 0
        ):
            raise serializers.ValidationError({
                "amount_claimed": (
                    "Amount claimed cannot be negative."
                )
            })

        if (
            amount_allowed is not None
            and amount_allowed < 0
        ):
            raise serializers.ValidationError({
                "amount_allowed": (
                    "Amount allowed cannot be negative."
                )
            })

        if (
            amount_claimed is not None
            and amount_allowed is not None
            and amount_allowed > amount_claimed
        ):
            raise serializers.ValidationError({
                "amount_allowed": (
                    "Amount allowed cannot exceed "
                    "amount claimed."
                )
            })

        new_status = attrs.get(
            "status",
            instance.status
            if instance
            else CostTaxation.Status.SUBMITTED,
        )

        if (
            instance is not None
            and new_status != instance.status
        ):
            allowed = self.VALID_TRANSITIONS.get(
                instance.status,
                set(),
            )

            if new_status not in allowed:
                raise serializers.ValidationError({
                    "status": (
                        f"Invalid taxation status transition "
                        f"from {instance.status} to {new_status}."
                    )
                })

        if new_status in {
            CostTaxation.Status.TAXED,
            CostTaxation.Status.DISALLOWED,
            CostTaxation.Status.COMPLETED,
        }:
            taxation_date = attrs.get(
                "taxation_date",
                instance.taxation_date
                if instance
                else None,
            )

            taxation_notes = attrs.get(
                "taxation_notes",
                instance.taxation_notes
                if instance
                else "",
            )

            if taxation_date is None:
                raise serializers.ValidationError({
                    "taxation_date": (
                        "A taxation date is required."
                    )
                })

            if not taxation_notes.strip():
                raise serializers.ValidationError({
                    "taxation_notes": (
                        "Taxation notes are required."
                    )
                })

        return attrs

    def create(self, validated_data):
        validated_data["status"] = (
            CostTaxation.Status.SUBMITTED
        )
        return super().create(validated_data)


class CaseClosureSerializer(serializers.ModelSerializer):
    class Meta:
        model = CaseClosure
        fields = "__all__"

    def validate(self, attrs):
        complaint = attrs.get("complaint")

        if complaint is None and self.instance:
            complaint = self.instance.complaint

        if complaint is None:
            return attrs

        if complaint.status != Complaint.Status.ENFORCEMENT:
            raise serializers.ValidationError({
                "complaint": (
                    "A case can only be closed when the complaint "
                    "is in the ENFORCEMENT stage."
                )
            })

        decision_award = getattr(
            complaint,
            "decision_award",
            None,
        )

        if decision_award is None:
            raise serializers.ValidationError({
                "complaint": (
                    "A case cannot be closed because it has "
                    "no decision award."
                )
            })

        if not decision_award.enforcement_cases.filter(
            status=EnforcementCase.Status.COMPLETED
        ).exists():
            raise serializers.ValidationError({
                "complaint": (
                    "A case cannot be closed until enforcement "
                    "has been completed."
                )
            })

        return attrs

    def create(self, validated_data):
        closure = super().create(validated_data)

        complaint = closure.complaint
        complaint.status = Complaint.Status.CLOSED

        complaint.save(
            update_fields=["status"]
        )

        return closure