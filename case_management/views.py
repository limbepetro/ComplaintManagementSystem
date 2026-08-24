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

        return Response([
            {
                "id": complaint.id,
                "case_number": complaint.case_number,
                "title": complaint.title,
                "status": complaint.status,
                "respondent": {
                    "id": complaint.respondent.id,
                    "full_name": complaint.respondent.full_name,
                    "organization_name":
                        complaint.respondent.organization_name,
                },
            }
            for complaint in complaints
        ])


class MediationSessionViewSet(viewsets.ModelViewSet):
    serializer_class = MediationSessionSerializer
    permission_classes = [IsAdminOrMediator]

    def get_queryset(self):
        user = self.request.user

        queryset = (
            MediationSession.objects
            .select_related("complaint", "mediator")
            .all()
            .order_by("-session_date", "-start_time")
        )

        if user.role == "ADMIN":
            return queryset

        if user.role == "MEDIATOR":
            return queryset.filter(mediator=user)

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
        complaints = Complaint.objects.filter(
            status=Complaint.Status.MEDIATION
        ).order_by("-updated_at")

        return Response([
            {
                "id": complaint.id,
                "case_number": complaint.case_number,
                "title": complaint.title,
                "status": complaint.status,
            }
            for complaint in complaints
        ])

    @action(
        detail=False,
        methods=["get"],
        url_path="available-mediators",
    )
    def available_mediators(self, request):
        if request.user.role != "ADMIN":
            return Response(
                {
                    "detail":
                        "Only administrators can list available mediators."
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        mediators = User.objects.filter(
            role="MEDIATOR",
            is_active=True,
        ).order_by(
            "first_name",
            "last_name",
            "username",
        )

        return Response([
            {
                "id": user.id,
                "username": user.username,
                "name": (
                    user.get_full_name()
                    or user.username
                ),
            }
            for user in mediators
        ])


class HearingViewSet(viewsets.ModelViewSet):
    serializer_class = HearingSerializer
    permission_classes = [IsAdminOrHearingOfficer]

    def get_queryset(self):
        user = self.request.user

        queryset = (
            Hearing.objects
            .select_related("complaint", "committee")
            .all()
            .order_by("-hearing_date", "-start_time")
        )

        if user.role == "ADMIN":
            return queryset

        if user.role == "HEARING_OFFICER":
            return (
                queryset.filter(
                    committee__chairperson=user
                )
                | queryset.filter(
                    committee__member_two=user
                )
                | queryset.filter(
                    committee__member_three=user
                )
            ).distinct()

        return Hearing.objects.none()

    def perform_create(self, serializer):
        serializer.save(
            status=Hearing.Status.SCHEDULED
        )

    @action(
        detail=False,
        methods=["get"],
        url_path="available-complaints",
    )
    def available_complaints(self, request):
        complaints = Complaint.objects.filter(
            status=Complaint.Status.HEARING
        ).order_by("-updated_at")

        return Response([
            {
                "id": complaint.id,
                "case_number": complaint.case_number,
                "title": complaint.title,
                "status": complaint.status,
            }
            for complaint in complaints
        ])


class HearingCommitteeViewSet(viewsets.ModelViewSet):
    queryset = HearingCommittee.objects.all()
    serializer_class = HearingCommitteeSerializer
    permission_classes = [IsAdminOrHearingOfficer]


class DecisionAwardViewSet(viewsets.ModelViewSet):
    serializer_class = DecisionAwardSerializer
    permission_classes = [IsAdminOrHearingOfficer]

    def get_queryset(self):
        user = self.request.user

        queryset = (
            DecisionAward.objects
            .select_related(
                "complaint",
                "hearing",
                "issued_by",
            )
            .all()
            .order_by("-decision_date")
        )

        if user.role == "ADMIN":
            return queryset

        if user.role == "HEARING_OFFICER":
            return queryset.filter(issued_by=user)

        return DecisionAward.objects.none()

    def perform_create(self, serializer):
        serializer.save(
            issued_by=self.request.user,
            status=DecisionAward.Status.DRAFT,
        )

    @action(
        detail=False,
        methods=["get"],
        url_path="available-cases",
    )
    def available_cases(self, request):
        hearings = (
            Hearing.objects
            .select_related("complaint")
            .filter(
                status=Hearing.Status.COMPLETED,
                complaint__status=Complaint.Status.HEARING,
                decision_awards__isnull=True,
            )
            .order_by("-hearing_date")
        )

        return Response([
            {
                "complaint_id": hearing.complaint_id,
                "case_number": hearing.complaint.case_number,
                "title": hearing.complaint.title,
                "hearing_id": hearing.id,
                "hearing_date": hearing.hearing_date,
            }
            for hearing in hearings
        ])

    @action(
        detail=True,
        methods=["post"],
        url_path="issue",
    )
    def issue(self, request, pk=None):
        decision = self.get_object()

        if decision.status != DecisionAward.Status.DRAFT:
            return Response(
                {
                    "detail":
                        "Only draft decisions can be issued."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not decision.findings.strip():
            return Response(
                {
                    "findings":
                        "Findings are required before issuing."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        decision.status = DecisionAward.Status.ISSUED
        decision.save(
            update_fields=["status", "updated_at"]
        )

        return Response(
            DecisionAwardSerializer(decision).data
        )


class AwardReviewViewSet(viewsets.ModelViewSet):
    serializer_class = AwardReviewSerializer
    permission_classes = [IsAdminOrOfficer]

    def get_queryset(self):
        return (
            AwardReview.objects
            .select_related(
                "decision_award",
                "applicant",
            )
            .all()
            .order_by("-application_date")
        )

    def perform_create(self, serializer):
        serializer.save(
            applicant=self.request.user,
            status=AwardReview.Status.SUBMITTED,
            outcome=AwardReview.Outcome.PENDING,
        )

    @action(
        detail=False,
        methods=["get"],
        url_path="available-awards",
    )
    def available_awards(self, request):
        awards = (
            DecisionAward.objects
            .filter(
                status__in=[
                    DecisionAward.Status.ISSUED,
                    DecisionAward.Status.FINAL,
                ]
            )
            .exclude(
                reviews__status=AwardReview.Status.COMPLETED
            )
            .order_by("-decision_date")
        )

        return Response([
            {
                "id": award.id,
                "reference_number": award.reference_number,
                "complaint_id": award.complaint_id,
                "outcome": award.outcome,
                "status": award.status,
                "decision_date": award.decision_date,
            }
            for award in awards
        ])


class EnforcementCaseViewSet(viewsets.ModelViewSet):
    serializer_class = EnforcementCaseSerializer
    permission_classes = [IsAdminOrOfficer]

    def get_queryset(self):
        return (
            EnforcementCase.objects
            .select_related(
                "decision_award",
                "decision_award__complaint",
            )
            .all()
            .order_by("-issue_date")
        )

    @action(
        detail=False,
        methods=["get"],
        url_path="available-awards",
    )
    def available_awards(self, request):
        awards = (
            DecisionAward.objects
            .select_related("complaint")
            .filter(
                status__in=[
                    DecisionAward.Status.ISSUED,
                    DecisionAward.Status.FINAL,
                    DecisionAward.Status.ENFORCEMENT,
                ]
            )
            .exclude(
                enforcement_cases__status__in=[
                    EnforcementCase.Status.PENDING,
                    EnforcementCase.Status.NOTICE_ISSUED,
                    EnforcementCase.Status.COMPLIANCE_PENDING,
                ]
            )
            .order_by("-decision_date")
        )

        return Response([
            {
                "id": award.id,
                "reference_number": award.reference_number,
                "complaint_id": award.complaint_id,
                "case_number": award.complaint.case_number,
                "outcome": award.outcome,
                "status": award.status,
                "award_amount": award.award_amount,
                "costs_awarded": award.costs_awarded,
            }
            for award in awards
        ])

    def perform_create(self, serializer):
        award = serializer.validated_data["decision_award"]

        if award.status != DecisionAward.Status.ENFORCEMENT:
            award.status = DecisionAward.Status.ENFORCEMENT
            award.save(update_fields=["status"])

        serializer.save(
            status=EnforcementCase.Status.PENDING
        )


class CostTaxationViewSet(viewsets.ModelViewSet):
    serializer_class = CostTaxationSerializer
    permission_classes = [IsAdminOrOfficer]

    def get_queryset(self):
        return (
            CostTaxation.objects
            .select_related(
                "decision_award",
                "applicant",
            )
            .all()
            .order_by("-filing_date")
        )

    def perform_create(self, serializer):
        serializer.save(
            applicant=self.request.user,
            status=CostTaxation.Status.SUBMITTED,
        )

    @action(
        detail=False,
        methods=["get"],
        url_path="available-awards",
    )
    def available_awards(self, request):
        awards = (
            DecisionAward.objects
            .select_related("complaint")
            .filter(
                status__in=[
                    DecisionAward.Status.ISSUED,
                    DecisionAward.Status.FINAL,
                    DecisionAward.Status.UNDER_REVIEW,
                    DecisionAward.Status.ENFORCEMENT,
                    DecisionAward.Status.CLOSED,
                ]
            )
            .exclude(
                cost_taxations__status__in=[
                    CostTaxation.Status.SUBMITTED,
                    CostTaxation.Status.UNDER_TAXATION,
                ]
            )
            .order_by("-decision_date")
        )

        return Response([
            {
                "id": award.id,
                "reference_number":
                    award.reference_number,
                "complaint_id":
                    award.complaint_id,
                "case_number":
                    award.complaint.case_number,
                "outcome":
                    award.outcome,
                "status":
                    award.status,
            }
            for award in awards
        ])


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