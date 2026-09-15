<?php

declare(strict_types=1);

namespace App\Domains\Attendance\DTOs;

/**
 * How an Excel import of punches came out.
 */
final readonly class PunchImportResult
{
    /**
     * @param  list<string>  $errors  rows that were skipped, and why
     * @param  list<string>  $columns  the headings the punches were read from
     * @param  list<string>  $unmatchedIds  imported Employee IDs that belong to no LIS user
     */
    public function __construct(
        public int $imported,
        public int $duplicates,
        public array $errors,
        public array $columns,
        public array $unmatchedIds,
    ) {}

    /**
     * One message for the person who imported, e.g. "Imported 118 punches from Employee ID, Access
     * Date and Time. Skipped 2 duplicates. 3 rows could not be read."
     */
    public function summary(): string
    {
        $parts = [sprintf(
            'Imported %d %s from %s.',
            $this->imported,
            $this->imported === 1 ? 'punch' : 'punches',
            implode(', ', $this->columns),
        )];

        if ($this->duplicates > 0) {
            $parts[] = sprintf('Skipped %d %s.', $this->duplicates, $this->duplicates === 1 ? 'duplicate' : 'duplicates');
        }

        if ($this->errors !== []) {
            $count = count($this->errors);
            $parts[] = sprintf('%d %s could not be read.', $count, $count === 1 ? 'row' : 'rows');
        }

        if ($this->unmatchedIds !== []) {
            $shown = array_slice($this->unmatchedIds, 0, 5);
            $more = count($this->unmatchedIds) - count($shown);
            $parts[] = sprintf(
                'No user has Employee ID %s%s yet; set it on their user page.',
                implode(', ', $shown),
                $more > 0 ? " or $more more" : '',
            );
        }

        return implode(' ', $parts);
    }
}
