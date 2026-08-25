<?php

declare(strict_types=1);

namespace App\Domains\Billing\Requests;

use App\Domains\Billing\Exceptions\InvalidCardNumberTemplateException;
use App\Domains\Billing\Models\DiscountCard;
use App\Domains\Billing\Support\CardNumberTemplate;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class IssueDiscountCardsRequest extends FormRequest
{
    /** A single run is capped so an accidental extra zero cannot mint 100k cards. */
    private const MAX_QUANTITY = 5000;

    /** Kept in step with DiscountCardIssuanceService::CAPACITY_HEADROOM. */
    private const CAPACITY_HEADROOM = 10;

    public function authorize(): bool
    {
        return Gate::allows('issue', DiscountCard::class);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            // Optional: a run with no partner is stock, printable and held until
            // someone decides whose it is.
            'discount_partner_id' => 'nullable|exists:discount_partners,id',
            'quantity' => 'required|integer|min:1|max:'.self::MAX_QUANTITY,
            'prefix' => 'nullable|string|max:16|regex:/^[A-Za-z0-9\-]+$/',
            'number_template' => 'nullable|string|max:64',
            'serial_from' => 'nullable|integer|min:1',
            'expires_at' => 'nullable|date|after:today',
            'usage_limit' => 'nullable|integer|min:1',
            'notes' => 'nullable|string|max:1000',
            'activate_immediately' => 'boolean',
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'discount_partner_id.exists' => 'That partner does not exist.',
            'quantity.max' => 'A single batch cannot exceed '.self::MAX_QUANTITY.' cards.',
            'prefix.regex' => 'The prefix may only contain letters, numbers and dashes.',
            'expires_at.after' => 'The expiry date must be in the future.',
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('activate_immediately') && is_string($this->activate_immediately)) {
            $this->merge([
                'activate_immediately' => filter_var($this->activate_immediately, FILTER_VALIDATE_BOOLEAN),
            ]);
        }
    }

    /**
     * The template is compiled here rather than deep in the service, so a bad
     * pattern comes back as a field error on the form instead of a 500.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $template = trim((string) $this->input('number_template', ''));
            if ($template === '') {
                return;
            }

            try {
                $compiled = CardNumberTemplate::compile($template);
            } catch (InvalidCardNumberTemplateException $exception) {
                $validator->errors()->add('number_template', $exception->getMessage());

                return;
            }

            $quantity = (int) $this->input('quantity');
            if ($quantity > 0 && $compiled->capacity() < $quantity * self::CAPACITY_HEADROOM) {
                $validator->errors()->add('number_template', sprintf(
                    'This template can only make about %s distinct numbers, too few to mint %d cards safely. Add another D or L placeholder.',
                    number_format($compiled->capacity()),
                    $quantity
                ));
            }
        });
    }
}
