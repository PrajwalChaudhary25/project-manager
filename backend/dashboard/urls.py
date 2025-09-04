from django.urls import path
from .views import (
    CheckInView, BreakStartView, BreakEndView, CheckOutView,
    TimeLogView, SubmitLogsheetView, ManagerLogsheetsView,
    ApproveRejectLogsheetView,
    UserProfileView,
    UserTimeLogsView,
    LogsheetStatusView
)

urlpatterns = [
    # Employee Endpoints
    path('user/profile/', UserProfileView.as_view(), name='user-profile'),
    path('check-in/', CheckInView.as_view(), name='check-in'),
    path('break-start/', BreakStartView.as_view(), name='break-start'),
    path('break-end/', BreakEndView.as_view(), name='break-end'),
    path('check-out/', CheckOutView.as_view(), name='check-out'),
    path('time-logs/', TimeLogView.as_view(), name='time-logs'),
    path('submit-logsheet/', SubmitLogsheetView.as_view(), name='submit-logsheet'),
    path('logsheet-status/', LogsheetStatusView.as_view(), name='logsheet-status'),

    # Manager Endpoints
    path('manager/logsheets/', ManagerLogsheetsView.as_view(), name='manager-logsheets'),
    path('manager/logsheets/<int:pk>/', ApproveRejectLogsheetView.as_view(), name='approve-reject-logsheet'),
    path('time-logs/<int:user_id>/<str:date_str>/', UserTimeLogsView.as_view(), name='user-time-logs'),
]