<?php

namespace App\Domains\User\Models;

use App\Traits\Searchable;
use Spatie\Permission\Models\Role as BaseRole;
/**
 * @property int $id
 * @property string $name
 * @property string $guard_name
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
class Role extends BaseRole
{
    use Searchable;
}
