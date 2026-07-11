<?php

declare(strict_types=1);

namespace App\Domains\Laboratory\Repositories;

use App\Domains\Laboratory\Models\ReportTemplateParameter;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

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

    public function findById(int|string $id): ?ReportTemplateParameter
    {
        return ReportTemplateParameter::query()->find($id);
    }

    /**
     * @param  \Illuminate\Database\Eloquent\Builder<\App\Domains\Laboratory\Models\ReportTemplateParameter>  $query
     */
    protected function applyFilters(Builder $query, array $filters): void
    {
        if (isset($filters["search"]))
            $query->search(["title"], $filters["search"]);
    }

}
