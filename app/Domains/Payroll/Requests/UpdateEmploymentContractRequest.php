<?php

declare(strict_types=1);

namespace App\Domains\Payroll\Requests;

use Illuminate\Support\Facades\Gate;

class UpdateEmploymentContractRequest extends StoreEmploymentContractRequest
{
    public function authorize(): bool
    {
        return Gate::allows('update', $this->route('contract'));
    }
}
