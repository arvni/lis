<?php

declare(strict_types=1);

namespace App\Domains\Laboratory\Adapters;

use App\Domains\PreOrder\Models\Flow;
use App\Domains\PreOrder\Repositories\FlowRepository;

/** Lets the test catalogue offer the pre-order flows a test can be switched on with. */
class PreOrderAdapter
{
    public function __construct(private readonly FlowRepository $flowRepository) {}

    /** @return list<array{id: int, name: string, family: string}> */
    public function activeFlows(): array
    {
        return $this->flowRepository->active()
            ->map(fn (Flow $flow) => ['id' => $flow->id, 'name' => $flow->name, 'family' => $flow->family])
            ->values()
            ->all();
    }

    public function isActiveFlow(int $flowId): bool
    {
        return (bool) $this->flowRepository->findById($flowId)?->active;
    }
}
