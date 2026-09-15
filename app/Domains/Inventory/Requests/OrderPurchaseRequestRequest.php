<?php

declare(strict_types=1);

namespace App\Domains\Inventory\Requests;

use Illuminate\Foundation\Http\FormRequest;

class OrderPurchaseRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** The PO number isn't input: it was assigned when the request was approved. */
    public function rules(): array
    {
        return [
            'supplier_id' => 'required|exists:suppliers,id',
            // Signs the PO: their signature and stamp are printed on it.
            'signer_user_id' => 'required|exists:users,id,is_active,1',
            'po_file' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
        ];
    }
}
