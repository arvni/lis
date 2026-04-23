<?php

namespace App\Domains\Inventory\Exports;

use App\Domains\Inventory\Models\StockTransaction;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;

class TransactionHistoryExport implements FromCollection, WithHeadings, WithMapping, WithTitle, ShouldAutoSize
{
    public function __construct(
        private ?int    $storeId  = null,
        private ?string $dateFrom = null,
        private ?string $dateTo   = null,
        private ?string $type     = null,
    ) {}

    public function collection(): Collection
    {
        return StockTransaction::with(['store', 'lines.item', 'lines.unit'])
            ->where('status', 'APPROVED')
            ->when($this->storeId,  fn($q) => $q->where('store_id', $this->storeId))
            ->when($this->type,     fn($q) => $q->where('transaction_type', $this->type))
            ->when($this->dateFrom, fn($q) => $q->where('transaction_date', '>=', $this->dateFrom))
            ->when($this->dateTo,   fn($q) => $q->where('transaction_date', '<=', $this->dateTo))
            ->orderByDesc('transaction_date')
            ->get()
            ->flatMap(function (StockTransaction $tx) {
                return $tx->lines->map(fn($line) => [
                    'tx'   => $tx,
                    'line' => $line,
                ]);
            });
    }

    public function headings(): array
    {
        return ['Date', 'Reference', 'Type', 'Store', 'Item Code', 'Item Name', 'Unit', 'Qty', 'Qty (Base)', 'Lot #', 'Total Price'];
    }

    public function map($row): array
    {
        $tx   = $row['tx'];
        $line = $row['line'];
        return [
            $tx->transaction_date->format('Y-m-d'),
            $tx->reference_number,
            $tx->transaction_type->value,
            $tx->store->name,
            $line->item?->item_code,
            $line->item?->name,
            $line->unit?->name,
            (float) $line->quantity,
            (float) $line->quantity_base_units,
            $line->lot_number,
            (float) ($line->total_price ?? 0),
        ];
    }

    public function title(): string
    {
        return 'Transaction History';
    }
}
