<?php

namespace App\Http\Controllers\Reception;

use App\Domains\Reception\DTOs\AcceptanceItemDTO;
use App\Domains\Reception\Enums\AcceptanceStatus;
use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Requests\AddPoolingRequest;
use App\Domains\Reception\Services\AcceptanceItemService;
use App\Domains\Referrer\DTOs\ReferrerOrderDTO;
use App\Domains\Referrer\Services\ReferrerOrderService;
use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class AddPoolingController extends Controller
{
    public function __construct(
        private AcceptanceItemService $acceptanceItemService,
        private ReferrerOrderService  $referrerOrderService,
    ) {}

    public function __invoke(AddPoolingRequest $request, Acceptance $acceptance): RedirectResponse
    {
        if ($acceptance->status !== AcceptanceStatus::POOLING) {
            return back()->withErrors(['error' => 'Acceptance is not in pooling status.']);
        }

        $createdItems = $this->createPoolingItems($acceptance, $request->validated('acceptanceItems'));

        if ($createdItems->isNotEmpty() && $acceptance->referrer_id && $acceptance->out_patient) {
            $this->createPoolingReferrerOrder($acceptance, $createdItems);
        }

        return back()->with(['success' => true, 'status' => 'Pooling items added successfully.']);
    }

    private function createPoolingItems(Acceptance $acceptance, array $acceptanceItems): Collection
    {
        $user    = auth()->user();
        $created = collect();

        // Process tests
        foreach ($acceptanceItems['tests'] ?? [] as $item) {
            if (!empty($item['deleted'])) continue;

            $dto = new AcceptanceItemDTO(
                acceptanceId:     $acceptance->id,
                methodTestId:     $item['method_test']['id'],
                price:            $item['price'],
                discount:         $item['discount'] ?? 0,
                customParameters: array_merge(
                    $item['customParameters'] ?? [],
                    Arr::except($item, ['method_test', 'price', 'discount', 'timeLine', 'id', 'customParameters', 'sampleless', 'reportless'])
                ),
                timeline:  [Carbon::now()->format('Y-m-d H:i:s') => 'Created By ' . $user->name . ' (Pooling)'],
                noSample:  1,
                sampleless: true,
                reportless: true,
            );

            $createdItem = $this->acceptanceItemService->storeAcceptanceItem($dto);
            $createdItem->update(['is_pooling' => true]);
            $created->push($createdItem);

            // Increment no_sample on the original acceptance item
            $acceptance->acceptanceItems()
                ->where('method_test_id', $item['method_test']['id'])
                ->where('is_pooling', false)
                ->where('sampleless', false)
                ->increment('no_sample');
        }

        // Process panels
        foreach ($acceptanceItems['panels'] ?? [] as $panelData) {
            if (!empty($panelData['deleted'])) continue;
            if (empty($panelData['acceptanceItems'])) continue;

            $panelId    = Str::uuid();
            $itemCount  = count($panelData['acceptanceItems']);
            $panelPrice = ($panelData['price'] ?? 0) / ($itemCount ?: 1);
            $panelDisc  = ($panelData['discount'] ?? 0) / ($itemCount ?: 1);

            foreach ($panelData['acceptanceItems'] as $item) {
                $dto = new AcceptanceItemDTO(
                    acceptanceId:     $acceptance->id,
                    methodTestId:     $item['method_test']['id'],
                    price:            $panelPrice,
                    discount:         $panelDisc,
                    customParameters: array_merge(
                        $item['customParameters'] ?? [],
                        Arr::except($item, ['method_test', 'price', 'discount', 'timeLine', 'id', 'customParameters', 'sampleless', 'reportless'])
                    ),
                    timeline:  [Carbon::now()->format('Y-m-d H:i:s') => 'Created By ' . $user->name . ' (Pooling)'],
                    noSample:  1,
                    panelId:   $panelId,
                    sampleless: true,
                    reportless: true,
                );

                $createdItem = $this->acceptanceItemService->storeAcceptanceItem($dto);
                $createdItem->update(['is_pooling' => true]);
                $created->push($createdItem);

                // Increment no_sample on the original acceptance item
                $acceptance->acceptanceItems()
                    ->where('method_test_id', $item['method_test']['id'])
                    ->where('is_pooling', false)
                    ->where('sampleless', false)
                    ->increment('no_sample');
            }
        }

        return $created;
    }

    private function createPoolingReferrerOrder(Acceptance $acceptance, Collection $items): void
    {
        $acceptance->loadMissing('patient');
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

        $items->each(fn($item) => $item->load('test'));

        $orderItems = $items->map(fn($item) => [
            'id'       => $item->id,
            'test'     => [
                'id'   => $item->test?->id,
                'name' => $item->test?->name,
                'code' => $item->test?->code ?? null,
            ],
            'patients' => [$patientData],
            'samples'  => [],
        ])->values()->toArray();

        $orderInformation = [
            'status'     => 'processing',
            'patient'    => $patientData,
            'patients'   => [$patientData],
            'orderItems' => $orderItems,
            'samples'    => [],
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

        $items->each(fn($item) => $item->update(['is_pooling' => false]));
    }
}
