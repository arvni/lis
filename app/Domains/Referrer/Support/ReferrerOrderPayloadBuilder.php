<?php

namespace App\Domains\Referrer\Support;

use App\Domains\Reception\Enums\AcceptanceStatus;
use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Models\AcceptanceItem;
use App\Domains\Referrer\Models\ReferrerOrder;

class ReferrerOrderPayloadBuilder
{
    public const GENDER_MAP = [
        'male'   => 1,
        'female' => 0,
    ];

    /**
     * Whether an acceptance item should be sent to the provider: it must
     * map to a real test, be reportable, not flagged sampleless, and have
     * at least one sample.
     */
    public static function isSendableItem(AcceptanceItem $item): bool
    {
        $test = $item->methodTest?->test;
        if (!$test || $item->reportless) {
            return false;
        }

        return !$item->sampleless && $item->samples->isNotEmpty();
    }

    /**
     * Whether the acceptance has any item worth sending to the provider.
     */
    public static function hasSendableItems(Acceptance $acceptance): bool
    {
        return $acceptance->acceptanceItems->contains(
            fn(AcceptanceItem $item) => self::isSendableItem($item)
        );
    }

    public static function build(Acceptance $acceptance, ReferrerOrder $referrerOrder): array
    {
        $mainPatient = $acceptance->patient;

        $allPatients = collect([$mainPatient]);
        foreach ($acceptance->acceptanceItems as $item) {
            foreach ($item->patients as $patient) {
                if (!$allPatients->contains('id', $patient->id)) {
                    $allPatients->push($patient);
                }
            }
        }

        $orderItems = [];
        foreach ($acceptance->acceptanceItems as $item) {
            // Skip reportless / sampleless / not-yet-sampled items — only
            // actually sampled, reportable items go to the provider.
            if (!self::isSendableItem($item)) {
                continue;
            }

            $test = $item->methodTest->test;

            $samples = [];
            foreach ($item->samples as $sample) {
                $samples[] = [
                    'id'                 => $sample->id,
                    'sampleId'           => $sample->barcode,
                    'patientId'          => $sample->patient_id,
                    'collectionDate'     => $sample->collection_date,
                    'collect_request_id' => $sample->collect_request_id,
                    'sample_type_id'     => $sample->sample_type_id,
                    'sampleType'     => [
                        'id'   => $sample->sampleType?->id,
                        'name' => $sample->sampleType?->name ?? 'Unknown',
                    ],
                ];
            }

            $itemPatients = [];
            foreach ($item->patients as $patient) {
                $itemPatients[] = [
                    'id'          => (string) $patient->id,
                    'fullName'    => $patient->fullName,
                    'gender'      => self::GENDER_MAP[$patient->gender] ?? -1,
                    'id_no'       => $patient->idNo,
                    'nationality' => $patient->nationality,
                    'dateOfBirth' => $patient->dateOfBirth,
                    'is_main'     => $patient->id === $mainPatient->id,
                ];
            }

            $groupId = $item->panel_id ?? $item->id;
            $existingKey = collect($orderItems)->search(fn($o) => $o['id'] == $groupId);

            if ($existingKey !== false) {
                $orderItems[$existingKey]['patients'] = collect($orderItems[$existingKey]['patients'])
                    ->merge($itemPatients)->unique('id')->values()->all();
                $orderItems[$existingKey]['samples'] = collect($orderItems[$existingKey]['samples'])
                    ->merge($samples)->unique('id')->values()->all();
            } else {
                $orderItems[] = [
                    'id'      => $groupId,
                    'test_id' => $test->id,
                    'test'    => [
                        'id'   => $test->id,
                        'name' => $test->name,
                        'code' => $test->code ?? '',
                    ],
                    'samples'  => $samples,
                    'patients' => $itemPatients,
                ];
            }
        }

        return [
            'order' => [
                'id'                => $acceptance->id,
                'referrer_order_id' => $referrerOrder->id,
                'status'            => $acceptance->status !== AcceptanceStatus::REPORTED
                    ? AcceptanceStatus::PROCESSING
                    : AcceptanceStatus::REPORTED,
                'orderForms'   => null,
                'consents'     => null,
                'files'        => null,
                'main_patient' => [
                    'id'           => $mainPatient->id,
                    'fullName'     => $mainPatient->fullName,
                    'nationality'  => $mainPatient->nationality ?? 'Unknown',
                    'dateOfBirth'  => $mainPatient->dateOfBirth?->format('Y-m-d'),
                    'gender'       => self::GENDER_MAP[$mainPatient->gender] ?? -1,
                    'reference_id' => $acceptance->referenceCode,
                    'id_no'        => $mainPatient->idNo,
                ],
                'patients'   => $allPatients->map(fn($p) => [
                    'id'          => (string) $p->id,
                    'fullName'    => $p->fullName,
                    'id_no'       => $p->idNo,
                    'nationality' => $p->nationality,
                    'dateOfBirth' => $p->dateOfBirth?->format('Y-m-d'),
                    'gender'      => self::GENDER_MAP[$p->gender] ?? -1,
                ])->toArray(),
                'orderItems' => $orderItems,
                'created_at' => $acceptance->created_at,
                'updated_at' => $acceptance->updated_at,
            ],
            'referrer_id'     => $acceptance->referrer_id,
            'collect_request' => self::buildCollectRequest($referrerOrder),
        ];
    }

    private static function buildCollectRequest(ReferrerOrder $referrerOrder): ?array
    {
        $cr = $referrerOrder->collectRequest;
        if (!$cr) {
            return null;
        }

        return [
            'id'                   => $cr->id,
            'barcode'              => $cr->barcode,
            'preferred_date'       => $cr->preferred_date?->toIso8601String(),
            'status'               => $cr->status?->value ?? $cr->status,
            'logistic_information' => $cr->logistic_information,
            'sample_collector'     => $cr->sampleCollector ? [
                'id'   => $cr->sampleCollector->id,
                'name' => $cr->sampleCollector->name ?? null,
            ] : null,
        ];
    }
}
