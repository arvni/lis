<?php

namespace App\Domains\Reception\Services;

use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Models\AcceptanceItem;
use Exception;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Log;

/**
 * Builds the barcode-grouping view for an acceptance: loads the sample-bearing
 * items and folds them into per-(barcodeGroup, patient, sampleType) groups that
 * the barcode-printing UI consumes. Extracted from AcceptanceService
 * (improvement-plan #26); behavior is unchanged — AcceptanceService::listBarcodes
 * delegates here.
 */
class AcceptanceBarcodeService
{
    /** @return array<string, mixed> */
    public function listBarcodes(Acceptance $acceptance): array
    {
        $acceptance->load([
            'acceptanceItems' => function ($query) {
                $query->where('sampleless', false);
                $query->whereRaw("(select count(*) from `samples`
                    inner join `acceptance_item_samples` on `samples`.`id` = `acceptance_item_samples`.`sample_id`
                    where `acceptance_items`.`id` = `acceptance_item_samples`.`acceptance_item_id`
                    and `acceptance_item_samples`.`active` = 1
                ) < IF(
                    (SELECT `tests`.`type` FROM `tests`
                     INNER JOIN `method_tests` ON `method_tests`.`test_id` = `tests`.`id`
                     WHERE `method_tests`.`id` = `acceptance_items`.`method_test_id`) = 'service',
                    0,
                    `acceptance_items`.`no_sample`
                )");
                $query->with(['method.barcodeGroup', 'method.test.sampleTypes', 'test', 'patients']);
            },
            'patient',
            'referrer',
        ]);
        $barcodes = $this->convertAcceptanceItems($acceptance->acceptanceItems);

        return ['barcodes' => $barcodes, 'patient' => $acceptance->patient, 'referrer' => $acceptance->referrer, 'out_patient' => $acceptance->out_patient];
    }

    /** @param  Collection<int, AcceptanceItem>  $acceptanceItems */
    private function convertAcceptanceItems(Collection $acceptanceItems): \Illuminate\Support\Collection
    {
        return $acceptanceItems
            ->flatMap(function ($item) {
                $samples = $item->customParameters['samples'] ?? [];

                if (empty($samples)) {
                    $newModel = $item->replicate();
                    $newModel->id = $item->id;
                    $newModel->created_at = $item->created_at;
                    $newModel->setRelation('patient', $item->patients->first());
                    $newModel->_sampleTypeId = $item->customParameters['sampleType'] ?? null;

                    return collect([$newModel]);
                }

                return collect($samples)->flatMap(function ($sample, $sampleIndex) use ($item) {
                    try {
                        // Per-sample sampleType takes precedence over item-level sampleType
                        $sampleTypeId = $sample['sampleType'] ?? $item->customParameters['sampleType'] ?? null;

                        if (is_array($sample['patients'])) {
                            return collect($sample['patients'])
                                ->map(function ($patientData) use ($item, $sampleTypeId) {
                                    $newModel = $item->replicate();
                                    $newModel->id = $item->id;
                                    $newModel->created_at = $item->created_at;
                                    $patient = $item->patients->where('id', $patientData['id'])->first();
                                    $newModel->setRelation('patient', $patient);
                                    $newModel->_sampleTypeId = $sampleTypeId;

                                    return $newModel;
                                });
                        } else {
                            $newModel = $item->replicate();
                            $newModel->id = $item->id;
                            $newModel->created_at = $item->created_at;
                            $patient = $item->patients->where('id', $sample['id'])->first();
                            $newModel->setRelation('patient', $patient);
                            $newModel->_sampleTypeId = $sampleTypeId;

                            return $newModel;
                        }
                    } catch (Exception $exception) {
                        // Do not dump/leak the sample payload (PHI) to the response — log safe
                        // context and rethrow so the failure is observable, not a silent `dd`.
                        Log::error('Failed to convert acceptance item sample for barcode grouping', [
                            'acceptance_item_id' => $item->id,
                            'sample_index' => $sampleIndex,
                            'exception' => $exception->getMessage(),
                        ]);
                        throw $exception;
                    }
                });
            })
            ->groupBy(function ($item) {
                $barcodeGroupId = $item->method->barcode_group_id ?? 'no_barcode_group';
                $sampleTypeId = $item->_sampleTypeId ?? 'no_sample_type';

                return $barcodeGroupId.'_'.$item->patient->id.'_'.$sampleTypeId;
            })
            ->map(function ($item, $key) {
                $sampleTypeId = $item->first()->_sampleTypeId;
                $sampleTypes = $item->first()->method->test->sampleTypes;

                return [
                    'id' => $key,
                    'barcodeGroup' => $item->first()->method->barcodeGroup,
                    'patient' => $item->first()->patient,
                    'items' => $item,
                    'sampleType' => $sampleTypes->where('id', $sampleTypeId)->first()
                                        ?? $sampleTypes->first(),
                    'collection_date' => now()->format('Y-m-d H:i:s'),
                    'sampleLocation' => 'In Lab',
                ];
            })
            ->values();
    }
}
