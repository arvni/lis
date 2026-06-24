<?php

namespace App\Domains\Setting\Models;

use App\Traits\Searchable;
use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property string $title
 * @property string $key
 * @property string $class
 * @property array<array-key, mixed> $value
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
class Setting extends Model
{
    use Searchable;

    protected $fillable = [
        'title',
        'key',
        'class',
        'value',
    ];

    protected $casts = [
        'value' => 'json',
    ];

    public function toArray(): array
    {
        $array = parent::toArray();
        if (($array['value']['type'] ?? null) === 'password') {
            $array['value']['value'] = '';
        }
        return $array;
    }
}
