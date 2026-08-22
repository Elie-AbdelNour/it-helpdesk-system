<?php

namespace App\Support\Concerns;

use App\Mail\TicketNotificationMail;
use App\Models\Notification;
use App\Models\Setting;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

trait NotifiesUsers
{
    private function notifyOtherSide(User $actor, Ticket $ticket, string $message, string $type): void
    {
        $isActorCreator = (int) $actor->id === (int) $ticket->createdby;

        if ($isActorCreator) {
            if ($ticket->assignedto) {
                $this->notifyUser((int) $ticket->assignedto, $ticket, $message, $type);
            }

            return;
        }

        $this->notifyUser((int) $ticket->createdby, $ticket, $message, $type);
    }

    private function notifyUser(int $userId, ?Ticket $ticket, string $message, string $type): void
    {
        Notification::create([
            'userid' => $userId,
            'ticketid' => $ticket?->id,
            'message' => $message,
            'type' => $type,
        ]);

        $user = User::find($userId);

        if (! $user || ! $user->isactive || ! $this->emailNotificationsEnabled()) {
            return;
        }

        try {
            Mail::to($user->email)->send(new TicketNotificationMail($user, $message, $ticket));
        } catch (\Throwable $e) {
            Log::warning('Failed to send ticket notification email', [
                'userid' => $userId,
                'error' => $e->getMessage(),
            ]);
        }
    }

    private function emailNotificationsEnabled(): bool
    {
        return Setting::value('email_notifications_enabled', '1') === '1';
    }
}
