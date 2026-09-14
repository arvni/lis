<?php

declare(strict_types=1);

namespace App\Domains\Attendance\Requests;

use Illuminate\Support\Facades\Gate;

class UpdateShiftRequest extends StoreShiftRequest
{
    public function authorize(): bool
    {
        return Gate::allows('update', $this->route('shift'));
    }
}
