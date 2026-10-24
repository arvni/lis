<?php

declare(strict_types=1);

namespace App\Domains\PreOrder\Services;

use App\Domains\PreOrder\Adapters\LaboratoryAdapter;
use App\Domains\PreOrder\Enums\FinanceReason;
use App\Domains\PreOrder\Enums\Side;
use App\Domains\PreOrder\Models\PreOrder;
use App\Domains\PreOrder\Models\PreOrderItem;
use Illuminate\Support\Collection;

/**
 * Decides whether a set of test lines needs the center's financial approval, and why. With no
 * reason, the lines go straight to the lab. Re-draws carry no test lines, so they never count.
 */
class FinanceRules
{
    public function __construct(private readonly LaboratoryAdapter $laboratory) {}

    /**
     * @param  Collection<int, PreOrderItem>  $items  with test loaded
     * @return list<FinanceReason>
     */
    public function reasons(PreOrder $preOrder, Collection $items, bool $retest = false): array
    {
        $reasons = [];
        // Every test on a "describe the case" pre-order is BION's choice, so it counts here too.
        if ($items->contains(fn (PreOrderItem $i) => $i->added_by === Side::BION)) {
            $reasons[] = FinanceReason::BION_ADDED;
        }
        if ($items->contains(fn (PreOrderItem $i) => $this->scopeRaisesPrice($preOrder, $i))) {
            $reasons[] = FinanceReason::SCOPE;
        }
        if ($retest && $items->isNotEmpty()) {
            $reasons[] = FinanceReason::RETEST;
        }

        return $reasons;
    }

    /** A scope answer for this line's test that is marked as raising the price. */
    private function scopeRaisesPrice(PreOrder $preOrder, PreOrderItem $item): bool
    {
        $answers = $preOrder->scope[(string) $item->test_id] ?? [];
        if (! is_array($answers)) {
            return false;
        }

        foreach ($this->laboratory->scopeFields($item->test) as $field) {
            if (! $field['needs_finance'] || ! array_key_exists($field['key'], $answers)) {
                continue;
            }
            $answer = $answers[$field['key']];
            $raises = $field['type'] === 'number'
                ? is_numeric($answer) && (int) $answer >= (int) ($field['threshold'] ?? 1)
                : filter_var($answer, FILTER_VALIDATE_BOOLEAN);
            if ($raises) {
                return true;
            }
        }

        return false;
    }
}
