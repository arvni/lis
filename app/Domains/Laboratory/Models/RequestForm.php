<?php

namespace App\Domains\Laboratory\Models;

use App\Domains\Document\Models\Document;
use App\Traits\Searchable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphOne;

class RequestForm extends Model
{
    use Searchable;
    protected $searchable = [
        "name"
    ];

    protected $fillable = [
        "name",
        "file",
        "form_data",
        "is_active"
    ];

    protected $casts = [
        "form_data" => "json",
        "is_active" => "boolean"
    ];

    /** @return HasMany<Test, $this> */
    public function tests(): HasMany
    {
        return $this->hasMany(Test::class);
    }

    /** @return MorphOne<Document, $this> */
    public function document(): MorphOne
    {
        return $this->morphOne(Document::class, 'owner');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
