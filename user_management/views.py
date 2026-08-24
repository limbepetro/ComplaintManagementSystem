from django.db.models import Count, Q

from rest_framework import (
    permissions,
    serializers,
    status,
    viewsets,
)
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
    permission_classes = [
        permissions.IsAuthenticated
    ]

    def get(self, request):
        serializer = UserSerializer(
            request.user
        )

        return Response(
            serializer.data
        )


class UserViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdmin]

    def get_queryset(self):
        return (
            User.objects
            .all()
            .order_by(
                "first_name",
                "last_name",
                "username",
            )
        )

    def get_serializer_class(self):
        if self.action == "create":
            return UserCreateSerializer

        return UserSerializer

    def perform_update(self, serializer):
        target_user = self.get_object()

        if (
            target_user == self.request.user
            and "is_active" in serializer.validated_data
            and serializer.validated_data["is_active"] is False
        ):
            raise serializers.ValidationError(
                {
                    "is_active":
                        "You cannot deactivate your own account."
                }
            )

        serializer.save()

    def perform_destroy(self, instance):
        if instance == self.request.user:
            return Response(
                {
                    "detail":
                        "You cannot delete your own account."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if instance.role == User.Role.ADMIN:
            active_admins = User.objects.filter(
                role=User.Role.ADMIN,
                is_active=True,
            ).exclude(
                pk=instance.pk
            ).count()

            if active_admins == 0:
                return Response(
                    {
                        "detail":
                            "The last active administrator "
                            "cannot be deleted."
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        instance.delete()

    @action(
        detail=False,
        methods=["get"],
        url_path="statistics",
    )
    def statistics(self, request):
        total = User.objects.count()

        active = User.objects.filter(
            is_active=True
        ).count()

        inactive = User.objects.filter(
            is_active=False
        ).count()

        role_counts = User.objects.aggregate(
            admins=Count(
                "id",
                filter=Q(
                    role=User.Role.ADMIN
                ),
            ),
            officers=Count(
                "id",
                filter=Q(
                    role=User.Role.OFFICER
                ),
            ),
            case_officers=Count(
                "id",
                filter=Q(
                    role=User.Role.CASE_OFFICER
                ),
            ),
            mediators=Count(
                "id",
                filter=Q(
                    role=User.Role.MEDIATOR
                ),
            ),
            hearing_officers=Count(
                "id",
                filter=Q(
                    role=User.Role.HEARING_OFFICER
                ),
            ),
        )

        return Response({
            "total": total,
            "active": active,
            "inactive": inactive,
            "roles": role_counts,
        })

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

        serializer.is_valid(
            raise_exception=True
        )

        serializer.save()

        return Response(
            {
                "detail":
                    "Password changed successfully."
            },
            status=status.HTTP_200_OK,
        )