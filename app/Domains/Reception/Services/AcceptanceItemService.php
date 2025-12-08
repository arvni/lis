<?php

namespace App\Domains\Reception\Services;


use App\Domains\Reception\DTOs\AcceptanceItemDTO;
use App\Domains\Reception\Models\AcceptanceItem;
use App\Domains\Reception\Repositories\AcceptanceItemRepository;
use App\Domains\Reception\Repositories\ReportRepository;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Arr;

readonly class AcceptanceItemService
{
    public function __construct(
        private AcceptanceItemRepository $acceptanceItemRepository,
        private ReportRepository         $reportRepository,
    )
    {
    }

    public function listAcceptanceItems($queryData)
    {
        return $this->acceptanceItemRepository->listAcceptanceItems($queryData);
    }

    public function exportAcceptanceItems($queryData)
    {
        return $this->acceptanceItemRepository->listAllAcceptanceItems($queryData);
    }

    public function listAcceptanceItemsReadyReport($queryData): LengthAwarePaginator
    {
        return $this->acceptanceItemRepository->listAcceptanceItemsReadyReport($queryData);
    }

    public function storeAcceptanceItem(AcceptanceItemDTO $acceptanceItemDTO): AcceptanceItem
    {
        return $this->acceptanceItemRepository->creatAcceptanceItem(Arr::except($acceptanceItemDTO->toArray(), ["id"]));
    }

    public function showAcceptanceItem(AcceptanceItem $acceptanceItem): AcceptanceItem
    {
        $acceptanceItem->load([
            "acceptance",
            "patients",
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

    public function updateAcceptanceItemTimeline(AcceptanceItem $acceptanceItem, $message): AcceptanceItem
    {
        $timeline = $acceptanceItem->timeline;
        if (!is_array($timeline))
            $timeline = json_decode($timeline, true);
        $timeline[Carbon::now("Asia/Muscat")->format("Y-m-d H:i:s")] = $message;
        return $this->acceptanceItemRepository->updateAcceptanceItem($acceptanceItem, ["timeline" => $timeline]);
    }

    public function findAcceptanceItemById($id): ?AcceptanceItem
    {
        return $this->acceptanceItemRepository->findAcceptanceItemById($id);
    }

    public function deleteAcceptanceItem(AcceptanceItem $acceptanceItem): void
    {
        $this->acceptanceItemRepository->deleteAcceptanceItem($acceptanceItem);
    }

    public function getReportHistory($acceptanceItemId): Collection
    {
        $acceptanceItem = $this->findAcceptanceItemById($acceptanceItemId);
        return $this->reportRepository->getHistoryForAcceptanceItem($acceptanceItem);
    }

    public function rejectSample(AcceptanceItem $acceptanceItem, $sampleId): void
    {
        $acceptanceItem->acceptanceItemSamples()->where("sample_id", $sampleId)->update(["active" => false]);
        $user = auth()->user();
        $this->updateAcceptanceItemTimeline($acceptanceItem, "Rejected For Resampling By $user->name");
    }


}
