<?php

namespace App\Domains\Laboratory\Requests;

use App\Domains\Laboratory\Enums\MethodPriceType;
use App\Domains\Laboratory\Enums\TestType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class UpdateTestRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return Gate::allows("update", $this->route()->parameter("test"));
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $isPanel = $this->input('type') === TestType::PANEL->value;
        $isTest = $this->input('type') === TestType::TEST->value;
        $isService = $this->input('type') === TestType::SERVICE->value;

        $baseRules = [
            "test_group" => ["required", "array"],
            "test_group.id" => ["required", "exists:test_groups,id"],
            "name" => ["required", "string", "max:255", "unique:tests,name,".$this->route()->parameter("test")->id],
            "description" => ["nullable", "string", "max:1000"],
            "fullName" => ["required", "string", "max:255"],
            "code" => ["required", "string", "max:50", "unique:tests,code,".$this->route()->parameter("test")->id],
            "type" => ["required", Rule::enum(TestType::class)],
            "status" => ["nullable", "boolean"],
            "method_tests" => ["required", "array", "min:1"],
            "method_tests.*.id"=>["nullable"],
            "method_tests.*.status"=>["boolean"],
        ];

        $panelRules = [
            "price" => ["required_if:type," . TestType::PANEL->value, "numeric", "min:0"],
            "referrer_price" => ["required_if:type," . TestType::PANEL->value, "numeric", "min:0"],
            "price_type"=>["required", Rule::in(MethodPriceType::values())],
            "referrer_price_type"=>["required", Rule::in(MethodPriceType::values())],
            "extra"=>["nullable", "array"],
            "referrer_extra"=>["nullable", "array"],
            "method_tests.*.id" => ["nullable"],
            "method_tests.*.method.id" => ["required", "exists:methods,id"],
            "method_tests.*.status" => ["nullable","boolean"],
        ];

        $testRules = [
            "sample_type_tests"=>["required","array","min:1"],
            "sample_type_tests.*.sample_type.id" => ["required", "exists:sample_types,id"],
            "sample_type_tests.*.description" => ["required", "string", "max:255"],
            "sample_type_tests.*.defaultType" => ["nullable", "boolean"],
            "report_templates" => ["required_if:type," . TestType::TEST->value, "array"],
            "report_templates.*.id" => ["required_if:type," . TestType::TEST->value, "exists:report_templates,id"],
            "method_tests.*.id" => ["nullable"],
            "method_tests.*.method" => ["required", "array"],
            "method_tests.*.method.id" => ["nullable"],
            "method_tests.*.method.workflow" => ["required", "array"],
            "method_tests.*.method.workflow.id" => ["required", "exists:workflows,id"],
            "method_tests.*.method.barcode_group" => ["required", "array"],
            "method_tests.*.method.barcode_group.id" => ["required", "exists:barcode_groups,id"],
            "method_tests.*.method.name" => ["required", "string", "max:255"],
            "method_tests.*.method.no_patient" => [
                "nullable",
                "numeric",
                "min:1"
            ],
            "method_tests.*.method.price_type" => [
                "required",
                Rule::enum(MethodPriceType::class)
            ],
            "method_tests.*.method.referrer_price_type" => [
                "required",
                Rule::enum(MethodPriceType::class)
            ],
            "method_tests.*.method.price" => [
                "required_if:method_tests.*.method.price_type," . MethodPriceType::FIX->value,
                "numeric",
                "min:0"
            ],
            "method_tests.*.method.referrer_price" => [
                "required_if:method_tests.*.method.referrer_price_type," . MethodPriceType::FIX->value,
                "numeric",
                "min:0"
            ],
            "method_tests.*.method.turnaround_time" => ["required", "numeric", "min:1"],
            "method_tests.*.method.extra" => ["nullable", "array"],
            "method_tests.*.method.referrer_extra" => ["nullable", "array"],
        ];
        $serviceRules = [
            "method_tests.*.id" => ["nullable"],
            "method_tests.*.method" => ["required", "array"],
            "method_tests.*.method.id" => ["nullable"],
            "method_tests.*.method.name" => ["required", "string", "max:255"],
            "method_tests.*.method.price_type" => [
                "required",
                Rule::enum(MethodPriceType::class)
            ],
            "method_tests.*.method.referrer_price_type" => [
                "required",
                Rule::enum(MethodPriceType::class)
            ],
            "method_tests.*.method.price" => [
                "required_if:method_tests.*.method.price_type," . MethodPriceType::FIX->value,
                "numeric",
                "min:0"
            ],
            "method_tests.*.method.referrer_price" => [
                "required_if:method_tests.*.method.referrer_price_type," . MethodPriceType::FIX->value,
                "numeric",
                "min:0"
            ],
            "method_tests.*.method.extra" => ["nullable", "array"],
            "method_tests.*.method.referrer_extra" => ["nullable", "array"],
        ];

        return array_merge(
            $baseRules,
            $isPanel ? $panelRules : [],
            $isTest ? $testRules : [],
            $isService ? $serviceRules : []
        );
    }
}
