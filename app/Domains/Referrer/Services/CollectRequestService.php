<?php

namespace App\Domains\Referrer\Services;

use App\Domains\Referrer\DTOs\CollectRequestDTO;
use App\Domains\Referrer\Enums\CollectRequestStatus;
use App\Domains\Referrer\Events\CollectRequestEvent;
use App\Domains\Referrer\Models\CollectRequest;
use App\Domains\Referrer\Repositories\CollectRequestRepository;
use Exception;
use Illuminate\Pagination\LengthAwarePaginator;

class CollectRequestService
{
    public function __construct(protected CollectRequestRepository $collectRequestRepository)
    {
    }

    public function listCollectRequests(array $filters): LengthAwarePaginator
    {
        return $this->collectRequestRepository->listCollectRequest($filters);
    }

    public function createCollectRequest(CollectRequestDTO $collectRequestDTO): CollectRequest
    {
        $data = $collectRequestDTO->toArray();

        // Set default status to pending if not provided
        if (!isset($data['status'])) {
            $data['status'] = CollectRequestStatus::PENDING->value;
        }

        $collectRequest = $this->collectRequestRepository->createCollectRequest($data);

        // Dispatch event to notify logistics app
        CollectRequestEvent::dispatch($collectRequest->id, 'create');

        return $collectRequest;
    }

    public function getCollectRequestDetails(CollectRequest $collectRequest): array
    {
        $collectRequest->load([
            'sampleCollector',
            'referrer',
            'referrerOrders' => function ($query) {
                $query->with(['patient', 'acceptance'])->latest()->limit(10);
            }
        ]);

        return [
            "collectRequest" => $collectRequest,
            "sampleCollector" => $collectRequest->sampleCollector,
            "referrer" => $collectRequest->referrer,
            "referrerOrders" => $collectRequest->referrerOrders,
        ];
    }

    public function updateCollectRequest(CollectRequest $collectRequest, CollectRequestDTO $collectRequestDTO): CollectRequest
    {
        $data = $collectRequestDTO->toArray();

        // Check if sample collector is being assigned or changed
        $sampleCollectorChanged = isset($data['sample_collector_id']) &&
            $data['sample_collector_id'] != $collectRequest->sample_collector_id;

        if ($sampleCollectorChanged) {
            $data["status"] = CollectRequestStatus::PENDING->value;
        }

        $updatedCollectRequest = $this->collectRequestRepository->updateCollectRequest($collectRequest, $data);

        // Dispatch event to notify logistics app
        // The action can be 'update' or 'assign' depending on whether sample collector changed
        $action = $sampleCollectorChanged ? 'assign' : 'update';
        CollectRequestEvent::dispatch($updatedCollectRequest->id, $action);

        return $updatedCollectRequest;
    }

    /**
     * @throws Exception
     */
    public function deleteCollectRequest(CollectRequest $collectRequest): void
    {
        if ($collectRequest->referrerOrders()->exists()) {
            throw new Exception("CollectRequest has associated referrer orders.");
        }

        // Dispatch event before deletion to notify logistics app
        CollectRequestEvent::dispatch($collectRequest->id, 'delete');

        $this->collectRequestRepository->deleteCollectRequest($collectRequest);
    }

    public function getCollectRequestById($id): ?CollectRequest
    {
        return $this->collectRequestRepository->findCollectRequestById($id);
    }
}
