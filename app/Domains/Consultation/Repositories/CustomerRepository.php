<?php

namespace App\Domains\Consultation\Repositories;

use App\Domains\Shared\Traits\LogsUserActivity;
use App\Domains\Consultation\Models\Customer;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class CustomerRepository
{
    use LogsUserActivity;


    public function listCustomers(array $queryData): LengthAwarePaginator
    {
        $query = Customer::with(["patient"]);
        if (isset($queryData["filters"]))
            $this->applyFilters($query, $queryData["filters"]);
        if (isset($queryData["sort"]))
            $query->orderBy($queryData['sort']['field'] ?? 'id', $queryData['sort']['sort'] ?? 'asc');
        return $query->paginate($queryData["pageSize"] ?? 10);
    }

    public function creatCustomer(array $customerData): Customer
    {
        $customer = Customer::query()->make($customerData);
        $customer->save();
        $this->logCreated($customer);
        return $customer;
    }

    public function updateCustomer(Customer $customer, array $customerData): Customer
    {
        $customer->fill($customerData);
        if ($customer->isDirty()) {
            $customer->save();
            $this->logUpdated($customer);
        }
        return $customer;
    }

    public function deleteCustomer(Customer $customer): void
    {
        $customer->delete();
        $this->logDeleted($customer);
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
        return Customer::find($id);
    }

}
