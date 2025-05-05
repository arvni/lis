<?php

namespace App\Domains\Laboratory\Repositories;

use App\Domains\Laboratory\Models\ReportTemplateParameter;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ReportTemplateParameterRepository
{

    public function creatReportTemplateParameter(array $reportTemplateParameterData): ReportTemplateParameter
    {
        return ReportTemplateParameter::query()->create($reportTemplateParameterData);
    }

    public function updateReportTemplateParameter(ReportTemplateParameter $reportTemplateParameter, array $reportTemplateParameterData): ReportTemplateParameter
    {
        $reportTemplateParameter->fill($reportTemplateParameterData);
        if ($reportTemplateParameter->isDirty())
            $reportTemplateParameter->save();
        return $reportTemplateParameter;
    }

    public function deleteReportTemplateParameter(ReportTemplateParameter $reportTemplateParameter): void
    {
        $reportTemplateParameter->delete();
    }

    public function findById($id): ?ReportTemplateParameter
    {
        return ReportTemplateParameter::query()->find($id);
    }

    protected function applyFilters($query, array $filters)
    {
        if (isset($filters["search"]))
            $query->search(["name"], $filters["search"]);
    }

}
