<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    const CREATED_AT = null;
    const UPDATED_AT = 'updatedat';

    protected $fillable = ['settingkey', 'settingvalue'];

    public static function value(string $key, ?string $default = null): ?string
    {
        return static::where('settingkey', $key)->value('settingvalue') ?? $default;
    }
}
