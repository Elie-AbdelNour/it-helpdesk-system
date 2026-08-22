<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: sans-serif; font-size: 11px; color: #1e293b; }
        h1 { font-size: 18px; margin-bottom: 2px; }
        p.meta { color: #64748b; margin-top: 0; margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #cbd5e1; padding: 5px 7px; text-align: left; }
        th { background: #f1f5f9; }
    </style>
</head>
<body>
    <h1>IT Help Desk &mdash; Tickets Report</h1>
    <p class="meta">Generated {{ $generatedat }} &middot; {{ count($tickets) }} ticket(s)</p>

    <table>
        <thead>
            <tr>
                <th>Ref #</th>
                <th>Subject</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Created By</th>
                <th>Agent</th>
                <th>Created</th>
                <th>Resolved</th>
                <th>Resolution (min)</th>
            </tr>
        </thead>
        <tbody>
            @foreach($tickets as $ticket)
                <tr>
                    <td>{{ $ticket->ticketrefno }}</td>
                    <td>{{ $ticket->subject }}</td>
                    <td>{{ $ticket->category?->name }}</td>
                    <td>{{ $ticket->priority?->name }}</td>
                    <td>{{ $ticket->status?->name }}</td>
                    <td>{{ $ticket->creator?->fullname }}</td>
                    <td>{{ $ticket->agent?->fullname ?? '-' }}</td>
                    <td>{{ $ticket->createdat?->toDateTimeString() }}</td>
                    <td>{{ $ticket->resolvedat?->toDateTimeString() ?? '-' }}</td>
                    <td>{{ $ticket->actualresolutionminutes ?? '-' }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
</body>
</html>
