<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class KbArticle extends Model
{
    protected $table = 'kbarticles';

    const CREATED_AT = 'createdat';
    const UPDATED_AT = 'updatedat';

    protected $fillable = ['categoryid', 'createdby', 'title', 'content', 'status'];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class, 'categoryid');
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'createdby');
    }
}
