<?php

declare(strict_types=1);

namespace App\Domains\Attendance\Notifications;

use App\Domains\Attendance\Models\LeaveRequest;
use App\Domains\Attendance\Support\LeavePeriod;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

/**
 * A leave request was approved, rejected or cancelled.
 */
class LeaveRequestDecidedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public readonly LeaveRequest $leave) {}

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
        $kind = $this->leave->kind->name ?? 'Leave';
        $who = $this->leave->user->name ?? 'someone';

        return [
            'type' => 'leave_request_decided',
            'leave_request_id' => $this->leave->id,
            'message' => "{$kind} leave for {$who} (".LeavePeriod::describe($this->leave).') was '.strtolower($this->leave->status->label()).'.',
            'link' => route('attendance.leave-requests.index'),
        ];
    }
}
