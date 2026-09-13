<?php

declare(strict_types=1);

namespace App\Domains\Reception\Models;

use App\Domains\Laboratory\Models\Test;
use App\Domains\User\Models\Role;
use App\Domains\User\Models\User;
use App\Traits\Searchable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

/**
 * A reminder setting: every day, open acceptance items of the attached tests with
 * `days_left` working days of TAT or fewer notify the attached users and roles.
 *
 * @property int $id
 * @property string $name
 * @property int $days_left
 * @property bool $active
 * @property Carbon|null $last_run_on
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property Carbon|null $deleted_at
 */
class TatAlertRule extends Model
{
    use Searchable, SoftDeletes;

    protected $fillable = [
        'name',
        'days_left',
        'active',
    ];

    protected $casts = [
        'days_left' => 'integer',
        'active' => 'boolean',
        'last_run_on' => 'date:Y-m-d',
    ];

    /** @var list<string> */
    protected $searchable = [
        'name',
    ];

    /** @return BelongsToMany<Test, $this> */
    public function tests(): BelongsToMany
    {
        return $this->belongsToMany(Test::class, 'tat_alert_rule_test')->withTimestamps();
    }

    /** @return BelongsToMany<User, $this> */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'tat_alert_rule_user')->withTimestamps();
    }

    /** @return BelongsToMany<Role, $this> */
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'tat_alert_rule_role')->withTimestamps();
    }
}
