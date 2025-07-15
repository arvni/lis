<?php

namespace App\Domains\Laboratory\Resources;

use App\Domains\Laboratory\Enums\TestType;
use App\Domains\Laboratory\Models\MethodTest;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Arr;

class TestResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $data = [
            "id" => $this->id,
            "name" => $this->name,
            "code" => $this->code,
            "fullName" => $this->fullName,
            "description" => $this->description,
            "status" => $this->status,
            "test_groups" => $this->whenLoaded('testGroups'),
            "type" => $this->type,
            ...$this->resolveTestPrice(),

        ];

        if ($this->relationLoaded("methodTests")) {
            $data["method_tests"] = $this->resolveMethodTests();
        }
        if ($this->relationLoaded("offers"))
            $data["offers"] = $this->offers;
        if ($this->relationLoaded("sampleTypes"))
            $data["sample_types"] = $this->sampleTypes;
        return $data;
    }

    /**
     * Resolve the test price based on type and referrer relationship.
     *
     * @return array
     */
    private function resolveTestPrice(): array
    {
        if ($this->type == TestType::PANEL) {
            if ($this->relationLoaded("referrerTest") && $this->referrerTest) {
                return [
                    "price" => $this->referrerTest->price,
                    "price_type" => $this->referrerTest->price_type,
                    "extra" => $this->referrerTest->extra
                ];
            } elseif ($this->withDefaultReferrerPrice && $this->referrer_price)
                return [
                    "price" => $this->referrer_price,
                    "price_type" => $this->referrer_price_type,
                    "extra" => $this->referrer_extra
                ];
            return [
                "price" => $this->price,
                "price_type" => $this->pric_type,
                "extra" => $this->extra
            ];
        }
        return [];
    }

    /**
     * Resolve method tests with their associated data.
     *
     * @return array
     */
    private function resolveMethodTests(): array
    {
        $output = [];

        foreach ($this->methodTests as $methodTest) {
            // Make sure the method relationship is loaded
            if (!$methodTest->relationLoaded('method')) {
                $methodTest->load('method');
            }

            $output[] = [
                'id' => $methodTest->id,
                'method_id' => $methodTest->method_id,
                "method" => [
                    ...$methodTest->method->toArray(),
                    'price' => $this->resolvePrice($methodTest),
                    'price_type' => $this->resolvePriceType($methodTest),
                    'extra' => $this->resolveExtra($methodTest),
                ],
                'test_id' => $methodTest->test_id,
                'is_default' => $methodTest->is_default,
                'status' => $methodTest->status,
            ];
        }

        return $output;
    }

    /**
     * Resolve the price based on the referrer method relationship.
     *
     * @param MethodTest $methodTest
     * @return float|null
     */
    protected function resolvePrice(MethodTest $methodTest): ?float
    {
        if ($this->relationLoaded("referrerTest") && $this->referrerTest) {
            $methods = $this->referrerTest->methods ?? [];

            if (is_array($methods)) {
                foreach ($methods as $method) {
                    if (isset($method['method_id']) && $method['method_id'] == $methodTest->method_id) {
                        return $method['price'] ?? null;
                    }
                }
            }
        } elseif ($this->withDefaultReferrerPrice) {
            return $methodTest->method->referrer_price;
        }

        return $methodTest->method->price ?? null;
    }

    /**
     * Resolve the price type based on the referrer method relationship.
     *
     * @param MethodTest $methodTest
     * @return string|null
     */
    protected function resolvePriceType(MethodTest $methodTest): ?string
    {
        if ($this->relationLoaded("referrerTest") && $this->referrerTest) {
            $methods = $this->referrerTest->methods ?? [];

            if (is_array($methods)) {
                foreach ($methods as $method) {
                    if (isset($method['method_id']) && $method['method_id'] == $methodTest->method_id) {
                        return $method['price_type'] ?? null;
                    }
                }
            }
        } elseif ($this->withDefaultReferrerPrice) {
            return $methodTest->method->referrer_price_type->value;
        }

        return $methodTest->method->price_type->value ?? null;
    }

    /**
     * Resolve extra information based on the referrer method relationship.
     *
     * @param MethodTest $methodTest
     * @return array|null
     */
    protected function resolveExtra(MethodTest $methodTest): ?array
    {
        if ($this->relationLoaded("referrerTest") && $this->referrerTest) {
            $methods = $this->referrerTest->methods ?? [];

            if (is_array($methods)) {
                foreach ($methods as $method) {
                    if (isset($method['method_id']) && $method['method_id'] == $methodTest->method_id) {
                        return $method['extra'] ?? null;
                    }
                }
            }
        } elseif ($this->withDefaultReferrerPrice) {
            return $methodTest->method->referrer_extra;
        }

        return $methodTest->method->extra ?? null;
    }
}
