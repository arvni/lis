<?php

declare(strict_types=1);

namespace App\Domains\PreOrder\Support;

use App\Domains\PreOrder\Enums\BatchMode;
use App\Domains\PreOrder\Enums\PreOrderStage;
use App\Domains\PreOrder\Enums\StageMode;
use App\Domains\PreOrder\Models\PreOrder;
use App\Domains\PreOrder\Models\PreOrderItem;
use App\Domains\PreOrder\Models\PreOrderQuotation;

/**
 * Which library stages a pre-order walks through, read from the flow stages it copied when its
 * main test was chosen. Before that (no flow yet) only the always-on stages apply.
 */
final class FlowStages
{
    public static function uses(PreOrder $preOrder, PreOrderStage $stage): bool
    {
        if ($stage->isAlwaysOn()) {
            return true;
        }
        $entry = self::entry($preOrder, $stage);
        $mode = $entry['mode'] ?? StageMode::OFF->value;
        if ($mode === StageMode::RULE->value) {
            return self::ruleHolds($preOrder, (string) ($entry['rule'] ?? ''));
        }

        return $mode === StageMode::ON->value;
    }

    /** Finance runs unless the flow switched it off; whether a case needs it is FinanceRules' call. */
    public static function financeEnabled(PreOrder $preOrder): bool
    {
        return (self::entry($preOrder, PreOrderStage::AWAITING_FINANCE)['mode'] ?? StageMode::OFF->value) !== StageMode::OFF->value;
    }

    /** The flow always starts with a pre-test workup (PGT-M), so BION must mark its tests. */
    public static function requiresPreTest(PreOrder $preOrder): bool
    {
        return (self::entry($preOrder, PreOrderStage::AWAITING_PRE_SAMPLES)['mode'] ?? null) === StageMode::ON->value;
    }

    /** BION can mark pre-tests: the flow has a pre-test workup, always or when tests are marked. */
    public static function preTestEnabled(PreOrder $preOrder): bool
    {
        return (self::entry($preOrder, PreOrderStage::AWAITING_PRE_SAMPLES)['mode'] ?? StageMode::OFF->value) !== StageMode::OFF->value;
    }

    /** How later batches reach the lab: their own order, or more samples for the first one. */
    public static function batchMode(PreOrder $preOrder): BatchMode
    {
        return BatchMode::tryFrom((string) (self::entry($preOrder, PreOrderStage::AWAITING_SAMPLES)['batch_mode'] ?? '')) ?? BatchMode::PER_BATCH;
    }

    /** The center may say "no more batches" itself; otherwise only BION closes them. */
    public static function centerCanClose(PreOrder $preOrder): bool
    {
        return (bool) (self::entry($preOrder, PreOrderStage::AWAITING_SAMPLES)['center_can_close'] ?? false);
    }

    /** An unknown rule keeps its stage off. */
    private static function ruleHolds(PreOrder $preOrder, string $rule): bool
    {
        return match ($rule) {
            // On once the tests BION confirmed went to the center as a quotation.
            'finance_required' => $preOrder->exists && $preOrder->quotations->contains(fn (PreOrderQuotation $q) => $q->request_id === null),
            // On when BION marked prerequisite tests (e.g. familial variant confirmation).
            'pre_test_items' => $preOrder->exists && $preOrder->items->contains(fn (PreOrderItem $i) => $i->isPreTest()),
            default => false,
        };
    }

    /**
     * The stages this pre-order uses, in library order.

     *

     * @return list<PreOrderStage>
     */
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

    /** What the center should do next, honouring the flow's wording. */
    public static function nextAction(PreOrder $preOrder, PreOrderStage $stage, string $locale = 'en'): ?string
    {
        $text = self::entry($preOrder, $stage)["action_$locale"] ?? null;

        return is_string($text) && $text !== '' ? $text : ($locale === 'en' ? $stage->nextAction() : null);
    }

    /** The Arabic label, when the flow gives one. */
    public static function labelAr(PreOrder $preOrder, PreOrderStage $stage): ?string
    {
        $label = self::entry($preOrder, $stage)['label_ar'] ?? null;

        return is_string($label) && $label !== '' ? $label : null;
    }

    /**
     * Document tags the center is asked for at this stage.

     *

     * @return list<string>
     */
    public static function requiredDocuments(PreOrder $preOrder, PreOrderStage $stage): array
    {
        return array_values(array_map('strval', (array) (self::entry($preOrder, $stage)['required_documents'] ?? [])));
    }

    /**
     * Hours in the stage before a reminder, and before escalating to the team leads.

     *

     * @return array{0: int|null, 1: int|null}
     */
    public static function reminderHours(PreOrder $preOrder, PreOrderStage $stage): array
    {
        $entry = self::entry($preOrder, $stage);
        $hours = fn (string $key) => isset($entry[$key]) ? max(1, (int) $entry[$key]) : null;

        return [$hours('remind_after_hours'), $hours('escalate_after_hours')];
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
