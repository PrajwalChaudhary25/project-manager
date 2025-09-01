from django.shortcuts import render
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import TimeLog, LogSheetApproval
from .serializers import TimeLogSerializer, LogSheetApprovalSerializer
from datetime import date, timedelta

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
        today = date.today()
        if TimeLog.objects.filter(user=user, type='check_in', timestamp__date=today).exists():
            return Response({'detail': 'You have already checked in today.'}, status=status.HTTP_400_BAD_REQUEST)

        TimeLog.objects.create(user=user, type='check_in')
        return Response({'detail': 'Checked in successfully.'}, status=status.HTTP_201_CREATED)



class BreakStartView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        today = date.today()
        last_log = TimeLog.objects.filter(user=user, timestamp__date=today).order_by('-timestamp').first()
        if not last_log or last_log.type not in ['check_in', 'break_end']:
            return Response({'detail': 'You must be checked in to start a break.'}, status=status.HTTP_400_BAD_REQUEST)
        
        TimeLog.objects.create(user=user, type='break_start')
        return Response({'detail': 'Break started.'}, status=status.HTTP_201_CREATED)



class BreakEndView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        today = date.today()
        last_log = TimeLog.objects.filter(user=user, timestamp__date=today).order_by('-timestamp').first()
        if not last_log or last_log.type != 'break_start':
            return Response({'detail': 'You are not currently on a break.'}, status=status.HTTP_400_BAD_REQUEST)
            
        TimeLog.objects.create(user=user, type='break_end')
        return Response({'detail': 'Break ended.'}, status=status.HTTP_201_CREATED)




class CheckOutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        today = date.today()
        last_log = TimeLog.objects.filter(user=user, timestamp__date=today).order_by('-timestamp').first()
        if not last_log or last_log.type in ['check_out', 'break_start']:
            return Response({'detail': 'You must be checked in to check out.'}, status=status.HTTP_400_BAD_REQUEST)
        
        TimeLog.objects.create(user=user, type='check_out')
        return Response({'detail': 'Checked out successfully.'}, status=status.HTTP_201_CREATED)




class TimeLogView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = date.today()
        logs = TimeLog.objects.filter(user=request.user, timestamp__date=today).order_by('timestamp')
        serializer = TimeLogSerializer(logs, many=True)
        return Response(serializer.data)




class SubmitLogsheetView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        today = date.today()
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