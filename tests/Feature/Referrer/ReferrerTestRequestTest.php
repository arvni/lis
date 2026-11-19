<?php

declare(strict_types=1);

namespace Tests\Feature\Referrer;

use App\Domains\Laboratory\Enums\TestType;
use App\Domains\Laboratory\Models\Method;
use App\Domains\Laboratory\Models\MethodTest;
use App\Domains\Laboratory\Models\Test;
use App\Domains\Referrer\Models\Referrer;
use App\Domains\Referrer\Models\ReferrerTest;
use App\Domains\Referrer\Requests\StoreReferrerTestRequest;
use App\Domains\Referrer\Requests\UpdateReferrerTestRequest;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Validator;
use Tests\TestCase;

/**
 * A referrer's per-method formula price must keep its formula and its combine-on-invoice switch:
 * validated() drops any nested key without a rule.
 */
class ReferrerTestRequestTest extends TestCase
{
    use RefreshDatabase;

    public function test_store_keeps_the_method_formula_and_combine_switch(): void
    {
        [$referrer, $test, $method] = $this->fixtures();

        $validated = $this->validated(StoreReferrerTestRequest::class, $this->payload($referrer, $test, $method));

        $this->assertSame('150*noEmbryos', $validated['methods'][0]['extra']['formula']);
        $this->assertTrue($validated['methods'][0]['extra']['combine_on_invoice']);
    }

    public function test_update_keeps_the_method_combine_switch(): void
    {
        [$referrer, $test, $method] = $this->fixtures();
        $existing = ReferrerTest::create([
            'referrer_id' => $referrer->id,
            'test_id' => $test->id,
            'price_type' => 'Fix',
            'price' => 0,
        ]);

        $validated = $this->validated(
            UpdateReferrerTestRequest::class,
            $this->payload($referrer, $test, $method),
            fn (FormRequest $request) => $request->setRouteResolver(
                fn () => new class($existing)
                {
                    public function __construct(private ReferrerTest $model) {}

                    public function parameter(string $key, mixed $default = null): mixed
                    {
                        return $key === 'referrer_test' ? $this->model : $default;
                    }
                }
            ),
        );

        $this->assertTrue($validated['methods'][0]['extra']['combine_on_invoice']);
    }

    /**
     * @param  class-string<FormRequest>  $class
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function validated(string $class, array $data, ?callable $configure = null): array
    {
        $request = $class::create('/', 'POST', $data);
        if ($configure) {
            $configure($request);
        }

        return Validator::make($data, $request->rules())->validated();
    }

    /** @return array<string, mixed> */
    private function payload(Referrer $referrer, Test $test, Method $method): array
    {
        return [
            'referrer' => ['id' => $referrer->id],
            'test' => ['id' => $test->id],
            'methods' => [[
                'method_id' => $method->id,
                'price_type' => 'Formulate',
                'price' => 0,
                'extra' => [
                    'parameters' => [['id' => 'p1', 'value' => 'noEmbryos']],
                    'formula' => '150*noEmbryos',
                    'combine_on_invoice' => true,
                ],
            ]],
        ];
    }

    /** @return array{0: Referrer, 1: Test, 2: Method} */
    private function fixtures(): array
    {
        $referrer = Referrer::create([
            'fullName' => 'Request Referrer',
            'phoneNo' => '90000011',
            'billingInfo' => [],
            'email' => 'request-referrer@example.com',
            'reportReceivers' => [],
        ]);
        $test = Test::create([
            'name' => 'PGT-A',
            'fullName' => 'PGT-A',
            'code' => 'PGT01',
            'type' => TestType::TEST,
            'status' => true,
        ]);
        $method = Method::create([
            'name' => 'NGS',
            'price' => 0,
            'status' => true,
            'no_patient' => 1,
            'no_sample' => 1,
        ]);
        MethodTest::create(['method_id' => $method->id, 'test_id' => $test->id, 'is_default' => true, 'status' => true]);

        return [$referrer, $test, $method];
    }
}
