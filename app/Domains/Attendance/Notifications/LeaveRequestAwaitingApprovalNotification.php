<?php

declare(strict_types=1);

namespace App\Domains\Attendance\Notifications;

use App\Domains\Attendance\Models\LeaveRequest;
use App\Domains\Attendance\Support\LeavePeriod;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class LeaveRequestAwaitingApprovalNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly LeaveRequest $leave,
        public readonly string $stepName,
    ) {}

    /**
     * Staff notifications stay in the app.
     *
     * @return list<string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $who = $this->leave->user->name ?? 'Someone';
        $kind = $this->leave->kind->name ?? 'Leave';

        return [
            'type' => 'leave_request_pending',
            'leave_request_id' => $this->leave->id,
            'message' => "{$who}’s {$kind} leave (".LeavePeriod::describe($this->leave).") is waiting for your approval — step: {$this->stepName}",
            'link' => route('attendance.leave-requests.index', ['filters' => ['scope' => 'approvals']]),
        ];
    }
}
