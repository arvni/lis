<?php

declare(strict_types=1);

namespace App\Domains\Payroll\Resources;

use App\Domains\Payroll\DTOs\LeaveBalance;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LeaveBalanceResource extends JsonResource
{
    public function __construct(LeaveBalance $resource)
    {
        parent::__construct($resource);
    }

    /**
     * The DTO owns the shape, because the same one is snapshotted onto an issued slip. Writing it
     * out twice would let the stored balance and the live one drift apart.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var LeaveBalance $balance */
        $balance = $this->resource;

        return $balance->toArray();
    }
}
