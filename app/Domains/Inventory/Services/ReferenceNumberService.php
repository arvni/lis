<?php

namespace App\Domains\Inventory\Services;

use App\Domains\Inventory\Enums\TransactionType;
use App\Domains\Inventory\Models\StockTransaction;

readonly class ReferenceNumberService
{
    /**
     * Generate a unique reference number per transaction type and year.
     * Format: {PREFIX}-{YYYY}-{XXXXXX}
     * Example: ENT-2025-000001
     */
    public function generate(TransactionType $type): string
    {
        $prefix = $type->referencePrefix();
        $year   = now()->year;
        $pattern = "{$prefix}-{$year}-";

        $last = StockTransaction::where('reference_number', 'like', $pattern . '%')
            ->orderByDesc('reference_number')
            ->lockForUpdate()
            ->value('reference_number');

        $next = $last ? ((int) substr($last, strlen($pattern))) + 1 : 1;

        return $pattern . str_pad($next, 6, '0', STR_PAD_LEFT);
    }
}
