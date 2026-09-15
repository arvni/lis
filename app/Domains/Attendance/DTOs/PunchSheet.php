<?php

declare(strict_types=1);

namespace App\Domains\Attendance\DTOs;

/**
 * What could be read from an imported punches sheet.
 */
final readonly class PunchSheet
{
    /**
     * @param  list<ParsedPunch>  $punches
     * @param  list<string>  $errors  one message per row that could not be read
     * @param  list<string>  $columns  the headings the punches were read from, as written in the sheet
     */
    public function __construct(
        public array $punches,
        public array $errors,
        public array $columns,
    ) {}
}
