<?php

namespace App\Domains\Laboratory\Models;

use App\Domains\Document\Models\Document;
use App\Traits\Searchable;
use Illuminate\Database\Eloquent\Model;

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

    public function tests()
    {
        return $this->hasMany(Test::class);
    }

    public function document()
    {
        return $this->morphOne(Document::class, 'owner');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
