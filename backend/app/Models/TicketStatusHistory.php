<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TicketStatusHistory extends Model
{
    protected $table = 'ticketstatushistories';

    const CREATED_AT = 'changedat';
    const UPDATED_AT = null;

    protected $fillable = ['ticketid', 'fromstatusid', 'tostatusid', 'changedby', 'notes'];

    protected function casts(): array
    {
        return [
            'changedat' => 'datetime',
        ];
    }

    public function ticket(): BelongsTo
    {
        return $this->belongsTo(Ticket::class, 'ticketid');
    }

    public function fromStatus(): BelongsTo
    {
        return $this->belongsTo(Status::class, 'fromstatusid');
    }

    public function toStatus(): BelongsTo
    {
        return $this->belongsTo(Status::class, 'tostatusid');
    }

    public function changedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'changedby');
    }
}
