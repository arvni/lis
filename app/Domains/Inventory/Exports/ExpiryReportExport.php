<?php

namespace App\Domains\Inventory\Exports;

use App\Domains\Inventory\Models\StockLot;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;

class ExpiryReportExport implements FromCollection, WithHeadings, WithMapping, WithTitle, ShouldAutoSize
{
    public function __construct(private ?int $storeId = null, private int $days = 90) {}

    public function collection(): Collection
    {
        return StockLot::with(['item', 'store', 'location'])
            ->where('status', 'ACTIVE')
            ->where('quantity_base_units', '>', 0)
            ->whereNotNull('expiry_date')
            ->when($this->storeId, fn($q) => $q->where('store_id', $this->storeId))
            ->whereDate('expiry_date', '<=', now()->addDays($this->days))
            ->orderBy('expiry_date')
            ->get();
    }

    public function headings(): array
    {
        return ['Item Code', 'Item Name', 'Lot #', 'Brand', 'Expiry Date', 'Days Left', 'Qty (Base)', 'Store', 'Location', 'Status'];
    }

    public function map($lot): array
    {
        $daysLeft = (int) now()->startOfDay()->diffInDays($lot->expiry_date, false);
        return [
            $lot->item?->item_code,
            $lot->item?->name,
            $lot->lot_number,
            $lot->brand,
            $lot->expiry_date->format('Y-m-d'),
            $daysLeft,
            (float) $lot->quantity_base_units,
            $lot->store?->name,
            $lot->location?->label,
            $daysLeft < 0 ? 'EXPIRED' : ($daysLeft <= 30 ? 'CRITICAL' : 'EXPIRING SOON'),
        ];
    }

    public function title(): string
    {
        return 'Expiry Report';
    }
}
