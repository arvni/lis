<?php

declare(strict_types=1);

namespace Tests\Unit\Billing;

use App\Domains\Billing\Support\CardSerialGenerator;
use Tests\TestCase;

class CardSerialGeneratorTest extends TestCase
{
    private CardSerialGenerator $generator;

    protected function setUp(): void
    {
        parent::setUp();
        $this->generator = new CardSerialGenerator;
    }

    public function test_series_carries_the_prefix_and_the_current_month(): void
    {
        $series = $this->generator->generateSeries('acme');

        $this->assertStringStartsWith('ACME-'.now()->format('Ym').'-', $series);
    }

    public function test_series_falls_back_to_a_default_head_without_a_prefix(): void
    {
        $this->assertStringStartsWith('CARD-', $this->generator->generateSeries(null));
    }

    public function test_two_series_for_the_same_prefix_and_month_differ(): void
    {
        $this->assertNotSame(
            $this->generator->generateSeries('acme'),
            $this->generator->generateSeries('acme')
        );
    }

    public function test_card_number_zero_pads_the_serial(): void
    {
        $this->assertSame('ACME-202608-AAAA-00042', $this->generator->numberFor('ACME-202608-AAAA', 42));
    }
}
