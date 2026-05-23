<?php

namespace App\Domains\Referrer\Services;

use App\Domains\Reception\Enums\AcceptanceStatus;
use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Models\AcceptanceItem;
use App\Domains\Referrer\DTOs\ReferrerOrderDTO;
use App\Domains\Referrer\Events\ReferrerOrderCreated;
use App\Domains\Referrer\Events\ReferrerOrderUpdated;
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
        if ((string) $referrerOrder->status === (string) $status) {
            return $referrerOrder;
        }

        $updated = $this->referrerRepository->updateReferrerOrder($referrerOrder, ["status" => $status]);
        ReferrerOrderUpdated::dispatch($updated);
        return $updated;
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

    /**
     * Create or update the non-pooling ReferrerOrder for an acceptance based on the submitted barcodes.
     *
     * Rules:
     *  - If a collect_request_id is provided AND no existing RO on this acceptance shares it → create new.
     *  - Otherwise → update the most recent non-pooling RO (or create one if none exists yet, e.g. inpatient first sample).
     */
    public function createOrUpdateFromBarcodes(array $barcodes, Acceptance $acceptance, ?int $collectRequestId): ?ReferrerOrder
    {
        if (!$acceptance->referrer_id) return null;

        $acceptance->loadMissing('patient');
        $patient = $acceptance->patient;
        if (!$patient) return null;

        $itemIds = collect($barcodes)
            ->flatMap(fn($b) => collect($b['items'] ?? [])->pluck('id'))
            ->unique()
            ->values();

        if ($itemIds->isEmpty()) return null;

        $acceptanceItems = AcceptanceItem::whereIn('id', $itemIds)
            ->with(['test', 'panelTest'])
            ->get();

        $patientData = [
            'server_id'   => $patient->id,
            'fullName'    => $patient->fullName,
            'id_no'       => $patient->idNo,
            'gender'      => $patient->gender,
            'dateOfBirth' => $patient->dateOfBirth?->format('Y-m-d'),
            'is_main'     => true,
        ];

        [$itemPatients, $itemSamplesMap, $samples] = $this->buildBarcodeMaps($barcodes, $patient);

        $orderItems = $this->buildGroupedOrderItems($acceptanceItems, $itemPatients, $itemSamplesMap, $patientData);

        $orderInformation = [
            'status'     => 'processing',
            'patient'    => $patientData,
            'patients'   => [$patientData],
            'orderItems' => $orderItems,
            'samples'    => $samples,
        ];

        $existing = $this->findExistingNonPoolingOrder($acceptance, $collectRequestId);

        if ($collectRequestId && (!$existing || $existing->collect_request_id !== $collectRequestId)) {
            return $this->createReferrerOrder(new ReferrerOrderDTO(
                referrerId:       $acceptance->referrer_id,
                orderId:          'SC-POOL-' . $acceptance->id . '-' . now()->timestamp,
                orderInformation: $orderInformation,
                status:           'processing',
                userId:           auth()->id(),
                patientId:        $patient->id,
                acceptanceId:     $acceptance->id,
                collectRequestId: $collectRequestId,
                needsAddSample:   false,
            ));
        }

        if (!$existing) {
            return $this->createReferrerOrder(new ReferrerOrderDTO(
                referrerId:       $acceptance->referrer_id,
                orderId:          'SC-IN-' . $acceptance->id . '-' . now()->timestamp,
                orderInformation: $orderInformation,
                status:           'processing',
                userId:           auth()->id(),
                patientId:        $patient->id,
                acceptanceId:     $acceptance->id,
                collectRequestId: null,
                needsAddSample:   false,
            ));
        }

        $merged = $this->mergeOrderInformation($existing->orderInformation ?? [], $orderInformation);

        $this->referrerRepository->updateReferrerOrder($existing, [
            'orderInformation' => $merged,
            'needs_add_sample' => false,
        ]);

        ReferrerOrderUpdated::dispatch($existing->fresh());

        return $existing;
    }

    public function createPoolingOrderIfNeeded(array $barcodes, ?Acceptance $acceptance): ?ReferrerOrder
    {
        if (!$acceptance) return null;
        if (!$acceptance->waiting_for_pooling || !$acceptance->referrer_id) return null;

        $alreadyHasPoolingOrder = ReferrerOrder::where('acceptance_id', $acceptance->id)
            ->where('pooling', true)
            ->exists();
        if ($alreadyHasPoolingOrder) return null;

        $poolingItems = AcceptanceItem::where('acceptance_id', $acceptance->id)
            ->where('is_pooling', true)
            ->with(['test', 'panelTest'])
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

        [$itemPatientsUnused, $itemSamplesMap, $samples] = $this->buildBarcodeMaps($barcodes, $patient);
        unset($itemPatientsUnused);

        $orderItems = $this->buildGroupedOrderItems($poolingItems, [], $itemSamplesMap, $patientData);

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

    /**
     * Re-sync every ReferrerOrder linked to this acceptance with the provider — used after acceptance items change
     * (added/removed/edited) so the provider sees the current test composition. The webhook payload is rebuilt
     * from the live Acceptance, so we only need to dispatch the event.
     */
    public function syncReferrerOrdersForAcceptance(Acceptance $acceptance): void
    {
        if (!$acceptance->referrer_id) return;

        $acceptance->load('referrerOrders');
        foreach ($acceptance->referrerOrders as $referrerOrder) {
            ReferrerOrderUpdated::dispatch($referrerOrder);
        }
    }

    /**
     * Reconcile an acceptance with its referrer orders.
     *
     * If one or more ROs exist → dispatch ReferrerOrderUpdated for each (provider receives a refresh).
     * If none exist → build orderInformation from the acceptance's items + samples and create a new RO.
     *
     * Returns ['action' => 'updated'|'created'|'skipped', 'count' => int].
     */
    public function syncOrCreateForAcceptance(Acceptance $acceptance): array
    {
        if (!$acceptance->referrer_id) {
            return ['action' => 'skipped', 'count' => 0, 'reason' => 'no_referrer'];
        }

        $acceptance->loadMissing([
            'patient',
            'referrerOrders',
            'acceptanceItems.test',
            'acceptanceItems.panelTest',
            'acceptanceItems.patients',
            'acceptanceItems.samples',
        ]);

        if ($acceptance->referrerOrders->isNotEmpty()) {
            foreach ($acceptance->referrerOrders as $referrerOrder) {
                ReferrerOrderUpdated::dispatch($referrerOrder);
            }
            return ['action' => 'updated', 'count' => $acceptance->referrerOrders->count()];
        }

        $patient = $acceptance->patient;
        if (!$patient) {
            return ['action' => 'skipped', 'count' => 0, 'reason' => 'no_patient'];
        }

        $items = $acceptance->acceptanceItems->reject(fn($i) => $i->reportless);
        if ($items->isEmpty()) {
            return ['action' => 'skipped', 'count' => 0, 'reason' => 'no_reportable_items'];
        }

        $patientData = [
            'server_id'   => $patient->id,
            'fullName'    => $patient->fullName,
            'id_no'       => $patient->idNo,
            'gender'      => $patient->gender,
            'dateOfBirth' => $patient->dateOfBirth?->format('Y-m-d'),
            'is_main'     => true,
        ];

        $orderItems     = [];
        $samplesByKey   = [];
        foreach ($items as $item) {
            $groupId = $item->panel_id ?? $item->id;

            $itemPatients = $item->patients->isNotEmpty()
                ? $item->patients->map(fn($p) => [
                    'server_id' => $p->id,
                    'fullName'  => $p->fullName,
                    'is_main'   => $p->id === $patient->id,
                ])->all()
                : [$patientData];

            $itemSamples = $item->samples->map(function ($s) {
                return [
                    'sampleType'     => null,
                    'collectionDate' => $s->collection_date,
                    'receivedAt'     => $s->received_at ?? null,
                    'sampleLocation' => null,
                    'sampleId'       => $s->barcode,
                    'materialId'     => null,
                ];
            })->all();

            foreach ($itemSamples as $sample) {
                $key = $sample['materialId'] ?? $sample['sampleId'] ?? uniqid('s_', true);
                $samplesByKey[$key] = array_merge($sample, [
                    'patientId' => $patient->id,
                    'itemIds'   => array_unique(array_merge(
                        $samplesByKey[$key]['itemIds'] ?? [],
                        [$item->id],
                    )),
                ]);
            }

            $existingIdx = null;
            foreach ($orderItems as $idx => $existing) {
                if ($existing['id'] === $groupId) {
                    $existingIdx = $idx;
                    break;
                }
            }

            if ($existingIdx === null) {
                $orderItems[] = [
                    'id'       => $groupId,
                    'test'     => $item->panel_id
                        ? ['id' => $item->panelTest?->id, 'name' => $item->panelTest?->name, 'code' => $item->panelTest?->code ?? null]
                        : ['id' => $item->test?->id,      'name' => $item->test?->name,      'code' => $item->test?->code ?? null],
                    'patients' => $itemPatients,
                    'samples'  => $itemSamples,
                ];
                continue;
            }

            $orderItems[$existingIdx]['patients'] = collect($orderItems[$existingIdx]['patients'])
                ->merge($itemPatients)
                ->unique(fn($p) => $p['server_id'] ?? $p['id'] ?? null)
                ->values()->all();
            $orderItems[$existingIdx]['samples'] = collect($orderItems[$existingIdx]['samples'])
                ->merge($itemSamples)
                ->unique(fn($s) => $s['materialId'] ?? $s['sampleId'] ?? null)
                ->values()->all();
        }

        $this->createReferrerOrder(new ReferrerOrderDTO(
            referrerId:       $acceptance->referrer_id,
            orderId:          'SYNC-' . $acceptance->id . '-' . now()->timestamp,
            orderInformation: [
                'status'     => 'processing',
                'patient'    => $patientData,
                'patients'   => [$patientData],
                'orderItems' => $orderItems,
                'samples'    => array_values($samplesByKey),
            ],
            status:           'processing',
            userId:           null,
            patientId:        $patient->id,
            acceptanceId:     $acceptance->id,
            collectRequestId: null,
            needsAddSample:   $samplesByKey ? false : true,
        ));

        return ['action' => 'created', 'count' => 1];
    }

    public function checkStatus(ReferrerOrder $referrerOrder): void
    {
        $referrerOrder->load("acceptance");
        if ($referrerOrder->acceptance && ($referrerOrder->acceptance?->status == AcceptanceStatus::PROCESSING || $referrerOrder->acceptance?->status == AcceptanceStatus::REPORTED)) {
            $this->updateReferrerOrderStatus($referrerOrder, $referrerOrder->acceptance?->status->value);
        }
    }

    private function findExistingNonPoolingOrder(Acceptance $acceptance, ?int $collectRequestId): ?ReferrerOrder
    {
        $query = ReferrerOrder::where('acceptance_id', $acceptance->id)
            ->where('pooling', false);

        if ($collectRequestId) {
            $matching = (clone $query)->where('collect_request_id', $collectRequestId)->latest('id')->first();
            if ($matching) return $matching;
        }

        return $query->whereNull('collect_request_id')->latest('id')->first()
            ?? $query->latest('id')->first();
    }

    private function buildBarcodeMaps(array $barcodes, $patient): array
    {
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
                        'is_main'   => ($barcodePatient['id'] ?? null) === $patient->id,
                    ];
                }
                $itemSamplesMap[$item['id']][] = $sampleData;
            }
        }

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

        return [$itemPatients, $itemSamplesMap, $samples];
    }

    private function buildGroupedOrderItems($acceptanceItems, array $itemPatients, array $itemSamplesMap, array $patientData): array
    {
        $orderItems = [];
        foreach ($acceptanceItems as $item) {
            $groupId = $item->panel_id ?? $item->id;
            $entry   = [
                'id'       => $groupId,
                'test'     => $item->panel_id
                    ? ['id' => $item->panelTest?->id, 'name' => $item->panelTest?->name, 'code' => $item->panelTest?->code ?? null]
                    : ['id' => $item->test?->id,      'name' => $item->test?->name,      'code' => $item->test?->code ?? null],
                'patients' => $itemPatients[$item->id] ?? [$patientData],
                'samples'  => $itemSamplesMap[$item->id] ?? [],
            ];

            $existingIdx = null;
            foreach ($orderItems as $idx => $existingEntry) {
                if ($existingEntry['id'] === $groupId) {
                    $existingIdx = $idx;
                    break;
                }
            }

            if ($existingIdx === null) {
                $orderItems[] = $entry;
                continue;
            }

            $orderItems[$existingIdx]['patients'] = collect($orderItems[$existingIdx]['patients'])
                ->merge($entry['patients'])
                ->unique(fn($p) => $p['server_id'] ?? $p['id'] ?? null)
                ->values()->all();

            $orderItems[$existingIdx]['samples'] = collect($orderItems[$existingIdx]['samples'])
                ->merge($entry['samples'])
                ->unique(fn($s) => $s['materialId'] ?? $s['sampleId'] ?? null)
                ->values()->all();
        }

        return array_values($orderItems);
    }

    private function mergeOrderInformation(array $existing, array $incoming): array
    {
        $merged = $existing ?: [];

        $merged['status']   = $merged['status']   ?? $incoming['status'];
        $merged['patient']  = $merged['patient']  ?? $incoming['patient'];
        $merged['patients'] = collect($merged['patients'] ?? [])
            ->merge($incoming['patients'] ?? [])
            ->unique(fn($p) => $p['server_id'] ?? $p['id'] ?? null)
            ->values()->all();

        $existingItems = collect($merged['orderItems'] ?? []);
        foreach ($incoming['orderItems'] ?? [] as $newItem) {
            $idx = $existingItems->search(fn($e) => ($e['id'] ?? null) === ($newItem['id'] ?? null));
            if ($idx === false) {
                $existingItems->push($newItem);
                continue;
            }
            $current = $existingItems[$idx];
            $current['patients'] = collect($current['patients'] ?? [])
                ->merge($newItem['patients'] ?? [])
                ->unique(fn($p) => $p['server_id'] ?? $p['id'] ?? null)
                ->values()->all();
            $current['samples'] = collect($current['samples'] ?? [])
                ->merge($newItem['samples'] ?? [])
                ->unique(fn($s) => $s['materialId'] ?? $s['sampleId'] ?? null)
                ->values()->all();
            $existingItems[$idx] = $current;
        }
        $merged['orderItems'] = $existingItems->values()->all();

        $merged['samples'] = collect($merged['samples'] ?? [])
            ->merge($incoming['samples'] ?? [])
            ->unique(fn($s) => $s['materialId'] ?? $s['sampleId'] ?? null)
            ->values()->all();

        return $merged;
    }
}
