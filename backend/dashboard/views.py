from django.shortcuts import render
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import TimeLog, LogSheetApproval
from .serializers import TimeLogSerializer, LogSheetApprovalSerializer
from datetime import date
from datetime import datetime 
from django.utils import timezone

# Create your views here.
from .serializers import UserSerializer
class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
    
class CheckInView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        today = timezone.localdate()
        if TimeLog.objects.filter(user=user, type='check_in', timestamp__date=today).exists():
            return Response({'detail': 'You have already checked in today.'}, status=status.HTTP_400_BAD_REQUEST)

        TimeLog.objects.create(user=user, type='check_in')
        return Response({'detail': 'Checked in successfully.'}, status=status.HTTP_201_CREATED)



class BreakStartView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        today = timezone.localdate()
        
        is_checked_in = TimeLog.objects.filter(user=user, type='check_in', timestamp__date=today).exists()
        has_active_break = TimeLog.objects.filter(user=user, type='break_start', timestamp__date=today).exists() and \
                          not TimeLog.objects.filter(user=user, type='break_end', timestamp__date=today).exists()
        has_checked_out = TimeLog.objects.filter(user=user, type='check_out', timestamp__date=today).exists()
        
        if not is_checked_in or has_checked_out or has_active_break:
            return Response({'detail': 'You cannot start a break at this time.'}, status=status.HTTP_400_BAD_REQUEST)
        
        TimeLog.objects.create(user=user, type='break_start')
        return Response({'detail': 'Break started.'}, status=status.HTTP_201_CREATED)

class BreakEndView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        
        # Get the most recent TimeLog entry for the user on the current day
        try:
            last_log = TimeLog.objects.filter(user=user, timestamp__date=timezone.localdate()).latest('timestamp')
        except TimeLog.DoesNotExist:
            return Response({'detail': 'You are not currently on a break.'}, status=status.HTTP_400_BAD_REQUEST)

        # Check if the last log entry was a 'break_start'
        if last_log.type != 'break_start':
            return Response({'detail': 'You are not currently on a break.'}, status=status.HTTP_400_BAD_REQUEST)

        # Create the new 'break_end' TimeLog entry
        TimeLog.objects.create(user=user, type='break_end')
        return Response({'detail': 'Break ended.'}, status=status.HTTP_201_CREATED)

class CheckOutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        today = timezone.localdate()
        
        is_checked_in = TimeLog.objects.filter(user=user, type='check_in', timestamp__date=today).exists()
        has_checked_out = TimeLog.objects.filter(user=user, type='check_out', timestamp__date=today).exists()
        has_active_break = TimeLog.objects.filter(user=user, type='break_start', timestamp__date=today).exists() and \
                          not TimeLog.objects.filter(user=user, type='break_end', timestamp__date=today).exists()
        
        if not is_checked_in or has_checked_out or has_active_break:
            return Response({'detail': 'You cannot check out at this time.'}, status=status.HTTP_400_BAD_REQUEST)

        TimeLog.objects.create(user=user, type='check_out')
        return Response({'detail': 'Checked out successfully.'}, status=status.HTTP_201_CREATED)


class TimeLogView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = timezone.localdate() # Get today's date in the local timezone
        logs = TimeLog.objects.filter(user=request.user, timestamp__date=today).order_by('timestamp')
        print(f"Logs fetched for user {request.user.username} on {today}: {logs}")
        print(logs)
        serializer = TimeLogSerializer(logs, many=True)
        return Response(serializer.data)




class SubmitLogsheetView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        today = timezone.localdate()
        jira_key = request.data.get('jira_key')
        
        if not jira_key:
            return Response({'detail': 'JIRA key is required.'}, status=status.HTTP_400_BAD_REQUEST)
            
        # Check for completed day
        check_in_log = TimeLog.objects.filter(user=user, type='check_in', timestamp__date=today).first()
        check_out_log = TimeLog.objects.filter(user=user, type='check_out', timestamp__date=today).first()

        if not check_in_log or not check_out_log:
            return Response({'detail': 'You must have both a check-in and a check-out to submit a logsheet.'}, status=status.HTTP_400_BAD_REQUEST)

        # Calculate total hours worked
        all_logs = TimeLog.objects.filter(user=user, timestamp__date=today).order_by('timestamp')
        total_work_seconds = 0
        last_time = None

        for log in all_logs:
            if log.type == 'check_in':
                last_time = log.timestamp
            elif log.type == 'break_start':
                if last_time:
                    total_work_seconds += (log.timestamp - last_time).total_seconds()
                last_time = log.timestamp
            elif log.type == 'break_end' or log.type == 'check_out':
                if last_time:
                    total_work_seconds += (log.timestamp - last_time).total_seconds()
                last_time = log.timestamp

        hours_worked = total_work_seconds / 3600
        
        logsheet, created = LogSheetApproval.objects.get_or_create(
            user=user,
            date=today,
            defaults={
                'jira_key': jira_key,
                'hours_worked': hours_worked,
                'status': 'pending',
            }
        )
        
        if not created:
            logsheet.jira_key = jira_key
            logsheet.hours_worked = hours_worked
            logsheet.status = 'pending'
            logsheet.save()
        
        serializer = LogSheetApprovalSerializer(logsheet)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class LogsheetStatusView(APIView):
    """
    Checks if a logsheet has been submitted by the user for the current day.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        today = timezone.now().date()
        
        # Check if a logsheet exists for the user today, regardless of status
        has_submitted = LogSheetApproval.objects.filter(
            user=user,
            date=today
        ).exists()
        
        return Response({'has_submitted': has_submitted})




# Manager Views
class ManagerLogsheetsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.is_manager:
            return Response({'detail': 'You do not have permission to view this.'}, status=status.HTTP_403_FORBIDDEN)
        
        logsheets = LogSheetApproval.objects.filter(status='pending').order_by('-date')
        serializer = LogSheetApprovalSerializer(logsheets, many=True)
        return Response(serializer.data)




class ApproveRejectLogsheetView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if not request.user.is_manager:
            return Response({'detail': 'You do not have permission to perform this action.'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            logsheet = LogSheetApproval.objects.get(pk=pk, status='pending')
        except LogSheetApproval.DoesNotExist:
            return Response({'detail': 'Logsheet not found or already processed.'}, status=status.HTTP_404_NOT_FOUND)

        action = request.data.get('action')
        work_day_credit = request.data.get('work_day_credit')

        if action == 'approve':
            if work_day_credit not in [1.0, 0.5]:
                return Response({'detail': 'Work day credit must be 1.0 or 0.5'}, status=status.HTTP_400_BAD_REQUEST)
            
            logsheet.status = 'approved'
            logsheet.work_day_credit = work_day_credit
            logsheet.manager = request.user
            logsheet.save()
            return Response({'detail': 'Logsheet approved.'}, status=status.HTTP_200_OK)
        
        elif action == 'reject':
            logsheet.status = 'rejected'
            logsheet.work_day_credit = 0.0
            logsheet.manager = request.user
            logsheet.save()
            return Response({'detail': 'Logsheet rejected.'}, status=status.HTTP_200_OK)

        return Response({'detail': 'Invalid action.'}, status=status.HTTP_400_BAD_REQUEST)

# view for detail time logs of a user for a specific date 
# for manager to view
class UserTimeLogsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id, date_str):
        # Optional: Add a check to ensure only managers or the user themselves can view logs
        if not request.user.is_manager and request.user.id != int(user_id):
            return Response({'detail': 'You do not have permission to view these logs.'}, status=status.HTTP_403_FORBIDDEN)
            
        try:
            log_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            return Response({'detail': 'Invalid date format. Use YYYY-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)
        
        logs = TimeLog.objects.filter(
            user__id=user_id,
            timestamp__date=log_date
        ).order_by('timestamp')
        
        # Calculate total hours worked
        total_work_seconds = 0
        last_time = None
        for log in logs:
            if log.type == 'check_in':
                last_time = log.timestamp
            elif log.type == 'break_start':
                if last_time:
                    total_work_seconds += (log.timestamp - last_time).total_seconds()
                last_time = log.timestamp
            elif log.type == 'break_end' or log.type == 'check_out':
                if last_time:
                    total_work_seconds += (log.timestamp - last_time).total_seconds()
                last_time = log.timestamp
        
        hours_worked = round(total_work_seconds / 3600, 2)
        
        # Serialize the logs and include the total hours
        serializer = TimeLogSerializer(logs, many=True)
        response_data = {
            'logs': serializer.data,
            'total_hours': hours_worked
        }

        return Response(response_data)