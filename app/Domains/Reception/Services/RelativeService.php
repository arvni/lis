<?php

namespace App\Domains\Reception\Services;

use App\Domains\Reception\DTOs\RelativeDTO;
use App\Domains\Reception\Models\Relative;

class RelativeService
{
    public function makeRelative(RelativeDTO $relativeDTO): void
    {

        Relative::create($relativeDTO->toArray());
    }

    public function updateRelation(Relative $relative, RelativeDTO $relativeDTO): void
    {
        $relative->update($relativeDTO->toArray());
    }

    public function deleteRelation(Relative $relative): void
    {
        $relative->delete();
    }

}
