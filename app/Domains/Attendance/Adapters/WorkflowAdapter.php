<?php

declare(strict_types=1);

namespace App\Domains\Attendance\Adapters;

use App\Domains\Inventory\Enums\WorkflowRequestType;
use App\Domains\Inventory\Services\WorkflowTemplateMatcher;
use App\Domains\User\Models\User;

/**
 * Adapter to the workflow templates kept in the Inventory domain. Leave workflows are templates of
 * type "Leave requests", picked by the roles of the person taking the leave.
 */
readonly class WorkflowAdapter
{
    public function __construct(private WorkflowTemplateMatcher $templateMatcher) {}

    /**
     * The approval steps, in order, of the leave workflow that matches the person; null when none does.
     *
     * @return array{template_id: int, steps: list<array{name: string, approver_role: string|null, approver_user_id: int|null, deadline_days: int|null}>}|null
     */
    public function leaveWorkflowFor(User $person): ?array
    {
        // Leave templates only match on the requester's roles, so urgency and total don't apply.
        $template = $this->templateMatcher->find($person, '', 0, WorkflowRequestType::LEAVE);
        if ($template === null) {
            return null;
        }

        $steps = [];
        foreach ($template->steps as $step) {
            $steps[] = [
                'name' => $step->name,
                'approver_role' => $step->approver_role,
                'approver_user_id' => $step->approver_user_id,
                'deadline_days' => $step->deadline_days,
            ];
        }

        return ['template_id' => $template->id, 'steps' => $steps];
    }
}
