from rest_framework.permissions import BasePermission


class RolePermission(BasePermission):
    """
    Base permission that requires an authenticated,
    active user with an allowed role.
    """

    allowed_roles = set()

    message = "You do not have permission to perform this action."

    def has_permission(self, request, view):
        user = request.user

        if not (
            user
            and user.is_authenticated
            and user.is_active
        ):
            return False

        # DELETE is restricted to administrators.
        if request.method == "DELETE":
            return user.role == "ADMIN"

        return user.role in self.allowed_roles


class IsAdmin(BasePermission):
    allowed_roles = {"ADMIN"}

    message = "Only a System Administrator can perform this action."

    def has_permission(self, request, view):
        user = request.user

        return (
            user
            and user.is_authenticated
            and user.is_active
            and user.role == "ADMIN"
        )


class IsAdminOrOfficer(RolePermission):
    allowed_roles = {"ADMIN", "OFFICER"}


class IsAdminOrCaseOfficer(RolePermission):
    allowed_roles = {"ADMIN", "CASE_OFFICER"}


class IsAdminOrMediator(RolePermission):
    allowed_roles = {"ADMIN", "MEDIATOR"}


class IsAdminOrHearingOfficer(RolePermission):
    allowed_roles = {"ADMIN", "HEARING_OFFICER"}