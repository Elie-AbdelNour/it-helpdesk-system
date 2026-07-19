<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TicketAttachment extends Model
{
    protected $table = 'ticketattachments';

    const CREATED_AT = 'uploadedat';
    const UPDATED_AT = null;

    protected $fillable = ['ticketid', 'uploadedby', 'filename', 'filepath', 'filesize', 'filetype'];

    public function ticket(): BelongsTo
    {
        return $this->belongsTo(Ticket::class, 'ticketid');
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploadedby');
    }
}
