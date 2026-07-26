<?php

namespace App\Policies;

use App\Models\Ticket;
use App\Models\User;

class TicketPolicy
{
    private const MANAGING_ROLES = ['Admin', 'Manager', 'IT Support Agent'];

    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Ticket $ticket): bool
    {
        return $this->isManager($user) || $ticket->createdby === $user->id;
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, Ticket $ticket): bool
    {
        return $this->isManager($user) || $ticket->createdby === $user->id;
    }

    public function delete(User $user, Ticket $ticket): bool
    {
        return $user->role->rolename === 'Admin' || $ticket->createdby === $user->id;
    }

    private function isManager(User $user): bool
    {
        return in_array($user->role->rolename, self::MANAGING_ROLES, true);
    }
}
