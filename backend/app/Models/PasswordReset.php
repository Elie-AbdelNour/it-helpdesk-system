<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PasswordReset extends Model
{
    protected $table = 'passwordresets';

    const CREATED_AT = 'createdat';
    const UPDATED_AT = null;

    protected $fillable = ['userid', 'tokenhash', 'expiresat', 'usedat'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'userid');
    }
}
