<?php

namespace App\Domains\Laboratory\Repositories;

use App\Domains\Laboratory\Models\RequestForm;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class RequestFormRepository
{
    public function listRequestForms(array $queryData): LengthAwarePaginator
    {
        $query = RequestForm::query()
            ->with("document")
            ->withCount("tests");
        if (isset($queryData["filters"]))
            $this->applyFilters($query, $queryData["filters"]);
        if (isset($queryData["sort"]))
            $query->orderBy($queryData['sort']['field'] ?? 'id', $queryData['sort']['sort'] ?? 'asc');
        return $query->paginate($queryData["pageSize"] ?? 10);
    }

    public function creatRequestForm(array $requestFormData): RequestForm
    {
        return RequestForm::create($requestFormData);
    }

    public function updateRequestForm(RequestForm $requestForm, array $requestFormData): RequestForm
    {
        $requestForm->fill($requestFormData);
        if ($requestForm->isDirty())
            $requestForm->save();
        return $requestForm;
    }

    public function deleteRequestForm(RequestForm $requestForm): void
    {
        $requestForm->delete();
    }

    protected function applyFilters($query, array $filters)
    {
        if (isset($filters["search"]))
            $query->search(["name"], $filters["search"]);
        if (isset($filters["active"]))
            $query->active();
    }

    public function getRequestFormById($id): ?RequestForm
    {
        return RequestForm::query()->findOrFail($id);
    }

}
