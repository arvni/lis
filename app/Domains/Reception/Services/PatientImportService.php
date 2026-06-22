<?php

namespace App\Domains\Reception\Services;

use App\Domains\Laboratory\Enums\TestType;
use App\Domains\Reception\Enums\AcceptanceStatus;
use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Models\AcceptanceItem;
use App\Domains\Reception\Repositories\AcceptanceRepository;
use App\Domains\Reception\Repositories\PatientRepository;
use Illuminate\Support\Facades\DB;

class PatientImportService
{
    public function __construct(
        private PatientRepository $patientRepository,
        private AcceptanceRepository $acceptanceRepository,
    ) {}

    /**
     * Patient field options for the import column-mapping form.
     *
     * @return array<int, array{value: string, label: string}>
     */
    public function patientFields(): array
    {
        return [
            ['value' => 'fullName', 'label' => 'Full Name'],
            ['value' => 'idNo', 'label' => 'ID Number'],
            ['value' => 'nationality', 'label' => 'Nationality'],
            ['value' => 'dateOfBirth', 'label' => 'Date of Birth'],
            ['value' => 'age', 'label' => 'Age'],
            ['value' => 'gender', 'label' => 'Gender'],
            ['value' => 'phone', 'label' => 'Phone'],
            ['value' => 'tribe', 'label' => 'Tribe'],
            ['value' => 'wilayat', 'label' => 'Wilayat'],
            ['value' => 'village', 'label' => 'Village'],
        ];
    }

    /**
     * Map raw spreadsheet rows to patient field arrays, applying age→DOB
     * conversion and the provided default values.
     *
     * @param  array<int, array<int, mixed>>  $sheet
     * @param  array<int|string, string>  $columnMapping
     * @param  array<string, mixed>  $defaultValues
     * @return array<int, array<string, mixed>>
     */
    public function mapRows(array $sheet, bool $hasHeader, array $columnMapping, array $defaultValues): array
    {
        $processed = [];
        $startRow = $hasHeader ? 1 : 0;

        for ($i = $startRow; $i < count($sheet); $i++) {
            $row = $sheet[$i];
            $patientData = [];

            foreach ($columnMapping as $excelColumnIndex => $patientField) {
                if ($patientField && $patientField !== 'skip') {
                    $value = $row[$excelColumnIndex] ?? null;

                    if ($patientField === 'age' && $value !== null) {
                        $patientData['dateOfBirth'] = $this->convertAgeToDateOfBirth($value);
                    } else {
                        $patientData[$patientField] = $value;
                    }
                }
            }

            foreach ($defaultValues as $field => $defaultValue) {
                if ($defaultValue === null || $defaultValue === '') {
                    continue;
                }
                // referrer is stored on the Acceptance, not the Patient
                if ($field === 'referrer') {
                    continue;
                }
                if (! isset($patientData[$field]) || empty($patientData[$field])) {
                    if ($field === 'nationality' && is_array($defaultValue)) {
                        $patientData[$field] = $defaultValue['code'] ?? $defaultValue;
                    } else {
                        $patientData[$field] = $defaultValue;
                    }
                }
            }

            if (! empty($patientData)) {
                $processed[] = $patientData;
            }
        }

        return $processed;
    }

    /**
     * Normalise the selected tests into the persistence shape.
     *
     * @param  array<int, array<string, mixed>>  $tests
     * @return array<int, array<string, mixed>>
     */
    public function buildTests(array $tests): array
    {
        $processed = [];
        foreach ($tests as $test) {
            $processed[] = [
                'test_id' => $test['test']['id'],
                'test_name' => $test['test']['name'],
                'test_type' => $test['type'],
                'method_id' => $test['method']['id'] ?? null,
                'method_name' => $test['method']['name'] ?? null,
                'price' => $test['price'],
                'sample_type_id' => $test['sampleType'] ?? null,
                'panel_sample_types' => $test['panelSampleTypes'] ?? null,
            ];
        }

        return $processed;
    }

    /**
     * Create the imported patients, a single acceptance, and a non-panel
     * acceptance item per patient/test, all within one transaction.
     *
     * @param  array<int, array<string, mixed>>  $patientsData
     * @param  array<int, array<string, mixed>>  $tests
     */
    public function persist(array $patientsData, array $tests, ?int $referrerId): Acceptance
    {
        return DB::transaction(function () use ($patientsData, $tests, $referrerId) {
            $patients = [];
            foreach ($patientsData as $patientData) {
                $patients[] = $this->patientRepository->createPatient($patientData);
            }

            $acceptance = $this->acceptanceRepository->createAcceptance([
                'patient_id' => $patients[0]->id,
                'out_patient' => true,
                'referrer_id' => $referrerId,
                'acceptor_id' => auth()->user()->id,
                'howReport' => ['sendToReferrer' => true],
                'status' => AcceptanceStatus::WAITING_FOR_PAYMENT,
            ]);

            foreach ($patients as $patient) {
                foreach ($tests as $test) {
                    if ($test['test_type'] === TestType::PANEL->value) {
                        continue;
                    }
                    $acceptanceItem = AcceptanceItem::create([
                        'acceptance_id' => $acceptance->id,
                        'method_test_id' => $test['method_id'],
                        'price' => $test['price'],
                        'discount' => 0,
                        'timeline' => [],
                        'customParameters' => [
                            'sampleType' => $test['sample_type_id'],
                            'no_sample' => 1,
                            'samples' => [
                                [
                                    'patients' => [['id' => $patient->id]],
                                    'sampleType' => $test['sample_type_id'],
                                ],
                            ],
                        ],
                        'panel_id' => null,
                        'no_sample' => 1,
                    ]);
                    $acceptanceItem->patients()->sync([$patient->id => ['order' => 0]]);
                }
            }

            return $acceptance;
        });
    }

    /**
     * Convert an age expression to a date of birth. Supports "25" (years),
     * "5 M" (months), and "10 D" (days); returns null when unparseable.
     */
    public function convertAgeToDateOfBirth(mixed $age): ?string
    {
        if (empty($age)) {
            return null;
        }

        $age = trim((string) $age);
        $now = now();

        if (preg_match('/^(\d+)\s*([YMD])$/i', $age, $matches)) {
            $value = (int) $matches[1];
            $unit = strtoupper($matches[2]);

            return match ($unit) {
                'Y' => $now->subYears($value)->format('Y-m-d'),
                'M' => $now->subMonths($value)->format('Y-m-d'),
                'D' => $now->subDays($value)->format('Y-m-d'),
                default => null,
            };
        }

        if (is_numeric($age)) {
            return $now->subYears((int) $age)->format('Y-m-d');
        }

        return null;
    }
}
