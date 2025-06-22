<?php

namespace App\Domains\Laboratory\Repositories;

use App\Domains\Laboratory\Models\ConsentForm;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ConsentFormRepository
{

    public function listConsentForms(array $queryData): LengthAwarePaginator
    {
        $query = ConsentForm::with("document")->withCount(["tests"]);
        if (isset($queryData["filters"]))
            $this->applyFilters($query, $queryData["filters"]);
        if (isset($queryData["sort"]))
            $query->orderBy($queryData['sort']['field'] ?? 'id', $queryData['sort']['sort'] ?? 'asc');
        return $query->paginate($queryData["pageSize"] ?? 10);
    }

    public function creatConsentForm(array $consentFormData): ConsentForm
    {
        return ConsentForm::query()->create($consentFormData);
    }

    public function updateConsentForm(ConsentForm $consentForm, array $consentFormData): ConsentForm
    {
        $consentForm->fill($consentFormData);
        if ($consentForm->isDirty())
            $consentForm->save();
        return $consentForm;
    }

    public function deleteConsentForm(ConsentForm $consentForm): void
    {
        $consentForm->delete();
    }

    protected function applyFilters($query, array $filters)
    {
        if (isset($filters["search"]))
            $query->search(["name"], $filters["search"]);
        if (isset($filters["active"]))
            $query->active($filters["active"]);
    }

}
