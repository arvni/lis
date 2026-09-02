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

    public function test_capped_shares_never_pass_their_price(): void
    {
        // The reported case: a 10 panel over 3 items prices them 4/3/3, so an
        // uncapped 100% discount handed the 3 items 3.334 and blew up every
        // `price - discount` aggregate that touched them.
        $prices = AmountDistributor::distribute(10, 3);
        $shares = AmountDistributor::distributeCapped(10, $prices);

        $this->assertSame([4.0, 3.0, 3.0], $shares);
        $this->assertSame(10.0, array_sum($shares));

        foreach ($shares as $index => $share) {
            $this->assertLessThanOrEqual($prices[$index], $share);
        }
    }

    public function test_capped_split_keeps_its_total_when_nothing_hits_a_cap(): void
    {
        $shares = AmountDistributor::distributeCapped(10, [100.0, 100.0, 100.0]);

        $this->assertSame([3.334, 3.333, 3.333], $shares);
        $this->assertSame(10.0, round(array_sum($shares), AmountDistributor::DISCOUNT_DECIMALS));
    }

    public function test_capped_split_pushes_the_excess_onto_the_parts_with_room(): void
    {
        $shares = AmountDistributor::distributeCapped(30, [2.0, 50.0, 50.0]);

        $this->assertSame([2.0, 14.0, 14.0], $shares);
        $this->assertSame(30.0, array_sum($shares));
    }

    public function test_capped_split_cannot_exceed_the_sum_of_the_caps(): void
    {
        $shares = AmountDistributor::distributeCapped(100, [3.0, 4.0]);

        $this->assertSame([3.0, 4.0], $shares);
    }

    public function test_capped_split_treats_a_negative_total_as_nothing(): void
    {
        $this->assertSame([0.0, 0.0], AmountDistributor::distributeCapped(-5, [3.0, 4.0]));
    }

    public function test_capped_split_without_caps_produces_nothing(): void
    {
        $this->assertSame([], AmountDistributor::distributeCapped(140, []));
    }
}
