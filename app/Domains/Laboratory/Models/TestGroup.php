<?php

namespace App\Domains\Laboratory\Models;

use App\Traits\Searchable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * @property int $id
 * @property string $name
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
class TestGroup extends Model
{
    use Searchable;
    protected $fillable = [
        "name",
    ];
    protected $searchable = [
      "name"
    ];
    /** @return BelongsToMany<Test, $this> */
    public function tests(): BelongsToMany
    {
        return $this->belongsToMany(Test::class,"test_group_test");
    }
}
