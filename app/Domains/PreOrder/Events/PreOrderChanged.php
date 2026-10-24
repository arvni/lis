<?php

declare(strict_types=1);

namespace App\Domains\PreOrder\Events;

use App\Domains\PreOrder\Models\PreOrder;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PreOrderChanged
{
    use Dispatchable, SerializesModels;

    public function __construct(public PreOrder $preOrder) {}
}
