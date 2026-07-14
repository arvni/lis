<?php

declare(strict_types=1);

namespace App\Domains\Reception\Traits;

trait ExtractsTestFilterIds
{
    /**
     * Normalize the `tests` filter (array of ids or {id,...} objects) to a list of int ids.
     *
     * @return array<int, int>
     */
    protected function extractTestFilterIds(array $filters): array
    {
        $tests = $filters['tests'] ?? $filters['test'] ?? [];

        if (isset($filters['test_id'])) {
            $tests = array_merge((array) $tests, [(int) $filters['test_id']]);
        }

        return collect((array) $tests)
            ->map(fn ($test) => is_array($test) ? ($test['id'] ?? null) : $test)
            ->filter(fn ($id) => is_numeric($id))
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values()
            ->all();
    }
}
