<?php

declare(strict_types=1);

namespace App\Domains\PreOrder\Support;

use App\Domains\PreOrder\Enums\BatchMode;
use App\Domains\PreOrder\Enums\PreOrderStage as S;
use App\Domains\PreOrder\Enums\StageMode;
use App\Domains\PreOrder\Exceptions\PreOrderRuleException;

/**
 * Turns what an admin set in the flow builder into a flow's stage list. Shapes are checked by
 * the request; this keeps the parts that only make sense together consistent: every library
 * stage once and in order, always-on stages on, the pre-test stages and the batch stages each
 * switched as one group, and only the rules the workflow knows.
 */
final class FlowDefinition
{
    /** The rule each optional stage may use instead of a fixed on/off. */
    public const RULES = [
        'AWAITING_FINANCE' => 'finance_required',
        'AWAITING_PRE_SAMPLES' => 'pre_test_items',
    ];

    private const PRE_TEST = [S::AWAITING_PRE_SAMPLES, S::PRE_RECEIVED, S::PRE_IN_PROGRESS, S::PRE_COMPLETED];

    private const BATCHES = [S::BATCH_OPEN, S::READY_FOR_TESTING];

    /** Copied as given when set: per-stage wording, timing and required files. */
    private const TEXT_FIELDS = ['label_en', 'label_ar', 'action_en', 'action_ar'];

    /**
     * @param  array<string, array<string, mixed>>  $input  keyed by stage code
     * @return list<array<string, mixed>>
     */
    public static function normalise(array $input): array
    {
        $groupMode = fn (S $leader) => (string) ($input[$leader->value]['mode'] ?? StageMode::OFF->value);
        $stages = [];

        foreach (S::cases() as $stage) {
            $given = $input[$stage->value] ?? [];
            $mode = match (true) {
                $stage->isAlwaysOn() => StageMode::ON->value,
                in_array($stage, self::PRE_TEST, true) => $groupMode(S::AWAITING_PRE_SAMPLES),
                in_array($stage, self::BATCHES, true) => $groupMode(S::BATCH_OPEN),
                default => (string) ($given['mode'] ?? StageMode::OFF->value),
            };
            $rule = in_array($stage, self::PRE_TEST, true) ? self::RULES['AWAITING_PRE_SAMPLES'] : (self::RULES[$stage->value] ?? null);
            if ($mode === StageMode::RULE->value && $rule === null) {
                throw new PreOrderRuleException("{$stage->label()} can only be on or off.");
            }
            if ($stage === S::AWAITING_FINANCE && $mode === StageMode::ON->value) {
                // Finance opens only when a quotation is needed; "on" means "when the rules say so".
                $mode = StageMode::RULE->value;
            }

            $entry = ['stage' => $stage->value, 'mode' => $mode];
            if ($mode === StageMode::RULE->value) {
                $entry['rule'] = $rule;
            }
            foreach (self::TEXT_FIELDS as $field) {
                $value = trim((string) ($given[$field] ?? ''));
                if ($value !== '') {
                    $entry[$field] = $value;
                }
            }
            $remind = self::hours($given['remind_after_hours'] ?? null);
            $escalate = self::hours($given['escalate_after_hours'] ?? null);
            if ($remind !== null && $escalate !== null && $escalate <= $remind) {
                throw new PreOrderRuleException("{$stage->label()}: escalate later than the reminder.");
            }
            $entry += array_filter(['remind_after_hours' => $remind, 'escalate_after_hours' => $escalate], fn ($v) => $v !== null);
            $documents = array_values(array_unique(array_map('strval', (array) ($given['required_documents'] ?? []))));
            if ($documents !== []) {
                $entry['required_documents'] = $documents;
            }

            if ($stage === S::AWAITING_SAMPLES && $groupMode(S::BATCH_OPEN) !== StageMode::OFF->value) {
                $entry['batch_mode'] = (BatchMode::tryFrom((string) ($given['batch_mode'] ?? '')) ?? BatchMode::PER_BATCH)->value;
                $entry['center_can_close'] = (bool) ($given['center_can_close'] ?? false);
            }

            $stages[] = $entry;
        }

        return $stages;
    }

    /**
     * The stage list keyed by code, as the builder edits it.

     *

     * @param  list<array<string, mixed>>  $stages  @return array<string, array<string, mixed>>
     */
    public static function keyed(array $stages): array
    {
        $keyed = [];
        foreach ($stages as $entry) {
            $keyed[(string) $entry['stage']] = $entry;
        }

        return $keyed;
    }

    private static function hours(mixed $value): ?int
    {
        return $value === null || $value === '' ? null : max(1, (int) $value);
    }
}
