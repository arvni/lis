<?php

namespace App\Domains\Reception\Requests;

use App\Domains\Reception\Models\Report;
use Illuminate\Foundation\Http\FormRequest;

class ListAcceptanceItemReadyReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Reporting worklist (items ready to report) — gate on report listing.
        return $this->user()->can("viewAny", Report::class);
    }

    public function rules(): array
    {
        return [];
    }
}
