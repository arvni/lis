<?php

namespace App\Domains\Laboratory\Models;

use App\Domains\Document\Enums\DocumentTag;
use App\Domains\Document\Models\Document;
use App\Traits\Searchable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\Relations\MorphOne;

class ConsentForm extends Model
{
    use HasFactory, Searchable;

    protected $fillable = [
        "name",
        "is_active"
    ];

    protected $casts = [
        "is_active" => "boolean"
    ];

    public function document(): MorphOne
    {
        return $this->morphOne(Document::class, "owner")->latest();
    }
    public function documents(): MorphMany
    {
        return $this->morphMany(Document::class, "owner");
    }


    public function tests(): HasMany
    {
        return $this->hasMany(Test::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
