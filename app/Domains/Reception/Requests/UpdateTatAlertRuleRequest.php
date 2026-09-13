<?php

declare(strict_types=1);

namespace App\Domains\Reception\Requests;

use Illuminate\Support\Facades\Gate;

class UpdateTatAlertRuleRequest extends StoreTatAlertRuleRequest
{
    public function authorize(): bool
    {
        return Gate::allows('update', $this->route('tat_alert_rule'));
    }
}
