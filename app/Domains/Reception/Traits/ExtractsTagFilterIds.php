<?php

namespace App\Domains\Reception\Traits;

trait ExtractsTagFilterIds
{
    protected function extractTagFilterIds(array $filters): array
    {
        $tags = $filters['tags'] ?? $filters['tag'] ?? [];

        if (isset($filters['tag_id'])) {
            $tags = array_merge((array) $tags, [(int) $filters['tag_id']]);
        }

        return collect((array) $tags)
            ->map(fn($tag) => is_array($tag) ? ($tag['id'] ?? null) : $tag)
            ->filter(fn($id) => is_numeric($id))
            ->map(fn($id) => (int) $id)
            ->unique()
            ->values()
            ->all();
    }
}
