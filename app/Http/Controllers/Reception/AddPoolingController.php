<?php

namespace App\Http\Controllers\Reception;

use App\Domains\Reception\DTOs\AcceptanceItemDTO;
use App\Domains\Reception\Enums\AcceptanceStatus;
use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Requests\AddPoolingRequest;
use App\Domains\Reception\Services\AcceptanceItemService;
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

        if ($createdItems->isNotEmpty() && $acceptance->referrer_id) {
            // Don't create a new referrer order for pooling — refresh the
            // acceptance's existing order so the provider sees the update.
            $this->referrerOrderService->updateExistingOrderForPooling($acceptance);
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
}
