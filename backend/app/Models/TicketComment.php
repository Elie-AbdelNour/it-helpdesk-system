<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TicketComment extends Model
{
    protected $table = 'ticketcomments';

    const CREATED_AT = 'createdat';
    const UPDATED_AT = null;

    protected $fillable = ['ticketid', 'userid', 'commenttext', 'isinternal'];

    protected function casts(): array
    {
        return ['isinternal' => 'boolean'];
    }

    public function ticket(): BelongsTo
    {
        return $this->belongsTo(Ticket::class, 'ticketid');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'userid');
    }
}
