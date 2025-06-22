<?php

namespace App\Domains\Laboratory\Repositories;

use App\Domains\Laboratory\Models\ReportTemplate;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ReportTemplateRepository
{

    public function listReportTemplates(array $queryData): LengthAwarePaginator
    {
        $query = ReportTemplate::with("template", "activeParameters")->withCount(["tests","activeParameters"]);
        if (isset($queryData["filters"]))
            $this->applyFilters($query, $queryData["filters"]);
        if (isset($queryData["sort"]))
            $query->orderBy($queryData['sort']['field'] ?? 'id', $queryData['sort']['sort'] ?? 'asc');
        return $query->paginate($queryData["pageSize"] ?? 10);
    }

    public function creatReportTemplate(array $reportTemplateData): ReportTemplate
    {
        return ReportTemplate::query()->create($reportTemplateData);
    }

    public function updateReportTemplate(ReportTemplate $reportTemplate, array $reportTemplateData): ReportTemplate
    {
        $reportTemplate->fill($reportTemplateData);
        if ($reportTemplate->isDirty())
            $reportTemplate->save();
        return $reportTemplate;
    }

    public function deleteReportTemplate(ReportTemplate $reportTemplate): void
    {
        $reportTemplate->delete();
    }

    protected function applyFilters($query, array $filters)
    {
        if (isset($filters["search"]))
            $query->search(["name"], $filters["search"]);
    }

}
