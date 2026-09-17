<?php

declare(strict_types=1);

namespace App\Domains\Payroll\DTOs;

/**
 * One leave kind's standing on a contract.
 *
 * Days and hours are kept as separate facts because they are measured separately: full-day leave
 * counts working days, hourly leave counts minutes. They are only added together when the person's
 * shift says how long one of their working days is — with no shift, nothing does, and the two are
 * reported side by side rather than merged behind an invented conversion.
 *
 * Pending requests are reported but never subtracted: nothing is used until it is approved.
 */
final readonly class LeaveBalanceLine
{
    public function __construct(
        public ?int $kindId,
        public string $kindName,
        public bool $isPaid,
        public string $entitledDays,
        public int $usedDays,
        public int $usedMinutes,
        public int $pendingDays,
        public int $pendingMinutes,
        /** How long one of this person's working days is; null when they have no shift. */
        public ?int $dailyMinutes,
    ) {}

    /** Everything owed, in minutes; null when no shift says what a day is worth. */
    public function entitledMinutes(): ?int
    {
        return $this->dailyMinutes === null
            ? null
            : (int) round((float) $this->entitledDays * $this->dailyMinutes);
    }

    /** Everything taken and booked, in minutes; null when no shift says what a day is worth. */
    public function totalUsedMinutes(): ?int
    {
        return $this->dailyMinutes === null
            ? null
            : $this->usedDays * $this->dailyMinutes + $this->usedMinutes;
    }

    public function remainingMinutes(): ?int
    {
        $entitled = $this->entitledMinutes();
        $used = $this->totalUsedMinutes();

        return $entitled === null || $used === null ? null : $entitled - $used;
    }

    /** What is left in whole days, which is all that can be said without a shift. */
    public function remainingDays(): float
    {
        return (float) $this->entitledDays - $this->usedDays;
    }

    /** True when more leave has been taken or booked than the contract grants. */
    public function isOverdrawn(): bool
    {
        $remaining = $this->remainingMinutes();

        return $remaining === null ? $this->remainingDays() < 0 : $remaining < 0;
    }

    /**
     * The one shape this line is written in — used both to answer a request and to snapshot the
     * balance onto an issued slip, so the two can never drift apart.
     *
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'kind_id' => $this->kindId,
            'kind' => $this->kindName,
            'is_paid' => $this->isPaid,
            'entitled_days' => $this->entitledDays,
            'used_days' => $this->usedDays,
            'used_minutes' => $this->usedMinutes,
            'pending_days' => $this->pendingDays,
            'pending_minutes' => $this->pendingMinutes,
            'entitled_minutes' => $this->entitledMinutes(),
            'total_used_minutes' => $this->totalUsedMinutes(),
            'remaining_minutes' => $this->remainingMinutes(),
            'remaining_days' => $this->remainingDays(),
            'is_overdrawn' => $this->isOverdrawn(),
        ];
    }
}
