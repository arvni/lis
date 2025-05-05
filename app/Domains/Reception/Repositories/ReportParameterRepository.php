<?php

namespace App\Domains\Reception\Repositories;

use App\Domains\Reception\Models\ReportParameter;

class ReportParameterRepository
{
    /**
     * @param $data
     * @return mixed
     */
    public function create($data): ReportParameter
    {
        return ReportParameter::create($data);
    }

    public function save(ReportParameter $reportParameter): ReportParameter
    {
        $reportParameter->save();
        return $reportParameter;
    }

    public function find($id): ?ReportParameter
    {
        return ReportParameter::find($id);
    }
}
