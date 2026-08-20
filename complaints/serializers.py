from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Complaint, Complainant, Respondent


User = get_user_model()


class ComplainantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Complainant
        fields = [
            "id",
            "party_type",
            "full_name",
            "organization_name",
            "email",
            "phone_number",
            "address",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]


class RespondentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Respondent
        fields = [
            "id",
            "party_type",
            "full_name",
            "organization_name",
            "email",
            "phone_number",
            "address",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]


class ComplaintSerializer(serializers.ModelSerializer):
    complainant = ComplainantSerializer(read_only=True)
    respondent = RespondentSerializer(read_only=True)

    class Meta:
        model = Complaint
        fields = [
            "id",
            "case_number",
            "complainant",
            "respondent",
            "title",
            "description",
            "status",
            "submitted_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "submitted_at",
            "created_at",
            "updated_at",
        ]

    VALID_TRANSITIONS = {
        Complaint.Status.DRAFT: {
            Complaint.Status.SUBMITTED,
        },
        Complaint.Status.SUBMITTED: {
            Complaint.Status.UNDER_REVIEW,
        },
        Complaint.Status.UNDER_REVIEW: {
            Complaint.Status.NOTICE_SENT,
        },
        Complaint.Status.NOTICE_SENT: {
            Complaint.Status.RESPONSE_PENDING,
        },
        Complaint.Status.RESPONSE_PENDING: {
            Complaint.Status.MEDIATION,
        },
        Complaint.Status.MEDIATION: {
            Complaint.Status.HEARING,
            Complaint.Status.CLOSED,
        },
        Complaint.Status.HEARING: {
            Complaint.Status.DECIDED,
        },
        Complaint.Status.DECIDED: {
            Complaint.Status.REVIEW,
            Complaint.Status.ENFORCEMENT,
        },
        Complaint.Status.REVIEW: {
            Complaint.Status.ENFORCEMENT,
        },
        Complaint.Status.ENFORCEMENT: {
            Complaint.Status.CLOSED,
        },
        Complaint.Status.CLOSED: set(),
    }

    def validate(self, attrs):
        instance = self.instance

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
                    f"Invalid status transition from "
                    f"{current_status} to {new_status}."
                )
            })

        if (
            current_status == Complaint.Status.UNDER_REVIEW
            and new_status == Complaint.Status.NOTICE_SENT
        ):
            valid_notice_exists = instance.notices.filter(
                delivery_status__in=["SENT", "DELIVERED"]
            ).exists()

            if not valid_notice_exists:
                raise serializers.ValidationError({
                    "status": (
                        "The complaint cannot move to NOTICE_SENT "
                        "until a notice has been sent or delivered."
                    )
                })

        if (
            current_status == Complaint.Status.RESPONSE_PENDING
            and new_status == Complaint.Status.MEDIATION
        ):
            valid_response_exists = instance.respondent_responses.filter(
                status__in=[
                    "SUBMITTED",
                    "ACCEPTED",
                    "REJECTED",
                ]
            ).exists()

            if not valid_response_exists:
                raise serializers.ValidationError({
                    "status": (
                        "The complaint cannot move to MEDIATION "
                        "until the respondent has submitted a response."
                    )
                })

        if (
            current_status == Complaint.Status.MEDIATION
            and new_status == Complaint.Status.HEARING
        ):
            valid_mediation_exists = instance.mediation_sessions.filter(
                status="COMPLETED",
                outcome__in=[
                    "FAILED",
                    "PARTIALLY_SETTLED",
                ],
            ).exists()

            if not valid_mediation_exists:
                raise serializers.ValidationError({
                    "status": (
                        "The complaint cannot move to HEARING until "
                        "mediation is completed with an unresolved outcome."
                    )
                })

        if (
            current_status == Complaint.Status.MEDIATION
            and new_status == Complaint.Status.CLOSED
        ):
            settled_mediation_exists = instance.mediation_sessions.filter(
                status="COMPLETED",
                outcome="SETTLED",
            ).exists()

            if not settled_mediation_exists:
                raise serializers.ValidationError({
                    "status": (
                        "The complaint can only be closed directly from "
                        "mediation when the mediation is completed and settled."
                    )
                })

            if not hasattr(instance, "closure"):
                raise serializers.ValidationError({
                    "status": (
                        "A case closure record must exist before "
                        "the complaint can be closed."
                    )
                })

        if (
            current_status == Complaint.Status.HEARING
            and new_status == Complaint.Status.DECIDED
        ):
            completed_hearing_exists = instance.hearings.filter(
                status="COMPLETED"
            ).exists()

            if not completed_hearing_exists:
                raise serializers.ValidationError({
                    "status": (
                        "The complaint cannot be marked DECIDED "
                        "until the hearing is completed."
                    )
                })

            if not hasattr(instance, "decision_award"):
                raise serializers.ValidationError({
                    "status": (
                        "A Decision and Award must exist before "
                        "the complaint can be marked DECIDED."
                    )
                })

        if (
            current_status == Complaint.Status.DECIDED
            and new_status == Complaint.Status.ENFORCEMENT
        ):
            if not hasattr(instance, "decision_award"):
                raise serializers.ValidationError({
                    "status": (
                        "A Decision and Award must exist before "
                        "enforcement can begin."
                    )
                })

            if instance.decision_award.status not in [
                "ISSUED",
                "FINAL",
            ]:
                raise serializers.ValidationError({
                    "status": (
                        "The Decision and Award must be ISSUED or FINAL "
                        "before enforcement can begin."
                    )
                })

        if (
            current_status == Complaint.Status.REVIEW
            and new_status == Complaint.Status.ENFORCEMENT
        ):
            if not hasattr(instance, "decision_award"):
                raise serializers.ValidationError({
                    "status": (
                        "A Decision and Award must exist before "
                        "enforcement can begin."
                    )
                })

            valid_review_exists = instance.decision_award.reviews.filter(
                status="COMPLETED",
                outcome__in=[
                    "CONFIRMED",
                    "VARIED",
                ],
            ).exists()

            if not valid_review_exists:
                raise serializers.ValidationError({
                    "status": (
                        "The award review must be completed with a "
                        "confirmed or varied outcome before enforcement."
                    )
                })

        if (
            current_status == Complaint.Status.ENFORCEMENT
            and new_status == Complaint.Status.CLOSED
        ):
            if not hasattr(instance, "decision_award"):
                raise serializers.ValidationError({
                    "status": (
                        "A Decision and Award must exist before "
                        "the case can be closed."
                    )
                })

            completed_enforcement_exists = (
                instance.decision_award.enforcement_cases.filter(
                    status="COMPLETED"
                ).exists()
            )

            if not completed_enforcement_exists:
                raise serializers.ValidationError({
                    "status": (
                        "The case cannot be closed until enforcement "
                        "is completed."
                    )
                })

            if not hasattr(instance, "closure"):
                raise serializers.ValidationError({
                    "status": (
                        "A case closure record must exist before "
                        "the complaint can be closed."
                    )
                })

        return attrs


class ComplaintCreateSerializer(serializers.ModelSerializer):
    """
    Creates a complaint and its complainant/respondent atomically.
    New complaints always begin as DRAFT.
    """

    complainant = ComplainantSerializer()
    respondent = RespondentSerializer()

    class Meta:
        model = Complaint
        fields = [
            "id",
            "case_number",
            "complainant",
            "respondent",
            "title",
            "description",
            "status",
        ]
        read_only_fields = [
            "id",
            "status",
        ]

    def validate_case_number(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Case number is required."
            )

        if Complaint.objects.filter(
            case_number=value
        ).exists():
            raise serializers.ValidationError(
                "A complaint with this case number already exists."
            )

        return value

    def validate_title(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Complaint title is required."
            )

        return value

    def validate_description(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Complaint description is required."
            )

        return value

    def validate(self, attrs):
        complainant = attrs.get("complainant")
        respondent = attrs.get("respondent")

        if not complainant:
            raise serializers.ValidationError({
                "complainant":
                "Complainant information is required."
            })

        if not respondent:
            raise serializers.ValidationError({
                "respondent":
                "Respondent information is required."
            })

        return attrs

    def create(self, validated_data):
        complainant_data = validated_data.pop(
            "complainant"
        )

        respondent_data = validated_data.pop(
            "respondent"
        )

        complainant = Complainant.objects.create(
            **complainant_data
        )

        respondent = Respondent.objects.create(
            **respondent_data
        )

        complaint = Complaint.objects.create(
            complainant=complainant,
            respondent=respondent,
            status=Complaint.Status.DRAFT,
            **validated_data,
        )

        return complaint