from rest_framework.routers import DefaultRouter
from .views import (
    RespondentResponseViewSet,
    MediationSessionViewSet,
    HearingViewSet,
    HearingCommitteeViewSet,
    DecisionAwardViewSet,
    AwardReviewViewSet,
    EnforcementCaseViewSet,
    CostTaxationViewSet,
    CaseClosureViewSet,
)

router = DefaultRouter()

router.register(
    r'respondent-responses',
    RespondentResponseViewSet,
    basename='respondent-response'
)

router.register(
    r'mediation-sessions',
    MediationSessionViewSet,
    basename='mediation-session'
)

router.register(
    r'hearings',
    HearingViewSet,
    basename='hearing'
)

router.register(
    r'hearing-committees',
    HearingCommitteeViewSet,
    basename='hearing-committee'
)

router.register(
    r'decision-awards',
    DecisionAwardViewSet,
    basename='decision-award'
)

router.register(
    r'award-reviews',
    AwardReviewViewSet,
    basename='award-review'
)

router.register(
    r'enforcement-cases',
    EnforcementCaseViewSet,
    basename='enforcement-case'
)

router.register(
    r'cost-taxations',
    CostTaxationViewSet,
    basename='cost-taxation'
)

router.register(
    r'case-closures',
    CaseClosureViewSet,
    basename='case-closure'
)

urlpatterns = router.urls