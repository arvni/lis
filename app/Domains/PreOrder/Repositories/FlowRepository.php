<?php

declare(strict_types=1);

namespace App\Domains\PreOrder\Repositories;

use App\Domains\PreOrder\Models\Flow;
use Illuminate\Database\Eloquent\Collection;

class FlowRepository
{
    public function findById(int $id): ?Flow
    {
        return Flow::query()->find($id);
    }

    /** @return Collection<int, Flow> */
    public function active(): Collection
    {
        return Flow::query()->where('active', true)->orderBy('name')->get();
    }

    /**
     * Every flow with how many tests use it and how many pre-orders are still open on it.
     *
     * @return Collection<int, Flow>
     */
    public function listForAdmin(): Collection
    {
        /** @var Collection<int, Flow> $flows */
        $flows = Flow::query()
            ->withCount(['tests', 'preOrders as open_pre_orders_count' => fn ($q) => $q->whereNull('closed_at')])
            ->orderBy('family')
            ->orderBy('name')
            ->get();

        return $flows;
    }

    public function testCount(Flow $flow): int
    {
        return $flow->tests()->count();
    }

    /** @param  array<string, mixed>  $data */
    public function create(array $data): Flow
    {
        return Flow::query()->create($data);
    }

    /** @param  array<string, mixed>  $data */
    public function update(Flow $flow, array $data): Flow
    {
        $flow->update($data);

        return $flow;
    }

    /** @param  array<string, mixed>  $data */
    public function upsertByFamily(string $family, array $data): Flow
    {
        return Flow::query()->firstOrCreate(['family' => $family], $data);
    }
}
