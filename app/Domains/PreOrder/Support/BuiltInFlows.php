<?php

declare(strict_types=1);

namespace App\Domains\PreOrder\Support;

use App\Domains\PreOrder\Enums\PreOrderStage as S;
use App\Domains\PreOrder\Enums\StageMode;

/**
 * The six flows BION starts with. Seeded as version 1; admins copy and edit them in the flow
 * builder (phase 4). Only the optional parts differ: always-on stages are listed for clarity.
 */
final class BuiltInFlows
{
    /** @return list<array{name: string, family: string, stages: list<array<string, mixed>>}> */
    public static function all(): array
    {
        return [
            ['name' => 'NIPT', 'family' => 'nipt', 'stages' => self::stages()],
            ['name' => 'Carrier couple', 'family' => 'carrier', 'stages' => self::stages(batches: 'join')],
            ['name' => 'Exome / Genome', 'family' => 'exome', 'stages' => self::stages(batches: 'join')],
            ['name' => 'Familial / prenatal', 'family' => 'familial', 'stages' => self::stages(preTest: StageMode::RULE)],
            ['name' => 'PGT-A / PGT-SR', 'family' => 'pgt_a', 'stages' => self::stages(batches: 'per_batch', label: 'Waiting for embryo samples')],
            ['name' => 'PGT-M family', 'family' => 'pgt_m', 'stages' => self::stages(preTest: StageMode::ON, batches: 'per_batch', label: 'Waiting for embryo samples')],
        ];
    }

    /** @return list<array<string, mixed>> */
    private static function stages(StageMode $preTest = StageMode::OFF, ?string $batches = null, ?string $label = null): array
    {
        $stages = [];
        foreach (S::cases() as $stage) {
            $entry = ['stage' => $stage->value, 'mode' => StageMode::ON->value];

            if (in_array($stage, [S::AWAITING_FINANCE], true)) {
                // Opened by the finance rules (BION-added tests, a scope field marked needs_finance, a re-test).
                $entry = [...$entry, 'mode' => StageMode::RULE->value, 'rule' => 'finance_required'];
            } elseif ($stage === S::FINANCE_VERIFY) {
                // The center's click is the approval; a flow can switch the second look on.
                $entry['mode'] = StageMode::OFF->value;
            } elseif (in_array($stage, [S::AWAITING_PRE_SAMPLES, S::PRE_RECEIVED, S::PRE_IN_PROGRESS, S::PRE_COMPLETED], true)) {
                $entry['mode'] = $preTest->value;
                if ($preTest === StageMode::RULE) {
                    $entry['rule'] = 'pre_test_items';
                }
            } elseif (in_array($stage, [S::BATCH_OPEN, S::READY_FOR_TESTING], true)) {
                $entry['mode'] = $batches === null ? StageMode::OFF->value : StageMode::ON->value;
            }

            if ($stage === S::AWAITING_SAMPLES && $batches !== null) {
                $entry['batch_mode'] = $batches;
                $entry['center_can_close'] = true;
            }
            if ($stage === S::AWAITING_SAMPLES && $label !== null) {
                $entry['label_en'] = $label;
            }

            $stages[] = $entry;
        }

        return $stages;
    }
}
