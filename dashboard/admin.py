from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, TimeLog, LogSheetApproval



# Define a new Admin class for your custom User model
@admin.register(User)
class CustomUserAdmin(BaseUserAdmin):
    fieldsets = BaseUserAdmin.fieldsets + (
        (None, {'fields': ('is_manager',)}),
    )

# Register the other models
admin.site.register(TimeLog)
admin.site.register(LogSheetApproval)