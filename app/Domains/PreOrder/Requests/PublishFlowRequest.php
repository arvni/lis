<?php

declare(strict_types=1);

namespace App\Domains\PreOrder\Requests;

use App\Domains\PreOrder\Adapters\DocumentAdapter;
use App\Domains\PreOrder\Enums\BatchMode;
use App\Domains\PreOrder\Enums\PreOrderStage;
use App\Domains\PreOrder\Enums\StageMode;
use App\Domains\PreOrder\Models\Flow;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** One row per library stage from the flow builder. FlowDefinition keeps the rows consistent. */
class PublishFlowRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('manage', Flow::class) ?? false;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120'],
            'stages' => ['required', 'array'],
            'stages.*' => ['array'],
            'stages.*.mode' => ['nullable', Rule::enum(StageMode::class)],
            'stages.*.label_en' => ['nullable', 'string', 'max:120'],
            'stages.*.label_ar' => ['nullable', 'string', 'max:120'],
            'stages.*.action_en' => ['nullable', 'string', 'max:200'],
            'stages.*.action_ar' => ['nullable', 'string', 'max:200'],
            'stages.*.remind_after_hours' => ['nullable', 'integer', 'min:1', 'max:2160'],
            'stages.*.escalate_after_hours' => ['nullable', 'integer', 'min:1', 'max:2160'],
            'stages.*.required_documents' => ['nullable', 'array'],
            'stages.*.required_documents.*' => [Rule::in(DocumentAdapter::centerTagValues())],
            'stages.*.batch_mode' => ['nullable', Rule::enum(BatchMode::class)],
            'stages.*.center_can_close' => ['nullable', 'boolean'],
        ];
    }

    /** Only library stages may be sent. */
    public function after(): array
    {
        return [function ($validator) {
            $unknown = array_diff(array_keys((array) $this->input('stages', [])), array_map(fn (PreOrderStage $s) => $s->value, PreOrderStage::cases()));
            if ($unknown !== []) {
                $validator->errors()->add('stages', 'Unknown stages: '.implode(', ', $unknown));
            }
        }];
    }
}
