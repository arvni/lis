<?php

namespace App\Domains\Referrer\Services;

use App\Domains\Reception\Enums\AcceptanceStatus;
use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Models\AcceptanceItem;
use App\Domains\Referrer\DTOs\ReferrerOrderDTO;
use App\Domains\Referrer\Events\ReferrerOrderCreated;
use App\Domains\Referrer\Models\ReferrerOrder;
use App\Domains\Referrer\Repositories\ReferrerOrderRepository;
use Exception;
use Illuminate\Pagination\LengthAwarePaginator;

class ReferrerOrderService
{
    public function __construct(protected ReferrerOrderRepository $referrerRepository)
    {
    }

    public function listReferrerOrders(array $filters): LengthAwarePaginator
    {
        return $this->referrerRepository->listReferrerOrder($filters);
    }

    public function createReferrerOrder(ReferrerOrderDTO $referrerDTO): ReferrerOrder
    {
        $referrerOrder = $this->referrerRepository->createReferrerOrder($referrerDTO->toArray());
        ReferrerOrderCreated::dispatch($referrerOrder);
        return $referrerOrder;
    }

    public function updateReferrerOrder(ReferrerOrder $referrerOrder, ReferrerOrderDTO $referrerDTO): ReferrerOrder
    {
        return $this->referrerRepository->updateReferrerOrder($referrerOrder, $referrerDTO->toArray());
    }

    public function updateReferrerOrderStatus(ReferrerOrder $referrerOrder, $status): ReferrerOrder
    {
        return $this->referrerRepository->updateReferrerOrder($referrerOrder, ["status" => $status]);
    }


    public function loadShowRequirementLoaded(ReferrerOrder $referrerOrder): ReferrerOrder
    {
        return $referrerOrder->load([
            "ownedDocuments",
            "patient",
            "referrer",
            "acceptance.samples",
        ]);
    }

    /**
     * @throws Exception
     */
    public function deleteReferrerOrder(ReferrerOrder $referrer): void
    {
        if (!$referrer->acceptance()->exists()) {
            $this->referrerRepository->deleteReferrerOrder($referrer);
        } else {
            throw new Exception("ReferrerOrder has associated acceptances or Orders.");
        }
    }

    public function createFromBarcodes(array $barcodes, Acceptance $acceptance, int $collectRequestId): ?ReferrerOrder
    {
        if (!$acceptance->referrer_id) return null;

        $acceptance->loadMissing('patient');
        $patient = $acceptance->patient;
        if (!$patient) return null;

        $itemIds = collect($barcodes)
            ->flatMap(fn($b) => collect($b['items'] ?? [])->pluck('id'))
            ->unique()
            ->values();

        $acceptanceItems = AcceptanceItem::whereIn('id', $itemIds)->with('test')->get();

        $patientData = [
            'server_id'   => $patient->id,
            'fullName'    => $patient->fullName,
            'id_no'       => $patient->idNo,
            'gender'      => $patient->gender,
            'dateOfBirth' => $patient->dateOfBirth?->format('Y-m-d'),
            'is_main'     => true,
        ];

        $itemPatients   = [];
        $itemSamplesMap = [];
        foreach ($barcodes as $barcode) {
            $barcodePatient = $barcode['patient'] ?? null;
            $material       = $barcode['material'] ?? null;
            $sampleData     = [
                'sampleType'     => $barcode['sampleType'] ?? null,
                'collectionDate' => $barcode['collection_date'] ?? null,
                'receivedAt'     => $barcode['received_at'] ?? null,
                'sampleLocation' => $barcode['sampleLocation'] ?? null,
                'sampleId'       => $material['barcode'] ?? null,
                'materialId'     => $material['id'] ?? null,
            ];
            foreach ($barcode['items'] ?? [] as $item) {
                if ($barcodePatient) {
                    $itemPatients[$item['id']][] = [
                        'server_id' => $barcodePatient['id'] ?? null,
                        'fullName'  => $barcodePatient['fullName'] ?? null,
                        'is_main'   => $barcodePatient['id'] === $patient->id,
                    ];
                }
                $itemSamplesMap[$item['id']][] = $sampleData;
            }
        }

        $orderItems = $acceptanceItems->map(fn($item) => [
            'id'       => $item->id,
            'test'     => ['id' => $item->test?->id, 'name' => $item->test?->name, 'code' => $item->test?->code ?? null],
            'patients' => $itemPatients[$item->id] ?? [$patientData],
            'samples'  => $itemSamplesMap[$item->id] ?? [],
        ])->values()->toArray();

        $samples = collect($barcodes)->map(function ($barcode) use ($patient) {
            $material = $barcode['material'] ?? null;
            return [
                'sampleType'     => $barcode['sampleType'] ?? null,
                'collectionDate' => $barcode['collection_date'] ?? null,
                'receivedAt'     => $barcode['received_at'] ?? null,
                'sampleLocation' => $barcode['sampleLocation'] ?? null,
                'patientId'      => $patient->id,
                'itemIds'        => collect($barcode['items'] ?? [])->pluck('id')->values()->toArray(),
                'sampleId'       => $material['barcode'] ?? null,
                'materialId'     => $material['id'] ?? null,
            ];
        })->values()->toArray();

        return $this->createReferrerOrder(new ReferrerOrderDTO(
            referrerId:       $acceptance->referrer_id,
            orderId:          'SC-POOL-' . $acceptance->id . '-' . now()->timestamp,
            orderInformation: ['status' => 'processing', 'patient' => $patientData, 'patients' => [$patientData], 'orderItems' => $orderItems, 'samples' => $samples],
            status:           'processing',
            userId:           auth()->id(),
            patientId:        $patient->id,
            acceptanceId:     $acceptance->id,
            collectRequestId: $collectRequestId,
            needsAddSample:   false,
        ));
    }

    public function createPoolingOrderIfNeeded(array $barcodes, ?Acceptance $acceptance): ?ReferrerOrder
    {
        if (!$acceptance) return null;
        if (!$acceptance->waiting_for_pooling || !$acceptance->referrer_id || !$acceptance->out_patient) return null;

        $alreadyHasPoolingOrder = ReferrerOrder::where('acceptance_id', $acceptance->id)
            ->where('pooling', true)
            ->exists();
        if ($alreadyHasPoolingOrder) return null;

        $poolingItems = AcceptanceItem::where('acceptance_id', $acceptance->id)
            ->where('is_pooling', true)
            ->with('test')
            ->get();
        if ($poolingItems->isEmpty()) return null;

        $acceptance->loadMissing('patient');
        $patient = $acceptance->patient;
        if (!$patient) return null;

        $patientData = [
            'server_id'   => $patient->id,
            'fullName'    => $patient->fullName,
            'id_no'       => $patient->idNo,
            'gender'      => $patient->gender,
            'dateOfBirth' => $patient->dateOfBirth?->format('Y-m-d'),
            'is_main'     => true,
        ];

        $itemSamplesMap = [];
        foreach ($barcodes as $barcode) {
            $material   = $barcode['material'] ?? null;
            $sampleData = [
                'sampleType'     => $barcode['sampleType'] ?? null,
                'collectionDate' => $barcode['collection_date'] ?? null,
                'receivedAt'     => $barcode['received_at'] ?? null,
                'sampleLocation' => $barcode['sampleLocation'] ?? null,
                'sampleId'       => $material['barcode'] ?? null,
                'materialId'     => $material['id'] ?? null,
            ];
            foreach ($barcode['items'] ?? [] as $item) {
                $itemSamplesMap[$item['id']][] = $sampleData;
            }
        }

        $orderItems = $poolingItems->map(fn($item) => [
            'id'       => $item->id,
            'test'     => ['id' => $item->test?->id, 'name' => $item->test?->name, 'code' => $item->test?->code ?? null],
            'patients' => [$patientData],
            'samples'  => $itemSamplesMap[$item->id] ?? [],
        ])->values()->toArray();

        $samples = collect($barcodes)->map(function ($barcode) use ($patient) {
            $material = $barcode['material'] ?? null;
            return [
                'sampleType'     => $barcode['sampleType'] ?? null,
                'collectionDate' => $barcode['collection_date'] ?? null,
                'receivedAt'     => $barcode['received_at'] ?? null,
                'sampleLocation' => $barcode['sampleLocation'] ?? null,
                'patientId'      => $patient->id,
                'itemIds'        => collect($barcode['items'] ?? [])->pluck('id')->values()->toArray(),
                'sampleId'       => $material['barcode'] ?? null,
                'materialId'     => $material['id'] ?? null,
            ];
        })->values()->toArray();

        $order = $this->createReferrerOrder(new ReferrerOrderDTO(
            referrerId:       $acceptance->referrer_id,
            orderId:          'POOL-' . $acceptance->id . '-' . now()->timestamp,
            orderInformation: ['status' => 'processing', 'patient' => $patientData, 'patients' => [$patientData], 'orderItems' => $orderItems, 'samples' => $samples],
            status:           'processing',
            userId:           auth()->id(),
            patientId:        $patient->id,
            acceptanceId:     $acceptance->id,
            needsAddSample:   false,
            pooling:          true,
        ));

        AcceptanceItem::where('acceptance_id', $acceptance->id)
            ->where('is_pooling', true)
            ->update(['is_pooling' => false]);

        return $order;
    }

    public function checkStatus(ReferrerOrder $referrerOrder): void
    {
        $referrerOrder->load("acceptance");
        if ($referrerOrder->acceptance && ($referrerOrder->acceptance?->status == AcceptanceStatus::PROCESSING || $referrerOrder->acceptance?->status == AcceptanceStatus::REPORTED)) {
            $this->referrerRepository->updateReferrerOrder($referrerOrder, ["status" => $referrerOrder->acceptance?->status->value]);
        }
    }
}
