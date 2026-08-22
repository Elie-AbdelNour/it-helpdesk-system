<?php

namespace App\Mail;

use App\Models\Ticket;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class TicketNotificationMail extends Mailable
{
    use Queueable, SerializesModels;

    public ?string $ticketUrl;

    public function __construct(public User $user, public string $notificationMessage, public ?Ticket $ticket)
    {
        $this->ticketUrl = $ticket
            ? rtrim(config('app.frontend_url'), '/').'/tickets/'.$ticket->id
            : null;
    }

    public function build()
    {
        return $this
            ->subject($this->ticket ? "Update on ticket {$this->ticket->ticketrefno}" : 'IT Help Desk notification')
            ->view('emails.ticket-notification');
    }
}
