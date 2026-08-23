<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TicketEscalation extends Model
{
    protected $table = 'ticketescalations';

    const CREATED_AT = 'escalatedat';

    const UPDATED_AT = null;

    protected $fillable = [
        'ticketid',
        'escalatedby',
        'reason',
        'reviewedby',
        'reviewedat',
        'assignedto',
    ];

    protected function casts(): array
    {
        return [
            'escalatedat' => 'datetime',
            'reviewedat' => 'datetime',
        ];
    }

    public function ticket(): BelongsTo
    {
        return $this->belongsTo(Ticket::class, 'ticketid');
    }

    public function escalatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'escalatedby');
    }

    public function reviewedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewedby');
    }

    public function assignedAgent(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assignedto');
    }
}
