<?php

namespace Tests\Feature\Consultation;

use App\Domains\Consultation\DTOs\CustomerDTO;
use App\Domains\Consultation\Models\Customer;
use App\Domains\Consultation\Repositories\CustomerRepository;
use App\Domains\Consultation\Services\CustomerService;
use Exception;
use Mockery;
use Tests\TestCase;

class CustomerServiceTest extends TestCase
{
    private CustomerRepository $repo;
    private CustomerService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->repo = Mockery::mock(CustomerRepository::class);
        $this->service = new CustomerService($this->repo);
    }

    private function dto(array $data = ['name' => 'C']): CustomerDTO
    {
        $dto = Mockery::mock(CustomerDTO::class);
        $dto->shouldReceive('toArray')->andReturn($data);
        return $dto;
    }

    private function customerWithTimes(bool $has): Customer
    {
        $rel = Mockery::mock();
        $rel->shouldReceive('exists')->andReturn($has);
        $customer = Mockery::mock(Customer::class)->makePartial();
        $customer->shouldReceive('times')->andReturn($rel);
        return $customer;
    }

    public function test_list_delegates(): void
    {
        $paginator = new \Illuminate\Pagination\LengthAwarePaginator([], 0, 10);
        $this->repo->shouldReceive('ListCustomers')->once()->andReturn($paginator);
        $this->assertSame($paginator, $this->service->listCustomers([]));
    }

    public function test_store_delegates(): void
    {
        $customer = new Customer();
        $this->repo->shouldReceive('creatCustomer')->once()->with(['name' => 'C'])->andReturn($customer);
        $this->assertSame($customer, $this->service->storeCustomer($this->dto()));
    }

    public function test_update_delegates(): void
    {
        $customer = new Customer();
        $this->repo->shouldReceive('updateCustomer')->once()->with($customer, ['name' => 'C'])->andReturn($customer);
        $this->assertSame($customer, $this->service->updateCustomer($customer, $this->dto()));
    }

    public function test_find_by_id_delegates(): void
    {
        $customer = new Customer();
        $this->repo->shouldReceive('findById')->once()->with(4)->andReturn($customer);
        $this->assertSame($customer, $this->service->findById(4));
    }

    public function test_delete_removes_customer_without_times(): void
    {
        $customer = $this->customerWithTimes(false);
        $this->repo->shouldReceive('deleteCustomer')->once()->with($customer)->andReturnNull();
        $this->service->deleteCustomer($customer);
        $this->assertTrue(true);
    }

    public function test_delete_throws_when_customer_has_times(): void
    {
        $customer = $this->customerWithTimes(true);
        $this->repo->shouldNotReceive('deleteCustomer');
        $this->expectException(Exception::class);
        $this->service->deleteCustomer($customer);
    }

    public function test_create_or_get_returns_existing_by_phone(): void
    {
        $existing = new Customer();
        $this->repo->shouldReceive('getCustomerByPhone')->once()->with('999')->andReturn($existing);
        $this->repo->shouldNotReceive('creatCustomer');
        $this->assertSame($existing, $this->service->createOrGetCustomer(['phone' => '999']));
    }

    public function test_create_or_get_creates_when_missing(): void
    {
        $created = new Customer();
        $this->repo->shouldReceive('getCustomerByPhone')->once()->with('888')->andReturnNull();
        $this->repo->shouldReceive('creatCustomer')->once()->andReturn($created);
        $this->assertSame($created, $this->service->createOrGetCustomer(['phone' => '888']));
    }
}
