from rest_framework import serializers
from .models import TimeLog, LogSheetApproval, User
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Add custom claims
        token['is_manager'] = user.is_manager

        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        # Include is_manager in the access token data
        data['is_manager'] = self.user.is_manager
        return data

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'is_manager']

class TimeLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = TimeLog
        fields = '__all__'

class LogSheetApprovalSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    manager = UserSerializer(read_only=True)

    class Meta:
        model = LogSheetApproval
        fields = '__all__'
