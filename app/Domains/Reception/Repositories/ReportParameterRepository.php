<?php

namespace App\Domains\Reception\Repositories;

use App\Domains\Reception\Models\ReportParameter;

class ReportParameterRepository
{
    public function create(array $data): ReportParameter
    {
        return ReportParameter::create($data);
    }

    public function save(ReportParameter $reportParameter): ReportParameter
    {
        $reportParameter->save();
        return $reportParameter;
    }

    public function find(int|string $id): ?ReportParameter
    {
        return ReportParameter::find($id);
    }
}
