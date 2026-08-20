from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import User
from .serializers import (
    UserCreateSerializer,
    UserPasswordChangeSerializer,
    UserSerializer,
)

from case_management.permissions import IsAdmin


class CurrentUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by("id")
    permission_classes = [IsAdmin]

    def get_serializer_class(self):
        if self.action == "create":
            return UserCreateSerializer

        return UserSerializer

    @action(
        detail=False,
        methods=["post"],
        permission_classes=[
            permissions.IsAuthenticated
        ],
        url_path="change-password",
    )
    def change_password(self, request):
        serializer = UserPasswordChangeSerializer(
            data=request.data,
            context={"request": request},
        )

        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            {
                "detail":
                "Password changed successfully."
            },
            status=status.HTTP_200_OK,
        )