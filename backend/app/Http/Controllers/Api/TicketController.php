<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\AssignmentHistory;
use App\Models\Priority;
use App\Models\Status;
use App\Models\Ticket;
use App\Models\TicketComment;
use App\Models\TicketStatusHistory;
use App\Models\User;
use App\Support\Concerns\NotifiesUsers;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class TicketController extends Controller
{
    use NotifiesUsers;

    private const MANAGING_ROLES = ['Admin', 'Manager', 'IT Support Agent'];
    private const FINAL_STATUSES = ['Resolved', 'Closed'];

    public function index(Request $request)
    {
        $this->authorize('viewAny', Ticket::class);

        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'categoryid' => ['nullable', 'integer', 'exists:categories,id'],
            'priorityid' => ['nullable', 'integer', 'exists:priorities,id'],
            'statusid' => ['nullable', 'integer', 'exists:statuses,id'],
            'assignedto' => ['nullable', 'integer', 'exists:users,id'],
            'unassigned' => ['nullable', 'boolean'],
            'createdfrom' => ['nullable', 'date'],
            'createdto' => ['nullable', 'date', 'after_or_equal:createdfrom'],
            'resolvedfrom' => ['nullable', 'date'],
            'resolvedto' => ['nullable', 'date', 'after_or_equal:resolvedfrom'],
            'closedfrom' => ['nullable', 'date'],
            'closedto' => ['nullable', 'date', 'after_or_equal:closedfrom'],
        ]);

        $query = Ticket::query()->with(['category', 'priority', 'status', 'creator', 'agent']);

        if (! $this->isManagingUser($request->user())) {
            $query->where('createdby', $request->user()->id);
        }

        if ($search = $validated['search'] ?? null) {
            $query->where(function ($q) use ($search) {
                $q->where('subject', 'like', "%{$search}%")
                    ->orWhere('ticketrefno', 'like', "%{$search}%");
            });
        }

        foreach (['categoryid', 'priorityid', 'statusid'] as $filter) {
            if ($value = $validated[$filter] ?? null) {
                $query->where($filter, $value);
            }
        }

        if ($assignedTo = $validated['assignedto'] ?? null) {
            $query->where('assignedto', $assignedTo);
        }

        if ($validated['unassigned'] ?? false) {
            $query->whereNull('assignedto');
        }

        $this->applyDateRange($query, 'createdat', $validated['createdfrom'] ?? null, $validated['createdto'] ?? null);
        $this->applyDateRange($query, 'resolvedat', $validated['resolvedfrom'] ?? null, $validated['resolvedto'] ?? null);
        $this->applyDateRange($query, 'closedat', $validated['closedfrom'] ?? null, $validated['closedto'] ?? null);

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
        $priority = Priority::findOrFail($validated['priorityid']);
        $openedAt = now();

        $ticket = Ticket::create([
            ...$validated,
            'ticketrefno' => 'P-'.uniqid(),
            'statusid' => $openStatus->id,
            'createdby' => $request->user()->id,
            'targetresolutionhours' => $priority->targetresolutionhours,
            'resolutiondueat' => $this->calculateDueAt($openedAt, $priority->targetresolutionhours),
        ]);

        $ticket->ticketrefno = 'TCK-'.str_pad($ticket->id, 6, '0', STR_PAD_LEFT);
        $ticket->save();

        TicketStatusHistory::create([
            'ticketid' => $ticket->id,
            'fromstatusid' => null,
            'tostatusid' => $openStatus->id,
            'changedby' => $request->user()->id,
            'notes' => 'Ticket opened',
        ]);

        $this->recordActivity($request, $ticket, 'ticket_created', 'Ticket created');

        return response()->json(
            $this->loadTicket($ticket, $request),
            201
        );
    }

    public function show(Request $request, Ticket $ticket)
    {
        $this->authorize('view', $ticket);

        return $this->loadTicket($ticket, $request);
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

        $changedFields = array_keys($validated);

        if (array_key_exists('priorityid', $validated) && ! $ticket->resolvedat) {
            $priority = Priority::findOrFail($validated['priorityid']);
            $validated['targetresolutionhours'] = $priority->targetresolutionhours;
            $validated['resolutiondueat'] = $this->calculateDueAt(
                $ticket->createdat ?? now(),
                $priority->targetresolutionhours,
            );
            $changedFields[] = 'targetresolutionhours';
            $changedFields[] = 'resolutiondueat';
        }

        $ticket->update($validated);

        if ($changedFields !== []) {
            $this->recordActivity(
                $request,
                $ticket,
                'ticket_updated',
                'Updated fields: '.implode(', ', array_unique($changedFields)),
            );
        }

        return $this->loadTicket($ticket, $request);
    }

    public function destroy(Request $request, Ticket $ticket)
    {
        $this->authorize('delete', $ticket);

        $this->recordActivity($request, $ticket, 'ticket_deleted', 'Ticket deleted');

        $ticket->delete();

        return response()->noContent();
    }

    public function assign(Request $request, Ticket $ticket)
    {
        $this->authorize('assign', $ticket);

        $validated = $request->validate([
            'assignedto' => ['required', 'integer', 'exists:users,id'],
            'notes' => ['nullable', 'string', 'max:255'],
        ]);

        $agent = User::with('role')->findOrFail($validated['assignedto']);
        if (! $this->isManagingUser($agent)) {
            throw ValidationException::withMessages([
                'assignedto' => ['Tickets can only be assigned to an admin, manager, or IT support agent.'],
            ]);
        }

        $assignedFrom = $ticket->assignedto;
        $ticket->update(['assignedto' => $agent->id]);

        AssignmentHistory::create([
            'ticketid' => $ticket->id,
            'assignedfrom' => $assignedFrom,
            'assignedto' => $agent->id,
            'assignedby' => $request->user()->id,
            'notes' => $validated['notes'] ?? null,
        ]);

        $this->recordActivity(
            $request,
            $ticket,
            'ticket_assigned',
            'Assigned to '.$agent->fullname,
        );

        $this->notifyUser($agent->id, $ticket, "You were assigned to ticket {$ticket->ticketrefno}", 'assignment');

        return $this->loadTicket($ticket, $request);
    }

    public function escalate(Request $request, Ticket $ticket)
    {
        $this->authorize('escalate', $ticket);

        $validated = $request->validate([
            'priorityid' => ['nullable', 'integer', 'exists:priorities,id'],
            'assignedto' => ['nullable', 'integer', 'exists:users,id'],
            'notes' => ['required', 'string', 'max:500'],
        ]);

        if (empty($validated['priorityid']) && empty($validated['assignedto'])) {
            throw ValidationException::withMessages([
                'priorityid' => ['Escalation requires a higher priority, a new assignee, or both.'],
            ]);
        }

        $updates = [];
        $summary = [];

        if (! empty($validated['priorityid'])) {
            $currentPriority = $ticket->priority;
            $newPriority = Priority::findOrFail($validated['priorityid']);

            if ($newPriority->level <= $currentPriority->level) {
                throw ValidationException::withMessages([
                    'priorityid' => ['Escalation must move the ticket to a higher priority than its current one.'],
                ]);
            }

            $updates['priorityid'] = $newPriority->id;
            $updates['targetresolutionhours'] = $newPriority->targetresolutionhours;
            $updates['resolutiondueat'] = $this->calculateDueAt(
                $ticket->createdat ?? now(),
                $newPriority->targetresolutionhours,
            );
            $summary[] = "priority {$currentPriority->name} to {$newPriority->name}";
        }

        $agent = null;
        $assignedFrom = null;
        if (! empty($validated['assignedto'])) {
            $agent = User::with('role')->findOrFail($validated['assignedto']);
            if (! $this->isManagingUser($agent)) {
                throw ValidationException::withMessages([
                    'assignedto' => ['Tickets can only be escalated to an admin, manager, or IT support agent.'],
                ]);
            }

            $assignedFrom = $ticket->assignedto;
            $updates['assignedto'] = $agent->id;
            $summary[] = "reassigned to {$agent->fullname}";
        }

        $ticket->update($updates);

        if ($agent) {
            AssignmentHistory::create([
                'ticketid' => $ticket->id,
                'assignedfrom' => $assignedFrom,
                'assignedto' => $agent->id,
                'assignedby' => $request->user()->id,
                'notes' => 'Escalation: '.$validated['notes'],
            ]);
        }

        $this->recordActivity(
            $request,
            $ticket,
            'ticket_escalated',
            'Escalated ('.implode(', ', $summary).'): '.$validated['notes'],
        );

        if ($agent) {
            $this->notifyUser($agent->id, $ticket, "Ticket {$ticket->ticketrefno} was escalated to you", 'escalation');
        } elseif ($ticket->assignedto) {
            $this->notifyUser((int) $ticket->assignedto, $ticket, "Ticket {$ticket->ticketrefno} was escalated", 'escalation');
        }

        return $this->loadTicket($ticket->fresh(), $request);
    }

    public function changeStatus(Request $request, Ticket $ticket)
    {
        $this->authorize('changeStatus', $ticket);

        $validated = $request->validate([
            'statusid' => ['required', 'integer', 'exists:statuses,id'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $fromStatus = $ticket->status;
        $toStatus = Status::findOrFail($validated['statusid']);

        if ((int) $ticket->statusid === (int) $toStatus->id) {
            return $this->loadTicket($ticket, $request);
        }

        $updates = ['statusid' => $toStatus->id];
        if (in_array($toStatus->name, self::FINAL_STATUSES, true)) {
            if (! $ticket->resolvedat) {
                $updates['resolvedat'] = now();
            }
        } elseif ($ticket->resolvedat) {
            $updates['resolvedat'] = null;
        }
        if ($toStatus->name === 'Closed') {
            $updates['closedat'] = now();
        } elseif ($ticket->closedat) {
            $updates['closedat'] = null;
        }

        $ticket->update($updates);

        TicketStatusHistory::create([
            'ticketid' => $ticket->id,
            'fromstatusid' => $fromStatus?->id,
            'tostatusid' => $toStatus->id,
            'changedby' => $request->user()->id,
            'notes' => $validated['notes'] ?? null,
        ]);

        $freshTicket = $ticket->fresh(['status']);
        $details = 'Status changed from '.($fromStatus?->name ?? 'None').' to '.$toStatus->name;
        if ($freshTicket->actualresolutionminutes !== null) {
            $details .= '; actual resolution '.$freshTicket->actualresolutionminutes.' minutes';
        }

        $this->recordActivity($request, $freshTicket, 'status_updated', $details);

        if ((int) $ticket->createdby !== (int) $request->user()->id) {
            $this->notifyUser(
                (int) $ticket->createdby,
                $freshTicket,
                "Ticket {$ticket->ticketrefno} status changed to {$toStatus->name}",
                'status',
            );
        }

        return $this->loadTicket($freshTicket, $request);
    }

    public function comment(Request $request, Ticket $ticket)
    {
        $this->authorize('comment', $ticket);

        $validated = $request->validate([
            'commenttext' => ['required', 'string', 'max:5000'],
            'isinternal' => ['sometimes', 'boolean'],
        ]);

        $isInternal = (bool) ($validated['isinternal'] ?? false);
        if ($isInternal && ! $this->isManagingUser($request->user())) {
            abort(403, 'Only support users can add internal notes.');
        }

        $comment = TicketComment::create([
            'ticketid' => $ticket->id,
            'userid' => $request->user()->id,
            'commenttext' => $validated['commenttext'],
            'isinternal' => $isInternal,
        ]);

        $this->recordActivity(
            $request,
            $ticket,
            $isInternal ? 'internal_note_added' : 'comment_added',
            $isInternal ? 'Internal note added' : 'Comment added',
        );

        if (! $isInternal) {
            $this->notifyOtherSide($request->user(), $ticket, "New comment on ticket {$ticket->ticketrefno}", 'comment');

            $otherSideId = (int) $request->user()->id === (int) $ticket->createdby
                ? $ticket->assignedto
                : $ticket->createdby;

            foreach ($this->parseMentions($ticket, $validated['commenttext'], $request->user(), (int) $otherSideId) as $mentioned) {
                $this->notifyUser(
                    $mentioned->id,
                    $ticket,
                    "{$request->user()->fullname} mentioned you in a comment on {$ticket->ticketrefno}",
                    'mention',
                );
            }
        }

        return response()->json($comment->load('user'), 201);
    }

    /** @return array<User> */
    private function parseMentions(Ticket $ticket, string $commentText, User $actor, int $skipUserId): array
    {
        $candidates = collect([$ticket->creator, $ticket->agent])
            ->filter()
            ->merge(User::whereHas('role', fn ($query) => $query->whereIn('rolename', ['Manager', 'Admin']))->get())
            ->unique('id');

        $mentioned = [];

        foreach ($candidates as $candidate) {
            if ((int) $candidate->id === (int) $actor->id || (int) $candidate->id === $skipUserId) {
                continue;
            }

            if (stripos($commentText, '@'.$candidate->fullname) !== false) {
                $mentioned[$candidate->id] = $candidate;
            }
        }

        return array_values($mentioned);
    }

    public function history(Request $request, Ticket $ticket)
    {
        $this->authorize('viewHistory', $ticket);

        $validated = $request->validate([
            'datefrom' => ['nullable', 'date'],
            'dateto' => ['nullable', 'date', 'after_or_equal:datefrom'],
        ]);

        $dateFrom = $validated['datefrom'] ?? null;
        $dateTo = $validated['dateto'] ?? null;
        $isManagingUser = $this->isManagingUser($request->user());

        $statusHistories = $this->applyDateRange(
            $ticket->statusHistories()
                ->with(['fromStatus', 'toStatus', 'changedBy'])
                ->latest('changedat'),
            'changedat',
            $dateFrom,
            $dateTo,
        )->get();

        $comments = $this->applyDateRange(
            $ticket->comments()
                ->with('user')
                ->when(! $isManagingUser, fn ($query) => $query->where('isinternal', false))
                ->latest('createdat'),
            'createdat',
            $dateFrom,
            $dateTo,
        )->get();

        $assignmentHistories = collect();
        $activityLogs = collect();

        if ($isManagingUser) {
            $assignmentHistories = $this->applyDateRange(
                $ticket->assignmentHistories()
                    ->with(['fromUser', 'toUser', 'byUser'])
                    ->latest('assignedat'),
                'assignedat',
                $dateFrom,
                $dateTo,
            )->get();

            $activityLogs = $this->applyDateRange(
                ActivityLog::query()
                    ->with('user')
                    ->where('entitytype', 'ticket')
                    ->where('entityid', $ticket->id)
                    ->latest('createdat'),
                'createdat',
                $dateFrom,
                $dateTo,
            )->get();
        }

        $timeline = collect()
            ->merge($statusHistories->map(fn ($item) => [
                'type' => 'status',
                'title' => 'Status: '.($item->fromStatus?->name ?? 'None').' to '.$item->toStatus->name,
                'details' => $item->notes,
                'actor' => $item->changedBy?->fullname,
                'createdat' => $item->changedat,
            ]))
            ->merge($comments->map(fn ($item) => [
                'type' => $item->isinternal ? 'internal_note' : 'comment',
                'title' => $item->isinternal ? 'Internal note' : 'Comment',
                'details' => $item->commenttext,
                'actor' => $item->user?->fullname,
                'createdat' => $item->createdat,
            ]))
            ->merge($assignmentHistories->map(fn ($item) => [
                'type' => 'assignment',
                'title' => 'Assigned to '.$item->toUser->fullname,
                'details' => $item->notes,
                'actor' => $item->byUser?->fullname,
                'createdat' => $item->assignedat,
            ]))
            ->sortByDesc('createdat')
            ->values();

        return response()->json([
            'statushistories' => $statusHistories,
            'assignmenthistories' => $assignmentHistories,
            'comments' => $comments,
            'activitylogs' => $activityLogs,
            'timeline' => $timeline,
        ]);
    }

    private function loadTicket(Ticket $ticket, Request $request): Ticket
    {
        $relations = [
            'category',
            'priority',
            'status',
            'creator',
            'agent',
            'comments' => function ($query) use ($request) {
                $query
                    ->when(
                        ! $this->isManagingUser($request->user()),
                        fn ($query) => $query->where('isinternal', false),
                    )
                    ->latest('createdat');
            },
            'comments.user',
            'comments.attachments',
            'comments.attachments.uploader',
            'attachments' => fn ($query) => $query->latest('uploadedat'),
            'attachments.uploader',
            'statusHistories' => fn ($query) => $query->latest('changedat'),
            'statusHistories.fromStatus',
            'statusHistories.toStatus',
            'statusHistories.changedBy',
        ];

        if ($this->isManagingUser($request->user())) {
            $relations = [
                ...$relations,
                'assignmentHistories' => fn ($query) => $query->latest('assignedat'),
                'assignmentHistories.fromUser',
                'assignmentHistories.toUser',
                'assignmentHistories.byUser',
            ];
        }

        return $ticket->load($relations);
    }

    private function calculateDueAt($createdAt, ?int $targetHours)
    {
        if (! $targetHours) {
            return null;
        }

        return $createdAt->copy()->addHours($targetHours);
    }

    private function applyDateRange($query, string $column, ?string $from, ?string $to)
    {
        if ($from) {
            $query->whereDate($column, '>=', $from);
        }

        if ($to) {
            $query->whereDate($column, '<=', $to);
        }

        return $query;
    }

    private function recordActivity(Request $request, Ticket $ticket, string $action, string $details): void
    {
        ActivityLog::create([
            'userid' => $request->user()?->id,
            'action' => $action,
            'entitytype' => 'ticket',
            'entityid' => $ticket->id,
            'details' => str($details)->limit(500)->toString(),
            'ipaddress' => $request->ip(),
        ]);
    }

    private function isManagingUser(User $user): bool
    {
        return in_array($user->role?->rolename, self::MANAGING_ROLES, true);
    }
}
