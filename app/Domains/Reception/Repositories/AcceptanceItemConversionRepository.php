<?php

declare(strict_types=1);

namespace App\Domains\Reception\Repositories;

use App\Domains\Reception\Models\AcceptanceItemConversion;

class AcceptanceItemConversionRepository
{
    public function create(array $fields): AcceptanceItemConversion
    {
        return AcceptanceItemConversion::create($fields);
    }
}
