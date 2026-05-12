<?php

namespace App\Domains\Shared\Traits;

trait HasSelectOptions
{
    public static function toOptions(): array
    {
        return array_map(fn($c) => ['value' => $c->value, 'name' => $c->label()], static::cases());
    }
}
