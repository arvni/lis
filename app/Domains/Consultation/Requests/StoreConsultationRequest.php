<?php

namespace App\Domains\Consultation\Requests;

use App\Domains\Consultation\Models\Consultation;
use Carbon\Carbon;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class StoreConsultationRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize()
    {
        return Gate::allows("create",Consultation::class);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */

    public function rules()
    {
        return [
            "consultant.id" => "required|exists:users,id",
            "dueDate" => ["required", function ($attribute, $value, $fail) {
                $date = Carbon::createFromFormat("Y-m-d", $value);
                if ($date->lessThanOrEqualTo(Carbon::now()->startOfDay()))
                    $fail("Due Date Must Be Grater Than Now");
            }],
            "time" => ["required"],
            "patient_id" => "required|exists:patients,id"
        ];
    }
}
