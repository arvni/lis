<?php

declare(strict_types=1);

namespace App\Domains\Inventory\Requests;

use App\Domains\Inventory\Enums\TransactionStatus;
use App\Domains\Inventory\Enums\TransactionType;
use App\Domains\Inventory\Models\StockTransaction;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ExportStockTransactionsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('viewAny', StockTransaction::class);
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'filters' => 'nullable|array',
            'filters.transaction_type' => ['nullable', Rule::enum(TransactionType::class)],
            'filters.status' => ['nullable', Rule::enum(TransactionStatus::class)],
            'filters.store_id' => 'nullable|integer',
            'filters.date_from' => 'nullable|date',
            'filters.date_to' => 'nullable|date|after_or_equal:filters.date_from',
        ];
    }
}
