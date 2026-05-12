<?php

namespace App\Domains\Monitoring\Requests;

use App\Domains\Monitoring\Models\MonitoringNode;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class UpdateNodeSectionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('update', MonitoringNode::class);
    }

    public function rules(): array
    {
        return [
            'section_id' => 'nullable|exists:sections,id',
            'notes'      => 'nullable|string|max:1000',
        ];
    }
}
