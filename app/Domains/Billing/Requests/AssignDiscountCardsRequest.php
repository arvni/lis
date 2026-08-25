<?php

declare(strict_types=1);

namespace App\Domains\Billing\Requests;

use App\Domains\Billing\Models\DiscountCard;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class AssignDiscountCardsRequest extends FormRequest
{
    /** A range is capped so one slip cannot re-point an entire print run. */
    private const MAX_RANGE = 5000;

    public function authorize(): bool
    {
        return Gate::allows('assign', DiscountCard::class);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'discount_partner_id' => 'required|exists:discount_partners,id',
            'card_ids' => 'nullable|array|max:'.self::MAX_RANGE,
            'card_ids.*' => 'integer|exists:discount_cards,id',
            'discount_card_batch_id' => 'nullable|exists:discount_card_batches,id',
            'serial_from' => 'nullable|integer|min:1',
            'serial_to' => 'nullable|integer|min:1|gte:serial_from',
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'discount_partner_id.required' => 'Choose the partner these cards go to.',
            'serial_to.gte' => 'The end of the range must not come before its start.',
        ];
    }

    /**
     * Exactly one way of choosing cards: a serial range, or a list of cards. Both
     * at once would leave it ambiguous which the operator meant.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $byId = $this->input('card_ids', []) !== [];
            $byRange = $this->filled('discount_card_batch_id')
                || $this->filled('serial_from')
                || $this->filled('serial_to');

            if ($byId && $byRange) {
                $validator->errors()->add('card_ids', 'Choose either a serial range or specific cards, not both.');

                return;
            }
            if (! $byId && ! $byRange) {
                $validator->errors()->add('card_ids', 'Choose the cards to assign, either by serial range or individually.');

                return;
            }

            if (! $byRange) {
                return;
            }

            foreach (['discount_card_batch_id', 'serial_from', 'serial_to'] as $field) {
                if (! $this->filled($field)) {
                    $validator->errors()->add($field, 'A range needs a batch, a start and an end.');
                }
            }

            $span = (int) $this->input('serial_to') - (int) $this->input('serial_from') + 1;
            if ($span > self::MAX_RANGE) {
                $validator->errors()->add('serial_to', 'A single assignment cannot cover more than '.self::MAX_RANGE.' cards.');
            }
        });
    }
}
