<?php

declare(strict_types=1);

namespace App\Domains\Attendance\Resources;

use App\Domains\Attendance\Models\LeaveRequest;
use App\Domains\Attendance\Models\LeaveRequestApproval;
use App\Domains\User\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Gate;

/**
 * @mixin LeaveRequest
 */
class LeaveRequestResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $viewer = $request->user();
        $gate = $viewer instanceof User ? Gate::forUser($viewer) : null;

        return [
            'id' => $this->id,
            'user' => $this->whenLoaded('user', fn () => ['id' => $this->user->id, 'name' => $this->user->name]),
            'requested_by' => $this->whenLoaded('requestedBy', fn () => $this->requestedBy
                ? ['id' => $this->requestedBy->id, 'name' => $this->requestedBy->name]
                : null),
            'kind' => $this->whenLoaded('kind', fn () => ['id' => $this->kind->id, 'name' => $this->kind->name]),
            'type' => $this->type->value,
            'type_label' => $this->type->label(),
            'start_date' => $this->start_date->format('Y-m-d'),
            'end_date' => $this->end_date->format('Y-m-d'),
            'start_time' => $this->start_time !== null ? substr($this->start_time, 0, 5) : null,
            'end_time' => $this->end_time !== null ? substr($this->end_time, 0, 5) : null,
            'reason' => $this->reason,
            'status' => $this->status->value,
            'status_label' => $this->status->label(),
            'decided_at' => $this->decided_at?->format('Y-m-d H:i'),
            'cancelled_by' => $this->whenLoaded('cancelledBy', fn () => $this->cancelledBy?->name),
            'cancelled_at' => $this->cancelled_at?->format('Y-m-d H:i'),
            'cancel_reason' => $this->cancel_reason,
            'created_at' => $this->created_at?->format('Y-m-d H:i'),
            'approvals' => $this->whenLoaded('approvals', fn () => $this->approvals->map(fn (LeaveRequestApproval $approval) => [
                'id' => $approval->id,
                'name' => $approval->name,
                'approver' => $approval->approverUser->name ?? $approval->approver_role ?? 'Leave managers',
                'status' => $approval->status->value,
                'status_label' => $approval->status->label(),
                'acted_by' => $approval->actedBy?->name,
                'notes' => $approval->notes,
                'acted_at' => $approval->acted_at?->format('Y-m-d H:i'),
                'due_at' => $approval->due_at?->format('Y-m-d H:i'),
            ])->values()->all()),
            'can' => [
                'approve' => (bool) $gate?->allows('approve', $this->resource),
                'cancel' => (bool) $gate?->allows('cancel', $this->resource),
            ],
        ];
    }
}
