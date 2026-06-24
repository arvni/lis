<?php

namespace App\Domains\Laboratory\Models;

use App\Domains\Document\Models\Document;
use App\Traits\Searchable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphOne;

/**
 * @property int $id
 * @property string $name
 * @property array<array-key, mixed> $form_data
 * @property bool $is_active
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
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
