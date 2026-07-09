<?php

namespace App\Domains\Reception\Services;

use App\Domains\Reception\Models\Report;
use Carbon\Carbon;
use DNS1D;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use InvalidArgumentException;
use RuntimeException;

/**
 * Builds the flat, placeholder-keyed data arrays that feed the Word/PDF report
 * templates (patient/sample/signer/referrer/parameter blocks), plus the
 * frontend document-file shape. Extracted from ReportService
 * (improvement-plan #26) so the report lifecycle service stays focused on
 * create/approve/publish while this owns the template data shaping. Behavior is
 * unchanged — ReportService delegates its data-shaping methods here.
 */
class ReportDataService
{
    /**
     * Format document files for frontend display
     *
     * @return Collection
     */
    public function formatDocumentFiles(Collection $documents)
    {
        return $documents->map(function ($item) {
            return [
                'id' => $item['hash'],
                'originalName' => $item['originalName'],
                'tag' => $item['tag'],
                'created_at' => $item['created_at'],
            ];
        });
    }

    /**
     * Load necessary relationships for report data generation
     */
    public function loadReportRelationships(Report $report): Report
    {
        return $report->load([
            'acceptanceItem.patients',
            'acceptanceItem.activeSamples.sampleType',
            'acceptanceItem.test',
            'signers',
            'acceptanceItem.acceptance.referrer',
            'parameters.parameter',
        ]);
    }

    /**
     * Get all data needed for report generation
     */
    public function getReportData(Report $report): array
    {
        if (! $report->exists) {
            throw new InvalidArgumentException('Report must be a persisted model');
        }

        $report = $this->loadReportRelationships($report);

        // Check if required relationships are loaded
        if (! $report->acceptanceItem || ! $report->acceptanceItem->activeSamples) {
            throw new RuntimeException('Required report relationships not loaded');
        }

        $patientData = $this->preparePatientData($report->acceptanceItem->patients);
        $sampleData = $this->getSampleData($report->acceptanceItem->activeSamples);
        $signers = $this->prepareSigners($report->signers);
        if (count($report->parameters));
        $parametersData = $this->prepareParametersData($report->parameters);
        $referrer = [];
        if ($report->acceptanceItem->acceptance->referrer) {
            $referrer = $this->prepareReferrer($report->acceptanceItem->acceptance->referrer);
        }

        $other = [
            'test' => $report->acceptanceItem->test->name,
            'report_approved_at' => $report->approved_at,
        ];

        return Arr::undot(array_merge(
            Arr::dot($patientData),
            Arr::dot($signers),
            Arr::dot($sampleData),
            Arr::dot($other),
            Arr::dot($referrer),
            Arr::dot($parametersData)
        ));
    }

    /**
     * Prepare patient data for report
     */
    public function preparePatientData(?Collection $patients): array
    {
        if (! $patients || $patients->isEmpty()) {
            return ['patient_0_full_name' => 'No patient data available'];
        }

        $output = [];
        foreach ($patients as $key => $patient) {
            $output["patient_{$key}_full_name"] = $patient->fullName ?? 'N/A';
            $output["patient_{$key}_no_id"] = $patient->idNo ?? 'N/A';
            $output["patient_{$key}_gender"] = $patient->gender ?? 'N/A';
            $output["patient_{$key}_date_of_birth"] = filled($patient->dateOfBirth)
                ? Carbon::parse($patient->dateOfBirth)->format('d M Y')
                : 'N/A';
            $output["patient_{$key}_nationality"] = $patient->nationality ?? 'N/A';
            $output["patient_{$key}_age"] = $patient->age ?? 'N/A';
        }

        return $output;
    }

    /**
     * Get sample data for report
     */
    public function getSampleData(iterable $samples): array
    {
        $data = ['images' => ['logo' => url('/images/logo.png')]];

        foreach ($samples as $key => $sample) {
            $sample->loadAggregate('sampleType', 'name');

            $barcodeValue = strtoupper($sample->barcode);
            $barcodePath = storage_path('app/barcodes/');
            if (! file_exists($barcodePath)) {
                mkdir($barcodePath, 0755, true);
            }
            if ($key == 0) {

                $data['barcode'] = $barcodeValue;
                $data['sample_created_at'] = Carbon::parse($sample->created_at, 'Asia/Muscat')->format('d M Y');
                $data['sample_collection_date'] = Carbon::parse($sample->collection_date, 'Asia/Muscat')->format('d M Y');
                $data['sample_type_name'] = $sample->sample_type_name ?? 'N/A';
                $data['images'] = [
                    ...$data['images'],
                    'barcodeImg' => $barcodeValue ? DNS1D::getBarcodePNGPath($barcodeValue, 'C128', 1, 30) : null,
                ];
            } else {
                $data["barcode_{$key}"] = $barcodeValue;
                $data["sample_{$key}_created_at"] = Carbon::parse($sample->created_at, 'Asia/Muscat')->format('d M Y');
                $data["sample_{$key}_collection_date"] = Carbon::parse($sample->collection_date, 'Asia/Muscat')->format('d M Y');
                $data["sample_{$key}_type_name"] = $sample->sample_type_name ?? 'N/A';
                $data['images'] = [
                    ...$data['images'],
                    "barcodeImg_{$key}" => $barcodeValue ? DNS1D::getBarcodePNGPath($barcodeValue, 'C128', 1, 30) : null,
                ];
            }
        }

        return $data;
    }

    /**
     * Prepare signers data for report
     */
    public function prepareSigners(?Collection $signers): array
    {
        $output = ['images' => []];

        if (! $signers || $signers->isEmpty()) {
            return $output;
        }

        foreach ($signers as $signer) {
            if (! $signer) {
                continue;
            }

            $output["signer_{$signer->row}_name"] = $signer->name ?? 'N/A';
            $output["signer_{$signer->row}_title"] = $signer->title ?? 'N/A';

            if (! empty($signer->signature)) {
                $output['images']["signer_{$signer->row}_signature"] = url($signer->signature);
            }

            if (! empty($signer->stamp)) {
                $output['images']["signer_{$signer->row}_stamp"] = url($signer->stamp);
            }
        }

        return $output;
    }

    public function prepareReferrer($referrer): array
    {
        return [
            'referrer_name' => $referrer->billingInfo['name'] ?? $referrer->fullName,
            'address' => $referrer->billingInfo['address'] ?? 'N/A',
            'vatIn' => $referrer->billingInfo['vatIn'] ?? 'N/A',
            'phone' => $referrer->billingInfo['phone'] ?? $referrer->phoneNo,
            'email' => $referrer->billingInfo['email'] ?? $referrer->email,
            'city' => $referrer->billingInfo['city'] ?? 'N/A',
            'country' => $referrer->billingInfo['country'] ?? 'N/A',
        ];
    }

    private function prepareParametersData(iterable $parameters): array
    {
        $output = [];
        foreach ($parameters as $parameter) {
            if ($parameter->parameter->type == 'image') {
                $output['images'][$parameter->parameter->element] = $parameter->value;
            } else {
                $output[$parameter->parameter->element] = $parameter->value;
            }
        }

        return $output;
    }
}
