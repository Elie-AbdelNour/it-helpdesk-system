<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use Illuminate\Http\Request;

class ActivityLogController extends Controller
{
    public function index(Request $request)
    {
        $validated = $request->validate([
            'userid' => ['nullable', 'integer', 'exists:users,id'],
            'action' => ['nullable', 'string', 'max:100'],
            'datefrom' => ['nullable', 'date'],
            'dateto' => ['nullable', 'date', 'after_or_equal:datefrom'],
        ]);

        $query = ActivityLog::query()->with('user');

        if ($userId = $validated['userid'] ?? null) {
            $query->where('userid', $userId);
        }

        if ($action = $validated['action'] ?? null) {
            $query->where('action', $action);
        }

        if ($from = $validated['datefrom'] ?? null) {
            $query->whereDate('createdat', '>=', $from);
        }

        if ($to = $validated['dateto'] ?? null) {
            $query->whereDate('createdat', '<=', $to);
        }

        return $query->latest('createdat')->paginate(25);
    }
}
