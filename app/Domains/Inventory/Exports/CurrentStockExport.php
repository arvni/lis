<?php

namespace App\Domains\Inventory\Exports;

use App\Domains\Inventory\Models\Item;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;

class CurrentStockExport implements FromCollection, WithHeadings, WithMapping, WithTitle, ShouldAutoSize
{
    public function __construct(private ?int $storeId = null) {}

    public function collection(): Collection
    {
        return Item::with(['defaultUnit', 'unitConversions'])
            ->active()
            ->withSum(['lots' => fn($q) => $q->where('status', 'ACTIVE')
                ->when($this->storeId, fn($q2) => $q2->where('store_id', $this->storeId))
            ], 'quantity_base_units')
            ->get();
    }

    public function headings(): array
    {
        return ['Item Code', 'Item Name', 'Department', 'Material Type', 'Default Unit', 'Qty (Base Units)', 'Min Stock Level', 'Status'];
    }

    public function map($item): array
    {
        $qty = (float) ($item->lots_sum_quantity_base_units ?? 0);
        $isLow = $item->minimum_stock_level > 0 && $qty < (float) $item->minimum_stock_level;
        return [
            $item->item_code,
            $item->name,
            $item->department,
            $item->material_type,
            $item->defaultUnit?->name,
            $qty,
            (float) $item->minimum_stock_level,
            $isLow ? 'LOW STOCK' : 'OK',
        ];
    }

    public function title(): string
    {
        return 'Current Stock';
    }
}
