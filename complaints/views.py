from rest_framework import viewsets

from .models import Complaint
from .serializers import ComplaintSerializer

from case_management.permissions import IsAdminOrOfficer


class ComplaintViewSet(viewsets.ModelViewSet):
    queryset = Complaint.objects.all()
    serializer_class = ComplaintSerializer
    permission_classes = [IsAdminOrOfficer]