<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Notification extends Model
{
    const CREATED_AT = 'createdat';
    const UPDATED_AT = null;

    protected $fillable = ['userid', 'ticketid', 'message', 'type', 'isread'];

    protected function casts(): array
    {
        return ['isread' => 'boolean'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'userid');
    }

    public function ticket(): BelongsTo
    {
        return $this->belongsTo(Ticket::class, 'ticketid');
    }
}
