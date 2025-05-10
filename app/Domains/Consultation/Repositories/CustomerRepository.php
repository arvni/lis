<?php

namespace App\Domains\Consultation\Repositories;

use App\Domains\Consultation\Models\Customer;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class CustomerRepository
{

    public function listCustomers(array $queryData): LengthAwarePaginator
    {
        $query = Customer::with(["patient"]);
        if (isset($queryData["filters"]))
            $this->applyFilters($query, $queryData["filters"]);
        if (isset($queryData["sort"]))
            $query->orderBy($queryData['sort']['field'] ?? 'id', $queryData['sort']['sort'] ?? 'asc');
        return $query->paginate($queryData["pageSize"] ?? 10);
    }

    public function creatCustomer(array $doctorData): Customer
    {
        $doctor = Customer::query()->make($doctorData);
        $doctor->save();
        return $doctor;
    }

    public function updateCustomer(Customer $doctor, array $doctorData): Customer
    {
        $doctor->fill($doctorData);
        if ($doctor->isDirty())
            $doctor->save();
        return $doctor;
    }

    public function deleteCustomer(Customer $doctor): void
    {
        $doctor->delete();
    }

    protected function applyFilters($query, array $filters)
    {
        if (isset($filters["search"]))
            $query->search($filters["search"]);
    }

    public function getCustomerByPhone(string $phone): ?Customer
    {
        return Customer::query()->where("phone", $phone)->first();
    }

    public function findById($id)
    {
        return Customer::query()->findOrFail($id);
    }

}
