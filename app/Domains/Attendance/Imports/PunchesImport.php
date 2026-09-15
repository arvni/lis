<?php

declare(strict_types=1);

namespace App\Domains\Attendance\Imports;

use Maatwebsite\Excel\Concerns\ToArray;

/**
 * Reads the raw cells of an uploaded punches file; PunchSheetParser makes sense of them.
 * Only the first sheet is kept, and heading detection is left to the parser because
 * exported reports often have title rows above the headings.
 */
class PunchesImport implements ToArray
{
    /** @var list<list<mixed>>|null */
    private ?array $rows = null;

    /**
     * @param  array<int, array<int, mixed>>  $array
     */
    public function array(array $array): void
    {
        $this->rows ??= array_values(array_map(array_values(...), $array));
    }

    /**
     * @return list<list<mixed>>
     */
    public function rows(): array
    {
        return $this->rows ?? [];
    }
}
