<?php

namespace App\Domains\Shared\Contracts;

use Illuminate\Support\Collection;

interface SectionLookupInterface
{
    public function getSectionNames(): Collection;

    public function getSectionGroupNames(): Collection;
}
