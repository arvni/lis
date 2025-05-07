<?php

namespace App\Domains\Consultation\Services;


use App\Domains\Consultation\DTOs\CustomerDTO;
use App\Domains\Consultation\Models\Customer;
use App\Domains\Consultation\Repositories\CustomerRepository;
use Exception;

class CustomerService
{
    public function __construct(private CustomerRepository $customerRepository)
    {
    }

    public function listCustomers($queryData)
    {
        return $this->customerRepository->ListCustomers($queryData);
    }

    public function storeCustomer(CustomerDTO $customerDTO)
    {
        return $this->customerRepository->creatCustomer($customerDTO->toArray());
    }

    public function updateCustomer(Customer $customer, CustomerDTO $customerDTO): Customer
    {
        return $this->customerRepository->updateCustomer($customer, $customerDTO->toArray());
    }

    /**
     * @throws Exception
     */
    public function deleteCustomer(Customer $customer): void
    {
        if (!$customer->methods()->exists()) {
            $this->customerRepository->deleteCustomer($customer);
        } else
            throw new Exception("This Customer has some Acceptances");
    }

    public function createOrGetCustomer(array $data): Customer
    {
        $customer = $this->customerRepository->getCustomerByPhone($data["phone"]);
        if (!$customer)
            $customer = $this->customerRepository->creatCustomer($data);
        return $customer;
    }
}
