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

class ReportTemplate extends Model
{
    use HasFactory, Searchable;

    protected $fillable = [
        "name",
    ];

    public function template(): MorphOne
    {
        return $this->morphOne(Document::class, "owner")->latest();
    }

    public function oldTemplates(): MorphMany
    {
        return $this->morphMany(Document::class, "owner")->whereNot("tag", DocumentTag::LATEST);
    }

    public function tests(): BelongsToMany
    {
        return $this->belongsToMany(Test::class);
    }

    public function parameters(): HasMany
    {
        return $this->hasMany(ReportTemplateParameter::class);
    }

    public function activeParameters(): HasMany
    {
        return $this->hasMany(ReportTemplateParameter::class)->where("active", true);
    }
}
