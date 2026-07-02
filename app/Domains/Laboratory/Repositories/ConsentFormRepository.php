<?php

namespace App\Domains\Laboratory\Repositories;

use Illuminate\Database\Eloquent\Builder;

use App\Domains\Shared\Traits\LogsUserActivity;
use App\Domains\Laboratory\Models\ConsentForm;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ConsentFormRepository
{
    use LogsUserActivity;


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
        $consentForm= ConsentForm::query()->create($consentFormData);
        $this->logCreated($consentForm);
        return $consentForm;
    }

    public function updateConsentForm(ConsentForm $consentForm, array $consentFormData): ConsentForm
    {
        $consentForm->fill($consentFormData);
        if ($consentForm->isDirty()) {
            $consentForm->save();
            $this->logUpdated($consentForm);
        }
        return $consentForm;
    }

    public function deleteConsentForm(ConsentForm $consentForm): void
    {
        $consentForm->delete();
        $this->logDeleted($consentForm);
    }

    protected function applyFilters($query, array $filters): void
    {
        if (isset($filters["search"]))
            $query->search(["name"], $filters["search"]);
        if (isset($filters["active"]))
            $query->active($filters["active"]);
    }

}
