<?php

declare(strict_types=1);

namespace App\Domains\Attendance\Resources;

use App\Domains\Attendance\Models\AttendanceTransaction;
use App\Domains\User\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin AttendanceTransaction
 */
class AttendanceTransactionResource extends JsonResource
{
    /**
     * @param  User|null  $matchedUser  the LIS user whose attendance number is this punch's Employee ID
     */
    public function __construct(AttendanceTransaction $resource, private readonly ?User $matchedUser)
    {
        parent::__construct($resource);
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'attendance_id' => $this->attendance_id,
            'access_date_and_time' => $this->access_date_and_time->format('Y-m-d H:i:s'),
            'user' => $this->matchedUser ? ['id' => $this->matchedUser->id, 'name' => $this->matchedUser->name] : null,
        ];
    }
}
