<?php

namespace App\Domains\Reception\Models;

use App\Traits\Searchable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphedByMany;

class Tag extends Model
{
    use Searchable;

    protected $fillable = [
        'name',
        'color',
        'normalized_name',
    ];

    protected static function booted()
    {
        static::saving(function ($tag) {
            if ($tag->isDirty('name')) {
                $tag->normalized_name = static::normalizeName($tag->name);
            }
        });
    }

    protected $searchable = [
        'name',
    ];

    public static function normalizeName(string $name): string
    {
        return strtolower(preg_replace('/\s+/', ' ', trim($name)));
    }

    public static function isValidName(string $name): bool
    {
        return (bool) preg_match('/^[A-Za-z0-9 ]+$/', $name);
    }

    public function acceptances(): MorphedByMany
    {
        return $this->morphedByMany(Acceptance::class, 'taggable');
    }

    public function acceptanceItems(): MorphedByMany
    {
        return $this->morphedByMany(AcceptanceItem::class, 'taggable');
    }
}
