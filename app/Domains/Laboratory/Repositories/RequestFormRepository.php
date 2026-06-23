<?php

namespace App\Domains\Laboratory\Repositories;

use Illuminate\Database\Eloquent\Builder;

use App\Domains\Shared\Traits\LogsUserActivity;
use App\Domains\Laboratory\Models\RequestForm;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class RequestFormRepository
{
    use LogsUserActivity;

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
        $requestForm= RequestForm::create($requestFormData);
        $this->logCreated($requestForm);
        return $requestForm;
    }

    public function updateRequestForm(RequestForm $requestForm, array $requestFormData): RequestForm
    {
        $requestForm->fill($requestFormData);
        if ($requestForm->isDirty()) {
            $requestForm->save();
            $this->logUpdated($requestForm);
        }
        return $requestForm;
    }

    public function deleteRequestForm(RequestForm $requestForm): void
    {
        $requestForm->delete();
        $this->logDeleted($requestForm);
    }

    /**
     * @param  \Illuminate\Database\Eloquent\Builder<\App\Domains\Laboratory\Models\RequestForm>  $query
     */
    protected function applyFilters(Builder $query, array $filters): void
    {
        if (isset($filters["search"]))
            $query->search(["name"], $filters["search"]);
        if (isset($filters["active"]))
            $query->active();
    }

    public function getRequestFormById(int|string $id): ?RequestForm
    {
        return RequestForm::query()->findOrFail($id);
    }

}
