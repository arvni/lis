<?php

namespace App\Domains\Inventory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WorkflowTemplate extends Model
{
    protected $fillable = ['name', 'description', 'is_active', 'is_default', 'conditions', 'priority'];

    protected $casts = [
        'is_active'  => 'boolean',
        'is_default' => 'boolean',
        'conditions' => 'array',
        'priority'   => 'integer',
    ];

    public function steps(): HasMany
    {
        return $this->hasMany(WorkflowStep::class)->orderBy('sort_order');
    }

    public function purchaseRequests(): HasMany
    {
        return $this->hasMany(PurchaseRequest::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
