<?php

namespace App\Domains\Consultation\Requests;

use Illuminate\Support\Facades\Gate;

class UpdateConsultantRequest extends StoreConsultantRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return Gate::allows('update', $this->route()->parameter('consultant'));
    }

    /**
     * Prepare the data for validation.
     *
     * @return void
     */
    protected function prepareForValidation()
    {
        parent::prepareForValidation();

        // Handle potential _method field for PUT requests
        if ($this->has('_method')) {
            $this->request->remove('_method');
        }
    }

    /**
     * Get day name by index.
     *
     * Overridden because the update form's week starts on Saturday, while the
     * store form's starts on Sunday (pre-existing drift kept as-is).
     *
     * @param  int  $index
     * @return string
     */
    protected function getDayName($index)
    {
        $days = [
            'Saturday',
            'Sunday',
            'Monday',
            'Tuesday',
            'Wednesday',
            'Thursday',
            'Friday',
        ];

        return $days[$index] ?? "Day {$index}";
    }
}
