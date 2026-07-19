<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AssignmentHistory extends Model
{
    protected $table = 'assignmenthistories';

    const CREATED_AT = 'assignedat';
    const UPDATED_AT = null;

    protected $fillable = ['ticketid', 'assignedfrom', 'assignedto', 'assignedby', 'notes'];

    public function ticket(): BelongsTo
    {
        return $this->belongsTo(Ticket::class, 'ticketid');
    }

    public function fromUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assignedfrom');
    }

    public function toUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assignedto');
    }

    public function byUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assignedby');
    }
}
