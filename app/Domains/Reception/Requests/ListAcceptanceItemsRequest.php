<?php

namespace App\Domains\Reception\Requests;

use App\Domains\Reception\Models\Acceptance;
use Illuminate\Foundation\Http\FormRequest;

class ListAcceptanceItemsRequest extends FormRequest
{
    public function authorize(): bool
    {
        // PHI worklist — require acceptance listing permission.
        return $this->user()->can("viewAny", Acceptance::class);
    }

    public function rules(): array
    {
        return [];
    }
}
