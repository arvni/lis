<?php

declare(strict_types=1);

namespace App\Domains\Payroll\Requests;

use Illuminate\Support\Facades\Gate;

class UpdatePayrollItemTypeRequest extends StorePayrollItemTypeRequest
{
    public function authorize(): bool
    {
        return Gate::allows('update', $this->route('item_type'));
    }
}
