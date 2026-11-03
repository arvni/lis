<?php

declare(strict_types=1);

namespace Tests\Unit\Shared;

use App\Domains\Shared\Helpers\PriceFormula;
use PHPUnit\Framework\TestCase;
use ReflectionMethod;

/**
 * The price calculator acceptances and pre-orders share: parameter substitution, formula and
 * conditional evaluation, and the `eval()` safety guards that keep stored pricing expressions
 * from executing arbitrary code. The private steps are exercised via reflection.
 */
class PriceFormulaTest extends TestCase
{
    /** @param mixed ...$args */
    private function invoke(string $method, ...$args): mixed
    {
        return (new ReflectionMethod(PriceFormula::class, $method))->invoke(null, ...$args);
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
    // substitute — name→value replacement, longest-name-first, \b-bounded.
    // ---------------------------------------------------------------------

    public function test_substitute_params_replaces_named_values(): void
    {
        $schema = [['value' => 'weight'], ['value' => 'age']];
        $values = ['weight' => 75, 'age' => 30];

        $this->assertSame('75 * 2 + 30', $this->invoke('substitute', 'weight * 2 + age', $schema, $values));
    }

    public function test_substitute_params_longest_name_first_avoids_partial_clobber(): void
    {
        // If 'w' were substituted before 'weight', the longer token could be
        // corrupted. Longest-first + word boundaries must keep them distinct.
        $schema = [['value' => 'w'], ['value' => 'weight']];
        $values = ['w' => 2, 'weight' => 75];

        $this->assertSame('75 + 2', $this->invoke('substitute', 'weight + w', $schema, $values));
    }

    public function test_substitute_params_missing_value_defaults_to_zero(): void
    {
        $schema = [['value' => 'weight'], ['value' => 'missing']];
        $values = ['weight' => 75];

        $this->assertSame('75 + 0', $this->invoke('substitute', 'weight + missing', $schema, $values));
    }

    // ---------------------------------------------------------------------
    // formula — substitute then evaluate, guarded.
    // ---------------------------------------------------------------------

    public function test_eval_formula_computes_substituted_expression(): void
    {
        $schema = [['value' => 'weight']];

        $this->assertSame(150.0, $this->invoke('formula', 'weight * 2', $schema, ['weight' => 75]));
        $this->assertSame(2.5, $this->invoke('formula', 'weight / 4', $schema, ['weight' => 10]));
    }

    public function test_eval_formula_returns_zero_for_blank_formula(): void
    {
        $this->assertSame(0.0, $this->invoke('formula', '', [], []));
        $this->assertSame(0.0, $this->invoke('formula', '   ', [], []));
    }

    public function test_eval_formula_returns_zero_when_unsafe(): void
    {
        // An unsubstituted identifier leaves letters in the expression → rejected.
        $this->assertSame(0.0, $this->invoke('formula', 'weight * 2', [], ['weight' => 75]));
        // Attempted code injection is neutralised.
        $this->assertSame(0.0, $this->invoke('formula', 'phpinfo()', [], []));
    }

    // ---------------------------------------------------------------------
    // conditional — first matching condition wins.
    // ---------------------------------------------------------------------

    public function test_eval_conditional_returns_first_matching_value(): void
    {
        $schema = [['value' => 'weight']];
        $conditions = [
            ['condition' => 'weight > 50', 'value' => '200'],
            ['condition' => 'weight <= 50', 'value' => '100'],
        ];

        $this->assertSame(200.0, $this->invoke('conditional', $conditions, $schema, ['weight' => 75]));
        $this->assertSame(100.0, $this->invoke('conditional', $conditions, $schema, ['weight' => 30]));
    }

    public function test_eval_conditional_returns_zero_when_nothing_matches(): void
    {
        $schema = [['value' => 'weight']];
        $conditions = [
            ['condition' => 'weight > 100', 'value' => '200'],
        ];

        $this->assertSame(0.0, $this->invoke('conditional', $conditions, $schema, ['weight' => 75]));
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

        $this->assertSame(200.0, $this->invoke('conditional', $conditions, $schema, ['weight' => 75]));
    }

    // ---------------------------------------------------------------------
    // resolve and parameters — the public face.
    // ---------------------------------------------------------------------

    public function test_resolve_prices_the_pgt_conditions_by_embryo_count(): void
    {
        $extra = [
            'parameters' => [['value' => 'noEmbryos']],
            'conditions' => [
                ['condition' => 'noEmbryos<=1', 'value' => '190*noEmbryos'],
                ['condition' => 'noEmbryos<=2', 'value' => '360'],
                ['condition' => 'noEmbryos>=6 && noEmbryos<=12', 'value' => '865'],
            ],
        ];

        $this->assertSame(190.0, PriceFormula::resolve('Conditional', 190, $extra, ['noEmbryos' => 1]));
        $this->assertSame(360.0, PriceFormula::resolve('Conditional', 190, $extra, ['noEmbryos' => 2]));
        $this->assertSame(865.0, PriceFormula::resolve('Conditional', 190, $extra, ['noEmbryos' => 8]));
        $this->assertSame(0.0, PriceFormula::resolve('Conditional', 190, $extra, ['noEmbryos' => 13]));
        $this->assertSame(['noEmbryos'], PriceFormula::parameters($extra));
    }
}
