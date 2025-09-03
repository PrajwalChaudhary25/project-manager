from django.db import models
from django.contrib.auth.models import AbstractUser

# Create your models here.
class User(AbstractUser):
    is_manager = models.BooleanField(default=False)

    # Add a related_name to the groups and user_permissions fields
    groups = models.ManyToManyField(
        'auth.Group',
        related_name='dashboard_user_set',  # Unique related_name for groups
        blank=True,
        help_text='The groups this user belongs to. A user will get all permissions granted to each of their groups.',
        related_query_name='dashboard_user',
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        related_name='dashboard_user_permissions',  # Unique related_name for user_permissions
        blank=True,
        help_text='Specific permissions for this user.',
        related_query_name='dashboard_user',
    )
    
# Time log model  
class TimeLog(models.Model):
    TYPE_CHOICES = (
        ('check_in', 'Check-in'),
        ('break_start', 'Break Start'),
        ('break_end', 'Break End'),
        ('check_out', 'Check-out'),
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE,related_name='time_logs')
    timestamp = models.DateTimeField(auto_now_add=True)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    
    def __str__(self):
        return f'{self.user.username}-{self.type} at {self.timestamp}'

# Log sheet approval model    
class LogSheetApproval(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )
    user = models.ForeignKey(User, on_delete = models.CASCADE, related_name='log_approvals')
    date = models.DateField()
    jira_key = models.CharField(max_length=255)
    hours_worked = models.FloatField(default=0.0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    manager = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name = 'manager_approvals')
    work_day_credit = models.FloatField(default=0.0)
    
    def __str__(self):
        return f'LogSheet for {self.user.username} on {self.date}'