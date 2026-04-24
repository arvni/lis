<?php

namespace App\Domains\Monitoring\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithTitle;

class NodeSamplesExport implements FromArray, WithHeadings, WithTitle, ShouldAutoSize
{
    public function __construct(
        private array  $samples,
        private string $nodeName,
        private bool   $hasHumidity,
    ) {}

    public function array(): array
    {
        return collect($this->samples)->map(function (array $s) {
            $row = [
                date('Y-m-d H:i:s', $s['time']),
                isset($s['data']['tm']) ? round($s['data']['tm'] / 100, 2) : null,
            ];

            if ($this->hasHumidity) {
                $row[] = isset($s['data']['hu']) ? round($s['data']['hu'] / 100, 2) : null;
            }

            return $row;
        })->toArray();
    }

    public function headings(): array
    {
        $headings = ['Time', 'Temperature (°C)'];

        if ($this->hasHumidity) {
            $headings[] = 'Humidity (%)';
        }

        return $headings;
    }

    public function title(): string
    {
        return substr($this->nodeName, 0, 31);
    }
}
