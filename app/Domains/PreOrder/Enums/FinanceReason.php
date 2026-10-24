<?php

declare(strict_types=1);

namespace App\Domains\PreOrder\Enums;

use Kongulov\Traits\InteractWithEnum;

/** Why the center has to approve the cost. With none of these, no quotation is opened. */
enum FinanceReason: string
{
    use InteractWithEnum;

    /** BION added tests the center didn't order (including every test on a "describe the case" pre-order). */
    case BION_ADDED = 'bion_added';
    /** A scope answer marked as raising the price, e.g. PGT-M with 2+ genes, HLA or linkage. */
    case SCOPE = 'scope';
    /** A re-test that adds new work, e.g. a different method. Re-draws never count. */
    case RETEST = 'retest';

    public function label(): string
    {
        return match ($this) {
            self::BION_ADDED => 'Tests added by BION',
            self::SCOPE => 'Test scope',
            self::RETEST => 'Re-test',
        };
    }
}
