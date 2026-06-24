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
use Illuminate\Database\Eloquent\Builder;

/**
 * @property int $id
 * @property string $name
 * @property bool $is_active
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
class Instruction extends Model
{
    use HasFactory, Searchable;

    protected $fillable = [
        "name",
        "is_active"
    ];

    protected $casts = [
        "is_active" => "boolean"
    ];

    /** @return MorphOne<Document, $this> */
    public function document(): MorphOne
    {
        return $this->morphOne(Document::class, "owner")->latest();
    }
    /** @return MorphMany<Document, $this> */
    public function documents(): MorphMany
    {
        return $this->morphMany(Document::class, "owner");
    }


    /** @return HasMany<Test, $this> */
    public function tests(): HasMany
    {
        return $this->hasMany(Test::class);
    }

    /**
     * @param  Builder<Instruction>  $query
     * @return Builder<Instruction>
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }
}
