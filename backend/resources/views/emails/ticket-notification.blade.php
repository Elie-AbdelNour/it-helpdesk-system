<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; color: #1e293b;">
    <p>Hi {{ $user->fullname }},</p>
    <p>{{ $notificationMessage }}</p>
    @if($ticketUrl)
        <p><a href="{{ $ticketUrl }}">View ticket {{ $ticket->ticketrefno }}</a></p>
    @endif
    <p style="color: #64748b; font-size: 12px;">You're receiving this because of activity on an IT Help Desk ticket involving you.</p>
</body>
</html>
