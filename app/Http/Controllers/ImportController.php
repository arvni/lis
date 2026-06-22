<?php

namespace App\Http\Controllers;

use App\Domains\Reception\Services\PatientImportService;
use Exception;
use Illuminate\Http\Request;
use Log;
use Maatwebsite\Excel\Facades\Excel;
use Inertia\Inertia;

class ImportController extends Controller
{
    public function __construct(private PatientImportService $importService) {}

    /**
     * Display the import form.
     */
    public function create()
    {
        return Inertia::render('Import/Create', [
            'patientFields' => $this->importService->patientFields(),
        ]);
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
            $hasHeader      = $request->boolean('has_header', true);
            $columnMapping  = $request->input('column_mapping', []);
            $defaultValues  = $request->input('default_values', []);
            $tests          = $request->input('tests', []);

            // Read the Excel file
            $data = Excel::toArray([], $request->file('file'));

            if (empty($data) || empty($data[0])) {
                return back()->with('error', 'The Excel file is empty');
            }

            $processedData  = $this->importService->mapRows($data[0], $hasHeader, $columnMapping, $defaultValues);
            $processedTests = $this->importService->buildTests($tests);
            $referrerId     = $defaultValues['referrer']['id'] ?? null;

            try {
                $this->importService->persist($processedData, $processedTests, $referrerId);

                return response()->redirectTo(route("acceptances.index"));
            } catch (Exception $e) {
                Log::error('Transaction failed: ' . $e->getMessage());
                return response()->json(['error' => $e->getMessage()], 500);
            }
        } catch (Exception $e) {
            return back()->with('error', 'Error importing file: ' . $e->getMessage());
        }
    }
}
