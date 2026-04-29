<?php

namespace App\Domains\Inventory\Services;

use App\Domains\Inventory\Models\WorkflowTemplate;
use App\Domains\User\Models\User;

class WorkflowTemplateMatcher
{
    /**
     * Find the best matching template for a given requester + urgency.
     *
     * Evaluation order (priority ASC, lower = higher priority):
     *   1. Templates with conditions — first one whose conditions ALL pass wins.
     *   2. If nothing matched, fall back to the is_default template.
     *   3. If no default exists, return null (no workflow).
     *
     * Condition logic (per key):
     *   - Key absent / empty array → matches any value (wildcard).
     *   - Key present with values  → value must be in the list.
     */
    public function find(User $requester, string $urgency, float $estimatedTotal = 0): ?WorkflowTemplate
    {
        $templates = WorkflowTemplate::active()
            ->orderBy('priority')
            ->orderBy('id')
            ->get();

        $requesterRoles = $requester->getRoleNames()->all();

        // First pass: templates that have at least one condition defined
        foreach ($templates as $template) {
            if ($template->is_default) continue; // skip default in first pass
            if ($this->matches($template, $urgency, $requesterRoles, $estimatedTotal)) {
                return $template;
            }
        }

        // Second pass: default fallback
        return $templates->firstWhere('is_default', true);
    }

    private function matches(WorkflowTemplate $template, string $urgency, array $requesterRoles, float $estimatedTotal): bool
    {
        $conditions = $template->conditions ?? [];

        $urgencies     = $conditions['urgencies']       ?? [];
        $requiredRoles = $conditions['requester_roles'] ?? [];
        $minTotal      = isset($conditions['min_total']) ? (float) $conditions['min_total'] : null;

        // Empty conditions on a non-default template = matches nothing
        if (empty($urgencies) && empty($requiredRoles) && $minTotal === null) {
            return false;
        }

        if (!empty($urgencies) && !in_array($urgency, $urgencies, true)) {
            return false;
        }

        if (!empty($requiredRoles) && empty(array_intersect($requiredRoles, $requesterRoles))) {
            return false;
        }

        if ($minTotal !== null && $estimatedTotal < $minTotal) {
            return false;
        }

        return true;
    }
}
