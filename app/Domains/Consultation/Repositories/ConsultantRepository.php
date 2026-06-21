<?php

namespace App\Domains\Consultation\Repositories;

use App\Domains\Shared\Traits\LogsUserActivity;
use App\Domains\Consultation\Models\Consultant;
use Illuminate\Database\Eloquent\Collection;

class ConsultantRepository
{
    use LogsUserActivity;

    /**
     * Active consultants as lightweight {id, name, title} options, ordered by name.
     *
     * @return Collection<int, Consultant>
     */
    public function activeForSelect(): Collection
    {
        return Consultant::query()
            ->where('active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'title']);
    }

    public function all(array $queryData = [])
    {
        $query = Consultant::query()->with('user');
        if (isset($queryData["filters"]))
            $this->apalyFilters($query, $queryData["filters"]);

        $query->orderBy($filters['sort']['field'] ?? 'id', $filters['sort']['sort'] ?? 'asc');

        return $query->paginate($filters["pageSize"] ?? 10);
    }

    public function find(int $id): ?Consultant
    {
        return Consultant::with('user')->find($id);
    }

    public function create(array $data): Consultant
    {

        $consultant= Consultant::create($data);
        $this->logCreated($consultant);
        return $consultant;
    }

    public function update(Consultant $consultant, array $data): Consultant
    {
        $consultant->update($data);
        $this->logUpdated($consultant);
        return $consultant;
    }

    public function delete(Consultant $consultant): void
    {
        $consultant->delete();
        $this->logDeleted($consultant);
    }

    public function apalyFilters($query, array $filters)
    {
        if (isset($filters["search"]))
            $query->search(["name", "title"], $filters["search"]);
        if (isset($filters["active"]))
            $query->where("active", $filters["active"]);
    }
}
