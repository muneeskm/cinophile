from rest_framework import serializers
from django.contrib.auth.models import User
from .models import WatchlistItem


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password')

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password']
        )
        return user


class WatchlistItemSerializer(serializers.ModelSerializer):
    owner = serializers.ReadOnlyField(source='owner.username')

    class Meta:
        model = WatchlistItem
        fields = '__all__'
        read_only_fields = ('owner',)  # Prevents 400 Bad Request when creating items