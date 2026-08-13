<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LoginOtp extends Model
{
    protected $table = 'login_otps';

    const CREATED_AT = 'createdat';
    const UPDATED_AT = null;

    protected $fillable = ['userid', 'codehash', 'expiresat', 'usedat'];

    protected function casts(): array
    {
        return [
            'expiresat' => 'datetime',
            'usedat' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'userid');
    }
}
