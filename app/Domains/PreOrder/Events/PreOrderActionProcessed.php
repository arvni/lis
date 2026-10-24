<?php

declare(strict_types=1);

namespace App\Domains\PreOrder\Events;

use App\Domains\PreOrder\Models\PreOrderAction;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PreOrderActionProcessed
{
    use Dispatchable, SerializesModels;

    public function __construct(public PreOrderAction $action) {}
}
