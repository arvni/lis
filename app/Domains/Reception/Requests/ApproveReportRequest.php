<?php

declare(strict_types=1);

namespace App\Domains\Reception\Requests;

use App\Domains\Reception\Models\Report;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class ApproveReportRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return Gate::allows("approve", $this->route()->parameter("report"));
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * The published PDF is only produced on the step that completes the
     * flow; intermediate steps just need an optional comment.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        /** @var Report $report */
        $report = $this->route("report");

        return [
            "clinical_comment_document.id" => "exists:documents,hash",
            "published_report_document.hash" => [
                Rule::requiredIf(fn() => $report->isOnFinalApprovalStep()),
                "exists:documents,hash",
            ],
            "comment" => "nullable|string",
        ];
    }
}
