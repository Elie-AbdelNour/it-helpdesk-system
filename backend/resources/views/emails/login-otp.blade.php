<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; color: #1e293b;">
    <p>Hi {{ $user->fullname }},</p>
    <p>Use this code to log in to IT Help Desk:</p>
    <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px;">{{ $code }}</p>
    <p>This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.</p>
</body>
</html>
