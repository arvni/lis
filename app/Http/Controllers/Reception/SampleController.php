<?php

namespace App\Http\Controllers\Reception;

use App\Domains\Reception\DTOs\SampleDTO;
use App\Domains\Reception\Models\AcceptanceItem;
use App\Domains\Reception\Models\Sample;
use App\Domains\Reception\Requests\StoreSampleRequest;
use App\Domains\Reception\Requests\UpdateSampleRequest;
use App\Domains\Reception\Services\SampleService;
use App\Domains\Referrer\DTOs\ReferrerOrderDTO;
use App\Domains\Referrer\Models\ReferrerOrder;
use App\Domains\Referrer\Services\ReferrerOrderService;
use App\Http\Controllers\Controller;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SampleController extends Controller
{
    public function __construct(
        private SampleService $sampleService,
        private ReferrerOrderService $referrerOrderService,
    ) {
        $this->middleware("indexProvider")->only("index");
    }

    /**
     * Display a listing of the resource.
     * @throws AuthorizationException
     */
    public function index(Request $request): Response
    {
        $this->authorize("viewAny", Sample::class);
        $requestInputs = $request->all();

        $samples = $this->sampleService->listSamples($requestInputs);
        return Inertia::render('Sample/Index',
            [
                "samples" => $samples,
                "requestInputs" => $requestInputs,
            ]);
    }


    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreSampleRequest $request)
    {
        foreach ($request->validated("barcodes") as $key => $barcode) {
            $this->sampleService->storeSample(SampleDTO::fromArray($barcode), $key);
        }

        $collectRequestId = $request->input('collect_request.id');
        if ($collectRequestId) {
            $this->createOrUpdateReferrerOrder($request, (int) $collectRequestId);
        } else {
            $this->maybeCreatePoolingReferrerOrder($request);
        }

        return redirect()->back()->with(["success" => true, "status" => "Sample created successfully."]);
    }

    private function createOrUpdateReferrerOrder(StoreSampleRequest $request, int $collectRequestId): void
    {
        $barcodes    = $request->input('barcodes', []);
        $firstItemId = data_get($barcodes, '0.items.0.id');

        $acceptanceItem = AcceptanceItem::with('acceptance.patient')->find($firstItemId);
        if (!$acceptanceItem) return;

        $acceptance = $acceptanceItem->acceptance;
        if (!$acceptance || !$acceptance->referrer_id) return;

        $patient = $acceptance->patient;

        // Load all acceptance items referenced in the barcodes (with test info)
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

        // Map each item ID to the patients and samples of the barcodes that contain it
        $itemPatients = [];
        $itemSamplesMap = [];
        foreach ($barcodes as $barcode) {
            $barcodePatient = $barcode['patient'] ?? null;
            $material = $barcode['material'] ?? null;
            $sampleData = [
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
                        'server_id'   => $barcodePatient['id'] ?? null,
                        'fullName'    => $barcodePatient['fullName'] ?? null,
                        'is_main'     => $barcodePatient['id'] === $patient->id,
                    ];
                }
                $itemSamplesMap[$item['id']][] = $sampleData;
            }
        }

        $orderItems = $acceptanceItems->map(fn($item) => [
            'id'       => $item->id,
            'test'     => [
                'id'   => $item->test?->id,
                'name' => $item->test?->name,
                'code' => $item->test?->code ?? null,
            ],
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

        $orderInformation = [
            'status'     => 'processing',
            'patient'    => $patientData,
            'patients'   => [$patientData],
            'orderItems' => $orderItems,
            'samples'    => $samples,
        ];

        $this->referrerOrderService->createReferrerOrder(new ReferrerOrderDTO(
            referrerId: $acceptance->referrer_id,
            orderId: 'SC-POOL-' . $acceptance->id . '-' . now()->timestamp,
            orderInformation: $orderInformation,
            status: 'processing',
            userId: auth()->id(),
            patientId: $patient->id,
            acceptanceId: $acceptance->id,
            collectRequestId: $collectRequestId,
            needsAddSample: false
        ));
    }

    private function maybeCreatePoolingReferrerOrder(StoreSampleRequest $request): void
    {
        $barcodes    = $request->input('barcodes', []);
        $firstItemId = data_get($barcodes, '0.items.0.id');

        $acceptanceItem = AcceptanceItem::with('acceptance')->find($firstItemId);
        if (!$acceptanceItem) return;

        $acceptance = $acceptanceItem->acceptance;
        if (!$acceptance) return;
        if (!$acceptance->waiting_for_pooling || !$acceptance->referrer_id || !$acceptance->out_patient) return;

        // Skip if a pooling referrer order was already created (e.g., by AddPoolingController)
        $alreadyHasPoolingOrder = ReferrerOrder::where('acceptance_id', $acceptance->id)
            ->where('pooling', true)
            ->exists();
        if ($alreadyHasPoolingOrder) return;

        $poolingItems = AcceptanceItem::where('acceptance_id', $acceptance->id)
            ->where('is_pooling', true)
            ->with('test')
            ->get();

        if ($poolingItems->isEmpty()) return;

        $patient = $acceptance->patient;
        if (!$patient) return;

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
            'test'     => [
                'id'   => $item->test?->id,
                'name' => $item->test?->name,
                'code' => $item->test?->code ?? null,
            ],
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

        $orderInformation = [
            'status'     => 'processing',
            'patient'    => $patientData,
            'patients'   => [$patientData],
            'orderItems' => $orderItems,
            'samples'    => $samples,
        ];

        $this->referrerOrderService->createReferrerOrder(new ReferrerOrderDTO(
            referrerId:       $acceptance->referrer_id,
            orderId:          'POOL-' . $acceptance->id . '-' . now()->timestamp,
            orderInformation: $orderInformation,
            status:           'processing',
            userId:           auth()->id(),
            patientId:        $patient->id,
            acceptanceId:     $acceptance->id,
            needsAddSample:   false,
            pooling:          true,
        ));

        // Reset is_pooling flag after referrer order is created
        AcceptanceItem::where('acceptance_id', $acceptance->id)
            ->where('is_pooling', true)
            ->update(['is_pooling' => false]);
    }

    /**
     * Display the specified resource.
     */
    public function show(Sample $sample)
    {
        $sample->load([
            "patient",
            "acceptanceItems" => function ($q) {
                $q->wherePivot("active", true);
                $q->with("method.test");
            }
        ]);
        return Inertia::render('Acceptance/Barcodes', ["barcodes" => [
            $sample
        ]]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateSampleRequest $request, Sample $sample)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Sample $sample)
    {
        //
    }
}
