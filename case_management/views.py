from rest_framework import viewsets

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

from .serializers import (
    RespondentResponseSerializer,
    MediationSessionSerializer,
    HearingSerializer,
    HearingCommitteeSerializer,
    DecisionAwardSerializer,
    AwardReviewSerializer,
    EnforcementCaseSerializer,
    CostTaxationSerializer,
    CaseClosureSerializer,
    RespondentResponseCreateSerializer,
)

from .permissions import (
    IsAdminOrCaseOfficer,
    IsAdminOrMediator,
    IsAdminOrHearingOfficer,
    IsAdminOrOfficer,
)


class RespondentResponseViewSet(viewsets.ModelViewSet):
    queryset = (
        RespondentResponse.objects
        .select_related(
            "complaint",
            "respondent",
            "notice",
        )
        .all()
        .order_by("-created_at")
    )

    permission_classes = [IsAdminOrCaseOfficer]

    def get_serializer_class(self):
        if self.action == "create":
            return RespondentResponseCreateSerializer

        return RespondentResponseSerializer

class MediationSessionViewSet(viewsets.ModelViewSet):
    serializer_class = MediationSessionSerializer
    permission_classes = [IsAdminOrMediator]

    def get_queryset(self):
        user = self.request.user

        if user.role == "ADMIN":
            return (
                MediationSession.objects
                .select_related("complaint", "mediator")
                .all()
                .order_by("-session_date")
            )

        if user.role == "MEDIATOR":
            return (
                MediationSession.objects
                .select_related("complaint", "mediator")
                .filter(mediator=user)
                .order_by("-session_date")
            )

        return MediationSession.objects.none()


class HearingViewSet(viewsets.ModelViewSet):
    serializer_class = HearingSerializer
    permission_classes = [IsAdminOrHearingOfficer]

    def get_queryset(self):
        user = self.request.user

        if user.role == "ADMIN":
            return (
                Hearing.objects
                .select_related("complaint", "committee")
                .all()
                .order_by("-hearing_date")
            )

        if user.role == "HEARING_OFFICER":
            return (
                Hearing.objects
                .select_related("complaint", "committee")
                .filter(
                    committee__chairperson=user
                )
                | Hearing.objects.filter(
                    committee__member_two=user
                )
                | Hearing.objects.filter(
                    committee__member_three=user
                )
            ).distinct().order_by("-hearing_date")

        return Hearing.objects.none()


class HearingCommitteeViewSet(viewsets.ModelViewSet):
    queryset = HearingCommittee.objects.all()
    serializer_class = HearingCommitteeSerializer
    permission_classes = [IsAdminOrHearingOfficer]


class DecisionAwardViewSet(viewsets.ModelViewSet):
    serializer_class = DecisionAwardSerializer
    permission_classes = [IsAdminOrHearingOfficer]

    def get_queryset(self):
        user = self.request.user

        if user.role == "ADMIN":
            return (
                DecisionAward.objects
                .select_related(
                    "complaint",
                    "hearing",
                    "issued_by",
                )
                .all()
                .order_by("-decision_date")
            )

        if user.role == "HEARING_OFFICER":
            return (
                DecisionAward.objects
                .select_related(
                    "complaint",
                    "hearing",
                    "issued_by",
                )
                .filter(issued_by=user)
                .order_by("-decision_date")
            )

        return DecisionAward.objects.none()


class AwardReviewViewSet(viewsets.ModelViewSet):
    queryset = (
        AwardReview.objects
        .select_related(
            "decision_award",
            "applicant",
        )
        .all()
        .order_by("-application_date")
    )
    serializer_class = AwardReviewSerializer
    permission_classes = [IsAdminOrOfficer]


class EnforcementCaseViewSet(viewsets.ModelViewSet):
    queryset = (
        EnforcementCase.objects
        .select_related(
            "decision_award",
        )
        .all()
        .order_by("-issue_date")
    )
    serializer_class = EnforcementCaseSerializer
    permission_classes = [IsAdminOrOfficer]


class CostTaxationViewSet(viewsets.ModelViewSet):
    queryset = (
        CostTaxation.objects
        .select_related(
            "decision_award",
            "applicant",
        )
        .all()
        .order_by("-filing_date")
    )
    serializer_class = CostTaxationSerializer
    permission_classes = [IsAdminOrOfficer]


class CaseClosureViewSet(viewsets.ModelViewSet):
    queryset = (
        CaseClosure.objects
        .select_related(
            "complaint",
            "closed_by",
        )
        .all()
        .order_by("-closure_date")
    )
    serializer_class = CaseClosureSerializer
    permission_classes = [IsAdminOrOfficer]