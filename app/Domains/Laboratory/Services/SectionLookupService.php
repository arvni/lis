<?php

namespace App\Domains\Laboratory\Services;

use App\Domains\Laboratory\Models\Section;
use App\Domains\Laboratory\Models\SectionGroup;
use App\Domains\Shared\Contracts\SectionLookupInterface;
use Illuminate\Support\Collection;

class SectionLookupService implements SectionLookupInterface
{
    public function getSectionNames(): Collection
    {
        return Section::all()->keyBy('id')->map(fn($item) => $item->name);
    }

    public function getSectionGroupNames(): Collection
    {
        return SectionGroup::all()->keyBy('id')->map(fn($item) => $item->name);
    }
}
