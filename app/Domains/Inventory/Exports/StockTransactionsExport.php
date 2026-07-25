<?php

declare(strict_types=1);

namespace App\Domains\Inventory\Exports;

use App\Domains\Inventory\Models\StockTransaction;
use App\Domains\Inventory\Models\StockTransactionLine;
use Illuminate\Database\Eloquent\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class StockTransactionsExport implements FromCollection, ShouldAutoSize, WithHeadings, WithMapping, WithStyles, WithTitle
{
    private const HEADINGS = [
        'Date',
        'Reference',
        'Type',
        'Status',
        'Store',
        'Supplier',
        'Requested By',
        'Item Code',
        'Item Name',
        'Unit',
        'Quantity',
        'Quantity (Base)',
        'Unit Price',
        'Total Price',
        'Lot #',
        'Cat No',
        'Brand',
        'Expiry Date',
        'Notes',
    ];

    /**
     * @param  Collection<int, StockTransaction>  $transactions
     */
    public function __construct(private readonly Collection $transactions) {}

    /** @return Collection<int, StockTransaction> */
    public function collection(): Collection
    {
        return $this->transactions;
    }

    /**
     * One row per transaction line so quantities/prices export line-by-line.
     *
     * @return list<list<mixed>>
     */
    public function map($transaction): array
    {
        return $transaction->lines
            ->map(fn (StockTransactionLine $line): array => [
                $transaction->transaction_date?->format('Y-m-d'),
                $transaction->reference_number,
                $transaction->transaction_type->label(),
                $transaction->status->value,
                optional($transaction->store)->name,
                optional($transaction->supplier)->name,
                optional($transaction->requestedBy)->name,
                $line->item?->item_code,
                $line->item?->name,
                $line->unit?->name,
                (float) $line->quantity,
                (float) $line->quantity_base_units,
                $line->unit_price !== null ? (float) $line->unit_price : null,
                $line->total_price !== null ? (float) $line->total_price : null,
                $line->lot_number,
                $line->cat_no,
                $line->brand,
                $line->expiry_date?->format('Y-m-d'),
                $line->notes,
            ])
            ->all();
    }

    /** @return list<string> */
    public function headings(): array
    {
        return self::HEADINGS;
    }

    /** @return array<int, array<string, mixed>> */
    public function styles(Worksheet $sheet): array
    {
        $sheet->setAutoFilter('A1:S1');

        return [
            1 => [
                'font' => [
                    'bold' => true,
                    'color' => ['rgb' => 'ffffff'],
                ],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'color' => ['rgb' => '0361ac'],
                ],
            ],
        ];
    }

    public function title(): string
    {
        return 'Stock Transactions';
    }
}
