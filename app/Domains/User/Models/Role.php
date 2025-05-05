<?php

namespace App\Domains\User\Models;

use App\Traits\Searchable;
use Spatie\Permission\Models\Role as BaseRole;
class Role extends BaseRole
{
    use Searchable;
}
