<?php

namespace App\Domains\Reception\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;

class AcceptanceItemPatient extends Pivot
{
    protected $fillable=[
        "order",
        "acceptance_item_id",
        "patient_id"
    ];
}
