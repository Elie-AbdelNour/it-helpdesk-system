<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Status;
use App\Models\Ticket;
use Illuminate\Http\Request;

class TicketController extends Controller
{
    private const MANAGING_ROLES = ['Admin', 'Manager', 'IT Support Agent'];

    public function index(Request $request)
    {
        $this->authorize('viewAny', Ticket::class);

        $query = Ticket::query()->with(['category', 'priority', 'status', 'creator']);

        if (! in_array($request->user()->role->rolename, self::MANAGING_ROLES, true)) {
            $query->where('createdby', $request->user()->id);
        }

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('subject', 'like', "%{$search}%")
                    ->orWhere('ticketrefno', 'like', "%{$search}%");
            });
        }

        foreach (['categoryid', 'priorityid', 'statusid'] as $filter) {
            if ($value = $request->query($filter)) {
                $query->where($filter, $value);
            }
        }

        return $query->latest('createdat')->paginate(15);
    }

    public function store(Request $request)
    {
        $this->authorize('create', Ticket::class);

        $validated = $request->validate([
            'subject' => ['required', 'string', 'max:200'],
            'description' => ['required', 'string'],
            'categoryid' => ['required', 'integer', 'exists:categories,id'],
            'priorityid' => ['required', 'integer', 'exists:priorities,id'],
        ]);

        $openStatus = Status::where('name', 'Open')->firstOrFail();

        $ticket = Ticket::create([
            ...$validated,
            'ticketrefno' => 'P-'.uniqid(),
            'statusid' => $openStatus->id,
            'createdby' => $request->user()->id,
        ]);

        $ticket->ticketrefno = 'TCK-'.str_pad($ticket->id, 6, '0', STR_PAD_LEFT);
        $ticket->save();

        return response()->json(
            $ticket->load(['category', 'priority', 'status', 'creator']),
            201
        );
    }

    public function show(Ticket $ticket)
    {
        $this->authorize('view', $ticket);

        return $ticket->load(['category', 'priority', 'status', 'creator']);
    }

    public function update(Request $request, Ticket $ticket)
    {
        $this->authorize('update', $ticket);

        $validated = $request->validate([
            'subject' => ['sometimes', 'required', 'string', 'max:200'],
            'description' => ['sometimes', 'required', 'string'],
            'categoryid' => ['sometimes', 'required', 'integer', 'exists:categories,id'],
            'priorityid' => ['sometimes', 'required', 'integer', 'exists:priorities,id'],
        ]);

        $ticket->update($validated);

        return $ticket->load(['category', 'priority', 'status', 'creator']);
    }

    public function destroy(Ticket $ticket)
    {
        $this->authorize('delete', $ticket);

        $ticket->delete();

        return response()->noContent();
    }
}
