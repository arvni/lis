<?php

namespace App\Domains\Billing\Requests;

use App\Domains\Billing\Enums\InvoiceItemKind;
use App\Domains\Billing\Enums\InvoiceStatus;
use App\Domains\Billing\Enums\PaymentMethod;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class UpdateInvoiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('update', $this->routeInvoiceModel());
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $invoiceId = $this->routeInvoiceModel()->id;

        return [
            "owner_id"   => "required",
            "owner_type" => "required",
            "status"     => ["required", Rule::enum(InvoiceStatus::class)],

            "subject"              => ["nullable", "array"],
            "subject.title"        => ["nullable", "string", "max:255"],
            "subject.lines"        => ["nullable", "array"],
            "subject.lines.*.label" => ["nullable", "string", "max:120"],
            "subject.lines.*.value" => ["nullable", "string", "max:500"],

            "invoice_items"                       => ["required", "array"],
            "invoice_items.*.id"                  => [
                "nullable",
                Rule::exists("invoice_items", "id")->where("invoice_id", $invoiceId),
            ],
            "invoice_items.*._destroy"            => ["nullable", "boolean"],
            "invoice_items.*.kind"                => ["nullable", Rule::enum(InvoiceItemKind::class)],
            "invoice_items.*.title"               => ["required_without:invoice_items.*._destroy", "string", "max:255"],
            "invoice_items.*.code"                => ["nullable", "string", "max:255"],
            "invoice_items.*.description"         => ["nullable", "string"],
            "invoice_items.*.unit_price"          => ["required_without:invoice_items.*._destroy", "numeric", "min:0"],
            "invoice_items.*.qty"                 => ["required_without:invoice_items.*._destroy", "integer", "min:1"],
            "invoice_items.*.discount"            => ["nullable", "numeric", "min:0"],
            "invoice_items.*.test_id"             => ["nullable", "integer", Rule::exists("tests", "id")],
            "invoice_items.*.acceptance_id"       => ["nullable", "integer", Rule::exists("acceptances", "id")],
            "invoice_items.*.panel_id"            => ["nullable", "uuid"],
            "invoice_items.*.customParameters"    => ["nullable", "array"],

            "payments"                  => ["nullable", "array"],
            "payments.*.id"             => ["nullable", Rule::exists("payments", "id")],
            "payments.*.price"          => ["required", "numeric"],
            "payments.*.payer_id"       => ["required"],
            "payments.*.payer_type"     => ["required"],
            "payments.*.paymentMethod"  => ["required", Rule::enum(PaymentMethod::class)],
            "payments.*.information"    => ["array", "nullable"],
        ];
    }

    private function routeInvoiceModel(): \App\Domains\Billing\Models\Invoice
    {
        /** @var \App\Domains\Billing\Models\Invoice $model */
        $model = $this->route('invoice');

        return $model;
    }
}
