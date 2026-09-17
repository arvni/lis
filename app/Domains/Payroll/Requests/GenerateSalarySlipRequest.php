<?php

declare(strict_types=1);

namespace App\Domains\Payroll\Requests;

use App\Domains\Payroll\Models\SalarySlip;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class GenerateSalarySlipRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('create', SalarySlip::class);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'user_id' => ['required', 'integer', Rule::exists('users', 'id')],
            'month' => ['required', 'date_format:Y-m'],
        ];
    }

    public function personId(): int
    {
        return (int) $this->validated('user_id');
    }

    public function month(): Carbon
    {
        return Carbon::createFromFormat('Y-m', (string) $this->validated('month'))->startOfMonth();
    }
}
