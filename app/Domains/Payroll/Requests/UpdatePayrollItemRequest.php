<?php

declare(strict_types=1);

namespace App\Domains\Payroll\Requests;

use Illuminate\Support\Facades\Gate;

class UpdatePayrollItemRequest extends StorePayrollItemRequest
{
    public function authorize(): bool
    {
        return Gate::allows('update', $this->route('staff_allowance'));
    }
}
