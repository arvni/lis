<?php

declare(strict_types=1);

namespace App\Domains\Document\Repositories;

use App\Domains\Document\Models\Document;
use Illuminate\Database\Eloquent\Collection;

class DocumentRepository
{
    /**
     * @param  list<string>  $hashes
     * @return Collection<int, Document>
     */
    public function getByHashes(array $hashes): Collection
    {
        return Document::query()->whereIn('hash', $hashes)->get();
    }
}
