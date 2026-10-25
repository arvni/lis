<?php

declare(strict_types=1);

namespace App\Domains\PreOrder\Support;

use App\Domains\PreOrder\Enums\ItemStatus;
use App\Domains\PreOrder\Enums\ReleasePurpose;
use App\Domains\PreOrder\Models\PreOrder;
use App\Domains\PreOrder\Models\PreOrderItem;

/**
 * Every shipment of samples on a pre-order. Each release is the first batch of its order; later
 * batches (another cycle, a family member, a replacement) are kept in pre_orders.batches and
 * either open their own order or add samples to an order the pre-order already has.
 */
final class PreOrderBatches
{
    /** @return list<array{key: string, label: string, purpose: string, order_key: string, source?: string, replaces?: string, side?: string, by?: string|null, at?: string}> */
    public static function all(PreOrder $preOrder): array
    {
        $batches = [];
        $mainCount = 0;
        $released = $preOrder->items
            ->filter(fn (PreOrderItem $i) => $i->status === ItemStatus::RELEASED && $i->release_key !== null)
            ->groupBy('release_key')
            // In release order: the number after the letter is the shared release counter.
            ->sortBy(fn ($items, $key) => (int) preg_replace('/^.*-[A-Z]/', '', (string) $key));
        foreach ($released as $key => $items) {
            $purpose = $items->first()->release_purpose ?? ReleasePurpose::MAIN;
            $batches[] = [
                'key' => (string) $key,
                'label' => match ($purpose) {
                    ReleasePurpose::PRE_TEST => 'Pre-test samples',
                    ReleasePurpose::MAIN => 'Batch '.(++$mainCount),
                    ReleasePurpose::ADD_ON => 'Additional test',
                    ReleasePurpose::REPLACEMENT => 'Replacement',
                },
                'purpose' => $purpose->value,
                'order_key' => (string) $key,
            ];
        }
        foreach ($preOrder->batches ?? [] as $extra) {
            $batches[] = $extra;
        }

        return $batches;
    }

    /** @return array<string, mixed>|null */
    public static function find(PreOrder $preOrder, string $key): ?array
    {
        foreach (self::all($preOrder) as $batch) {
            if ($batch['key'] === $key) {
                return $batch;
            }
        }

        return null;
    }

    /** The first main release: the order later batches join, or copy their tests from. */
    public static function firstMainKey(PreOrder $preOrder): ?string
    {
        foreach (self::all($preOrder) as $batch) {
            if ($batch['purpose'] === ReleasePurpose::MAIN->value) {
                return $batch['order_key'];
            }
        }

        return null;
    }

    /** Every order the pre-order expects back from the center, placed or not. @return list<string> */
    public static function orderKeys(PreOrder $preOrder): array
    {
        return array_values(array_unique(array_column(self::all($preOrder), 'order_key')));
    }

    /** The number the next main batch gets in its default label. */
    public static function nextMainNumber(PreOrder $preOrder): int
    {
        return count(array_filter(self::all($preOrder), fn (array $b) => $b['purpose'] === ReleasePurpose::MAIN->value)) + 1;
    }
}
