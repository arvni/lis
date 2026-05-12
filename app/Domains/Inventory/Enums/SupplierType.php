<?php

namespace App\Domains\Inventory\Enums;

use App\Domains\Shared\Traits\HasSelectOptions;
use Kongulov\Traits\InteractWithEnum;

enum SupplierType: string
{
    use InteractWithEnum, HasSelectOptions;

    case LOCAL         = 'Local';
    case INTERNATIONAL = 'International';

    public function label(): string
    {
        return match($this) {
            self::LOCAL         => 'Local',
            self::INTERNATIONAL => 'International',
        };
    }
}
