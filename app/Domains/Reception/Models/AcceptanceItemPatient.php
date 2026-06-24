<?php

namespace App\Domains\Reception\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;

/**
 * @property int $acceptance_item_id
 * @property int $patient_id
 * @property int $order
 * @property int|null $main
 */
class AcceptanceItemPatient extends Pivot
{
    protected $fillable=[
        "order",
        "acceptance_item_id",
        "patient_id"
    ];
}
