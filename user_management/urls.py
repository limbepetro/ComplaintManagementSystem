from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import CurrentUserView, UserViewSet


router = DefaultRouter()

router.register(
    r"users",
    UserViewSet,
    basename="user",
)

urlpatterns = [
    path("me/", CurrentUserView.as_view(), name="current-user"),
]

urlpatterns += router.urls