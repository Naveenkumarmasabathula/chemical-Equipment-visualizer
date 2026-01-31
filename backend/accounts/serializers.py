"""
Production-grade auth serializers.
Validation lives here; views stay thin.
"""
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

User = get_user_model()


class SignupSerializer(serializers.Serializer):
    username = serializers.CharField(
        min_length=2,
        max_length=150,
        trim_whitespace=True,
        help_text="Unique username. Min 2 characters.",
    )
    password = serializers.CharField(
        write_only=True,
        min_length=8,
        style={"input_type": "password"},
        help_text="Required. Min 8 chars. Enforced by Django validators.",
    )

    def validate_username(self, value):
        if value.lower() == "admin":
            raise serializers.ValidationError("The username \"admin\" is reserved. Use a different username to sign up.")
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value

    def validate_password(self, value):
        validate_password(value, user=None)
        return value

    def create(self, validated_data):
        return User.objects.create_user(
            username=validated_data["username"],
            password=validated_data["password"],
        )


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(trim_whitespace=True, write_only=True)
    password = serializers.CharField(write_only=True, style={"input_type": "password"})

    def validate(self, attrs):
        username = attrs.get("username") or ""
        password = attrs.get("password") or ""
        if not username or not password:
            raise serializers.ValidationError(
                {"detail": "Invalid username or password"},
                code="invalid_credentials",
            )
        user = User.objects.filter(username=username).first()
        if user is None or not user.check_password(password):
            raise serializers.ValidationError(
                {"detail": "Invalid username or password"},
                code="invalid_credentials",
            )
        attrs["user"] = user
        return attrs
