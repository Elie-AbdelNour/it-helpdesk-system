<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ActivityLog extends Model
{
    protected $table = 'activitylogs';

    const CREATED_AT = 'createdat';
    const UPDATED_AT = null;

    protected $fillable = ['userid', 'action', 'entitytype', 'entityid', 'details', 'ipaddress'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'userid');
    }
}
