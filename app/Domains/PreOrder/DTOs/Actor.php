<?php

declare(strict_types=1);

namespace App\Domains\PreOrder\DTOs;

use App\Domains\PreOrder\Enums\Side;
use App\Domains\User\Models\User;

/** Whoever is acting on a pre-order: BION staff (an LIS user), a center user, or the system. */
final readonly class Actor
{
    public function __construct(
        public Side $side,
        public ?int $userId = null,
        public ?string $name = null,
    ) {}

    public static function bion(User $user): self
    {
        return new self(Side::BION, $user->id, $user->name);
    }

    /** A provider-panel user. Their id belongs to the panel, so it is kept only as a label. */
    public static function center(?string $name): self
    {
        return new self(Side::CENTER, null, $name);
    }

    public static function system(): self
    {
        return new self(Side::SYSTEM, null, 'System');
    }
}
