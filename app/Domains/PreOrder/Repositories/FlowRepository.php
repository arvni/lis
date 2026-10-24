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

    /** @param  array<string, mixed>  $data */
    public function upsertByFamily(string $family, array $data): Flow
    {
        return Flow::query()->firstOrCreate(['family' => $family], $data);
    }
}
