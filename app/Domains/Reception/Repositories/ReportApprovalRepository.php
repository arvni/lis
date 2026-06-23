<?php

namespace App\Domains\Reception\Repositories;

use App\Domains\Reception\Models\ReportApproval;
use App\Domains\Shared\Traits\LogsUserActivity;

class ReportApprovalRepository
{
    use LogsUserActivity;

    public function create(array $data)
    {
        $approval = ReportApproval::create($data);
        $this->logCreated($approval);
        return $approval;
    }
}
