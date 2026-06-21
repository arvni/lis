<?php

namespace Tests\Unit\Reception;

use App\Domains\Laboratory\Enums\MethodPriceType;
use App\Domains\Reception\Services\AcceptanceItemConversionService;
use ReflectionMethod;
use Tests\TestCase;

/**
 * Pure-logic coverage for the pricing cascade's leaf evaluators in
 * AcceptanceItemConversionService: parameter substitution, formula/conditional
 * evaluation, and — most importantly — the `eval()` safety guards that keep
 * client-supplied pricing expressions from executing arbitrary code.
 *
 * None of these helpers touch the database, so they are exercised directly via
 * reflection without booting Eloquent.
 */
class AcceptanceItemConversionServiceTest extends TestCase
{
    private AcceptanceItemConversionService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new AcceptanceItemConversionService;
    }

    /** @param mixed ...$args */
    private function invoke(string $method, ...$args): mixed
    {
        $ref = new ReflectionMethod(AcceptanceItemConversionService::class, $method);
        $ref->setAccessible(true);

        return $ref->invoke($this->service, ...$args);
    }

    // ---------------------------------------------------------------------
    // isSafeExpression — only bare numeric math may reach eval().
    // ---------------------------------------------------------------------

    public function test_is_safe_expression_allows_numeric_math(): void
    {
        $this->assertTrue($this->invoke('isSafeExpression', '1 + 2'));
        $this->assertTrue($this->invoke('isSafeExpression', '(75 * 2) / 3'));
        $this->assertTrue($this->invoke('isSafeExpression', '100'));
    }

    public function test_is_safe_expression_rejects_code_and_letters(): void
    {
        // Function calls / arbitrary code must never pass.
        $this->assertFalse($this->invoke('isSafeExpression', 'phpinfo()'));
        $this->assertFalse($this->invoke('isSafeExpression', "system('ls')"));
        // Any residual identifier (an unsubstituted param) is rejected.
        $this->assertFalse($this->invoke('isSafeExpression', 'weight'));
        // Comparison / logical operators are not arithmetic.
        $this->assertFalse($this->invoke('isSafeExpression', '5 > 3'));
        // Empty string has nothing to match.
        $this->assertFalse($this->invoke('isSafeExpression', ''));
    }

    // ---------------------------------------------------------------------
    // isSafeCondition — adds comparison/logical operators, still no letters.
    // ---------------------------------------------------------------------

    public function test_is_safe_condition_allows_comparison_and_logic(): void
    {
        $this->assertTrue($this->invoke('isSafeCondition', '75 > 50'));
        $this->assertTrue($this->invoke('isSafeCondition', '5 <= 10 || 3 == 3'));
        $this->assertTrue($this->invoke('isSafeCondition', '1 && 2'));
    }

    public function test_is_safe_condition_rejects_code(): void
    {
        $this->assertFalse($this->invoke('isSafeCondition', "system('x')"));
        $this->assertFalse($this->invoke('isSafeCondition', 'weight > 5'));
    }

    // ---------------------------------------------------------------------
    // substituteParams — name→value replacement, longest-name-first, \b-bounded.
    // ---------------------------------------------------------------------

    public function test_substitute_params_replaces_named_values(): void
    {
        $schema = [['value' => 'weight'], ['value' => 'age']];
        $values = ['weight' => 75, 'age' => 30];

        $this->assertSame('75 * 2 + 30', $this->invoke('substituteParams', 'weight * 2 + age', $schema, $values));
    }

    public function test_substitute_params_longest_name_first_avoids_partial_clobber(): void
    {
        // If 'w' were substituted before 'weight', the longer token could be
        // corrupted. Longest-first + word boundaries must keep them distinct.
        $schema = [['value' => 'w'], ['value' => 'weight']];
        $values = ['w' => 2, 'weight' => 75];

        $this->assertSame('75 + 2', $this->invoke('substituteParams', 'weight + w', $schema, $values));
    }

    public function test_substitute_params_missing_value_defaults_to_zero(): void
    {
        $schema = [['value' => 'weight'], ['value' => 'missing']];
        $values = ['weight' => 75];

        $this->assertSame('75 + 0', $this->invoke('substituteParams', 'weight + missing', $schema, $values));
    }

    // ---------------------------------------------------------------------
    // evalFormula — substitute then evaluate, guarded.
    // ---------------------------------------------------------------------

    public function test_eval_formula_computes_substituted_expression(): void
    {
        $schema = [['value' => 'weight']];

        $this->assertSame(150.0, $this->invoke('evalFormula', 'weight * 2', $schema, ['weight' => 75]));
        $this->assertSame(2.5, $this->invoke('evalFormula', 'weight / 4', $schema, ['weight' => 10]));
    }

    public function test_eval_formula_returns_zero_for_blank_formula(): void
    {
        $this->assertSame(0.0, $this->invoke('evalFormula', '', [], []));
        $this->assertSame(0.0, $this->invoke('evalFormula', '   ', [], []));
    }

    public function test_eval_formula_returns_zero_when_unsafe(): void
    {
        // An unsubstituted identifier leaves letters in the expression → rejected.
        $this->assertSame(0.0, $this->invoke('evalFormula', 'weight * 2', [], ['weight' => 75]));
        // Attempted code injection is neutralised.
        $this->assertSame(0.0, $this->invoke('evalFormula', 'phpinfo()', [], []));
    }

    // ---------------------------------------------------------------------
    // evalConditional — first matching condition wins.
    // ---------------------------------------------------------------------

    public function test_eval_conditional_returns_first_matching_value(): void
    {
        $schema = [['value' => 'weight']];
        $conditions = [
            ['condition' => 'weight > 50', 'value' => '200'],
            ['condition' => 'weight <= 50', 'value' => '100'],
        ];

        $this->assertSame(200.0, $this->invoke('evalConditional', $conditions, $schema, ['weight' => 75]));
        $this->assertSame(100.0, $this->invoke('evalConditional', $conditions, $schema, ['weight' => 30]));
    }

    public function test_eval_conditional_returns_zero_when_nothing_matches(): void
    {
        $schema = [['value' => 'weight']];
        $conditions = [
            ['condition' => 'weight > 100', 'value' => '200'],
        ];

        $this->assertSame(0.0, $this->invoke('evalConditional', $conditions, $schema, ['weight' => 75]));
    }

    public function test_eval_conditional_skips_unsafe_conditions(): void
    {
        // A condition that survives substitution with stray identifiers must be
        // skipped, not evaluated — even though a later safe branch matches.
        $schema = [['value' => 'weight']];
        $conditions = [
            ['condition' => 'system() > 0', 'value' => '999'],
            ['condition' => 'weight > 50', 'value' => '200'],
        ];

        $this->assertSame(200.0, $this->invoke('evalConditional', $conditions, $schema, ['weight' => 75]));
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
