<?php

declare(strict_types=1);

namespace App\Domains\PreOrder\Support;

use App\Domains\PreOrder\Enums\PreOrderActionType;
use App\Domains\PreOrder\Enums\StartMode;
use Illuminate\Validation\Rule;

/**
 * Payload rules for inbox actions. api validates the same shapes before writing the row; the LIS
 * checks again because it never trusts what another service wrote.
 */
final class PreOrderActionRules
{
    /** @return array<string, mixed> */
    public static function for(PreOrderActionType $type): array
    {
        return match ($type) {
            PreOrderActionType::CREATE => [
                'start_mode' => ['required', Rule::enum(StartMode::class)],
                'start_hint' => ['nullable', 'string', Rule::in(['ivf_pgt', 'pregnancy', 'diagnosis', 'carrier', 'other'])],
                'referral_reason' => ['nullable', 'required_if:start_mode,describe', 'string', 'max:5000'],
                'patients' => ['required', 'array', 'min:1', 'max:10'],
                'patients.*.ref' => ['required', 'string', 'max:64', 'distinct'],
                'patients.*.fullName' => ['required', 'string', 'max:255'],
                'patients.*.idNo' => ['nullable', 'string', 'max:64'],
                'patients.*.dateOfBirth' => ['nullable', 'date'],
                'patients.*.gender' => ['nullable', 'string', 'max:16'],
                'patients.*.nationality' => ['nullable', 'string', 'max:64'],
                'patients.*.relationship' => ['nullable', 'string', 'max:32'],
                'main_patient_ref' => ['nullable', 'string', 'max:64'],
                'tests' => ['nullable', 'required_if:start_mode,tests', 'array', 'max:30'],
                'tests.*.test_id' => ['required', 'integer'],
                'tests.*.patient_ref' => ['nullable', 'string', 'max:64'],
                'tests.*.qty' => ['nullable', 'integer', 'min:1', 'max:20'],
                'scope' => ['nullable', 'array'],
                'clinical' => ['nullable', 'array'],
                'submit' => ['nullable', 'boolean'],
            ],
            PreOrderActionType::SUBMIT => [],
            PreOrderActionType::ANSWER_REQUEST => [
                'request' => ['required', 'integer', 'min:1'],
                'answer' => ['required', 'string', 'max:5000'],
            ],
            PreOrderActionType::MESSAGE => [
                'body' => ['required', 'string', 'max:5000'],
            ],
            PreOrderActionType::REQUEST_HOLD, PreOrderActionType::CANCEL => [
                'reason' => ['required', 'string', 'max:64'],
                'comment' => ['nullable', 'string', 'max:2000'],
            ],
            PreOrderActionType::RESUME => [],
            default => [],
        };
    }
}
