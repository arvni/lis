<?php

declare(strict_types=1);

namespace App\Domains\PreOrder\Services;

use App\Domains\PreOrder\Exceptions\PreOrderRuleException;
use App\Domains\PreOrder\Models\Flow;
use App\Domains\PreOrder\Repositories\FlowRepository;
use App\Domains\PreOrder\Support\FlowDefinition;

/**
 * Admins change flows here. Publishing replaces the stage list and bumps the version: a
 * pre-order copies its flow's stages when its main test is chosen, so open pre-orders keep the
 * version they started on and only new ones follow the change.
 */
class FlowVersionService
{
    public function __construct(private readonly FlowRepository $flows) {}

    /** @param  array<string, array<string, mixed>>  $stages */
    public function publish(Flow $flow, string $name, array $stages): Flow
    {
        return $this->flows->update($flow, [
            'name' => $name,
            'stages' => FlowDefinition::normalise($stages),
            'version' => $flow->version + 1,
        ]);
    }

    /** A new flow starting from this one's stages, as version 1, for a variant of the same family. */
    public function copy(Flow $flow, string $name): Flow
    {
        return $this->flows->create([
            'name' => $name,
            'family' => $flow->family,
            'stages' => $flow->stages,
            'active' => true,
            'version' => 1,
        ]);
    }

    /** A flow still used by tests can't be switched off: their pre-orders would have nowhere to start. */
    public function setActive(Flow $flow, bool $active): Flow
    {
        if (! $active && $this->flows->testCount($flow) > 0) {
            throw new PreOrderRuleException('Tests still use this flow. Move them to another flow first.');
        }

        return $this->flows->update($flow, ['active' => $active]);
    }
}
