<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $notifications = Notification::where('userid', $user->id)
            ->latest('createdat')
            ->limit(50)
            ->get();

        return response()->json([
            'data' => $notifications,
            'unreadcount' => Notification::where('userid', $user->id)->where('isread', false)->count(),
        ]);
    }

    public function markRead(Request $request, Notification $notification)
    {
        abort_unless((int) $notification->userid === (int) $request->user()->id, 403);

        $notification->update(['isread' => true]);

        return response()->json($notification);
    }

    public function markAllRead(Request $request)
    {
        Notification::where('userid', $request->user()->id)
            ->where('isread', false)
            ->update(['isread' => true]);

        return response()->noContent();
    }
}
