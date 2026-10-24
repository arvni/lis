<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Domains\PreOrder\Models\Flow;
use App\Domains\PreOrder\Support\BuiltInFlows;
use Illuminate\Database\Seeder;

/** The six built-in flows as version 1. Existing flows are left alone, so re-running is safe. */
class PreOrderFlowSeeder extends Seeder
{
    public function run(): void
    {
        foreach (BuiltInFlows::all() as $flow) {
            Flow::query()->firstOrCreate(
                ['family' => $flow['family']],
                ['name' => $flow['name'], 'stages' => $flow['stages'], 'active' => true, 'version' => 1],
            );
        }
    }
}
