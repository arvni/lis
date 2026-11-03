<?php

namespace Tests\Unit\Reception;

use App\Domains\Laboratory\Enums\MethodPriceType;
use App\Domains\Reception\Services\AcceptanceItemConversionService;
use ReflectionMethod;
use Tests\TestCase;

/**
 * The pricing cascade's price-type dispatch in AcceptanceItemConversionService. The
 * formula and condition evaluation it delegates to is covered by
 * Tests\Unit\Shared\PriceFormulaTest.
 */
class AcceptanceItemConversionServiceTest extends TestCase
{
    private AcceptanceItemConversionService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = app(AcceptanceItemConversionService::class);
    }

    /** @param mixed ...$args */
    private function invoke(string $method, ...$args): mixed
    {
        $ref = new ReflectionMethod(AcceptanceItemConversionService::class, $method);
        $ref->setAccessible(true);

        return $ref->invoke($this->service, ...$args);
    }

    // ---------------------------------------------------------------------
    // resolvePrice — dispatches on price type (enum or its string value).
    // ---------------------------------------------------------------------

    public function test_resolve_price_fix_returns_static_price(): void
    {
        $this->assertSame(250.0, $this->invoke('resolvePrice', MethodPriceType::FIX, 250, [], []));
        // String value of the enum resolves the same way.
        $this->assertSame(250.0, $this->invoke('resolvePrice', 'Fix', 250, [], []));
    }

    public function test_resolve_price_formulate_evaluates_formula(): void
    {
        $extra = [
            'formula' => 'weight * 3',
            'parameters' => [['value' => 'weight']],
        ];

        $this->assertSame(225.0, $this->invoke('resolvePrice', MethodPriceType::FORMULATE, 0, $extra, ['weight' => 75]));
    }

    public function test_resolve_price_conditional_evaluates_conditions(): void
    {
        $extra = [
            'parameters' => [['value' => 'weight']],
            'conditions' => [
                ['condition' => 'weight > 50', 'value' => '200'],
            ],
        ];

        $this->assertSame(200.0, $this->invoke('resolvePrice', MethodPriceType::CONDITIONAL, 0, $extra, ['weight' => 75]));
    }

    public function test_resolve_price_unknown_type_falls_back_to_static_price(): void
    {
        // A null/unrecognised price type defaults to the static price.
        $this->assertSame(99.0, $this->invoke('resolvePrice', null, 99, [], []));
        $this->assertSame(99.0, $this->invoke('resolvePrice', 'nonsense', 99, [], []));
    }
}
