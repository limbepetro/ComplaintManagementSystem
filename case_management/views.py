from django.contrib.auth import get_user_model

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

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

from .serializers import (
    RespondentResponseSerializer,
    RespondentResponseCreateSerializer,
    MediationSessionSerializer,
    HearingSerializer,
    HearingCommitteeSerializer,
    DecisionAwardSerializer,
    AwardReviewSerializer,
    EnforcementCaseSerializer,
    CostTaxationSerializer,
    CaseClosureSerializer,
)

from .permissions import (
    IsAdminOrCaseOfficer,
    IsAdminOrMediator,
    IsAdminOrHearingOfficer,
    IsAdminOrOfficer,
)


User = get_user_model()


class RespondentResponseViewSet(viewsets.ModelViewSet):
    serializer_class = RespondentResponseSerializer
    permission_classes = [IsAdminOrCaseOfficer]

    def get_queryset(self):
        return (
            RespondentResponse.objects
            .select_related(
                "complaint",
                "respondent",
                "notice",
            )
            .all()
            .order_by("-created_at")
        )

    def get_serializer_class(self):
        if self.action == "create":
            return RespondentResponseCreateSerializer

        return RespondentResponseSerializer

    @action(
        detail=False,
        methods=["get"],
        url_path="available-complaints",
    )
    def available_complaints(self, request):
        complaints = (
            Complaint.objects
            .select_related("respondent")
            .filter(
                status__in=[
                    Complaint.Status.NOTICE_SENT,
                    Complaint.Status.RESPONSE_PENDING,
                ]
            )
            .order_by("-updated_at")
        )

        data = [
            {
                "id": complaint.id,
                "case_number": complaint.case_number,
                "title": complaint.title,
                "status": complaint.status,
                "respondent": {
                    "id": complaint.respondent.id,
                    "full_name":
                        complaint.respondent.full_name,
                    "organization_name":
                        complaint.respondent.organization_name,
                },
            }
            for complaint in complaints
        ]

        return Response(
            data,
            status=status.HTTP_200_OK,
        )


class MediationSessionViewSet(viewsets.ModelViewSet):
    serializer_class = MediationSessionSerializer
    permission_classes = [IsAdminOrMediator]

    def get_queryset(self):
        user = self.request.user

        queryset = (
            MediationSession.objects
            .select_related(
                "complaint",
                "mediator",
            )
            .all()
            .order_by(
                "-session_date",
                "-start_time",
            )
        )

        if user.role == "ADMIN":
            return queryset

        if user.role == "MEDIATOR":
            return queryset.filter(
                mediator=user
            )

        return MediationSession.objects.none()

    def perform_create(self, serializer):
        user = self.request.user

        if user.role == "MEDIATOR":
            serializer.save(
                mediator=user,
                status=MediationSession.Status.SCHEDULED,
                outcome=MediationSession.Outcome.PENDING,
            )
        else:
            serializer.save(
                status=MediationSession.Status.SCHEDULED,
                outcome=MediationSession.Outcome.PENDING,
            )

    @action(
        detail=False,
        methods=["get"],
        url_path="available-complaints",
    )
    def available_complaints(self, request):
        complaints = (
            Complaint.objects
            .filter(
                status=Complaint.Status.MEDIATION
            )
            .order_by("-updated_at")
        )

        data = [
            {
                "id": complaint.id,
                "case_number": complaint.case_number,
                "title": complaint.title,
                "status": complaint.status,
            }
            for complaint in complaints
        ]

        return Response(
            data,
            status=status.HTTP_200_OK,
        )

    @action(
        detail=False,
        methods=["get"],
        url_path="available-mediators",
    )
    def available_mediators(self, request):
        if request.user.role != "ADMIN":
            return Response(
                {
                    "detail": (
                        "Only administrators can list "
                        "available mediators."
                    )
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        mediators = (
            User.objects
            .filter(
                role="MEDIATOR",
                is_active=True,
            )
            .order_by(
                "first_name",
                "last_name",
                "username",
            )
        )

        data = [
            {
                "id": user.id,
                "username": user.username,
                "name": (
                    user.get_full_name()
                    or user.username
                ),
            }
            for user in mediators
        ]

        return Response(
            data,
            status=status.HTTP_200_OK,
        )


class HearingViewSet(viewsets.ModelViewSet):
    serializer_class = HearingSerializer
    permission_classes = [IsAdminOrHearingOfficer]

    def get_queryset(self):
        user = self.request.user

        if user.role == "ADMIN":
            return (
                Hearing.objects
                .select_related(
                    "complaint",
                    "committee",
                )
                .all()
                .order_by("-hearing_date")
            )

        if user.role == "HEARING_OFFICER":
            return (
                Hearing.objects
                .select_related(
                    "complaint",
                    "committee",
                )
                .filter(
                    committee__chairperson=user
                )
                | Hearing.objects.filter(
                    committee__member_two=user
                )
                | Hearing.objects.filter(
                    committee__member_three=user
                )
            ).distinct().order_by(
                "-hearing_date"
            )

        return Hearing.objects.none()


class HearingCommitteeViewSet(viewsets.ModelViewSet):
    queryset = (
        HearingCommittee.objects
        .select_related(
            "hearing",
            "chairperson",
            "member_two",
            "member_three",
        )
        .all()
    )

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