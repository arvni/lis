<?php

declare(strict_types=1);

namespace App\Domains\Attendance\Requests;

use Illuminate\Support\Facades\Gate;

class UpdateLeaveKindRequest extends StoreLeaveKindRequest
{
    public function authorize(): bool
    {
        return Gate::allows('update', $this->route('leave_kind'));
    }
}
