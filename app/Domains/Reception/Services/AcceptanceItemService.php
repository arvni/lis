<?php

namespace App\Domains\Reception\Services;


use App\Domains\Laboratory\Enums\TestType;
use App\Domains\Reception\DTOs\AcceptanceItemDTO;
use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Models\AcceptanceItem;
use App\Domains\Reception\Repositories\AcceptanceItemRepository;
use App\Domains\Reception\Repositories\ReportRepository;
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

                $panels[$panelId] = [
                    'type'      => 'panel',
                    'id'        => $panelId,
                    'name'      => $test->name,
                    'panelData' => [
                        'panel'    => $test->toArray(),
                        'price'    => (float) $item->price * $items->where('panel_id', $panelId)->count(),
                        'discount' => (float) $item->discount * $items->where('panel_id', $panelId)->count(),
                        'id'       => $panelId,
                        'acceptanceItems' => $items
                            ->where('panel_id', $panelId)
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
     * @param Acceptance $acceptance
     * @param array $items list of ["id" => int, "price" => float, "discount" => float]
     * @return void
     */
    public function updateItemPrices(Acceptance $acceptance, array $items): void
    {
        /** @var Collection<int, AcceptanceItem> $existingItems */
        $existingItems = $acceptance->acceptanceItems()->get()->keyBy("id");
        $editor = auth()->user()?->name;

        foreach ($items as $item) {
            $acceptanceItem = $existingItems->get($item["id"]);
            if (!$acceptanceItem) {
                continue;
            }

            $price = (float)$item["price"];
            $discount = (float)$item["discount"];
            if ((float)$acceptanceItem->price === $price && (float)$acceptanceItem->discount === $discount) {
                continue;
            }

            $timeline = $acceptanceItem->timeline;
            if (!is_array($timeline)) {
                $timeline = json_decode($timeline ?? "[]", true) ?? [];
            }
            $timeline[now()->format("Y-m-d H:i:s")] =
                "Price set to $price and discount to $discount by $editor";

            $this->acceptanceItemRepository->updateAcceptanceItem($acceptanceItem, [
                "price" => $price,
                "discount" => $discount,
                "timeline" => $timeline,
            ]);
        }
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
