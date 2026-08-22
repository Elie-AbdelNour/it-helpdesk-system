<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class ReportController extends Controller
{
    private const MANAGING_ROLES = ['Admin', 'Manager', 'IT Support Agent'];

    private const RESOLVED_STATES = ['resolved', 'resolved_within_target', 'resolved_late'];

    public function summary(Request $request)
    {
        $tickets = $this->filteredTickets($request);
        $isManagingUser = $this->isManagingUser($request->user());

        $resolved = $tickets->filter(fn (Ticket $t) => in_array($t->resolutionstate, self::RESOLVED_STATES, true));

        $payload = [
            'totals' => [
                'count' => $tickets->count(),
                'resolved' => $resolved->count(),
                'avgresolutionminutes' => $resolved->isEmpty()
                    ? null
                    : (int) round($resolved->avg(fn (Ticket $t) => $t->actualresolutionminutes)),
                'slacompliance' => $this->slaCompliance($resolved),
            ],
            'monthly' => $this->monthlyBreakdown($tickets),
        ];

        if ($isManagingUser) {
            $payload['byagent'] = $this->byAgent($tickets);
        }

        return response()->json($payload);
    }

    public function export(Request $request)
    {
        $validated = $request->validate([
            'format' => ['nullable', 'in:csv,pdf'],
        ]);

        $tickets = $this->filteredTickets($request)->sortByDesc('createdat')->values();
        $format = $validated['format'] ?? 'csv';

        return $format === 'pdf'
            ? $this->exportPdf($tickets)
            : $this->exportCsv($tickets);
    }

    private function filteredTickets(Request $request)
    {
        $validated = $request->validate([
            'datefrom' => ['nullable', 'date'],
            'dateto' => ['nullable', 'date', 'after_or_equal:datefrom'],
            'categoryid' => ['nullable', 'integer', 'exists:categories,id'],
            'priorityid' => ['nullable', 'integer', 'exists:priorities,id'],
            'statusid' => ['nullable', 'integer', 'exists:statuses,id'],
        ]);

        $query = Ticket::query()->with(['status', 'priority', 'category', 'creator', 'agent']);

        if (! $this->isManagingUser($request->user())) {
            $query->where('createdby', $request->user()->id);
        }

        foreach (['categoryid', 'priorityid', 'statusid'] as $filter) {
            if ($value = $validated[$filter] ?? null) {
                $query->where($filter, $value);
            }
        }

        if ($from = $validated['datefrom'] ?? null) {
            $query->whereDate('createdat', '>=', $from);
        }

        if ($to = $validated['dateto'] ?? null) {
            $query->whereDate('createdat', '<=', $to);
        }

        return $query->get();
    }

    private function monthlyBreakdown($tickets): array
    {
        $months = collect(range(5, 0))->map(fn ($offset) => Carbon::now()->subMonths($offset)->format('Y-m'));

        $createdByMonth = $tickets->groupBy(fn (Ticket $t) => $t->createdat?->format('Y-m'));
        $resolvedByMonth = $tickets
            ->filter(fn (Ticket $t) => $t->resolvedat !== null)
            ->groupBy(fn (Ticket $t) => $t->resolvedat->format('Y-m'));

        return $months->map(fn ($month) => [
            'month' => $month,
            'created' => $createdByMonth->get($month)?->count() ?? 0,
            'resolved' => $resolvedByMonth->get($month)?->count() ?? 0,
        ])->values()->all();
    }

    private function slaCompliance($resolved): ?float
    {
        $withTarget = $resolved->filter(fn (Ticket $t) => $t->targetresolutionhours !== null);

        if ($withTarget->isEmpty()) {
            return null;
        }

        $withinTarget = $withTarget->where('resolutionstate', 'resolved_within_target')->count();

        return round(($withinTarget / $withTarget->count()) * 100, 1);
    }

    private function byAgent($tickets): array
    {
        return $tickets
            ->filter(fn (Ticket $t) => $t->agent !== null)
            ->groupBy(fn (Ticket $t) => $t->agent->id)
            ->map(function ($group) {
                $resolved = $group->filter(fn (Ticket $t) => in_array($t->resolutionstate, self::RESOLVED_STATES, true));

                return [
                    'name' => $group->first()->agent->fullname,
                    'assigned' => $group->count(),
                    'resolved' => $resolved->count(),
                    'avgresolutionminutes' => $resolved->isEmpty()
                        ? null
                        : (int) round($resolved->avg(fn (Ticket $t) => $t->actualresolutionminutes)),
                ];
            })
            ->values()
            ->all();
    }

    private function exportCsv($tickets)
    {
        $filename = 'tickets-report-'.now()->format('Y-m-d').'.csv';

        return response()->streamDownload(function () use ($tickets) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['Ref #', 'Subject', 'Category', 'Priority', 'Status', 'Created By', 'Agent', 'Created', 'Resolved', 'Resolution (minutes)']);

            foreach ($tickets as $ticket) {
                fputcsv($handle, [
                    $ticket->ticketrefno,
                    $ticket->subject,
                    $ticket->category?->name,
                    $ticket->priority?->name,
                    $ticket->status?->name,
                    $ticket->creator?->fullname,
                    $ticket->agent?->fullname,
                    $ticket->createdat?->toDateTimeString(),
                    $ticket->resolvedat?->toDateTimeString(),
                    $ticket->actualresolutionminutes,
                ]);
            }

            fclose($handle);
        }, $filename, ['Content-Type' => 'text/csv']);
    }

    private function exportPdf($tickets)
    {
        $filename = 'tickets-report-'.now()->format('Y-m-d').'.pdf';

        $pdf = Pdf::loadView('reports.tickets-pdf', [
            'tickets' => $tickets,
            'generatedat' => now()->toDayDateTimeString(),
        ])->setPaper('a4', 'landscape');

        return $pdf->download($filename);
    }

    private function isManagingUser(User $user): bool
    {
        return in_array($user->role?->rolename, self::MANAGING_ROLES, true);
    }
}
