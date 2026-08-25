<?php

declare(strict_types=1);

namespace App\Domains\Reception\Requests;

use App\Domains\Billing\Models\DiscountCard;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class AttachDiscountCardRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('update', $this->route('acceptance'))
            && Gate::allows('apply', DiscountCard::class);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            // Either the printed card number or the whole scanned QR URL.
            'code' => 'required|string|max:255',
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'code.required' => 'Scan or type the card code.',
        ];
    }
}
