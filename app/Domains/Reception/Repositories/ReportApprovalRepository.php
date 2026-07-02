<?php

namespace App\Domains\Reception\Repositories;

use App\Domains\Reception\Models\ReportApproval;
use App\Domains\Shared\Traits\LogsUserActivity;

class ReportApprovalRepository
{
    use LogsUserActivity;

    /** @param  array<string, mixed>  $data */
    public function create(array $data): ReportApproval
    {
        $approval = ReportApproval::create($data);
        $this->logCreated($approval);
        return $approval;
    }
}
