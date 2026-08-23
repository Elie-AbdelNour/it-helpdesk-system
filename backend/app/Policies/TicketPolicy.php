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
        if ($user->role->rolename === 'IT Support Agent') {
            return $ticket->assignedto === $user->id;
        }

        return $this->isSupervisor($user) || $ticket->createdby === $user->id;
    }

    public function assign(User $user, Ticket $ticket): bool
    {
        return $this->isManager($user);
    }

    public function escalate(User $user, Ticket $ticket): bool
    {
        return $user->role->rolename === 'IT Support Agent';
    }

    public function changeStatus(User $user, Ticket $ticket): bool
    {
        return $this->isSupervisor($user)
            || ($user->role->rolename === 'IT Support Agent' && $ticket->assignedto === $user->id);
    }

    public function comment(User $user, Ticket $ticket): bool
    {
        return $this->view($user, $ticket);
    }

    public function viewHistory(User $user, Ticket $ticket): bool
    {
        return $this->view($user, $ticket);
    }

    public function delete(User $user, Ticket $ticket): bool
    {
        if ($user->role->rolename === 'Admin') {
            return true;
        }

        if ($ticket->createdby !== $user->id) {
            return false;
        }

        // Once a ticket has been picked up (assigned or moved out of Open),
        // deleting it would cascade away the agent's assignment/status/comment
        // history. Only the untouched, still-Open ticket may be self-deleted.
        return $ticket->assignedto === null
            && $ticket->status->name === 'Open'
            && ! $ticket->assignmentHistories()->exists()
            && ! $ticket->escalations()->exists();
    }

    private function isManager(User $user): bool
    {
        return in_array($user->role->rolename, self::MANAGING_ROLES, true);
    }

    private function isSupervisor(User $user): bool
    {
        return in_array($user->role->rolename, ['Admin', 'Manager'], true);
    }
}
