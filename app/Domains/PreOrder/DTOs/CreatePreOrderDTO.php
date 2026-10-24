<?php

declare(strict_types=1);

namespace App\Domains\PreOrder\DTOs;

use App\Domains\PreOrder\Enums\StartMode;

/** A new pre-order as the center sent it, already validated by PreOrderActionRules. */
final readonly class CreatePreOrderDTO
{
    /**
     * @param  list<array<string, mixed>>  $patients
     * @param  list<array{test_id: int, patient_ref?: string|null, qty?: int|null}>  $tests
     * @param  array<string, mixed>|null  $scope
     * @param  array<string, mixed>|null  $clinical
     */
    public function __construct(
        public StartMode $startMode,
        public array $patients,
        public ?string $mainPatientRef,
        public array $tests = [],
        public ?string $startHint = null,
        public ?string $referralReason = null,
        public ?array $scope = null,
        public ?array $clinical = null,
    ) {}

    /** @param  array<string, mixed>  $data */
    public static function fromArray(array $data): self
    {
        return new self(
            startMode: StartMode::from($data['start_mode']),
            patients: array_values($data['patients']),
            mainPatientRef: $data['main_patient_ref'] ?? ($data['patients'][0]['ref'] ?? null),
            tests: array_map(fn (array $t) => [
                'test_id' => (int) $t['test_id'],
                'patient_ref' => $t['patient_ref'] ?? null,
                'qty' => isset($t['qty']) ? (int) $t['qty'] : null,
            ], array_values($data['tests'] ?? [])),
            startHint: $data['start_hint'] ?? null,
            referralReason: $data['referral_reason'] ?? null,
            scope: $data['scope'] ?? null,
            clinical: $data['clinical'] ?? null,
        );
    }
}
