<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Ticket extends Model
{
    const CREATED_AT = 'createdat';
    const UPDATED_AT = 'updatedat';

    protected $fillable = [
        'ticketrefno',
        'subject',
        'description',
        'categoryid',
        'priorityid',
        'statusid',
        'createdby',
        'assignedto',
        'resolvedat',
        'closedat',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class, 'categoryid');
    }

    public function priority(): BelongsTo
    {
        return $this->belongsTo(Priority::class, 'priorityid');
    }

    public function status(): BelongsTo
    {
        return $this->belongsTo(Status::class, 'statusid');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'createdby');
    }

    public function agent(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assignedto');
    }

    public function comments(): HasMany
    {
        return $this->hasMany(TicketComment::class, 'ticketid');
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(TicketAttachment::class, 'ticketid');
    }

    public function assignmentHistories(): HasMany
    {
        return $this->hasMany(AssignmentHistory::class, 'ticketid');
    }
}
