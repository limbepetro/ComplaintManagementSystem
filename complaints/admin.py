from django.contrib import admin
from .models import Complainant, Respondent, Complaint, ComplaintDocument

@admin.register(ComplaintDocument)
class ComplaintDocumentAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "complaint",
        "uploaded_at",
    )
    search_fields = (
        "title",
        "complaint__case_number",
    )


@admin.register(Complainant)
class ComplainantAdmin(admin.ModelAdmin):
    list_display = (
        "full_name",
        "party_type",
        "email",
        "phone_number",
        "created_at",
    )
    search_fields = (
        "full_name",
        "organization_name",
        "email",
        "phone_number",
    )


@admin.register(Respondent)
class RespondentAdmin(admin.ModelAdmin):
    list_display = (
        "full_name",
        "party_type",
        "email",
        "phone_number",
        "created_at",
    )
    search_fields = (
        "full_name",
        "organization_name",
        "email",
        "phone_number",
    )


@admin.register(Complaint)
class ComplaintAdmin(admin.ModelAdmin):
    list_display = (
        "case_number",
        "title",
        "complainant",
        "respondent",
        "status",
        "created_at",
    )
    list_filter = ("status",)
    search_fields = (
        "case_number",
        "title",
        "description",
        "complainant__full_name",
        "respondent__full_name",
    )