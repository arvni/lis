<?php

declare(strict_types=1);

namespace App\Domains\Reception\Services;


use App\Domains\Laboratory\Enums\TestType;
use App\Domains\Reception\DTOs\AcceptanceItemDTO;
use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Models\AcceptanceItem;
use App\Domains\Reception\Repositories\AcceptanceItemRepository;
use App\Domains\Reception\Repositories\ReportRepository;
use App\Domains\Shared\Helpers\AmountDistributor;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection as SupportCollection;
use Illuminate\Support\Str;

class AcceptanceItemService
{
    public function __construct(
        private readonly AcceptanceItemRepository $acceptanceItemRepository,
        private readonly ReportRepository         $reportRepository,
    )
    {
    }

    /**
     * @return LengthAwarePaginator<int, AcceptanceItem>
     */
    public function listAcceptanceItems(array $queryData): LengthAwarePaginator
    {
        return $this->acceptanceItemRepository->listAcceptanceItems($queryData);
    }

    /**
     * @return Collection<int, AcceptanceItem>
     */
    public function exportAcceptanceItems(array $queryData): Collection
    {
        return $this->acceptanceItemRepository->listAllAcceptanceItems($queryData);
    }

    public function listAcceptanceItemsReadyReport(array $queryData): LengthAwarePaginator
    {
        return $this->acceptanceItemRepository->listAcceptanceItemsReadyReport($queryData);
    }

    public function storeAcceptanceItem(AcceptanceItemDTO $acceptanceItemDTO): AcceptanceItem
    {
        return $this->acceptanceItemRepository->creatAcceptanceItem(Arr::except($acceptanceItemDTO->toArray(), ["id"]));
    }

    /**
     * Create pooling acceptance items (tests + panels) for an acceptance and bump
     * the sample count on the originally-selected source items.
     *
     * @param  array<string, mixed>  $acceptanceItems
     * @return SupportCollection<int, AcceptanceItem>
     */
    public function addPoolingItems(Acceptance $acceptance, array $acceptanceItems): SupportCollection
    {
        $user    = auth()->user();
        $created = collect();

        // Process tests
        foreach ($acceptanceItems['tests'] ?? [] as $item) {
            if (!empty($item['deleted'])) {
                continue;
            }

            $dto = new AcceptanceItemDTO(
                acceptanceId:     $acceptance->id,
                methodTestId:     $item['method_test']['id'],
                price:            $item['price'],
                discount:         $item['discount'] ?? 0,
                customParameters: array_merge(
                    $item['customParameters'] ?? [],
                    Arr::except($item, ['method_test', 'price', 'discount', 'timeLine', 'id', 'customParameters', 'sampleless', 'reportless', 'original_acceptance_item_ids'])
                ),
                timeline:  [Carbon::now()->format('Y-m-d H:i:s') => 'Created By ' . $user->name . ' (Pooling)'],
                noSample:  1,
                sampleless: true,
                reportless: true,
            );

            $createdItem = $this->storeAcceptanceItem($dto);
            $createdItem->update(['is_pooling' => true]);
            $created->push($createdItem);

            // Bump no_sample on the originally-selected acceptance item(s)
            $this->incrementOriginalNoSample($acceptance, $item['original_acceptance_item_ids'] ?? []);
        }

        // Process panels
        foreach ($acceptanceItems['panels'] ?? [] as $panelData) {
            if (!empty($panelData['deleted'])) {
                continue;
            }
            if (empty($panelData['acceptanceItems'])) {
                continue;
            }

            $panelId    = Str::uuid()->toString();
            $itemCount  = count($panelData['acceptanceItems']);
            // Split the panel totals so the item shares add back up to the panel
            // price/discount even when they do not divide evenly.
            $panelPrices = AmountDistributor::distribute(
                (float) ($panelData['price'] ?? 0),
                $itemCount,
                AmountDistributor::PRICE_DECIMALS
            );
            $panelDiscounts = AmountDistributor::distribute(
                (float) ($panelData['discount'] ?? 0),
                $itemCount,
                AmountDistributor::DISCOUNT_DECIMALS
            );

            foreach (array_values($panelData['acceptanceItems']) as $itemIndex => $item) {
                $dto = new AcceptanceItemDTO(
                    acceptanceId:     $acceptance->id,
                    methodTestId:     $item['method_test']['id'],
                    price:            $panelPrices[$itemIndex],
                    discount:         $panelDiscounts[$itemIndex],
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

                $createdItem = $this->storeAcceptanceItem($dto);
                $createdItem->update(['is_pooling' => true]);
                $created->push($createdItem);
            }

            // Bump no_sample on every originally-selected acceptance item of the panel
            $this->incrementOriginalNoSample($acceptance, $panelData['original_acceptance_item_ids'] ?? []);
        }

        return $created;
    }

    /**
     * Add submitted acceptance items (tests + panels) to an acceptance that
     * already exists — what the referrer-order pooling flow does when an order is
     * attached to an acceptance the patient already has.
     *
     * Unlike addPoolingItems() these are ordinary items: they keep the submitted
     * sampleless/reportless flags, are not marked is_pooling, and no source item's
     * sample count is bumped.
     *
     * @param  array<string, mixed>  $acceptanceItems
     * @return SupportCollection<int, AcceptanceItem>
     */
    public function addItemsToExistingAcceptance(Acceptance $acceptance, array $acceptanceItems): SupportCollection
    {
        $user    = auth()->user();
        $created = collect();

        // Process tests
        foreach ($acceptanceItems['tests'] ?? [] as $item) {
            if (!empty($item['deleted'])) {
                continue;
            }

            $dto = new AcceptanceItemDTO(
                acceptanceId:     $acceptance->id,
                methodTestId:     $item['method_test']['id'],
                price:            $item['price'],
                discount:         $item['discount'] ?? 0,
                customParameters: $this->submittedItemParameters($item),
                timeline:  [Carbon::now()->format('Y-m-d H:i:s') => 'Created By ' . $user->name . ' (Pooling)'],
                noSample:  $item['no_sample'] ?? 1,
                sampleless: $item['sampleless'] ?? false,
            );

            $created->push($this->storeAcceptanceItem($dto));
        }

        // Process panels
        foreach ($acceptanceItems['panels'] ?? [] as $panelData) {
            if (!empty($panelData['deleted']) || empty($panelData['acceptanceItems'])) {
                continue;
            }

            $panelId         = Str::uuid()->toString();
            $panelSampleless = $panelData['sampleless'] ?? false;
            $panelReportless = $panelData['reportless'] ?? false;
            $itemCount       = count($panelData['acceptanceItems']);
            // Split the panel totals so the item shares add back up to the panel
            // price/discount even when they do not divide evenly.
            $panelPrices = AmountDistributor::distribute(
                (float) ($panelData['price'] ?? 0),
                $itemCount,
                AmountDistributor::PRICE_DECIMALS
            );
            $panelDiscounts = AmountDistributor::distribute(
                (float) ($panelData['discount'] ?? 0),
                $itemCount,
                AmountDistributor::DISCOUNT_DECIMALS
            );

            foreach (array_values($panelData['acceptanceItems']) as $itemIndex => $item) {
                $dto = new AcceptanceItemDTO(
                    acceptanceId:     $acceptance->id,
                    methodTestId:     $item['method_test']['id'],
                    price:            $panelPrices[$itemIndex],
                    discount:         $panelDiscounts[$itemIndex],
                    customParameters: $this->submittedItemParameters($item),
                    timeline:  [Carbon::now()->format('Y-m-d H:i:s') => 'Created By ' . $user->name . ' (Pooling)'],
                    noSample:  $item['no_sample'] ?? 1,
                    panelId:   $panelId,
                    sampleless: $panelSampleless || ($item['sampleless'] ?? false),
                    reportless: $panelReportless || ($item['reportless'] ?? false),
                );

                $created->push($this->storeAcceptanceItem($dto));
            }
        }

        return $created;
    }

    /**
     * Merge a submitted item's own customParameters with the leftover keys the
     * acceptance form sends alongside them.
     *
     * @param  array<string, mixed>  $item
     * @return array<string, mixed>
     */
    private function submittedItemParameters(array $item): array
    {
        return array_merge(
            $item['customParameters'] ?? [],
            Arr::except($item, ['method_test', 'price', 'discount', 'patients', 'timeLine', 'id', 'customParameters', 'sampleless'])
        );
    }

    /**
     * Increment no_sample by one on the given original (non-pooling) acceptance
     * items, so each pooled test requires one additional sample, and record the
     * bump on each item's timeline.
     *
     * @param  array<int, int|string>  $ids
     */
    private function incrementOriginalNoSample(Acceptance $acceptance, array $ids): void
    {
        $ids = array_filter($ids);
        if (empty($ids)) {
            return;
        }

        $user  = auth()->user();
        $items = $this->acceptanceItemRepository->getOriginalNonPoolingItems($acceptance, $ids);

        foreach ($items as $item) {
            $item->increment('no_sample');
            $this->updateAcceptanceItemTimeline(
                $item,
                "Sample count increased to {$item->no_sample} by {$user->name} (Pooling)"
            );
        }
    }

    /**
     * Build the grouped pooling-items payload (tests + panels) for an acceptance.
     *
     * @return array<int, array<string, mixed>>
     */
    public function buildPoolingItems(Acceptance $acceptance): array
    {
        $items = $this->acceptanceItemRepository->getPoolingSourceItems($acceptance);

        $tests  = [];
        $panels = [];

        foreach ($items as $item) {
            $methodTest = $item->methodTest;
            if (!$methodTest) {
                continue;
            }
            $test = $methodTest->test;
            if (!$test) {
                continue;
            }

            $isPanel = $test->type === TestType::PANEL || $test->type === TestType::PANEL->value;

            if ($isPanel) {
                $panelId = $item->panel_id;
                if (!$panelId || isset($panels[$panelId])) {
                    continue;
                }

                $panelItems = $items->where('panel_id', $panelId);

                $panels[$panelId] = [
                    'type'      => 'panel',
                    'id'        => $panelId,
                    'name'      => $test->name,
                    'panelData' => [
                        'panel'    => $test->toArray(),
                        // Sum the shares instead of scaling the first one: an
                        // unevenly split panel does not carry the same price on
                        // every item.
                        'price'    => (float) $panelItems->sum('price'),
                        'discount' => (float) $panelItems->sum('discount'),
                        'id'       => $panelId,
                        'acceptanceItems' => $panelItems
                            ->values()
                            ->map(fn ($sub) => [
                                'id'              => $sub->id,
                                'method_test'     => $sub->methodTest ? array_merge($sub->methodTest->toArray(), [
                                    'test'   => $sub->methodTest->test?->toArray(),
                                    'method' => $sub->methodTest->method?->toArray(),
                                ]) : null,
                                'price'           => (float) $sub->price,
                                'discount'        => (float) $sub->discount,
                                'no_sample'       => 1,
                                'customParameters' => $sub->customParameters ?? [],
                            ])->toArray(),
                    ],
                ];
            } else {
                $testId = $test->id;
                if (isset($tests[$testId])) {
                    continue;
                }

                $tests[$testId] = [
                    'type' => 'test',
                    'id'   => $testId,
                    'name' => $test->name,
                    'acceptance_item_id' => $item->id,
                    'initialData' => [
                        'method_test' => array_merge($methodTest->toArray(), [
                            'test'   => $test->toArray(),
                            'method' => $methodTest->method?->toArray(),
                        ]),
                        'price'            => (float) $item->price,
                        'discount'         => (float) $item->discount,
                        'customParameters' => $item->customParameters ?? [],
                        'no_sample'        => 1,
                    ],
                ];
            }
        }

        return array_values(array_merge(array_values($tests), array_values($panels)));
    }

    public function showAcceptanceItem(AcceptanceItem $acceptanceItem): AcceptanceItem
    {
        $acceptanceItem->load([
            "acceptance",
            "patients" => function ($q) {
                $q->with(["ownedDocuments" => function ($q) {
                    $q->allowedTag();
                }]);
            },
            "tags:id,name",
            "acceptanceItemStates" => function ($query) {
                return $query->with([
                    'section',
                    'sample.sampleType',
                    'sample.patient:id,fullName',
                    'finishedBy:name,id',
                    'startedBy:name,id'
                ]);
            },
            "method.workflow.sections",
            "test.testGroups",
            "report:id,acceptance_item_id,reported_at,approved_at,printed_at,approver_id,reporter_id",
            "report.reporter:id,name",
            "report.approver:id,name"
        ]);
        return $acceptanceItem;
    }

    public function updateAcceptanceItem(AcceptanceItem $acceptanceItem, AcceptanceItemDTO $acceptanceItemDTO): AcceptanceItem
    {
        return $this->acceptanceItemRepository->updateAcceptanceItem($acceptanceItem, $acceptanceItemDTO->toArray());
    }

    /**
     * Update the price and discount of an acceptance's items in bulk.
     * Only items belonging to the given acceptance are touched, and each
     * change is recorded on the item timeline.
     *
     * An entry is either a single item (["id" => int, ...]) or a whole panel
     * (["panel_id" => string, ...]); a panel's price/discount is the total for
     * the panel and is split across its items so the shares sum back exactly.
     *
     * A formula/conditional entry also carries the parameters its price was
     * calculated from ("custom_parameters"); those are merged into the item's
     * stored bag so the next edit starts from what was actually priced. A panel
     * prices as a whole, so its parameters land on every one of its items.
     *
     * @param Acceptance $acceptance
     * @param array $items list of ["id" => int|null, "panel_id" => string|null, "price" => float, "discount" => float, "custom_parameters" => array|null]
     * @return void
     */
    public function updateItemPrices(Acceptance $acceptance, array $items): void
    {
        /** @var Collection<int, AcceptanceItem> $acceptanceItems */
        $acceptanceItems = $acceptance->acceptanceItems()->get();
        $itemsById = $acceptanceItems->keyBy("id");
        $itemsByPanel = $acceptanceItems->whereNotNull("panel_id")->groupBy("panel_id");
        $editor = auth()->user()?->name;

        foreach ($items as $item) {
            $price = (float)$item["price"];
            $discount = (float)$item["discount"];
            $panelId = $item["panel_id"] ?? null;
            $customParameters = $item["custom_parameters"] ?? null;

            if ($panelId !== null && $panelId !== "") {
                $this->applyPanelPrice($itemsByPanel->get((string)$panelId), $price, $discount, $editor, $customParameters);
                continue;
            }

            $acceptanceItem = $itemsById->get($item["id"] ?? null);
            if ($acceptanceItem) {
                $this->applyItemPrice($acceptanceItem, $price, $discount, $editor, "", $customParameters);
            }
        }
    }

    /**
     * Split a panel total across its items and apply each share.
     *
     * @param SupportCollection<int, AcceptanceItem>|null $panelItems
     * @param array<string, mixed>|null $customParameters
     */
    private function applyPanelPrice(?SupportCollection $panelItems, float $price, float $discount, ?string $editor, ?array $customParameters = null): void
    {
        if (!$panelItems || $panelItems->isEmpty()) {
            return;
        }

        $count = $panelItems->count();
        $prices = AmountDistributor::distribute($price, $count, AmountDistributor::PRICE_DECIMALS);
        $discounts = AmountDistributor::distribute($discount, $count, AmountDistributor::DISCOUNT_DECIMALS);
        $note = " (share of panel price $price and discount $discount over $count items)";

        foreach ($panelItems->values() as $index => $panelItem) {
            $this->applyItemPrice($panelItem, $prices[$index], $discounts[$index], $editor, $note, $customParameters);
        }
    }

    /**
     * Write a single item's price/discount — and the parameters that price was
     * calculated from, when it has any — skipping items nothing changed on and
     * recording the change on the item timeline.
     *
     * @param array<string, mixed>|null $customParameters
     */
    private function applyItemPrice(AcceptanceItem $acceptanceItem, float $price, float $discount, ?string $editor, string $note = "", ?array $customParameters = null): void
    {
        $mergedParameters = $this->mergeCustomParameters($acceptanceItem, $customParameters);
        $amountsUnchanged = (float)$acceptanceItem->price === $price && (float)$acceptanceItem->discount === $discount;

        if ($amountsUnchanged && $mergedParameters === null) {
            return;
        }

        $timeline = $acceptanceItem->timeline;
        if (!is_array($timeline)) {
            $timeline = json_decode($timeline ?? "[]", true) ?? [];
        }
        $timeline[now()->format("Y-m-d H:i:s")] =
            "Price set to $price and discount to $discount by $editor" . $note
            . ($mergedParameters !== null ? " (pricing parameters updated)" : "");

        $updateData = [
            "price" => $price,
            "discount" => $discount,
            "timeline" => $timeline,
        ];
        if ($mergedParameters !== null) {
            $updateData["customParameters"] = $mergedParameters;
        }

        $this->acceptanceItemRepository->updateAcceptanceItem($acceptanceItem, $updateData);
    }

    /**
     * Merge submitted pricing parameters into an item's stored customParameters,
     * leaving every other key (samples, discounts, details…) alone. Returns null
     * when there is nothing to write.
     *
     * @param array<string, mixed>|null $submitted
     * @return array<string, mixed>|null
     */
    private function mergeCustomParameters(AcceptanceItem $acceptanceItem, ?array $submitted): ?array
    {
        if (empty($submitted)) {
            return null;
        }

        $existing = $acceptanceItem->customParameters;
        if (!is_array($existing)) {
            $existing = json_decode($existing ?? "[]", true) ?? [];
        }

        $merged = array_replace($existing, $submitted);

        return $merged === $existing ? null : $merged;
    }

    public function updateAcceptanceItemTimeline(AcceptanceItem $acceptanceItem, string $message): AcceptanceItem
    {
        $timeline = $acceptanceItem->timeline;
        if (!is_array($timeline))
            $timeline = json_decode($timeline ?? "[]", true) ?? [];
        $timeline[now()->format("Y-m-d H:i:s")] = $message;
        return $this->acceptanceItemRepository->updateAcceptanceItem($acceptanceItem, ["timeline" => $timeline]);
    }

    public function findAcceptanceItemById(int|string|null $id): ?AcceptanceItem
    {
        return $this->acceptanceItemRepository->findAcceptanceItemById($id);
    }

    public function deleteAcceptanceItem(AcceptanceItem $acceptanceItem): void
    {
        $this->acceptanceItemRepository->deleteAcceptanceItem($acceptanceItem);
    }

    public function getReportHistory(int|string $acceptanceItemId): Collection
    {
        $acceptanceItem = $this->findAcceptanceItemById($acceptanceItemId);
        return $this->reportRepository->getHistoryForAcceptanceItem($acceptanceItem);
    }

    public function rejectSample(AcceptanceItem $acceptanceItem, int|string $sampleId): void
    {
        $acceptanceItem->acceptanceItemSamples()->where("sample_id", $sampleId)->update(["active" => false]);
        $user = auth()->user();
        $this->updateAcceptanceItemTimeline($acceptanceItem, "Rejected For Resampling By $user->name");
    }


}
