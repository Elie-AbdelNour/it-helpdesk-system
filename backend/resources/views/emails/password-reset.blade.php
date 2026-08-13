<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; color: #1e293b;">
    <p>Hi {{ $user->fullname }},</p>
    <p>We received a request to reset your IT Help Desk password. Click the link below to choose a new one:</p>
    <p><a href="{{ $resetUrl }}">{{ $resetUrl }}</a></p>
    <p>This link expires in 60 minutes. If you didn't request this, you can safely ignore this email.</p>
</body>
</html>
