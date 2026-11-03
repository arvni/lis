<?php

declare(strict_types=1);

namespace Tests\Feature\Referrer;

use App\Domains\Referrer\Requests\StoreMaterialRequest;
use App\Domains\Referrer\Requests\UpdateMaterialRequest;
use Illuminate\Support\Facades\Validator;
use Tests\TestCase;

/** A mistyped year (0206 for 2026) must come back as a form error, not a database 500. */
class MaterialDateValidationTest extends TestCase
{
    /** @param  array<string, mixed>  $tube */
    private function tubeErrors(array $tube): array
    {
        $rules = array_filter((new StoreMaterialRequest)->rules(), fn (string $key) => str_starts_with($key, 'tubes.*.'), ARRAY_FILTER_USE_KEY);
        $rules = array_map(fn ($rule) => is_string($rule) ? str_replace('|unique:materials,tube_barcode', '', $rule) : $rule, $rules);

        return Validator::make(['tubes' => [$tube]], $rules)->errors()->keys();
    }

    public function test_a_mistyped_year_on_a_new_tube_is_refused(): void
    {
        $this->assertSame(['tubes.0.manufactured_date'], $this->tubeErrors(['manufactured_date' => '0206-02-28', 'expire_date' => now()->addYear()->toDateString()]));
        $this->assertSame(['tubes.0.expire_date'], $this->tubeErrors(['manufactured_date' => '2026-02-28', 'expire_date' => '20270-08-27']));
        $this->assertSame([], $this->tubeErrors(['manufactured_date' => '2026-02-28', 'expire_date' => now()->addYear()->toDateString()]));
    }

    public function test_a_mistyped_year_on_an_edit_is_refused(): void
    {
        $rules = array_intersect_key((new UpdateMaterialRequest)->rules(), array_flip(['manufactured_date', 'expire_date', 'assigned_at']));

        $this->assertSame(['manufactured_date', 'assigned_at'], Validator::make(['manufactured_date' => '0206-02-28', 'expire_date' => '2027-08-27', 'assigned_at' => '0026-11-03'], $rules)->errors()->keys());
        $this->assertSame([], Validator::make(['manufactured_date' => '2026-02-28', 'expire_date' => '2027-08-27', 'assigned_at' => '2026-11-03'], $rules)->errors()->keys());
    }
}
