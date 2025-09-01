<?php

namespace App\Domains\Consultation\Repositories;

use App\Domains\Consultation\Models\Customer;
use App\Domains\User\Enums\ActivityType;
use App\Domains\User\Services\UserActivityService;
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

    public function creatCustomer(array $customerData): Customer
    {
        $customer = Customer::query()->make($customerData);
        $customer->save();
        UserActivityService::createUserActivity($customer,ActivityType::CREATE);
        return $customer;
    }

    public function updateCustomer(Customer $customer, array $customerData): Customer
    {
        $customer->fill($customerData);
        if ($customer->isDirty()) {
            $customer->save();
            UserActivityService::createUserActivity($customer,ActivityType::UPDATE);
        }
        return $customer;
    }

    public function deleteCustomer(Customer $customer): void
    {
        $customer->delete();
        UserActivityService::createUserActivity($customer,ActivityType::DELETE);
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
