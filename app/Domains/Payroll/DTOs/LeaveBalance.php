<?php

declare(strict_types=1);

namespace App\Domains\Payroll\DTOs;

/**
 * What a contract grants against what has been used, per leave kind, over the contract's whole run.
 */
final readonly class LeaveBalance
{
    /**
     * @param  string  $from  the contract's first day, Y-m-d
     * @param  string  $to  its last day, or the open bound used for a contract that has no end
     * @param  list<LeaveBalanceLine>  $lines  by kind name
     * @param  int|null  $dailyMinutes  the person's working day from their shift, used to turn days
     *                                  into hours; null when they have no shift assignment
     */
    public function __construct(
        public string $from,
        public string $to,
        public array $lines,
        public ?int $dailyMinutes,
    ) {}

    /** Whether a shift was found to convert days and hours with. */
    public function hasShift(): bool
    {
        return $this->dailyMinutes !== null;
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'from' => $this->from,
            'to' => $this->to,
            'daily_minutes' => $this->dailyMinutes,
            // False when the person has no shift: days and hours are then reported apart rather
            // than combined behind a conversion nothing can justify.
            'has_shift' => $this->hasShift(),
            'lines' => array_map(fn (LeaveBalanceLine $line) => $line->toArray(), $this->lines),
        ];
    }
}
