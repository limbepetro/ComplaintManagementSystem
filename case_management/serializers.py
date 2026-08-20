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
        fields = "__all__"
        read_only_fields = [
            "submitted_at",
            "created_at",
            "updated_at",
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

        if complaint and respondent:
            if not complaint.complainant_id and not complaint.respondent_id:
                raise serializers.ValidationError(
                    "The selected complaint is invalid."
                )

            if complaint.respondent_id != respondent.id:
                raise serializers.ValidationError({
                    "respondent": (
                        "The respondent does not belong to "
                        "the selected complaint."
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

        allowed_statuses = self.VALID_TRANSITIONS.get(
            current_status,
            set(),
        )

        if new_status not in allowed_statuses:
            raise serializers.ValidationError({
                "status": (
                    f"Invalid response status transition "
                    f"from {current_status} to {new_status}."
                )
            })

        return attrs


class RespondentResponseCreateSerializer(
    serializers.ModelSerializer
):
    class Meta:
        model = RespondentResponse
        fields = [
            "id",
            "complaint",
            "respondent",
            "notice",
            "response_text",
        ]
        read_only_fields = ["id"]

    def validate(self, attrs):
        complaint = attrs["complaint"]
        respondent = attrs["respondent"]

        if complaint.respondent_id != respondent.id:
            raise serializers.ValidationError({
                "respondent": (
                    "The respondent does not belong to "
                    "the selected complaint."
                )
            })

        if complaint.status not in [
            Complaint.Status.RESPONSE_PENDING,
            Complaint.Status.NOTICE_SENT,
        ]:
            raise serializers.ValidationError({
                "complaint": (
                    "A respondent response can only be "
                    "registered during the response stage."
                )
            })

        return attrs

    def create(self, validated_data):
        return RespondentResponse.objects.create(
            status=RespondentResponse.Status.DRAFT,
            **validated_data,
        )


class MediationSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = MediationSession
        fields = "__all__"

    def validate(self, attrs):
        instance = self.instance

        status = attrs.get(
            "status",
            instance.status if instance else None
        )

        outcome = attrs.get(
            "outcome",
            instance.outcome if instance else None
        )

        if status == "COMPLETED" and outcome == "PENDING":
            raise serializers.ValidationError({
                "outcome": (
                    "A mediation session cannot be completed "
                    "while the outcome is still pending."
                )
            })

        if outcome in {
            "SETTLED",
            "PARTIALLY_SETTLED",
            "FAILED",
        }:
            if status != "COMPLETED":
                raise serializers.ValidationError({
                    "status": (
                        "A mediation outcome can only be recorded "
                        "when the mediation session is completed."
                    )
                })

        return attrs


class HearingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Hearing
        fields = "__all__"


class HearingCommitteeSerializer(serializers.ModelSerializer):
    class Meta:
        model = HearingCommittee
        fields = "__all__"


class DecisionAwardSerializer(serializers.ModelSerializer):
    class Meta:
        model = DecisionAward
        fields = "__all__"


class AwardReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = AwardReview
        fields = "__all__"


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
        fields = "__all__"

    def validate(self, attrs):
        instance = self.instance

        new_status = attrs.get("status")

        if new_status is None:
            return attrs

        current_status = instance.status

        if new_status == current_status:
            return attrs

        allowed_statuses = self.VALID_TRANSITIONS.get(
            current_status,
            set(),
        )

        if new_status not in allowed_statuses:
            raise serializers.ValidationError({
                "status": (
                    f"Invalid enforcement status transition "
                    f"from {current_status} to {new_status}."
                )
            })

        if new_status == EnforcementCase.Status.COMPLIED:
            amount_due = attrs.get(
                "amount_due",
                instance.amount_due
            )

            amount_paid = attrs.get(
                "amount_paid",
                instance.amount_paid
            )

            if (
                amount_due is not None
                and amount_due > 0
                and amount_paid < amount_due
            ):
                raise serializers.ValidationError({
                    "amount_paid": (
                        "The enforcement case cannot be marked "
                        "COMPLIED until the full amount due has been paid."
                    )
                })

        if new_status == EnforcementCase.Status.COMPLETED:
            resolved_statuses = {
                EnforcementCase.Status.COMPLIED,
                EnforcementCase.Status.NON_COMPLIANT,
            }

            if current_status not in resolved_statuses:
                raise serializers.ValidationError({
                    "status": (
                        "An enforcement case can only be completed "
                        "after compliance or a confirmed "
                        "non-compliance resolution."
                    )
                })

        return attrs


class CostTaxationSerializer(serializers.ModelSerializer):
    class Meta:
        model = CostTaxation
        fields = "__all__"


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
            None
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