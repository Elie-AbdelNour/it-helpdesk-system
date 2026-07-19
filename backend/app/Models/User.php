<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, Notifiable;

    const CREATED_AT = 'createdat';
    const UPDATED_AT = 'updatedat';

    protected $fillable = [
        'roleid',
        'fullname',
        'email',
        'passwordhash',
        'phone',
        'isactive',
    ];

    protected $hidden = [
        'passwordhash',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'isactive' => 'boolean',
            'lastloginat' => 'datetime',
            'passwordhash' => 'hashed',
        ];
    }

    public function getAuthPassword(): string
    {
        return $this->passwordhash;
    }

    public function getAuthPasswordName(): string
    {
        return 'passwordhash';
    }

    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class, 'roleid');
    }
}
