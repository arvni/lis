<?php

namespace App\Domains\Reception\Services;

use App\Domains\Reception\Models\Tag;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class TagService
{
    public function listTags(array $queryData = []): Collection
    {
        $query = Tag::query()->orderBy('name');

        if (!empty($queryData['filters']['search'])) {
            $query->search($queryData['filters']['search']);
        } elseif (!empty($queryData['search'])) {
            $query->search($queryData['search']);
        }

        return $query
            ->limit($queryData['pageSize'] ?? 50)
            ->get();
    }

    public function syncTags(Model $taggable, array $tagNames): Collection
    {
        $tagIds = collect($tagNames)
            ->map(fn($name) => $this->findOrCreateByName($name)->id)
            ->unique()
            ->values()
            ->all();

        $taggable->tags()->sync($tagIds);

        return $taggable->tags()->orderBy('name')->get();
    }

    private function findOrCreateByName(string $name): Tag
    {
        $name = preg_replace('/\s+/', ' ', trim($name));

        if ($name === '' || ! Tag::isValidName($name)) {
            throw ValidationException::withMessages([
                'tags' => 'Tags may only contain letters, numbers, and spaces.',
            ]);
        }

        $normalizedName = Tag::normalizeName($name);

        return DB::transaction(function () use ($name, $normalizedName) {
            $tag = Tag::query()
                ->where('normalized_name', $normalizedName)
                ->lockForUpdate()
                ->first();

            if ($tag) {
                return $tag;
            }

            return Tag::query()->create([
                'name' => $name,
                'normalized_name' => $normalizedName,
            ]);
        });
    }
}
