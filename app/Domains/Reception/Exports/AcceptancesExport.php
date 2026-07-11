<?php

namespace App\Domains\Reception\Exports;

use App\Domains\Reception\Models\Acceptance;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class AcceptancesExport implements
    FromCollection,
    WithHeadings,
    WithMapping,
    ShouldAutoSize,
    WithStyles
{
    private const HEADER_COLOR = '0361ac';
    private const HEADER_TEXT  = 'ffffff';

    public function __construct(private readonly Collection $acceptances) {}

    public function collection(): Collection
    {
        return $this->acceptances;
    }

    public function headings(): array
    {
        return [
            'ID',
            'Patient Name',
            'Patient ID',
            'Referrer',
            'Barcodes',
            'Tags',
            'Out-Patient',
            'Remaining (OMR)',
            'Status',
            'Est. Report Date',
            'Registered At',
            'Published At',
            'How Found Us',
            'Tests',
        ];
    }

    /** @param  Acceptance  $row */
    public function map($row): array
    {
        $remaining = ($row->payable_amount ?? 0) - ($row->payments_sum_price ?? 0);

        $reportDate = $row->report_date
            ? Carbon::parse($row->report_date)->toDateString()
            : null;

        $barcodes = collect($row->samples ?? [])->pluck('barcode')->filter()->join(', ');
        $tags = collect($row->tags ?? [])->pluck('name')->filter()->join(', ');

        return [
            $row->id,
            $row->patient_fullname,
            $row->patient_idno,
            $row->referrer_fullname,
            $barcodes,
            $tags,
            $row->out_patient ? 'Out-Patient' : 'In-Patient',
            number_format((float) $remaining, 3),
            $row->status instanceof \BackedEnum ? $row->status->value : $row->status,
            $reportDate ?? '',
            $this->formatDateTime($row->created_at),
            $row->published_at ? $this->formatDateTime($row->published_at) : '',
            $row->how_found_us ?? '',
            $this->formatTests($row),
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        $sheet->setAutoFilter('A1:N1');

        return [
            1 => [
                'font' => [
                    'bold'  => true,
                    'color' => ['rgb' => self::HEADER_TEXT],
                ],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'color'    => ['rgb' => self::HEADER_COLOR],
                ],
            ],
        ];
    }

    private function formatTests(Acceptance $row): string
    {
        $items = $row->acceptanceItems ?? collect();

        $standalone  = $items->whereNull('panel_id');
        $panelGroups = $items->whereNotNull('panel_id')->groupBy('panel_id');

        $parts = [];

        foreach ($standalone as $item) {
            $name = $item->methodTest?->test?->name;
            if ($name) $parts[] = $name;
        }

        foreach ($panelGroups as $panelItems) {
            $panelName = $panelItems->first()->panelTest?->name;
            $testNames = $panelItems
                ->map(fn($i) => $i->methodTest?->test?->name)
                ->filter()
                ->join(' + ');

            $parts[] = $panelName
                ? "{$panelName} ({$testNames})"
                : "Panel ({$testNames})";
        }

        return implode(', ', array_unique($parts));
    }

    private function formatDateTime(mixed $value): string
    {
        if (!$value) return '';
        return Carbon::parse($value)->format('Y-m-d H:i');
    }
}
