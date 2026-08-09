<?php

declare(strict_types=1);

namespace Tests\Unit\Shared;

use App\Domains\Shared\Helpers\AmountDistributor;
use PHPUnit\Framework\TestCase;

/**
 * The whole point of the helper is that the shares add back up to the total,
 * so every case asserts the sum as well as the shape of the split.
 */
class AmountDistributorTest extends TestCase
{
    public function test_splits_evenly_when_the_total_divides(): void
    {
        $this->assertSame([50.0, 50.0, 50.0], AmountDistributor::distribute(150, 3));
    }

    public function test_indivisible_total_keeps_its_sum(): void
    {
        // The reported case: 140 over 3 items must not become 3 x 46.67 = 140.01.
        $shares = AmountDistributor::distribute(140, 3);

        $this->assertSame([47.0, 47.0, 46.0], $shares);
        $this->assertSame(140.0, array_sum($shares));
    }

    public function test_respects_the_requested_precision(): void
    {
        $shares = AmountDistributor::distribute(140, 3, AmountDistributor::DISCOUNT_DECIMALS);

        $this->assertSame([46.667, 46.667, 46.666], $shares);
        $this->assertSame(140.0, round(array_sum($shares), AmountDistributor::DISCOUNT_DECIMALS));
    }

    public function test_single_part_gets_the_whole_total(): void
    {
        $this->assertSame([140.0], AmountDistributor::distribute(140, 1));
    }

    public function test_zero_total_produces_zero_shares(): void
    {
        $this->assertSame([0.0, 0.0], AmountDistributor::distribute(0, 2));
    }

    public function test_non_positive_part_count_produces_nothing(): void
    {
        $this->assertSame([], AmountDistributor::distribute(140, 0));
    }

    public function test_more_parts_than_units_spreads_the_units(): void
    {
        $shares = AmountDistributor::distribute(2, 5);

        $this->assertSame([1.0, 1.0, 0.0, 0.0, 0.0], $shares);
        $this->assertSame(2.0, array_sum($shares));
    }
}
