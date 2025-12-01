<?php

namespace App\Http\Controllers;

use App\Domains\Laboratory\Enums\TestType;
use App\Domains\Reception\Enums\AcceptanceStatus;
use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Models\AcceptanceItem;
use App\Domains\Reception\Models\Patient;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Log;
use Maatwebsite\Excel\Facades\Excel;
use Inertia\Inertia;

class ImportController extends Controller
{
    /**
     * Display the import form.
     */
    public function create()
    {
        $patientFields = $this->getPatientFields();
        return Inertia::render('Import/Create', [
            'patientFields' => $patientFields
        ]);
    }

    /**
     * Get patient fields for mapping
     */
    private function getPatientFields()
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
     * Convert age to date of birth
     * Supports formats: "25" (years), "5 M" (months), "10 D" (days)
     */
    private function convertAgeToDateOfBirth($age)
    {
        if (empty($age)) {
            return null;
        }

        $age = trim($age);
        $now = now();

        // Check if age contains letter suffix (Y, M, D)
        if (preg_match('/^(\d+)\s*([YMD])$/i', $age, $matches)) {
            $value = (int)$matches[1];
            $unit = strtoupper($matches[2]);

            switch ($unit) {
                case 'Y':
                    return $now->subYears($value)->format('Y-m-d');
                case 'M':
                    return $now->subMonths($value)->format('Y-m-d');
                case 'D':
                    return $now->subDays($value)->format('Y-m-d');
            }
        }

        // If just a number, assume it's years
        if (is_numeric($age)) {
            return $now->subYears((int)$age)->format('Y-m-d');
        }

        return null;
    }

    /**
     * Handle the Excel file import.
     */
    public function store(Request $request)
    {
        $request->validate([
            'file' => 'required|mimes:xlsx,xls,csv|max:10240',
            'has_header' => 'boolean',
            'column_mapping' => 'required|array',
            'default_values' => 'nullable|array',
            'tests' => 'nullable|array'
        ]);

        try {
            $file = $request->file('file');
            $hasHeader = $request->input('has_header', true);
            $columnMapping = $request->input('column_mapping', []);
            $defaultValues = $request->input('default_values', []);
            $tests = $request->input('tests', []);

            // Read the Excel file
            $data = Excel::toArray([], $file);

            if (empty($data) || empty($data[0])) {
                return back()->with('error', 'The Excel file is empty');
            }

            $sheet = $data[0];
            $processedData = [];

            // Skip header row if exists
            $startRow = $hasHeader ? 1 : 0;

            // Process each row
            for ($i = $startRow; $i < count($sheet); $i++) {
                $row = $sheet[$i];
                $patientData = [];

                // Map columns to patient fields
                foreach ($columnMapping as $excelColumnIndex => $patientField) {
                    if ($patientField && $patientField !== 'skip') {
                        $value = $row[$excelColumnIndex] ?? null;

                        // Convert age to date of birth
                        if ($patientField === 'age' && $value !== null) {
                            $patientData['dateOfBirth'] = $this->convertAgeToDateOfBirth($value);
                        } else {
                            $patientData[$patientField] = $value;
                        }
                    }
                }

                // Apply default values for fields not present in column mapping or empty
                foreach ($defaultValues as $field => $defaultValue) {
                    // Skip if default value is empty or null
                    if ($defaultValue === null || $defaultValue === '') {
                        continue;
                    }

                    // Skip referrer as it's not a patient field (it's stored on Acceptance)
                    if ($field === 'referrer') {
                        continue;
                    }

                    // Only apply default if field is not already set or is empty
                    if (!isset($patientData[$field]) || empty($patientData[$field])) {
                        // Handle nationality object (convert to code or full object based on your needs)
                        if ($field === 'nationality' && is_array($defaultValue)) {
                            $patientData[$field] = $defaultValue['code'] ?? $defaultValue;
                        } else {
                            $patientData[$field] = $defaultValue;
                        }
                    }
                }

                if (!empty($patientData)) {
                    $processedData[] = $patientData;
                }
            }

            // Get referrer info if set (for later use when creating acceptances)
            $referrerId = isset($defaultValues['referrer']['id']) ? $defaultValues['referrer']['id'] : null;

            // Process tests data
            $processedTests = [];
            foreach ($tests as $test) {
                $processedTests[] = [
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
            $acceptance = null;
            try {
                DB::transaction(function () use ($processedData, $processedTests, $referrerId) {
                    $patients = [];
                    foreach ($processedData as $patientData) {
                        $patients[] = Patient::create([...$patientData, "registrar_id" => auth()->user()->id]);
                    }

                    $acceptance = Acceptance::create([
                        "patient_id" => $patients[0]->id,
                        "out_patient" => true,
                        "referrer_id" => $referrerId,
                        "acceptor_id" => auth()->user()->id,
                        "howReport" => [
                            "sendToReferrer" => true
                        ],
                        "status" => AcceptanceStatus::WAITING_FOR_PAYMENT,
                    ]);

                    foreach ($patients as $patient) {
                        foreach ($processedTests as $test) {
                            if ($test["test_type"] !== TestType::PANEL->value) {
                                $acceptanceItem = AcceptanceItem::create([
                                    'acceptance_id' => $acceptance->id,
                                    'method_test_id' => $test['method_id'],
                                    'price' => $test['price'],
                                    'discount' => 0,
                                    'timeline' => [],
                                    'customParameters' => [
                                        "sampleType" => $test['sample_type_id'],
                                        "no_sample" => 1,
                                        "samples" => [
                                            [
                                                "patients" => [
                                                    [
                                                        "id" => $patient->id,
                                                    ]
                                                ],
                                                "sampleType" => $test['sample_type_id'],
                                            ]
                                        ],
                                    ],
                                    'panel_id' => null,
                                    'no_sample' => 1,
                                ]);
                                $acceptanceItem->patients()->sync([$patient->id => ["order" => 0]]);
                            }
                        }
                    }
                });

                return response()->redirectTo(route("acceptances.index"));
            } catch (Exception $e) {
                // Error handling
                Log::error('Transaction failed: ' . $e->getMessage());
                return response()->json(['error' => $e->getMessage()], 500);
            }
        } catch (Exception $e) {
            return back()->with('error', 'Error importing file: ' . $e->getMessage());
        }
    }
}
