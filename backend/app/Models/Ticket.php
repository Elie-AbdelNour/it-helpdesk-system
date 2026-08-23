<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Ticket extends Model
{
    const CREATED_AT = 'createdat';

    const UPDATED_AT = 'updatedat';

    protected $fillable = [
        'ticketrefno',
        'subject',
        'description',
        'categoryid',
        'priorityid',
        'statusid',
        'createdby',
        'assignedto',
        'targetresolutionhours',
        'resolutiondueat',
        'resolvedat',
        'closedat',
    ];

    protected $appends = [
        'actualresolutionminutes',
        'elapsedresolutionminutes',
        'resolutionstate',
    ];

    protected function casts(): array
    {
        return [
            'targetresolutionhours' => 'integer',
            'createdat' => 'datetime',
            'updatedat' => 'datetime',
            'resolutiondueat' => 'datetime',
            'resolvedat' => 'datetime',
            'closedat' => 'datetime',
        ];
    }

    public function getActualResolutionMinutesAttribute(): ?int
    {
        if (! $this->createdat || ! $this->resolvedat) {
            return null;
        }

        return (int) $this->createdat->diffInMinutes($this->resolvedat);
    }

    public function getElapsedResolutionMinutesAttribute(): ?int
    {
        if (! $this->createdat) {
            return null;
        }

        return (int) $this->createdat->diffInMinutes($this->resolvedat ?? now());
    }

    public function getResolutionStateAttribute(): string
    {
        if ($this->resolvedat) {
            if (! $this->targetresolutionhours) {
                return 'resolved';
            }

            return $this->actualresolutionminutes <= ($this->targetresolutionhours * 60)
                ? 'resolved_within_target'
                : 'resolved_late';
        }

        if ($this->resolutiondueat && now()->greaterThan($this->resolutiondueat)) {
            return 'overdue';
        }

        return 'open';
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class, 'categoryid');
    }

    public function priority(): BelongsTo
    {
        return $this->belongsTo(Priority::class, 'priorityid');
    }

    public function status(): BelongsTo
    {
        return $this->belongsTo(Status::class, 'statusid');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'createdby');
    }

    public function agent(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assignedto');
    }

    public function comments(): HasMany
    {
        return $this->hasMany(TicketComment::class, 'ticketid');
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(TicketAttachment::class, 'ticketid');
    }

    public function assignmentHistories(): HasMany
    {
        return $this->hasMany(AssignmentHistory::class, 'ticketid');
    }

    public function escalations(): HasMany
    {
        return $this->hasMany(TicketEscalation::class, 'ticketid');
    }

    public function openEscalation(): HasOne
    {
        return $this->hasOne(TicketEscalation::class, 'ticketid')
            ->whereNull('reviewedat')
            ->latest('escalatedat');
    }

    public function statusHistories(): HasMany
    {
        return $this->hasMany(TicketStatusHistory::class, 'ticketid');
    }
}
