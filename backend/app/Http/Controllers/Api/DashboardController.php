<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class DashboardController extends Controller
{
    private const MANAGING_ROLES = ['Admin', 'Manager', 'IT Support Agent'];

    private const RESOLVED_STATES = ['resolved', 'resolved_within_target', 'resolved_late'];

    private const TREND_DAYS = 14;

    public function stats(Request $request)
    {
        $user = $request->user();
        $isManagingUser = $this->isManagingUser($user);

        $query = Ticket::query()->with(['status', 'priority', 'category', 'agent']);
        if (! $isManagingUser) {
            $query->where('createdby', $user->id);
        }

        $tickets = $query->get();

        $resolved = $tickets->filter(fn (Ticket $t) => in_array($t->resolutionstate, self::RESOLVED_STATES, true));

        $payload = [
            'totals' => [
                'open' => $tickets->where('resolutionstate', 'open')->count(),
                'overdue' => $tickets->where('resolutionstate', 'overdue')->count(),
                'resolved' => $resolved->count(),
                'closed' => $tickets->filter(fn (Ticket $t) => $t->status?->name === 'Closed')->count(),
            ],
            'bystatus' => $this->groupCount($tickets, fn (Ticket $t) => $t->status?->name ?? 'Unknown'),
            'bypriority' => $this->groupCount($tickets, fn (Ticket $t) => $t->priority?->name ?? 'Unknown'),
            'bycategory' => $this->groupCount($tickets, fn (Ticket $t) => $t->category?->name ?? 'Unknown'),
            'createdtrend' => $this->createdTrend($tickets),
            'avgresolutionminutes' => $resolved->isEmpty()
                ? null
                : (int) round($resolved->avg(fn (Ticket $t) => $t->actualresolutionminutes)),
            'slacompliance' => $this->slaCompliance($resolved),
        ];

        if ($isManagingUser) {
            $payload['byagent'] = $this->byAgent($tickets);
        }

        return response()->json($payload);
    }

    private function groupCount($tickets, callable $key): array
    {
        return $tickets
            ->groupBy($key)
            ->map(fn ($group, $name) => ['name' => $name, 'count' => $group->count()])
            ->values()
            ->all();
    }

    private function createdTrend($tickets): array
    {
        $byDay = $tickets->groupBy(fn (Ticket $t) => $t->createdat?->toDateString());

        $days = collect(range(self::TREND_DAYS - 1, 0))
            ->map(fn ($offset) => Carbon::today()->subDays($offset)->toDateString());

        return $days
            ->map(fn ($date) => ['date' => $date, 'count' => $byDay->get($date)?->count() ?? 0])
            ->values()
            ->all();
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
            ->map(fn ($group) => [
                'name' => $group->first()->agent->fullname,
                'open' => $group->where('resolutionstate', 'open')->count()
                    + $group->where('resolutionstate', 'overdue')->count(),
                'resolved' => $group->filter(
                    fn (Ticket $t) => in_array($t->resolutionstate, self::RESOLVED_STATES, true)
                )->count(),
            ])
            ->values()
            ->all();
    }

    private function isManagingUser(User $user): bool
    {
        return in_array($user->role?->rolename, self::MANAGING_ROLES, true);
    }
}
