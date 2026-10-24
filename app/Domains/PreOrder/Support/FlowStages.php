<?php

declare(strict_types=1);

namespace App\Domains\PreOrder\Support;

use App\Domains\PreOrder\Enums\PreOrderStage;
use App\Domains\PreOrder\Enums\StageMode;
use App\Domains\PreOrder\Models\PreOrder;

/**
 * Which library stages a pre-order walks through, read from the flow stages it copied when its
 * main test was chosen. Before that (no flow yet) only the always-on stages apply.
 */
final class FlowStages
{
    /**
     * Stages whose machinery ships in a later phase: finance (phase 2), the pre-test workup and
     * sample batches (phase 3). Until then they are skipped even when a flow switches them on,
     * so a seeded PGT-M flow still runs end to end on the phase-1 path.
     *
     * @var list<PreOrderStage>
     */
    private const NOT_YET_AVAILABLE = [
        PreOrderStage::AWAITING_FINANCE,
        PreOrderStage::FINANCE_VERIFY,
        PreOrderStage::AWAITING_PRE_SAMPLES,
        PreOrderStage::PRE_RECEIVED,
        PreOrderStage::PRE_IN_PROGRESS,
        PreOrderStage::PRE_COMPLETED,
        PreOrderStage::BATCH_OPEN,
        PreOrderStage::READY_FOR_TESTING,
    ];

    public static function uses(PreOrder $preOrder, PreOrderStage $stage): bool
    {
        if ($stage->isAlwaysOn()) {
            return true;
        }
        if (in_array($stage, self::NOT_YET_AVAILABLE, true)) {
            return false;
        }

        $entry = self::entry($preOrder, $stage);

        // Rules arrive with the stages they guard (phase 2/3); an unknown rule keeps the stage off.
        return ($entry['mode'] ?? StageMode::OFF->value) === StageMode::ON->value;
    }

    /** The stages this pre-order uses, in library order. @return list<PreOrderStage> */
    public static function used(PreOrder $preOrder): array
    {
        return array_values(array_filter(PreOrderStage::cases(), fn (PreOrderStage $s) => self::uses($preOrder, $s)));
    }

    /** The first used stage after $from, or null at the end. */
    public static function nextAfter(PreOrder $preOrder, PreOrderStage $from): ?PreOrderStage
    {
        foreach (self::used($preOrder) as $stage) {
            if ($stage->rank() > $from->rank()) {
                return $stage;
            }
        }

        return null;
    }

    /** The center-facing label, honouring the flow's override. */
    public static function label(PreOrder $preOrder, PreOrderStage $stage): string
    {
        $label = self::entry($preOrder, $stage)['label_en'] ?? null;

        return is_string($label) && $label !== '' ? $label : $stage->label();
    }

    /** @return array<string, mixed> */
    private static function entry(PreOrder $preOrder, PreOrderStage $stage): array
    {
        foreach ($preOrder->flow_stages ?? [] as $entry) {
            if (($entry['stage'] ?? null) === $stage->value) {
                return $entry;
            }
        }

        return [];
    }
}
