<?php

namespace App\Domains\Laboratory\Repositories;

use Illuminate\Database\Eloquent\Builder;

use App\Domains\Shared\Traits\LogsUserActivity;
use App\Domains\Laboratory\Models\ReportTemplate;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ReportTemplateRepository
{
    use LogsUserActivity;


    public function listReportTemplates(array $queryData): LengthAwarePaginator
    {
        $query = ReportTemplate::with("template", "activeParameters", "approvalFlow:id,name")->withCount(["tests","activeParameters"]);
        if (isset($queryData["filters"]))
            $this->applyFilters($query, $queryData["filters"]);
        if (isset($queryData["sort"]))
            $query->orderBy($queryData['sort']['field'] ?? 'id', $queryData['sort']['sort'] ?? 'asc');
        return $query->paginate($queryData["pageSize"] ?? 10);
    }

    public function creatReportTemplate(array $reportTemplateData): ReportTemplate
    {
        $reportTemplate= ReportTemplate::query()->create($reportTemplateData);
        $this->logCreated($reportTemplate);
        return $reportTemplate;
    }

    public function updateReportTemplate(ReportTemplate $reportTemplate, array $reportTemplateData): ReportTemplate
    {
        $reportTemplate->fill($reportTemplateData);
        if ($reportTemplate->isDirty()) {
            $reportTemplate->save();
            $this->logUpdated($reportTemplate);
        }
        return $reportTemplate;
    }

    public function deleteReportTemplate(ReportTemplate $reportTemplate): void
    {
        $reportTemplate->delete();
        $this->logDeleted($reportTemplate);
    }

    /**
     * @param  \Illuminate\Database\Eloquent\Builder<\App\Domains\Laboratory\Models\ReportTemplate>  $query
     */
    protected function applyFilters(Builder $query, array $filters): void
    {
        if (isset($filters["search"]))
            $query->search(["name"], $filters["search"]);
    }

}
